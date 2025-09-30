import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { UploadFile } from "../../types/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";

const DOCUMENT_TYPES = [
  "CITIZENSHIP",
  "NATIONAL_ID",
  "PASSPORT",
  "DRIVING_LICENSE",
] as const;

const PHONE_REGEX = /^(98|97)\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const { signUp, sendRegisterEmailOtp, verifyRegisterEmailOtp } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpTimer, setEmailOtpTimer] = useState(0);

  const [role, setRole] = useState<"USER" | "HELPER">("USER");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [idDocumentType, setIdDocumentType] =
    useState<(typeof DOCUMENT_TYPES)[number]>("CITIZENSHIP");
  const [idDocumentNumber, setIdDocumentNumber] = useState("");
  const [idDocument, setIdDocument] = useState<UploadFile | null>(null);

  const [loading, setLoading] = useState(false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);

  const [isFocused, setIsFocused] = useState({
    fullName: false,
    email: false,
    phone: false,
    emailOtp: false,
    password: false,
    confirmPassword: false,
    docNumber: false,
  });

  useEffect(() => {
    if (emailOtpTimer <= 0) return;

    const interval = setInterval(() => {
      setEmailOtpTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [emailOtpTimer]);

  const handleFocus = (field: string) => {
    setIsFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setIsFocused((prev) => ({ ...prev, [field]: false }));
  };

  async function pickDocumentImage() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow gallery access to upload your document.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const originalName = asset.fileName || `document-${Date.now()}.jpg`;
      const lowerName = originalName.toLowerCase();

      let finalName = originalName;
      if (
        !lowerName.endsWith(".jpg") &&
        !lowerName.endsWith(".jpeg") &&
        !lowerName.endsWith(".png") &&
        !lowerName.endsWith(".webp")
      ) {
        finalName = `document-${Date.now()}.jpg`;
      }

      const finalType =
        asset.mimeType &&
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          asset.mimeType,
        )
          ? asset.mimeType
          : "image/jpeg";

      const file = {
        uri: asset.uri,
        name: finalName,
        type: finalType,
      };

      setIdDocument(file);
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  }

  function resetEmailOtpState() {
    setEmailVerified(false);
    setEmailOtpSent(false);
    setEmailOtpCode("");
    setEmailOtpTimer(0);
  }

  function handleFullNameChange(text: string) {
    setFullName(text);
    resetEmailOtpState();
  }

  function handleEmailChange(text: string) {
    setEmail(text);
    resetEmailOtpState();
  }

  function handlePhoneChange(text: string) {
    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 10);
    setPhoneNumber(cleaned);
  }

  async function handleSendEmailOtp() {
    if (!fullName.trim()) {
      Alert.alert("Full Name Required", "Please enter your full name first.");
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      Alert.alert(
        "Invalid Email",
        "Enter a valid email address (e.g. example@gmail.com)",
      );
      return;
    }

    if (!PHONE_REGEX.test(phoneNumber)) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid 10-digit Nepal mobile number first.",
      );
      return;
    }

    try {
      setSendingEmailOtp(true);

      const response = await sendRegisterEmailOtp({
        email: email.trim(),
        full_name: fullName.trim(),
      });

      setEmailOtpSent(true);
      setEmailVerified(false);
      setEmailOtpCode("");
      setEmailOtpTimer(60);
      setStep(2);

      Alert.alert(
        "Email OTP Sent",
        response.message ||
          "OTP sent successfully. Please check your inbox or spam folder.",
      );
    } catch (error: any) {
      Alert.alert(
        "Send Email OTP Failed",
        error.message || "Something went wrong",
      );
    } finally {
      setSendingEmailOtp(false);
    }
  }

  async function handleVerifyEmailOtp() {
    if (!emailOtpCode || emailOtpCode.trim().length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit email OTP.");
      return;
    }

    try {
      setVerifyingEmailOtp(true);

      const response = await verifyRegisterEmailOtp({
        email: email.trim(),
        otp_code: emailOtpCode,
      });

      setEmailVerified(true);
      setStep(3);

      Alert.alert("Verified", response.message || "Email verified.");
    } catch (error: any) {
      setEmailVerified(false);
      Alert.alert(
        "Email OTP Verification Failed",
        error.message || "Invalid OTP",
      );
    } finally {
      setVerifyingEmailOtp(false);
    }
  }

  function handleContinueToOtp() {
    if (!fullName.trim()) {
      Alert.alert("Full Name Required", "Please enter your full name first.");
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      Alert.alert(
        "Invalid Email",
        "Enter a valid email address (e.g. example@gmail.com)",
      );
      return;
    }

    if (!PHONE_REGEX.test(phoneNumber)) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid 10-digit Nepal mobile number first.",
      );
      return;
    }

    handleSendEmailOtp();
  }

  async function handleRegister() {
    if (!fullName || !email || !password || !confirmPassword || !role) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (!PHONE_REGEX.test(phoneNumber)) {
      Alert.alert("Error", "Please enter a valid 10-digit Nepal mobile number");
      return;
    }

    if (!emailVerified) {
      Alert.alert("Error", "Please verify your email with OTP first");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (role === "HELPER") {
      if (!idDocumentType) {
        Alert.alert("Error", "Please select a document type");
        return;
      }

      if (!idDocument) {
        Alert.alert("Error", "Please upload your identification document");
        return;
      }
    }

    try {
      setLoading(true);

      await signUp({
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phoneNumber,
        password,
        confirm_password: confirmPassword,
        role,
        id_document_type: role === "HELPER" ? idDocumentType : undefined,
        id_document_number: role === "HELPER" ? idDocumentNumber : undefined,
        id_document: role === "HELPER" ? idDocument || undefined : undefined,
      });

      Alert.alert(
        "🎉 Success!",
        role === "HELPER"
          ? "Helper registration successful. Your account is pending admin approval."
          : "Registration successful!",
        [
          {
            text: "OK",
            onPress: () => router.push("/(auth)/login"),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert("Register Failed", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = () => {
    if (password.length === 0) return { strength: 0, text: "" };
    if (password.length < 6) return { strength: 33, text: "Weak" };
    if (password.length < 10) return { strength: 66, text: "Fair" };
    return { strength: 100, text: "Strong" };
  };

  const strength = passwordStrength();

  function StepIndicator() {
    return (
      <View className="flex-row items-center justify-center mb-6 mt-2">
        {[1, 2, 3].map((item, index) => (
          <View key={item} className="flex-row items-center">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                step >= item ? "bg-[#FE8B4C]" : "bg-gray-200"
              }`}
            >
              <Text
                className={`font-bold ${
                  step >= item ? "text-white" : "text-gray-500"
                }`}
              >
                {item}
              </Text>
            </View>
            {index < 2 && (
              <View
                className={`w-10 h-1 ${
                  step > item ? "bg-[#FE8B4C]" : "bg-gray-200"
                }`}
              />
            )}
          </View>
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <LinearGradient
            colors={["#FEF3E8", "#FFE8DD", "#FFE0D0"]}
            className="flex-1"
          >
            <View className="items-center pt-12 pb-6 px-6">
              <View className="w-20 h-20 bg-white rounded-2xl items-center justify-center shadow-xl mb-6">
                <MaterialCommunityIcons
                  name="account-plus"
                  size={40}
                  color="#FE8B4C"
                />
              </View>
              <Text className="text-4xl font-bold text-[#FE8B4C] mb-2">
                Create Account
              </Text>
              <Text className="text-gray-500 text-lg text-center">
                Join Homigo and get started
              </Text>
            </View>

            <View className="mx-6 bg-white rounded-3xl p-6 shadow-2xl shadow-gray-200 border border-gray-100 mb-6">
              <StepIndicator />

              {step === 1 && (
                <>
                  <Text className="text-lg font-bold text-gray-800 mb-4 text-center">
                    Basic Details
                  </Text>

                  <View className="mb-5">
                    <Text className="text-gray-700 font-semibold mb-2">
                      Full Name
                    </Text>
                    <View
                      className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${
                        isFocused.fullName
                          ? "border-[#FE8B4C] bg-[#FEF3E8] border-2"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#6b7280"
                      />
                      <TextInput
                        value={fullName}
                        onChangeText={handleFullNameChange}
                        placeholder="Enter your full name"
                        onFocus={() => handleFocus("fullName")}
                        onBlur={() => handleBlur("fullName")}
                        className="flex-1 ml-3 text-gray-800 text-base"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View className="mb-5">
                    <Text className="text-gray-700 font-semibold mb-2">
                      Email Address
                    </Text>
                    <View
                      className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${
                        isFocused.email
                          ? "border-[#FE8B4C] bg-[#FEF3E8] border-2"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <Ionicons name="mail-outline" size={20} color="#6b7280" />
                      <TextInput
                        value={email}
                        onChangeText={handleEmailChange}
                        placeholder="you@example.com"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        onFocus={() => handleFocus("email")}
                        onBlur={() => handleBlur("email")}
                        className="flex-1 ml-3 text-gray-800 text-base"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <View className="mb-6">
                    <Text className="text-gray-700 font-semibold mb-2">
                      Phone Number
                    </Text>
                    <View
                      className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${
                        isFocused.phone
                          ? "border-[#FE8B4C] bg-[#FEF3E8] border-2"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <Ionicons name="call-outline" size={20} color="#6b7280" />
                      <TextInput
                        value={phoneNumber}
                        onChangeText={handlePhoneChange}
                        placeholder="98XXXXXXXX"
                        keyboardType="number-pad"
                        maxLength={10}
                        onFocus={() => handleFocus("phone")}
                        onBlur={() => handleBlur("phone")}
                        className="flex-1 ml-3 text-gray-800 text-base"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleContinueToOtp}
                    disabled={sendingEmailOtp}
                    className="bg-[#FE4D01] rounded-2xl py-4 items-center"
                    style={{ opacity: sendingEmailOtp ? 0.7 : 1 }}
                  >
                    {sendingEmailOtp ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-white font-bold text-lg">
                        Continue
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {step === 2 && (
                <>
                  <Text className="text-lg font-bold text-gray-800 mb-2 text-center">
                    Verify Your Email
                  </Text>
                  <Text className="text-sm text-gray-500 text-center mb-5">
                    We sent a 6-digit code to {email}
                  </Text>

                  <View className="mb-5">
                    <Text className="text-gray-700 font-semibold mb-2">
                      Enter Email OTP
                    </Text>
                    <View
                      className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${
                        isFocused.emailOtp
                          ? "border-[#FE8B4C] bg-[#FEF3E8] border-2"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={20}
                        color="#6b7280"
                      />
                      <TextInput
                        value={emailOtpCode}
                        onChangeText={(text) =>
                          setEmailOtpCode(
                            text.replace(/[^0-9]/g, "").slice(0, 6),
                          )
                        }
                        placeholder="Enter 6-digit email OTP"
                        keyboardType="number-pad"
                        maxLength={6}
                        onFocus={() => handleFocus("emailOtp")}
                        onBlur={() => handleBlur("emailOtp")}
                        className="flex-1 ml-3 text-gray-800 text-base"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  {emailOtpSent && !emailVerified && (
                    <View className="mb-5">
                      {emailOtpTimer > 0 ? (
                        <Text className="text-xs text-gray-500 text-center">
                          You can resend OTP in {emailOtpTimer}s
                        </Text>
                      ) : (
                        <TouchableOpacity
                          onPress={handleSendEmailOtp}
                          disabled={sendingEmailOtp}
                        >
                          <Text className="text-sm text-[#FE8B4C] font-semibold text-center">
                            Resend OTP
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setStep(1)}
                      className="flex-1 bg-gray-200 rounded-2xl py-4 items-center"
                    >
                      <Text className="text-gray-700 font-bold">Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleVerifyEmailOtp}
                      disabled={verifyingEmailOtp}
                      className="flex-1 bg-[#FE8B4C] rounded-2xl py-4 items-center"
                      style={{ opacity: verifyingEmailOtp ? 0.7 : 1 }}
                    >
                      {verifyingEmailOtp ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text className="text-white font-bold">Verify OTP</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {step === 3 && (
                <>
                  <Text className="text-lg font-bold text-gray-800 mb-2 text-center">
                    Complete Registration
                  </Text>

                  <View className="flex-row items-center justify-center mb-4">
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#16a34a"
                    />
                    <Text className="text-green-600 text-sm ml-1 font-medium">
                      Email verified successfully
                    </Text>
                  </View>

                  <View className="mb-5">
                    <Text className="text-gray-700 font-semibold mb-3">
                      I want to join as
                    </Text>
                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={() => setRole("USER")}
                        className={`flex-1 rounded-2xl p-4 border-2 ${
                          role === "USER"
                            ? "border-[#FE8B4C] bg-[#FEF3E8]"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <View className="items-center">
                          <View
                            className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                              role === "USER"
                                ? "bg-[#FE8B4C]/20"
                                : "bg-gray-100"
                            }`}
                          >
                            <FontAwesome
                              name="user"
                              size={24}
                              color={role === "USER" ? "#FE8B4C" : "#6b7280"}
                            />
                          </View>
                          <Text
                            className={`font-bold text-base ${
                              role === "USER"
                                ? "text-[#FE8B4C]"
                                : "text-gray-700"
                            }`}
                          >
                            User
                          </Text>
                        </View>
                      </Pressable>

                      <Pressable
                        onPress={() => setRole("HELPER")}
                        className={`flex-1 rounded-2xl p-4 border-2 ${
                          role === "HELPER"
                            ? "border-[#FE8B4C] bg-[#FEF3E8]"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <View className="items-center">
                          <View
                            className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                              role === "HELPER"
                                ? "bg-[#FE8B4C]/20"
                                : "bg-gray-100"
                            }`}
                          >
                            <FontAwesome
                              name="wrench"
                              size={24}
                              color={role === "HELPER" ? "#FE8B4C" : "#6b7280"}
                            />
                          </View>
                          <Text
                            className={`font-bold text-base ${
                              role === "HELPER"
                                ? "text-[#FE8B4C]"
                                : "text-gray-700"
                            }`}
                          >
                            Helper
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>

                  {role === "HELPER" && (
                    <View className="mb-5">
                      <Text className="text-base font-bold mb-3 text-gray-800">
                        Verification Documents
                      </Text>

                      <Text className="text-gray-700 font-semibold mb-2">
                        Document Type
                      </Text>
                      <View className="flex-row flex-wrap gap-2 mb-4">
                        {DOCUMENT_TYPES.map((docType) => (
                          <TouchableOpacity
                            key={docType}
                            onPress={() => setIdDocumentType(docType)}
                            className={`px-4 py-2 rounded-xl border ${
                              idDocumentType === docType
                                ? "bg-[#FE8B4C] border-[#FE8B4C]"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            <Text
                              className={`text-sm font-medium ${
                                idDocumentType === docType
                                  ? "text-white"
                                  : "text-gray-700"
                              }`}
                            >
                              {docType.replace("_", " ")}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text className="text-gray-700 font-semibold mb-2">
                        Document Number (optional)
                      </Text>
                      <View
                        className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${
                          isFocused.docNumber
                            ? "border-[#FE8B4C] bg-[#FEF3E8] border-2"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={20}
                          color="#6b7280"
                        />
                        <TextInput
                          value={idDocumentNumber}
                          onChangeText={setIdDocumentNumber}
                          placeholder="Enter document number"
                          onFocus={() => handleFocus("docNumber")}
                          onBlur={() => handleBlur("docNumber")}
                          className="flex-1 ml-3 text-gray-800 text-base"
                          placeholderTextColor="#9ca3af"
                        />
                      </View>

                      <TouchableOpacity
                        className="bg-gray-50 border-2 border-dashed border-[#FEF3E8] rounded-2xl p-4 mt-4 mb-3 items-center"
                        onPress={pickDocumentImage}
                      >
                        <Text className="text-4xl mb-2">📄</Text>
                        <Text className="text-[#FE8B4C] font-medium text-center">
                          {idDocument
                            ? "Change Document Image"
                            : "Upload Document Image"}
                        </Text>
                        <Text className="text-gray-400 text-xs mt-1 text-center">
                          JPG, PNG, WEBP (Max 5MB)
                        </Text>
                      </TouchableOpacity>

                      {idDocument && (
                        <View className="mb-2">
                          <Image
                            source={{ uri: idDocument.uri }}
                            style={{
                              width: "100%",
                              height: 180,
                              borderRadius: 16,
                            }}
                            resizeMode="cover"
                          />
                          <Text className="text-xs text-gray-500 mt-2 text-center">
                            {idDocument.name}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View className="mb-3">
                    <Text className="text-gray-700 font-semibold mb-2">
                      Password
                    </Text>
                    <View
                      className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${
                        isFocused.password
                          ? "border-[#FE8B4C] bg-[#FEF3E8] border-2"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#6b7280"
                      />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Minimum 6 characters"
                        secureTextEntry={!showPassword}
                        onFocus={() => handleFocus("password")}
                        onBlur={() => handleBlur("password")}
                        className="flex-1 ml-3 text-gray-800 text-base"
                        placeholderTextColor="#9ca3af"
                      />
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        className="p-1"
                      >
                        <Ionicons
                          name={
                            showPassword ? "eye-off-outline" : "eye-outline"
                          }
                          size={20}
                          color="#6b7280"
                        />
                      </Pressable>
                    </View>

                    {password.length > 0 && (
                      <View className="mt-2">
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-xs text-gray-600">
                            Password strength
                          </Text>
                          <Text
                            className="text-xs font-semibold"
                            style={{
                              color:
                                strength.text === "Weak"
                                  ? "#FE8B4C"
                                  : strength.text === "Fair"
                                    ? "#FE8B4C"
                                    : "#10b981",
                            }}
                          >
                            {strength.text}
                          </Text>
                        </View>
                        <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${strength.strength}%`,
                              backgroundColor:
                                strength.text === "Weak"
                                  ? "#FE8B4C"
                                  : strength.text === "Fair"
                                    ? "#FE8B4C"
                                    : "#10b981",
                            }}
                          />
                        </View>
                      </View>
                    )}
                  </View>

                  <View className="mb-6">
                    <Text className="text-gray-700 font-semibold mb-2">
                      Confirm Password
                    </Text>
                    <View
                      className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${
                        isFocused.confirmPassword
                          ? "border-[#FE8B4C] bg-[#FEF3E8] border-2"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#6b7280"
                      />
                      <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Re-enter your password"
                        secureTextEntry={!showConfirmPassword}
                        onFocus={() => handleFocus("confirmPassword")}
                        onBlur={() => handleBlur("confirmPassword")}
                        className="flex-1 ml-3 text-gray-800 text-base"
                        placeholderTextColor="#9ca3af"
                      />
                      <Pressable
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="p-1"
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? "eye-off-outline"
                              : "eye-outline"
                          }
                          size={20}
                          color="#6b7280"
                        />
                      </Pressable>
                    </View>

                    {confirmPassword.length > 0 && (
                      <View className="flex-row items-center mt-2">
                        <Ionicons
                          name={
                            password === confirmPassword
                              ? "checkmark-circle"
                              : "close-circle"
                          }
                          size={16}
                          color={
                            password === confirmPassword ? "#10b981" : "#ef4444"
                          }
                        />
                        <Text
                          className={`ml-1 text-xs ${
                            password === confirmPassword
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {password === confirmPassword
                            ? "Passwords match"
                            : "Passwords do not match"}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setStep(2)}
                      className="flex-1 bg-gray-200 rounded-2xl py-4 items-center"
                    >
                      <Text className="text-gray-700 font-bold">Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleRegister}
                      disabled={loading || !emailVerified}
                      activeOpacity={0.8}
                      className="flex-1 bg-[#FE4D01] rounded-2xl py-4 items-center justify-center"
                      style={{
                        opacity: loading || !emailVerified ? 0.7 : 1,
                      }}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text className="text-white font-bold text-lg">
                          Create Account
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            <View className="flex-row justify-center mb-8">
              <Text className="text-gray-600">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text className="text-[#FE8B4C] font-bold">Sign In</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
