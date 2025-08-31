import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  getCompletedBookingsForAdmin,
  releaseHelperPayment,
} from "../../services/adminService";
import { AdminCompletedBooking } from "../../types/admin";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

type PaymentFilter = "ALL" | "PENDING" | "RELEASED";

export default function AdminPaymentsScreen() {
  const { token } = useAuth();

  const [bookings, setBookings] = useState<AdminCompletedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<PaymentFilter>("ALL");
  const [releasingId, setReleasingId] = useState<number | null>(null);

  useEffect(() => {
    fetchBookings("ALL");
  }, []);

  async function fetchBookings(filter: PaymentFilter = selectedFilter) {
    if (!token) return;

    try {
      setLoading(true);

      const payoutStatus = filter === "ALL" ? undefined : filter;

      const res = await getCompletedBookingsForAdmin(token, payoutStatus);
      setBookings(res.bookings || []);
      setSelectedFilter(filter);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to load completed bookings",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings(selectedFilter);
  };

  async function handleReleasePayment(bookingId: number) {
    if (!token) return;

    Alert.alert(
      "Release Payment",
      "Are you sure you want to release this payment to the helper?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Release",
          onPress: async () => {
            try {
              setReleasingId(bookingId);
              await releaseHelperPayment(bookingId, token);
              Alert.alert("Success", "Helper payment released successfully");
              await fetchBookings(selectedFilter);
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to release payment",
              );
            } finally {
              setReleasingId(null);
            }
          },
        },
      ],
    );
  }

  function formatDate(date?: string | null) {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  }

  function getStatusBadgeStyle(status?: string) {
    if (status === "RELEASED") {
      return { bg: "#DCFCE7", text: "#166534", icon: "checkmark-circle" };
    }
    return { bg: "#FEF3C7", text: "#92400E", icon: "time-outline" };
  }

  const getFilterCount = (filter: PaymentFilter) => {
    if (filter === "ALL") return bookings.length;
    return bookings.filter((b) => b.payout_status === filter).length;
  };

  const totalPendingAmount = bookings
    .filter((b) => b.payout_status === "PENDING")
    .reduce((sum, b) => sum + Number(b.helper_earning || 0), 0);

  const totalReleasedAmount = bookings
    .filter((b) => b.payout_status === "RELEASED")
    .reduce((sum, b) => sum + Number(b.helper_earning || 0), 0);

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
        {/* Header with Back Button */}
        <View className="bg-white pt-12 pb-5 px-5 border-b border-gray-100">
          {/* Back Button */}
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
                Release Payments
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {bookings.length} completed bookings
              </Text>
            </View>
            <View className="bg-[#FEF3E8] p-3 rounded-full">
              <MaterialCommunityIcons name="cash" size={28} color="#FE8B4C" />
            </View>
          </View>
        </View>

        {/* Summary Cards */}
        <View className="px-5 pt-5">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-500 text-sm">Pending Payments</Text>
                <View className="bg-yellow-50 p-2 rounded-full">
                  <Ionicons name="time-outline" size={16} color="#F59E0B" />
                </View>
              </View>
              <Text className="text-2xl font-bold text-gray-800 mt-2">
                {bookings.filter((b) => b.payout_status === "PENDING").length}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">
                Rs. {totalPendingAmount.toFixed(2)} total
              </Text>
            </View>

            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-500 text-sm">Released Payments</Text>
                <View className="bg-green-50 p-2 rounded-full">
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                </View>
              </View>
              <Text className="text-2xl font-bold text-gray-800 mt-2">
                {bookings.filter((b) => b.payout_status === "RELEASED").length}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">
                Rs. {totalReleasedAmount.toFixed(2)} total
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Buttons */}
        <View className="px-5 pt-5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {(["ALL", "PENDING", "RELEASED"] as PaymentFilter[]).map(
                (filter) => (
                  <TouchableOpacity
                    key={filter}
                    className={`px-4 py-2 rounded-full ${
                      selectedFilter === filter
                        ? "bg-[#FE8B4C]"
                        : "bg-white border border-gray-200"
                    }`}
                    onPress={() => fetchBookings(filter)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`font-semibold ${
                        selectedFilter === filter
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {filter} ({getFilterCount(filter)})
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </ScrollView>
        </View>

        {/* Bookings List */}
        <View className="px-5 pt-4">
          {bookings.map((booking) => {
            const statusStyle = getStatusBadgeStyle(booking.payout_status);
            const isReleasing = releasingId === booking.id;

            return (
              <View
                key={booking.id}
                className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
              >
                {/* Header */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      {booking.service_name || "Service Booking"}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      #{booking.booking_number}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={{ backgroundColor: statusStyle.bg }}
                    className="px-3 py-1 rounded-full flex-row items-center"
                  >
                    <Ionicons
                      name={statusStyle.icon as any}
                      size={12}
                      color={statusStyle.text}
                    />
                    <Text
                      style={{ color: statusStyle.text }}
                      className="text-xs font-medium ml-1"
                    >
                      {booking.payout_status}
                    </Text>
                  </View>
                </View>

                {/* User & Helper Info */}
                <View className="flex-row flex-wrap mb-3 pb-3 border-b border-gray-100">
                  <View className="w-1/2 mb-2">
                    <Text className="text-xs text-gray-500">User</Text>
                    <Text className="text-sm font-medium text-gray-800">
                      {booking.user_name}
                    </Text>
                  </View>
                  <View className="w-1/2 mb-2">
                    <Text className="text-xs text-gray-500">Helper</Text>
                    <Text className="text-sm font-medium text-gray-800">
                      {booking.helper_name}
                    </Text>
                  </View>
                  <View className="w-1/2">
                    <Text className="text-xs text-gray-500">Category</Text>
                    <Text className="text-sm text-gray-600">
                      {booking.category_name || "N/A"}
                    </Text>
                  </View>
                  <View className="w-1/2">
                    <Text className="text-xs text-gray-500">Subcategory</Text>
                    <Text className="text-sm text-gray-600">
                      {booking.subcategory_name || "N/A"}
                    </Text>
                  </View>
                </View>

                {/* Payment Details */}
                <View className="flex-row flex-wrap mb-3">
                  <View className="w-1/3 mb-2">
                    <Text className="text-xs text-gray-500">Final Amount</Text>
                    <Text className="text-sm font-semibold text-gray-800">
                      Rs. {booking.final_amount || "0.00"}
                    </Text>
                  </View>
                  <View className="w-1/3 mb-2">
                    <Text className="text-xs text-gray-500">Commission</Text>
                    <Text className="text-sm text-gray-600">
                      Rs. {booking.commission_amount || "0.00"}
                    </Text>
                  </View>
                  <View className="w-1/3 mb-2">
                    <Text className="text-xs text-gray-500">
                      Helper Earning
                    </Text>
                    <Text className="text-sm font-semibold text-[#FE8B4C]">
                      Rs. {booking.helper_earning || "0.00"}
                    </Text>
                  </View>
                </View>

                {/* Date */}
                <View className="flex-row items-center mb-4">
                  <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
                  <Text className="text-xs text-gray-400 ml-1">
                    Completed: {formatDate(booking.completed_at)}
                  </Text>
                </View>

                {/* Action Button */}
                {booking.payout_status === "PENDING" ? (
                  <TouchableOpacity
                    className="bg-[#FE8B4C] rounded-xl py-3 items-center flex-row justify-center"
                    onPress={() => handleReleasePayment(booking.id)}
                    disabled={isReleasing}
                    activeOpacity={0.8}
                  >
                    {isReleasing ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="cash-outline" size={18} color="white" />
                        <Text className="text-white font-semibold ml-2">
                          Release Payment
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View className="bg-gray-100 rounded-xl py-3 items-center flex-row justify-center">
                    <Ionicons name="checkmark-done" size={18} color="#10b981" />
                    <Text className="text-green-600 font-semibold ml-2">
                      Payment Released
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Empty State */}
        {!bookings.length && (
          <View className="items-center justify-center py-16">
            <MaterialCommunityIcons name="cash-off" size={64} color="#d1d5db" />
            <Text className="text-gray-400 text-lg font-medium mt-4">
              No bookings found
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              No completed bookings available
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
