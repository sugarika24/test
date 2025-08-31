import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  RefreshControl,
  Linking,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getHelperById } from "../../../services/helperService";
import { getHelperReviews } from "@/services/reviewService";
import { ReviewItem } from "@/types/review";
import { HelperDetail, HelperSkillDetail } from "../../../types/helper";
import { getFullImageUrl } from "../../../services/profileService";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function HelperDetailsScreen() {
  const { id } = useLocalSearchParams();

  const [helper, setHelper] = useState<HelperDetail | null>(null);
  const [skills, setSkills] = useState<HelperSkillDetail[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);
      const result = await getHelperById(String(id));
      console.log("helper detail result:", result);

      setHelper(result.helper);
      setSkills(result.skills || []);

      await fetchHelperReviews(result.helper?.id);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load helper details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchHelperReviews(helperUserId?: number | string) {
    if (!helperUserId) {
      setReviews([]);
      setReviewsLoading(false);
      return;
    }

    try {
      setReviewsLoading(true);
      console.log("fetching reviews for helper id:", helperUserId);
      const res = await getHelperReviews(helperUserId);
      setReviews(res.reviews || []);
    } catch (error) {
      console.log("fetchHelperReviews error:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getInitial = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "H";
  };

  const formatRating = (rating: number | string | undefined) => {
    if (!rating) return "0";
    return typeof rating === "number" ? rating.toFixed(1) : rating;
  };

  const handleCall = (phoneNumber?: string) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("No Phone Number", "Phone number not available");
    }
  };

  const handleBookNow = (subcategoryId?: number) => {
    if (!subcategoryId) {
      Alert.alert("Error", "No bookable skill found for this helper");
      return;
    }

    router.push({
      pathname: "/(tabs)/create-booking",
      params: {
        helper_id: String(helper?.id),
        subcategory_id: String(subcategoryId),
      },
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#FE8B4C" />
      </View>
    );
  }

  if (!helper) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <MaterialCommunityIcons
          name="emoticon-sad-outline"
          size={64}
          color="#d1d5db"
        />
        <Text className="text-gray-400 text-lg mt-4">Helper not found</Text>
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
        {/* Header Section with Back Button */}
        <View className="bg-[#FEF3E8] pt-8 pb-6 px-5 border-b border-[#FDD867]/30">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
          </TouchableOpacity>

          {/* Profile Section */}
          <View className="items-center">
            {/* Avatar */}
            {helper?.profile_photo_url ? (
              <Image
                source={{
                  uri: getFullImageUrl(helper.profile_photo_url) || undefined,
                }}
                className="w-28 h-28 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <View className="w-28 h-28 rounded-full bg-gradient-to-r from-[#FDD867] to-[#FE8B4C] items-center justify-center border-4 border-white shadow-lg">
                <Text className="text-4xl font-bold text-white">
                  {getInitial(helper?.full_name || "")}
                </Text>
              </View>
            )}

            {/* Name */}
            <Text className="text-2xl font-bold text-gray-800 mt-3">
              {helper?.full_name}
            </Text>

            {/* Rating and Experience */}
            <View className="flex-row items-center mt-1">
              <View className="flex-row items-center">
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text className="text-gray-700 font-semibold ml-1">
                  {formatRating(helper?.avg_rating)}
                </Text>
                <Text className="text-gray-500 text-sm ml-1">
                  ({helper?.rating_count || 0} reviews)
                </Text>
              </View>
              <View className="w-1 h-1 bg-gray-300 rounded-full mx-2" />
              <View className="flex-row items-center">
                <Ionicons name="briefcase-outline" size={14} color="#9ca3af" />
                <Text className="text-gray-500 text-sm ml-1">
                  {helper?.completed_jobs_count || 0} jobs done
                </Text>
              </View>
            </View>

            {/* Location */}
            {helper?.address && (
              <View className="flex-row items-center mt-2">
                <Ionicons name="location-outline" size={14} color="#9ca3af" />
                <Text className="text-gray-500 text-sm ml-1">
                  {helper?.address}
                </Text>
              </View>
            )}

            {/* Availability Badge */}
            {helper?.is_available ? (
              <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-full mt-3">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                <Text className="text-green-700 text-xs font-medium">
                  Available Now
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-full mt-3">
                <View className="w-2 h-2 bg-gray-400 rounded-full mr-1" />
                <Text className="text-gray-600 text-xs font-medium">
                  Currently Unavailable
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact Buttons */}
        <View className="flex-row px-5 mt-5 gap-3">
          <TouchableOpacity
            className="flex-1 bg-[#FE8B4C] rounded-xl py-3 items-center flex-row justify-center shadow-sm"
            onPress={() => handleBookNow(skills[0]?.subcategory_id)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Book Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-white border border-gray-200 rounded-xl py-3 items-center flex-row justify-center"
            onPress={() => handleCall(helper?.phone_number)}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={20} color="#FE8B4C" />
            <Text className="text-[#FE8B4C] font-semibold ml-2">Call</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View className="px-5 mt-6">
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-2">About</Text>
            <Text className="text-gray-600 leading-5">
              {helper?.bio ||
                "Experienced and reliable professional dedicated to providing quality service."}
            </Text>

            {/* Experience */}
            <View className="flex-row items-center mt-4 pt-3 border-t border-gray-100">
              <View className="flex-1 flex-row items-center">
                <Ionicons name="briefcase-outline" size={18} color="#FE8B4C" />
                <Text className="text-gray-700 ml-2">
                  {helper?.experience_years || 0} years experience
                </Text>
              </View>
              <View className="flex-1 flex-row items-center">
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#FE8B4C"
                />
                <Text className="text-gray-700 ml-2">
                  {helper?.completed_jobs_count || 0} jobs completed
                </Text>
              </View>
            </View>

            {/* Verification Badge */}
            {helper?.is_verified && (
              <View className="flex-row items-center mt-3 pt-2">
                <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                <Text className="text-green-600 text-xs ml-1">
                  Verified Professional
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Skills Section */}
        {skills.length > 0 && (
          <View className="px-5 mt-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Services & Skills
            </Text>
            {skills.map((skill) => (
              <View
                key={skill.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-base font-semibold text-gray-800">
                        {skill.subcategory_name}
                      </Text>
                      {skill.price_model === "HOURLY" ? (
                        <Text className="text-xs text-gray-500 ml-2">
                          (Hourly)
                        </Text>
                      ) : (
                        <Text className="text-xs text-gray-500 ml-2">
                          (Fixed)
                        </Text>
                      )}
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">
                      {skill.category_name}
                    </Text>
                    <Text
                      className="text-sm text-gray-600 mt-2"
                      numberOfLines={2}
                    >
                      {skill.subcategory_description ||
                        `${skill.subcategory_name} services`}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="briefcase-outline"
                      size={14}
                      color="#9ca3af"
                    />
                    <Text className="text-xs text-gray-500 ml-1">
                      {skill.experience_years || 0} yrs exp
                    </Text>
                  </View>
                  {skill.total_jobs_completed ? (
                    <View className="flex-row items-center">
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={14}
                        color="#9ca3af"
                      />
                      <Text className="text-xs text-gray-500 ml-1">
                        {skill.total_jobs_completed} jobs
                      </Text>
                    </View>
                  ) : null}
                  {skill.average_rating ? (
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text className="text-xs text-gray-500 ml-1">
                        {formatRating(skill.average_rating)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Pricing */}
                <View className="mt-3 pt-2 border-t border-gray-100">
                  {skill.price_model === "FIXED" ? (
                    <Text className="text-2xl font-bold text-[#FE8B4C]">
                      ${skill.fixed_rate || 0}
                      <Text className="text-sm font-normal text-gray-500">
                        {" "}
                        fixed
                      </Text>
                    </Text>
                  ) : (
                    <Text className="text-2xl font-bold text-[#FE8B4C]">
                      ${skill.hourly_rate || 0}
                      <Text className="text-sm font-normal text-gray-500">
                        /hour
                      </Text>
                    </Text>
                  )}
                </View>

                {/* Book Button for this skill */}
                <TouchableOpacity
                  className="mt-3 bg-[#FEF3E8] rounded-lg py-2 items-center"
                  onPress={() => handleBookNow(skill.subcategory_id)}
                >
                  <Text className="text-[#FE8B4C] font-medium text-sm">
                    Book this service
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Reviews Summary Section */}
        <View className="px-5 mt-5">
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-800">Reviews</Text>
              <TouchableOpacity>
                <Text className="text-[#FE8B4C] text-sm font-medium">
                  See All
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center mt-3">
              <View className="items-center mr-4">
                <Text className="text-3xl font-bold text-gray-800">
                  {formatRating(helper?.avg_rating)}
                </Text>
                <View className="flex-row items-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={
                        star <=
                        Math.floor(Number(formatRating(helper?.avg_rating)))
                          ? "star"
                          : "star-outline"
                      }
                      size={14}
                      color={
                        star <=
                        Math.floor(Number(formatRating(helper?.avg_rating)))
                          ? "#F59E0B"
                          : "#d1d5db"
                      }
                    />
                  ))}
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  {helper?.rating_count || 0} reviews
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-sm">
                  {helper?.rating_count || 0} customers have rated this
                  professional
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Reviews List */}
        <View className="px-5 mt-4">
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Customer Reviews
            </Text>

            {reviewsLoading ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#FE8B4C" />
              </View>
            ) : reviews.length === 0 ? (
              <Text className="text-gray-500">No reviews yet.</Text>
            ) : (
              reviews.map((review) => (
                <View
                  key={review.id}
                  className="border-b border-gray-100 pb-4 mb-4 last:border-b-0 last:mb-0 last:pb-0"
                >
                  <View className="flex-row items-center mb-2">
                    {/* Avatar */}
                    {review.user_profile_photo_url ? (
                      <Image
                        source={{
                          uri:
                            getFullImageUrl(review.user_profile_photo_url) ||
                            undefined,
                        }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                      />
                    ) : (
                      <View className="w-9 h-9 rounded-full bg-gray-200 items-center justify-center">
                        <Text className="font-semibold text-gray-700">
                          {review.user_name?.charAt(0)?.toUpperCase() || "U"}
                        </Text>
                      </View>
                    )}

                    {/* Name + Date */}
                    <View className="ml-3 flex-1">
                      <Text className="font-semibold text-gray-800">
                        {review.user_name || "User"}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </Text>
                    </View>

                    {/* Rating */}
                    <View className="bg-yellow-100 px-2 py-1 rounded-full">
                      <Text className="text-yellow-700 font-semibold">
                        {review.rating} ★
                      </Text>
                    </View>
                  </View>

                  {/* Comment */}
                  <Text className="text-gray-700">
                    {review.comment || "No comment provided."}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Book Again Button */}
        <View className="px-5 mt-5 mb-4">
          <TouchableOpacity
            className="bg-[#FE8B4C] rounded-xl py-4 items-center shadow-sm"
            onPress={() => handleBookNow(skills[0]?.subcategory_id)}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={20} color="white" />
              <Text className="text-white font-semibold text-base ml-2">
                Book {helper?.full_name?.split(" ")[0] || "Helper"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="px-5 pb-4">
          <Text className="text-center text-gray-400 text-xs">
            By booking, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
