import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getHelperReviews } from "../../services/reviewService";
import { getHelperBookings } from "../../services/bookingService";
import { getUnreadNotificationCount } from "../../services/notificationService";
import { ReviewItem } from "@/types/review";
import ChatHeaderButton from "@/components/ChatHeaderButton";

type HelperBookingItem = {
  id: number;
  status?: string;
  final_amount?: number | string | null;
  booking_date?: string | null;
  created_at?: string;
};

export default function HelperHomeScreen() {
  const { user, token, signOut } = useAuth();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [bookings, setBookings] = useState<HelperBookingItem[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id && token) {
      fetchDashboardData();
    } else {
      setReviewsLoading(false);
      setBookingsLoading(false);
    }
  }, [user?.id, token]);

  useFocusEffect(
    React.useCallback(() => {
      loadUnreadCount();
    }, []),
  );

  async function loadUnreadCount() {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count || 0);
    } catch (error) {
      console.log("Failed to load unread notification count:", error);
    }
  }

  async function fetchDashboardData() {
    await Promise.all([fetchReviews(), fetchBookings(), loadUnreadCount()]);
  }

  async function fetchReviews() {
    if (!user?.id) {
      setReviews([]);
      setReviewsLoading(false);
      return;
    }

    try {
      setReviewsLoading(true);
      const res = await getHelperReviews(user.id);
      setReviews(res.reviews || []);
    } catch (error) {
      console.log("helper home reviews error:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }

  async function fetchBookings() {
    if (!token) {
      setBookings([]);
      setBookingsLoading(false);
      return;
    }

    try {
      setBookingsLoading(true);
      const res = await getHelperBookings(token);
      setBookings(res.bookings || []);

      console.log(
        "BOOKING STATUSES:",
        (res.bookings || []).map((b: HelperBookingItem) => b.status),
      );
    } catch (error) {
      console.log("helper home bookings error:", error);
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }

  const averageRating = useMemo(() => {
    if (!reviews.length) return "0.0";

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0,
    );

    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const reviewCount = reviews.length;

  const completedBookings = useMemo(() => {
    return bookings.filter(
      (booking) => booking.status?.toUpperCase() === "COMPLETED",
    );
  }, [bookings]);

  const completedJobsCount = completedBookings.length;

  const totalEarnings = useMemo(() => {
    const total = completedBookings.reduce((sum, booking) => {
      return sum + Number(booking.final_amount || 0);
    }, 0);

    return total.toFixed(2);
  }, [completedBookings]);

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  }, []);

  const monthStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, []);

  const thisWeekEarnings = useMemo(() => {
    const total = completedBookings.reduce((sum, booking) => {
      if (!booking.booking_date) return sum;

      const bookingDate = new Date(booking.booking_date);
      if (bookingDate >= weekStart) {
        return sum + Number(booking.final_amount || 0);
      }

      return sum;
    }, 0);

    return total.toFixed(2);
  }, [completedBookings, weekStart]);

  const thisMonthEarnings = useMemo(() => {
    const total = completedBookings.reduce((sum, booking) => {
      if (!booking.booking_date) return sum;

      const bookingDate = new Date(booking.booking_date);
      if (bookingDate >= monthStart) {
        return sum + Number(booking.final_amount || 0);
      }

      return sum;
    }, 0);

    return total.toFixed(2);
  }, [completedBookings, monthStart]);

  const activityCount = bookings.length;

  const activityPending = bookings.filter(
    (b) => b.status?.toUpperCase() === "PENDING",
  ).length;

  const activityInProgress = bookings.filter(
    (b) =>
      b.status?.toUpperCase() === "IN_PROGRESS" ||
      b.status?.toUpperCase() === "ON_THE_WAY" ||
      b.status?.toUpperCase() === "ACCEPTED",
  ).length;

  const activityCompleted = bookings.filter(
    (b) => b.status?.toUpperCase() === "COMPLETED",
  ).length;

  const getInitial = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "H";
  };

  const statsLoading = reviewsLoading || bookingsLoading;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#FEF3E8", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="pt-12 pb-6 px-5"
        >
          <View>
            <View className="absolute right-0 top-0 z-10 flex-row items-center gap-2 pr-4 pt-4">
              {/* Chat Button */}
              <ChatHeaderButton />

              {/* Notifications Button with Badge */}
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                className="bg-white p-3 rounded-full shadow-md"
                activeOpacity={0.8}
              >
                <View className="relative">
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color="#FE8B4C"
                  />
                  {unreadCount > 0 && (
                    <View className="absolute -top-2 -right-2 bg-[#FE4D01] rounded-full px-1 min-w-[18px] h-[18px] items-center justify-center">
                      <Text className="text-white text-[10px] font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View className="items-center">
              <View className="w-24 h-24 rounded-full bg-[#FE8B4C] items-center justify-center shadow-lg border-4 border-white">
                <Text className="text-3xl font-bold text-white">
                  {getInitial(user?.full_name || "")}
                </Text>
              </View>

              <Text className="text-2xl font-bold text-gray-800 mt-4">
                {user?.full_name}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">{user?.email}</Text>

              <View className="flex-row items-center mt-2">
                <View className="bg-green-100 px-3 py-1 rounded-full flex-row items-center">
                  <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                  <Text className="text-green-700 text-xs font-medium">
                    Active Helper
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View className="px-5 pt-6">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 items-center">
              <MaterialCommunityIcons
                name="briefcase-check"
                size={24}
                color="#FE8B4C"
              />
              {statsLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#FE8B4C"
                  style={{ marginTop: 8 }}
                />
              ) : (
                <Text className="text-2xl font-bold text-gray-800 mt-2">
                  {completedJobsCount}
                </Text>
              )}
              <Text className="text-xs text-gray-500">Completed Jobs</Text>
            </View>

            <TouchableOpacity
              className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 items-center"
              onPress={() => router.push("/(helper)/reviews")}
              activeOpacity={0.8}
            >
              <Ionicons name="star" size={24} color="#F59E0B" />
              {statsLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#FE8B4C"
                  style={{ marginTop: 8 }}
                />
              ) : (
                <Text className="text-2xl font-bold text-gray-800 mt-2">
                  {averageRating}
                </Text>
              )}
              <Text className="text-xs text-gray-500">
                Rating {reviewCount > 0 ? `(${reviewCount})` : ""}
              </Text>
            </TouchableOpacity>

            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 items-center">
              <Ionicons name="cash-outline" size={24} color="#10b981" />
              {statsLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#10b981"
                  style={{ marginTop: 8 }}
                />
              ) : (
                <Text className="text-2xl font-bold text-gray-800 mt-2">
                  Rs. {Number(totalEarnings).toFixed(0)}
                </Text>
              )}
              <Text className="text-xs text-gray-500">Earnings</Text>
            </View>
          </View>
        </View>

        <View className="px-5 pt-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Quick Actions
          </Text>

          <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row items-center"
            onPress={() => router.push("/(helper)/profile")}
            activeOpacity={0.8}
          >
            <View className="w-12 h-12 bg-[#FEF3E8] rounded-full items-center justify-center">
              <Ionicons name="person-outline" size={24} color="#FE8B4C" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-base font-semibold text-gray-800">
                My Profile
              </Text>
              <Text className="text-xs text-gray-500">
                View and edit your profile information
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row items-center"
            onPress={() => router.push("/(helper)/skills")}
            activeOpacity={0.8}
          >
            <View className="w-12 h-12 bg-[#FEF3E8] rounded-full items-center justify-center">
              <MaterialCommunityIcons name="tools" size={24} color="#FE8B4C" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-base font-semibold text-gray-800">
                Manage Skills
              </Text>
              <Text className="text-xs text-gray-500">
                Add or update your service skills
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row items-center"
            onPress={() => router.push("/(helper)/bookings")}
            activeOpacity={0.8}
          >
            <View className="w-12 h-12 bg-[#FEF3E8] rounded-full items-center justify-center">
              <Ionicons name="calendar-outline" size={24} color="#FE8B4C" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-base font-semibold text-gray-800">
                View Bookings
              </Text>
              <Text className="text-xs text-gray-500">
                Check your upcoming and past bookings
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row items-center"
            onPress={() => router.push("/(helper)/reviews")}
            activeOpacity={0.8}
          >
            <View className="w-12 h-12 bg-[#FEF3E8] rounded-full items-center justify-center">
              <Ionicons name="star-outline" size={24} color="#F59E0B" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-base font-semibold text-gray-800">
                My Reviews
              </Text>
              <Text className="text-xs text-gray-500">
                See ratings and feedback from customers
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        <View className="px-5 pt-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Recent Earnings
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm text-gray-500">This Week</Text>
              {bookingsLoading ? (
                <ActivityIndicator size="small" color="#FE8B4C" />
              ) : (
                <Text className="text-sm font-semibold text-[#FE8B4C]">
                  Rs. {thisWeekEarnings}
                </Text>
              )}
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm text-gray-500">This Month</Text>
              {bookingsLoading ? (
                <ActivityIndicator size="small" color="#FE8B4C" />
              ) : (
                <Text className="text-sm font-semibold text-[#FE8B4C]">
                  Rs. {thisMonthEarnings}
                </Text>
              )}
            </View>

            <View className="h-px bg-gray-100 my-2" />

            <View className="flex-row justify-between items-center">
              <Text className="text-base font-bold text-gray-800">
                Total Earnings
              </Text>
              {bookingsLoading ? (
                <ActivityIndicator size="small" color="#FE8B4C" />
              ) : (
                <Text className="text-xl font-bold text-[#FE8B4C]">
                  Rs. {totalEarnings}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View className="px-5 pt-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Booking Activity
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-gray-800">
                Total Bookings
              </Text>
              <Text className="text-lg font-bold text-[#FE8B4C]">
                {activityCount}
              </Text>
            </View>

            <View className="h-px bg-gray-100 my-2" />

            <View className="flex-row justify-between mt-2">
              <View className="items-center flex-1">
                <Text className="text-yellow-600 font-bold">
                  {activityPending}
                </Text>
                <Text className="text-xs text-gray-500">Pending</Text>
              </View>

              <View className="items-center flex-1">
                <Text className="text-blue-600 font-bold">
                  {activityInProgress}
                </Text>
                <Text className="text-xs text-gray-500">In Progress</Text>
              </View>

              <View className="items-center flex-1">
                <Text className="text-green-600 font-bold">
                  {activityCompleted}
                </Text>
                <Text className="text-xs text-gray-500">Completed</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="px-5 pt-6">
          <TouchableOpacity
            className="bg-red-500 rounded-2xl py-4 items-center flex-row justify-center"
            onPress={signOut}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Logout</Text>
          </TouchableOpacity>
        </View>

        <View className="px-5 mt-6 mb-4">
          <Text className="text-center text-gray-400 text-xs">
            Homigo Helper App v1.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
