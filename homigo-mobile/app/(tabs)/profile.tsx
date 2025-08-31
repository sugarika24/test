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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import {
  deactivateMyAccount,
  deleteMyAccount,
  getMyProfile,
  updateMyProfile,
  uploadMyProfilePhoto,
  getFullImageUrl,
} from "../../services/profileService";
import { Profile } from "../../types/profile";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function UserProfileScreen() {
  const { token, signOut } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Focus states
  const [isFocused, setIsFocused] = useState({
    fullName: false,
    phone: false,
    address: false,
  });

  const handleFocus = (field: string) => {
    setIsFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setIsFocused((prev) => ({ ...prev, [field]: false }));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    if (!token) return;

    try {
      setLoading(true);
      const data = await getMyProfile(token);
      setProfile(data.profile);
      setFullName(data.profile.full_name || "");
      setPhoneNumber(data.profile.phone_number || "");
      setAddress(data.profile.address || "");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile() {
    if (!token) return;

    if (!fullName) {
      Alert.alert("Error", "Full name is required");
      return;
    }

    try {
      setLoading(true);
      const data = await updateMyProfile(
        {
          full_name: fullName,
          phone_number: phoneNumber,
          address,
        },
        token,
      );
      setProfile(data.profile);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  async function handlePickProfilePhoto() {
    if (!token) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow gallery access to upload profile photo",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      const file = {
        uri: asset.uri,
        name: asset.fileName || `profile-${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      };

      setLoading(true);
      const data = await uploadMyProfilePhoto(file, token);
      setProfile(data.profile);
      Alert.alert("Success", "Profile photo updated");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to upload profile photo");
    } finally {
      setLoading(false);
    }
  }

  function handleDeactivate() {
    Alert.alert(
      "Deactivate Account",
      "Are you sure you want to deactivate your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            try {
              await deactivateMyAccount(token);
              Alert.alert("Success", "Account deactivated");
              await signOut();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to deactivate");
            }
          },
        },
      ],
    );
  }

  function handleDelete() {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. Delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            try {
              await deleteMyAccount(token);
              Alert.alert("Success", "Account deleted");
              await signOut();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete account");
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* Header - Light Orange */}
          <View className="bg-[#FEF3E8] pt-12 pb-8 px-6 border-b border-[#FDD867]/30">
            <View className="items-center">
              <Text className="text-2xl font-bold text-[#FE8B4C] mb-1">
                My Profile
              </Text>
              <Text className="text-gray-500 text-sm">
                Manage your personal information
              </Text>
            </View>
          </View>

          {/* Profile Image Section */}
          <View className="items-center -mt-12 mb-6">
            <View className="relative">
              {profile?.profile_photo_url ? (
                <Image
                  source={{
                    uri:
                      getFullImageUrl(profile.profile_photo_url) || undefined,
                  }}
                  className="w-28 h-28 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <View className="w-28 h-28 rounded-full bg-[#FEF3E8] items-center justify-center border-4 border-white shadow-lg">
                  <Text className="text-4xl font-bold text-[#FE8B4C]">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                onPress={handlePickProfilePhoto}
                className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md"
              >
                <Ionicons name="camera" size={18} color="#FE8B4C" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handlePickProfilePhoto} className="mt-2">
              <Text className="text-[#FE8B4C] text-sm font-medium">
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View className="mx-4 bg-white rounded-2xl p-5 shadow-sm">
            {/* Email (Read-only) */}
            <View className="mb-5">
              <Text className="text-gray-500 text-sm mb-1">Email Address</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Text className="text-gray-800">
                  {profile?.email || "Not provided"}
                </Text>
              </View>
            </View>

            {/* Full Name */}
            <View className="mb-5">
              <Text className="text-gray-500 text-sm mb-1">Full Name</Text>
              <View
                className={`flex-row items-center rounded-xl border px-4 ${
                  isFocused.fullName
                    ? "border-[#FE8B4C] bg-orange-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={isFocused.fullName ? "#FE8B4C" : "#9ca3af"}
                />
                <TextInput
                  className="flex-1 py-3 ml-2 text-gray-800"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  editable={isEditing}
                  onFocus={() => handleFocus("fullName")}
                  onBlur={() => handleBlur("fullName")}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Phone Number */}
            <View className="mb-5">
              <Text className="text-gray-500 text-sm mb-1">Phone Number</Text>
              <View
                className={`flex-row items-center rounded-xl border px-4 ${
                  isFocused.phone
                    ? "border-[#FE8B4C] bg-orange-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={isFocused.phone ? "#FE8B4C" : "#9ca3af"}
                />
                <TextInput
                  className="flex-1 py-3 ml-2 text-gray-800"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  editable={isEditing}
                  onFocus={() => handleFocus("phone")}
                  onBlur={() => handleBlur("phone")}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Address */}
            <View className="mb-6">
              <Text className="text-gray-500 text-sm mb-1">Address</Text>
              <View
                className={`flex-row items-center rounded-xl border px-4 ${
                  isFocused.address
                    ? "border-[#FE8B4C] bg-orange-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={isFocused.address ? "#FE8B4C" : "#9ca3af"}
                />
                <TextInput
                  className="flex-1 py-3 ml-2 text-gray-800"
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Your address"
                  editable={isEditing}
                  onFocus={() => handleFocus("address")}
                  onBlur={() => handleBlur("address")}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Action Buttons */}
            {!isEditing ? (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                className="bg-[#FE8B4C] rounded-xl py-3 items-center mb-4"
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-base">
                  Edit Profile
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row space-x-3 mb-4">
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(false);
                    setFullName(profile?.full_name || "");
                    setPhoneNumber(profile?.phone_number || "");
                    setAddress(profile?.address || "");
                  }}
                  className="flex-1 bg-gray-200 rounded-xl py-3 items-center"
                >
                  <Text className="text-gray-700 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUpdateProfile}
                  disabled={loading}
                  className="flex-1 bg-[#FE8B4C] rounded-xl py-3 items-center"
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white font-semibold">Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Account Actions */}
          <View className="mx-4 mt-4">
            <Text className="text-gray-400 text-sm mb-3 px-2">
              ACCOUNT ACTIONS
            </Text>

            <TouchableOpacity
              onPress={signOut}
              className="bg-white rounded-xl p-4 flex-row items-center mb-3 shadow-sm"
            >
              <Ionicons name="log-out-outline" size={22} color="#FE8B4C" />
              <Text className="text-gray-700 font-medium ml-3 flex-1">
                Logout
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDeactivate}
              className="bg-white rounded-xl p-4 flex-row items-center mb-3 shadow-sm"
            >
              <Ionicons name="alert-circle-outline" size={22} color="#f59e0b" />
              <Text className="text-gray-700 font-medium ml-3 flex-1">
                Deactivate Account
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              className="bg-white rounded-xl p-4 flex-row items-center shadow-sm"
            >
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
              <Text className="text-gray-700 font-medium ml-3 flex-1">
                Delete Account
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="mx-4 mt-8 mb-4">
            <Text className="text-center text-gray-400 text-xs">
              Your information is secure with us
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
