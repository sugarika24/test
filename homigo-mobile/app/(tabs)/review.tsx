import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Alert,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import {
  createReview,
  updateReview,
  getReviewByBooking,
} from "../../services/reviewService";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ReviewScreen() {
  const { token } = useAuth();

  const params = useLocalSearchParams<{
    booking_id?: string;
    helper_name?: string;
    service_name?: string;
  }>();

  const bookingId = Number(params.booking_id || 0);
  const helperName = params.helper_name || "Helper";
  const serviceName = params.service_name || "Service";

  const [reviewId, setReviewId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadExistingReview();
  }, []);

  async function loadExistingReview() {
    if (!token || !bookingId) {
      setInitialLoading(false);
      return;
    }

    try {
      const res = await getReviewByBooking(bookingId, token);
      const review = res.review;

      if (review) {
        setReviewId(review.id);
        setRating(Number(review.rating || 0));
        setComment(review.comment || "");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load review");
    } finally {
      setInitialLoading(false);
    }
  }

  const isEditMode = !!reviewId;

  async function handleSubmitReview() {
    if (!token) return;

    if (!bookingId) {
      Alert.alert("Error", "Invalid booking");
      return;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert("Validation", "Please select a rating between 1 and 5");
      return;
    }

    try {
      setLoading(true);

      if (reviewId) {
        await updateReview(
          reviewId,
          {
            rating,
            comment: comment.trim() || undefined,
          },
          token,
        );

        Alert.alert("Success", "Review updated successfully", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        await createReview(
          {
            booking_id: bookingId,
            rating,
            comment: comment.trim() || undefined,
          },
          token,
        );

        Alert.alert("Success", "Review submitted successfully", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message ||
          (reviewId ? "Failed to update review" : "Failed to submit review"),
      );
    } finally {
      setLoading(false);
    }
  }

  function StarButton({ value }: { value: number }) {
    const active = value <= rating;

    return (
      <TouchableOpacity
        onPress={() => setRating(value)}
        className="mr-2"
        activeOpacity={0.7}
      >
        <Text
          className={`text-5xl ${active ? "text-[#F59E0B]" : "text-gray-200"}`}
        >
          ★
        </Text>
      </TouchableOpacity>
    );
  }

  const getRatingLabel = () => {
    if (rating === 1) return "Very Poor";
    if (rating === 2) return "Poor";
    if (rating === 3) return "Average";
    if (rating === 4) return "Good";
    if (rating === 5) return "Excellent!";
    return "";
  };

  if (initialLoading) {
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
                {isEditMode ? "Edit Review" : "Write a Review"}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {isEditMode ? "Update your feedback" : "Share your experience"}
              </Text>
            </View>
            <View className="bg-[#FEF3E8] p-3 rounded-full">
              <Ionicons name="star-outline" size={28} color="#FE8B4C" />
            </View>
          </View>
        </View>

        {/* Booking Info Card */}
        <View className="mx-5 mt-5 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <Text className="text-sm text-gray-500 mb-1">Service</Text>
          <Text className="text-lg font-bold text-gray-800 mb-3">
            {serviceName}
          </Text>

          <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
            <View>
              <Text className="text-xs text-gray-500">Helper</Text>
              <Text className="text-base font-semibold text-gray-800">
                {helperName}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-gray-500">Booking ID</Text>
              <Text className="text-base font-semibold text-gray-800">
                #{bookingId}
              </Text>
            </View>
          </View>
        </View>

        {/* Rating Section */}
        <View className="mx-5 mt-6">
          <Text className="text-lg font-bold text-gray-800 mb-2">
            Your Rating
          </Text>
          <Text className="text-sm text-gray-500 mb-4">
            Tap on the stars to rate your experience
          </Text>

          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 items-center">
            <View className="flex-row mb-3">
              <StarButton value={1} />
              <StarButton value={2} />
              <StarButton value={3} />
              <StarButton value={4} />
              <StarButton value={5} />
            </View>
            {rating > 0 && (
              <Text className="text-[#F59E0B] font-medium">
                {getRatingLabel()}
              </Text>
            )}
          </View>
        </View>

        {/* Comment Section */}
        <View className="mx-5 mt-6">
          <Text className="text-lg font-bold text-gray-800 mb-2">
            Your Review
          </Text>
          <Text className="text-sm text-gray-500 mb-4">
            What did you think about the service?
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience with this helper..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="text-gray-800 text-base min-h-[120px]"
            />
          </View>
        </View>

        {/* Submit Button */}
        <View className="px-5 mt-8">
          <TouchableOpacity
            className={`rounded-2xl py-4 items-center ${
              rating === 0 ? "bg-gray-300" : "bg-[#FE8B4C]"
            }`}
            onPress={handleSubmitReview}
            disabled={loading || rating === 0}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="send-outline" size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  {isEditMode ? "Update Review" : "Submit Review"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <View className="mx-5 mt-6 mb-4">
          <Text className="text-center text-gray-400 text-xs">
            Your feedback helps other customers and improves service quality
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
