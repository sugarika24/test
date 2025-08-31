import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getHelperReviews } from "../../services/reviewService";
import { getFullImageUrl } from "../../services/profileService";
import { ReviewItem } from "../../types/review";

export default function HelperReviewsScreen() {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchReviews();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  async function fetchReviews() {
    if (!user?.id) {
      setReviews([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      const res = await getHelperReviews(user.id);
      setReviews(res.reviews || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load reviews");
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  const averageRating = useMemo(() => {
    if (!reviews.length) return "0.0";
    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0,
    );
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const ratingBreakdown = useMemo<Record<1 | 2 | 3 | 4 | 5, number>>(() => {
    const counts: Record<1 | 2 | 3 | 4 | 5, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach((review) => {
      const rating = Number(review.rating);
      if (rating >= 1 && rating <= 5) {
        counts[rating as 1 | 2 | 3 | 4 | 5] += 1;
      }
    });

    return counts;
  }, [reviews]);

  const getRelativeDate = (dateString: string) => {
    const now = new Date();
    const reviewDate = new Date(dateString);
    const diffMs = now.getTime() - reviewDate.getTime();

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

    return reviewDate.toLocaleDateString();
  };

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={14}
            color="#F59E0B"
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  const getBarWidth = (count: number) => {
    if (!reviews.length) return "0%";
    return `${(count / reviews.length) * 100}%`;
  };

  if (loading) {
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
        <View className="bg-[#FEF3E8] pt-8 pb-6 px-5 border-b border-[#FDD867]/30">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-800">My Reviews</Text>
          <Text className="text-gray-500 text-sm mt-1">
            Customer feedback and ratings
          </Text>

          {/* Summary Card */}
          <View className="bg-white rounded-2xl p-4 mt-4 shadow-sm border border-gray-100">
            <View className="flex-row">
              <View className="items-center justify-center pr-5 border-r border-gray-100">
                <Text className="text-4xl font-bold text-gray-800">
                  {averageRating}
                </Text>
                <View className="mt-1">
                  {renderStars(Math.round(Number(averageRating)))}
                </View>
                <Text className="text-xs text-gray-500 mt-2">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </Text>
              </View>

              <View className="flex-1 pl-4 justify-center">
                {[5, 4, 3, 2, 1].map((star) => (
                  <View
                    key={star}
                    className="flex-row items-center mb-2 last:mb-0"
                  >
                    <Text className="text-xs text-gray-600 w-3">{star}</Text>
                    <Ionicons
                      name="star"
                      size={12}
                      color="#F59E0B"
                      style={{ marginLeft: 2, marginRight: 8 }}
                    />
                    <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <View
                        className="h-2 bg-[#FE8B4C] rounded-full"
                        style={
                          {
                            width: getBarWidth(
                              ratingBreakdown[
                                star as keyof typeof ratingBreakdown
                              ],
                            ),
                          } as any
                        }
                      />
                    </View>
                    <Text className="text-xs text-gray-500 ml-2 w-5 text-right">
                      {ratingBreakdown[star as keyof typeof ratingBreakdown]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Reviews List */}
        <View className="px-5 pt-5">
          {reviews.length === 0 ? (
            <View className="items-center justify-center py-12 bg-white rounded-2xl border border-gray-100">
              <MaterialCommunityIcons
                name="star-outline"
                size={48}
                color="#d1d5db"
              />
              <Text className="text-gray-400 text-base mt-3">
                No reviews yet
              </Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">
                Complete more bookings to receive customer feedback
              </Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View
                key={review.id}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-start">
                  {review.user_profile_photo_url ? (
                    <Image
                      source={{
                        uri:
                          getFullImageUrl(review.user_profile_photo_url) ||
                          undefined,
                      }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-[#FEF3E8] items-center justify-center">
                      <Text className="font-bold text-[#FE8B4C] text-base">
                        {review.user_name?.charAt(0)?.toUpperCase() || "U"}
                      </Text>
                    </View>
                  )}

                  <View className="flex-1 ml-3">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-2">
                        <Text className="font-semibold text-gray-800 text-base">
                          {review.user_name || "User"}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          {getRelativeDate(review.created_at)}
                        </Text>
                      </View>

                      <View className="bg-yellow-100 px-3 py-1 rounded-full">
                        <Text className="text-yellow-700 font-semibold">
                          {review.rating}.0 ★
                        </Text>
                      </View>
                    </View>

                    <View className="mt-2">
                      {renderStars(Number(review.rating))}
                    </View>

                    <View className="mt-3 bg-gray-50 rounded-xl p-3">
                      <Text className="text-gray-700 leading-5">
                        {review.comment?.trim() || "No comment provided."}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
