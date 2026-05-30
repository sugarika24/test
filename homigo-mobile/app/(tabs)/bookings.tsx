import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import * as Location from "expo-location";
import { useAuth } from "../../context/AuthContext";
import { cancelBooking, getUserBookings } from "../../services/bookingService";
import { getReviewByBooking } from "../../services/reviewService";
import { createEmergencyAlert } from "../../services/emergencyService";
import { Booking } from "../../types/booking";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function UserBookingsScreen() {
  const { token } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewsMap, setReviewsMap] = useState<Record<number, any>>({});

  useEffect(() => {
    fetchBookings();
  }, [token]);

  async function fetchBookings() {
    if (!token) return;

    try {
      setLoading(true);

      const res = await getUserBookings(token);
      const fetchedBookings = res.bookings || [];

      setBookings(fetchedBookings);

      const completedBookings = fetchedBookings.filter(
        (booking: Booking) => booking.status === "COMPLETED",
      );

      const reviewEntries = await Promise.all(
        completedBookings.map(async (booking: Booking) => {
          try {
            const reviewRes = await getReviewByBooking(booking.id, token);
            return [booking.id, reviewRes.review || null];
          } catch {
            return [booking.id, null];
          }
        }),
      );

      setReviewsMap(Object.fromEntries(reviewEntries));
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleCancel(id: number) {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            if (!token) return;

            try {
              await cancelBooking(id, token, "Cancelled by user");
              Alert.alert("Success", "Booking cancelled successfully");
              fetchBookings();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to cancel booking");
            }
          },
        },
      ],
    );
  }

  async function handleSOS(booking: Booking) {
    Alert.alert(
      "Send Emergency Alert?",
      "This will notify the admin with your booking details and current location.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send SOS",
          style: "destructive",
          onPress: async () => {
            if (!token) return;

            try {
              const { status } =
                await Location.requestForegroundPermissionsAsync();

              if (status !== "granted") {
                Alert.alert(
                  "Location Required",
                  "Location permission is required to send SOS alert.",
                );
                return;
              }

              const location = await Location.getCurrentPositionAsync({});

              await createEmergencyAlert(token, {
                booking_id: booking.id,
                emergency_type: "UNSAFE_BEHAVIOUR",
                message: "User triggered SOS emergency alert.",
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });

              Alert.alert(
                "SOS Sent",
                "Emergency alert has been sent to admin.",
              );
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to send emergency alert",
              );
            }
          },
        },
      ],
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          icon: "time-outline",
          label: "Pending",
        };
      case "ACCEPTED":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          icon: "checkmark-circle-outline",
          label: "Accepted",
        };
      case "ON_THE_WAY":
        return {
          bg: "bg-purple-100",
          text: "text-purple-700",
          icon: "car-outline",
          label: "On The Way",
        };
      case "IN_PROGRESS":
        return {
          bg: "bg-orange-100",
          text: "text-orange-700",
          icon: "construct-outline",
          label: "In Progress",
        };
      case "COMPLETED":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          icon: "checkmark-done-outline",
          label: "Completed",
        };
      case "CANCELLED":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          icon: "close-circle-outline",
          label: "Cancelled",
        };
      case "REJECTED":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          icon: "close-circle-outline",
          label: "Rejected",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          icon: "help-outline",
          label: status,
        };
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const formatPaidAt = (paidAt?: string | null) => {
    if (!paidAt) return null;

    try {
      return new Date(paidAt).toLocaleString();
    } catch {
      return paidAt;
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#FE8B4C" />
        <Text className="text-gray-500 mt-3">Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-[#FEF3E8] pt-12 pb-6 px-6 border-b border-[#FDD867]/30">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
        </TouchableOpacity>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-[#FE8B4C] mb-1">
              My Bookings
            </Text>

            <Text className="text-gray-500 text-sm">
              {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}{" "}
              found
            </Text>
          </View>

          <View className="bg-[#FE8B4C]/10 p-3 rounded-full">
            <MaterialCommunityIcons
              name="calendar-clock"
              size={28}
              color="#FE8B4C"
            />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FE8B4C"]}
          />
        }
      >
        {bookings.length === 0 ? (
          <View className="items-center justify-center py-16">
            <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            </View>

            <Text className="text-gray-400 text-lg font-medium mb-2">
              No Bookings Yet
            </Text>

            <Text className="text-gray-400 text-sm text-center">
              You haven&apos;t made any bookings yet.
              {"\n"}Start booking services now!
            </Text>
          </View>
        ) : (
          bookings.map((booking) => {
            const bookingStatus = String(booking.status || "")
              .trim()
              .toUpperCase();
            const paymentStatus = String(booking.payment_status || "")
              .trim()
              .toUpperCase();

            const status = getStatusColor(bookingStatus);

            const review = reviewsMap[booking.id];
            const hasReview = !!review;

            const isPaid = ["PAID", "COMPLETED", "SUCCESS"].includes(
              paymentStatus,
            );

            const canCancel =
              ["PENDING", "ACCEPTED"].includes(bookingStatus) && !isPaid;

            const canReschedule =
              ["PENDING", "ACCEPTED"].includes(bookingStatus) && !isPaid;

            const canOpenChat = [
              "PENDING",
              "ACCEPTED",
              "ON_THE_WAY",
              "IN_PROGRESS",
            ].includes(bookingStatus);

            const canPayNow =
              ["ACCEPTED", "ON_THE_WAY", "IN_PROGRESS"].includes(
                bookingStatus,
              ) &&
              !isPaid &&
              booking.payment_method !== "COD";

            const canTrackProgress = ["ON_THE_WAY", "IN_PROGRESS"].includes(
              bookingStatus,
            );

            const canSendSOS = [
              "ACCEPTED",
              "ON_THE_WAY",
              "IN_PROGRESS",
            ].includes(bookingStatus);
            return (
              <View
                key={booking.id}
                className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      {booking.service_name || "Home Service"}
                    </Text>
                  </View>

                  <View className={`${status.bg} px-3 py-1 rounded-full`}>
                    <View className="flex-row items-center">
                      <Ionicons
                        name={status.icon as any}
                        size={14}
                        color="#374151"
                      />
                      <Text
                        className={`${status.text} text-xs font-medium ml-1`}
                      >
                        {status.label}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="flex-row items-center mb-3 pb-3 border-b border-gray-100">
                  <View className="w-10 h-10 bg-[#FEF3E8] rounded-full items-center justify-center">
                    <Text className="text-[#FE8B4C] font-bold text-lg">
                      {booking.helper_name?.charAt(0)?.toUpperCase() || "H"}
                    </Text>
                  </View>

                  <View className="ml-3">
                    <Text className="text-gray-500 text-xs">
                      Service Provider
                    </Text>

                    <Text className="text-gray-800 font-medium">
                      {booking.helper_name || "Helper"}
                    </Text>
                  </View>
                </View>

                <View className="space-y-2 mb-3">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#9ca3af"
                    />

                    <Text className="text-gray-600 text-sm ml-2">
                      {new Date(booking.booking_date).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={16} color="#9ca3af" />

                    <Text className="text-gray-600 text-sm ml-2">
                      {new Date(booking.start_time).toLocaleTimeString(
                        "en-GB",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}{" "}
                      {booking.end_time
                        ? `- ${new Date(booking.end_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
                        : ""}
                    </Text>
                  </View>

                  {booking.service_address && (
                    <View className="flex-row items-center">
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color="#9ca3af"
                      />

                      <Text
                        className="text-gray-600 text-sm ml-2 flex-1"
                        numberOfLines={1}
                      >
                        {booking.service_address}
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <Text className="text-gray-600 text-sm">
                      {bookingStatus === "COMPLETED"
                        ? "Total Amount"
                        : "Estimated Amount"}
                    </Text>

                    <Text className="text-[#FE8B4C] font-bold text-lg">
                      Rs.
                      {booking.status === "COMPLETED"
                        ? booking.final_amount || booking.estimated_amount || 0
                        : booking.estimated_amount || 0}
                    </Text>
                  </View>
                </View>

                <View className="mt-2 pt-2 border-t border-gray-100">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-gray-500 text-xs">
                      Payment Status
                    </Text>

                    <View
                      className={`px-2 py-1 rounded-full ${
                        booking.payment_status === "PAID"
                          ? "bg-green-100"
                          : booking.payment_status === "INITIATED"
                            ? "bg-orange-100"
                            : "bg-yellow-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          booking.payment_status === "PAID"
                            ? "text-green-700"
                            : booking.payment_status === "INITIATED"
                              ? "text-orange-700"
                              : "text-yellow-700"
                        }`}
                      >
                        {booking.payment_method === "COD"
                          ? "CASH ON DELIVERY"
                          : booking.payment_status || "UNPAID"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-gray-500 text-xs">Method</Text>

                    <Text className="text-gray-700 text-xs font-medium">
                      {booking.payment_method || "Not selected"}
                    </Text>
                  </View>

                  {booking.transaction_id ? (
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-gray-500 text-xs">
                        Transaction ID
                      </Text>

                      <Text className="text-gray-700 text-xs font-medium">
                        {booking.transaction_id}
                      </Text>
                    </View>
                  ) : null}

                  {booking.paid_at ? (
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-500 text-xs">Paid At</Text>

                      <Text className="text-gray-700 text-xs font-medium">
                        {formatPaidAt(booking.paid_at)}
                      </Text>
                    </View>
                  ) : null}

                  {booking.status === "PENDING" &&
                    booking.payment_status !== "PAID" && (
                      <Text className="text-yellow-700 text-xs mt-2">
                        Payment will be available after helper accepts your
                        booking.
                      </Text>
                    )}

                  {booking.payment_status === "PAID" && (
                    <Text className="text-green-700 text-xs mt-2 font-semibold">
                      This booking has been paid successfully.
                    </Text>
                  )}
                </View>

                <View className="flex-row flex-wrap gap-3 mt-4">
                  {canPayNow && (
                    <TouchableOpacity
                      className="flex-1 min-w-[45%] bg-[#FE8B4C] rounded-xl py-3 items-center"
                      onPress={() => router.push(`/payment/${booking.id}`)}
                    >
                      <Text className="text-white font-semibold text-sm">
                        Pay Now
                      </Text>
                    </TouchableOpacity>
                  )}

                  {canReschedule && (
                    <TouchableOpacity
                      className="flex-1 min-w-[45%] bg-blue-50 rounded-xl py-3 items-center border border-blue-200"
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/create-booking",
                          params: {
                            mode: "reschedule",
                            booking_id: String(booking.id),
                            helper_id: String(booking.helper_id || ""),
                            subcategory_id: String(
                              booking.subcategory_id || "",
                            ),
                            helperName: booking.helper_name || "Helper",
                            booking_date: booking.booking_date || "",
                            start_time: booking.start_time || "",
                            end_time: booking.end_time || "",
                            address: booking.service_address || "",
                            latitude: String(booking.latitude || ""),
                            longitude: String(booking.longitude || ""),
                          },
                        })
                      }
                    >
                      <Text className="text-blue-600 font-semibold text-sm">
                        Reschedule
                      </Text>
                    </TouchableOpacity>
                  )}

                  {canCancel && (
                    <TouchableOpacity
                      className="flex-1 min-w-[45%] bg-red-50 rounded-xl py-3 items-center border border-red-200"
                      onPress={() => handleCancel(booking.id)}
                    >
                      <Text className="text-red-600 font-semibold text-sm">
                        Cancel Booking
                      </Text>
                    </TouchableOpacity>
                  )}

                  {canSendSOS && (
                    <TouchableOpacity
                      className="flex-1 min-w-[45%] bg-red-600 rounded-xl py-3 items-center"
                      onPress={() => handleSOS(booking)}
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name="warning-outline"
                          size={18}
                          color="white"
                        />

                        <Text className="text-white font-bold text-sm ml-2">
                          SOS Emergency
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {canOpenChat && (
                    <TouchableOpacity
                      className="flex-1 min-w-[45%] bg-[#FEF3E8] rounded-xl py-3 items-center"
                      onPress={() =>
                        router.push({
                          pathname: "../chat/[bookingId]",
                          params: { bookingId: String(booking.id) },
                        })
                      }
                    >
                      <Text className="text-[#FE8B4C] font-semibold text-sm">
                        Open Chat
                      </Text>
                    </TouchableOpacity>
                  )}

                  {booking.status === "COMPLETED" && (
                    <TouchableOpacity
                      className="flex-1 min-w-[45%] bg-[#FEF3E8] rounded-xl py-3 items-center"
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/review",
                          params: {
                            booking_id: String(booking.id),
                            helper_name: booking.helper_name || "Helper",
                            service_name: booking.service_name || "Service",
                          },
                        })
                      }
                    >
                      <Text className="text-[#FE8B4C] font-semibold text-sm">
                        {hasReview ? "Edit Review" : "Write Review"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {canTrackProgress && (
                    <TouchableOpacity
                      className="flex-1 min-w-[45%] bg-[#FE8B4C] rounded-xl py-3 items-center"
                      onPress={() =>
                        router.push({
                          pathname: "/track-booking",
                          params: {
                            booking_id: String(booking.id),
                            latitude: String(booking.latitude || ""),
                            longitude: String(booking.longitude || ""),
                            address: booking.service_address || "",
                            service_name: booking.service_name || "Service",
                          },
                        })
                      }
                    >
                      <Text className="text-white font-semibold text-sm">
                        Track Progress
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}

        {bookings.length > 0 && (
          <TouchableOpacity
            className="bg-[#FE8B4C] rounded-2xl py-4 mt-4 items-center shadow-sm"
            onPress={() => router.push("/")}
          >
            <View className="flex-row items-center">
              <Ionicons name="search-outline" size={20} color="white" />

              <Text className="text-white font-semibold text-base ml-2">
                Book New Service
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
