import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const { resetPassword, forgotPassword } = useAuth();

  const [email, setEmail] = useState((params.email as string) || "");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Focus states
  const [isFocused, setIsFocused] = useState({
    email: false,
    otp: false,
    password: false,
    confirmPassword: false,
  });

  const handleFocus = (field: string) => {
    setIsFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setIsFocused((prev) => ({ ...prev, [field]: false }));
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    try {
      setResending(true);
      await forgotPassword(email);
      setCountdown(60);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Alert.alert("✅ OTP Sent", "A new OTP has been sent to your email");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  async function handleResetPassword() {
    if (!email || !otpCode || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    if (otpCode.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit verification code");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        "Password Too Short",
        "Password must be at least 6 characters",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await resetPassword({
        email,
        otp_code: otpCode,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      Alert.alert(
        "✅ Password Reset!",
        "Your password has been successfully reset. Please log in with your new password.",
        [
          {
            text: "Go to Login",
            onPress: () => router.replace("/(auth)/login"),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = () => {
    if (newPassword.length === 0)
      return { strength: 0, color: "bg-gray-200", text: "" };
    if (newPassword.length < 6)
      return { strength: 33, color: "bg-orange-400", text: "Weak" };
    if (newPassword.length < 10)
      return { strength: 66, color: "bg-[#FDD867]", text: "Fair" };
    return { strength: 100, color: "bg-[#FE4D01]", text: "Strong" };
  };

  const strength = passwordStrength();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <LinearGradient
              colors={["#fff5eb", "#ffe6d5", "#fff5eb"]}
              className="flex-1"
            >
              {/* Header Section */}
              <View className="items-center pt-12 pb-6 px-6">
                <View className="w-20 h-20 bg-gradient-to-r from-[#FDD867] to-[#FE4D01] rounded-2xl items-center justify-center shadow-xl shadow-orange-200 mb-6">
                  <MaterialCommunityIcons
                    name="lock-reset"
                    size={40}
                    color="white"
                  />
                </View>
                <Text className="text-4xl font-bold text-gray-800 mb-2">
                  Reset Password
                </Text>
                <Text className="text-gray-500 text-lg text-center">
                  Create a new secure password
                </Text>
              </View>

              {/* Reset Form Card */}
              <View className="mx-6 bg-white rounded-3xl p-6 shadow-2xl shadow-gray-200 border border-gray-100 mb-6">
                {/* Email Input */}
                <View className="mb-5">
                  <Text className="text-gray-700 font-semibold mb-2">
                    Email Address
                  </Text>
                  <View
                    className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${
                      isFocused.email
                        ? "border-[#FE4D01] bg-orange-50 border-2"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Ionicons name="mail-outline" size={20} color="#6b7280" />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onFocus={() => handleFocus("email")}
                      onBlur={() => handleBlur("email")}
                      className="flex-1 ml-3 text-gray-800 text-base"
                      placeholderTextColor="#9ca3af"
                    />
                    {email.length > 0 && (
                      <Pressable onPress={() => setEmail("")}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#9ca3af"
                        />
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* OTP Input */}
                <View className="mb-6">
                  <Text className="text-gray-700 font-semibold mb-2">
                    Verification Code
                  </Text>
                  <View
                    className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${
                      isFocused.otp
                        ? "border-[#FE4D01] bg-orange-50 border-2"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Ionicons name="key-outline" size={20} color="#6b7280" />
                    <TextInput
                      value={otpCode}
                      onChangeText={setOtpCode}
                      placeholder="6-digit code"
                      keyboardType="number-pad"
                      maxLength={6}
                      onFocus={() => handleFocus("otp")}
                      onBlur={() => handleBlur("otp")}
                      className="flex-1 ml-3 text-gray-800 text-base"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View className="flex-row justify-between items-center mt-3">
                    <Pressable
                      onPress={handleResendOtp}
                      disabled={resending || countdown > 0}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          resending || countdown > 0
                            ? "text-gray-400"
                            : "text-[#FE4D01]"
                        }`}
                      >
                        {resending
                          ? "Sending..."
                          : countdown > 0
                            ? `Resend in ${countdown}s`
                            : "Resend Code?"}
                      </Text>
                    </Pressable>
                    <Text className="text-xs text-gray-400">
                      OTP expires in 10 minutes
                    </Text>
                  </View>
                </View>

                {/* New Password Input */}
                <View className="mb-3">
                  <Text className="text-gray-700 font-semibold mb-2">
                    New Password
                  </Text>
                  <View
                    className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${
                      isFocused.password
                        ? "border-[#FE4D01] bg-orange-50 border-2"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#6b7280"
                    />
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
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
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#6b7280"
                      />
                    </Pressable>
                  </View>

                  {/* Password Strength Indicator */}
                  {newPassword.length > 0 && (
                    <View className="mt-2">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-xs text-gray-600">
                          Password strength
                        </Text>
                        <Text
                          className="text-xs font-semibold"
                          style={{
                            color: strength.color.includes("orange")
                              ? "#FE4D01"
                              : strength.color.includes("FDD867")
                                ? "#FDD867"
                                : "#10b981",
                          }}
                        >
                          {strength.text}
                        </Text>
                      </View>
                      <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <View
                          className={`h-full rounded-full`}
                          style={{
                            width: `${strength.strength}%`,
                            backgroundColor: strength.color.includes("orange")
                              ? "#FE4D01"
                              : strength.color.includes("FDD867")
                                ? "#FDD867"
                                : strength.color.includes("green")
                                  ? "#10b981"
                                  : "#f97316",
                          }}
                        />
                      </View>
                      <Text className="text-xs text-gray-500 mt-1">
                        Use 6+ characters with letters and numbers
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password Input */}
                <View className="mb-6">
                  <Text className="text-gray-700 font-semibold mb-2">
                    Confirm Password
                  </Text>
                  <View
                    className={`flex-row items-center border rounded-2xl px-4 py-3.5 ${
                      isFocused.confirmPassword
                        ? "border-[#FE4D01] bg-orange-50 border-2"
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

                  {/* Password Match Indicator */}
                  {confirmPassword.length > 0 && (
                    <View className="flex-row items-center mt-2">
                      <Ionicons
                        name={
                          newPassword === confirmPassword
                            ? "checkmark-circle"
                            : "close-circle"
                        }
                        size={16}
                        color={
                          newPassword === confirmPassword
                            ? "#FE4D01"
                            : "#ef4444"
                        }
                      />
                      <Text
                        className={`ml-1 text-xs ${
                          newPassword === confirmPassword
                            ? "text-[#FE4D01]"
                            : "text-red-600"
                        }`}
                      >
                        {newPassword === confirmPassword
                          ? "Passwords match"
                          : "Passwords do not match"}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Reset Button */}
                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={loading}
                  className={`rounded-2xl py-4 items-center shadow-lg ${
                    loading ||
                    !email ||
                    !otpCode ||
                    !newPassword ||
                    !confirmPassword
                      ? "bg-orange-500"
                      : "bg-gradient-to-r from-[#FDD867] to-[#FE4D01]"
                  }`}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white font-bold text-lg">
                      Reset Password
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Back to Login */}
              <View className="flex-row justify-center mb-8">
                <Text className="text-gray-600">Remember your password? </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                  <Text className="text-[#FE4D01] font-bold">Sign In</Text>
                </TouchableOpacity>
              </View>

              {/* Help Section */}
              <View className="mx-6 mb-10">
                <Text className="text-center text-gray-500 mb-4 font-medium">
                  Need help?
                </Text>
                <View className="flex-row justify-center space-x-4">
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("Contact Support", "support@homigo.com")
                    }
                    className="border border-gray-200 rounded-2xl p-4 bg-white"
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={24}
                      color="#FE4D01"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => Alert.alert("FAQ", "Check our FAQ section")}
                    className="border border-gray-200 rounded-2xl p-4 bg-white"
                  >
                    <Ionicons
                      name="help-circle-outline"
                      size={24}
                      color="#FE4D01"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
