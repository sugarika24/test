import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import {
  getMyHelperProfile,
  updateMyHelperProfile,
  uploadMyProfilePhoto,
  getFullImageUrl,
} from "../../services/profileService";
import { getAllCategories } from "../../services/categoryService";
import { HelperProfile } from "../../types/profile";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function HelperProfileScreen() {
  const { token, signOut } = useAuth();

  const [profile, setProfile] = useState<HelperProfile | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    if (!token) return;

    try {
      setLoading(true);

      const [profileData, categoryData] = await Promise.all([
        getMyHelperProfile(token),
        getAllCategories(),
      ]);

      setProfile(profileData.profile);
      setBio(profileData.profile.bio || "");
      setHourlyRate(
        profileData.profile.hourly_rate !== null &&
          profileData.profile.hourly_rate !== undefined
          ? String(profileData.profile.hourly_rate)
          : "",
      );
      setExperienceYears(
        profileData.profile.experience_years !== null &&
          profileData.profile.experience_years !== undefined
          ? String(profileData.profile.experience_years)
          : "",
      );
      setCategoryId(profileData.profile.category_id || null);
      setIsAvailable(!!profileData.profile.is_available);

      setCategories(categoryData.categories || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load helper profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  async function handleUpdateProfile() {
    if (!token) return;

    try {
      setLoading(true);

      const data = await updateMyHelperProfile(
        {
          bio,
          hourly_rate: hourlyRate ? Number(hourlyRate) : 0,
          category_id: categoryId,
          is_available: isAvailable,
          experience_years: experienceYears ? Number(experienceYears) : 0,
        },
        token,
      );

      Alert.alert("Success", data.message || "Helper profile updated");
      await fetchAll();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update helper profile");
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
        Alert.alert("Permission required", "Please allow gallery access");
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

      setUploadingPhoto(true);
      const data = await uploadMyProfilePhoto(file, token);
      setProfile((prev) =>
        prev
          ? { ...prev, profile_photo_url: data.profile.profile_photo_url }
          : prev,
      );

      Alert.alert("Success", "Profile photo updated");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to upload profile photo");
    } finally {
      setUploadingPhoto(false);
    }
  }

  const helperApproved =
    (profile as any)?.verification_status === "APPROVED" ||
    (profile as any)?.is_verified === true;

  const getInitial = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "H";
  };

  if (loading && !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#FE8B4C" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FE8B4C"]}
          />
        }
      >
        {/* Header */}
        <View className="bg-white pt-12 pb-5 px-5 border-b border-gray-100">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
          </TouchableOpacity>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-[#FE8B4C]">
                Helper Profile
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                Manage your professional profile
              </Text>
            </View>
            <View className="bg-[#FEF3E8] p-3 rounded-full">
              <MaterialCommunityIcons
                name="account-cowboy-hat"
                size={28}
                color="#FE8B4C"
              />
            </View>
          </View>
        </View>

        {/* Profile Photo Section */}
        <View className="items-center mt-5 mb-4">
          <View className="relative">
            {profile?.profile_photo_url ? (
              <Image
                source={{
                  uri: getFullImageUrl(profile.profile_photo_url) || undefined,
                }}
                className="w-28 h-28 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <View className="w-28 h-28 rounded-full bg-gradient-to-r from-[#FDD867] to-[#FE8B4C] items-center justify-center border-4 border-white shadow-lg">
                <Text className="text-3xl font-bold text-white">
                  {getInitial(profile?.full_name || "")}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={handlePickProfilePhoto}
              className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-md"
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#FE8B4C" />
              ) : (
                <Ionicons name="camera" size={18} color="#FE8B4C" />
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handlePickProfilePhoto} className="mt-2">
            <Text className="text-[#FE8B4C] text-sm font-medium">
              Change Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Approval Status Banner */}
        {!helperApproved && (
          <View className="mx-5 mb-5 bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
            <View className="flex-row items-start">
              <Ionicons name="alert-circle" size={20} color="#F59E0B" />
              <View className="flex-1 ml-2">
                <Text className="font-semibold text-yellow-800">
                  Approval Pending
                </Text>
                <Text className="text-yellow-700 text-sm mt-1">
                  Your helper account is not approved yet. You cannot become
                  available until admin approval.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Profile Form Card */}
        <View className="mx-5 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {/* Full Name (Read-only) */}
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold mb-2">Full Name</Text>
            <View className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <Text className="text-gray-800">
                {profile?.full_name || "Not provided"}
              </Text>
            </View>
          </View>

          {/* Email (Read-only) */}
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold mb-2">Email</Text>
            <View className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <Text className="text-gray-800">
                {profile?.email || "Not provided"}
              </Text>
            </View>
          </View>

          {/* Bio */}
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold mb-2">Bio</Text>
            <View className="bg-gray-50 rounded-xl border border-gray-200">
              <TextInput
                className="px-4 py-3 text-gray-800"
                value={bio}
                onChangeText={setBio}
                placeholder="Tell users about your experience"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Hourly Rate */}
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold mb-2">
              Hourly Rate (Rs.)
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
              <Ionicons name="cash-outline" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 ml-3 text-gray-800"
                value={hourlyRate}
                onChangeText={setHourlyRate}
                placeholder="e.g., 500"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Experience Years */}
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold mb-2">
              Experience Years
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4">
              <Ionicons name="briefcase-outline" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 ml-3 text-gray-800"
                value={experienceYears}
                onChangeText={setExperienceYears}
                placeholder="e.g., 3"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Category Selection */}
          <View className="mb-5">
            <Text className="text-gray-700 font-semibold mb-2">
              Choose Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    className={`px-4 py-2 rounded-full ${
                      categoryId === cat.id
                        ? "bg-[#FE8B4C]"
                        : "bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        categoryId === cat.id ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Availability Toggle */}
          <TouchableOpacity
            className={`rounded-xl py-4 mb-6 flex-row items-center justify-center ${
              isAvailable && helperApproved ? "bg-[#FE8B4C]" : "bg-gray-400"
            }`}
            onPress={() => helperApproved && setIsAvailable((prev) => !prev)}
            disabled={!helperApproved}
          >
            <Ionicons
              name={isAvailable ? "toggle" : "toggle-outline"}
              size={20}
              color="white"
            />
            <Text className="text-white font-semibold ml-2">
              {isAvailable ? "Available: ON" : "Available: OFF"}
            </Text>
          </TouchableOpacity>

          {/* Update Button */}
          <TouchableOpacity
            className="bg-[#FE8B4C] rounded-xl py-4 items-center mb-4"
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Update Profile
              </Text>
            )}
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            className="bg-gray-800 rounded-xl py-4 items-center flex-row justify-center"
            onPress={signOut}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="mx-5 mt-6 mb-4">
          <Text className="text-center text-gray-400 text-xs">
            Homigo Helper Profile v1.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
