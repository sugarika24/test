import { useEffect, useRef, useState } from "react";
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
import {
  acceptBooking,
  completeBooking,
  getHelperBookings,
  markOnTheWay,
  rejectBooking,
  startBooking,
  updateHelperLiveLocation,
} from "../../services/bookingService";
import { Booking } from "../../types/booking";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function HelperBookingsScreen() {
  const { token } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [trackingBookingId, setTrackingBookingId] = useState<number | null>(
    null,
  );

  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    return () => {
      stopLiveTracking();
    };
  }, []);

  function normalizeStatus(status?: string | null) {
    return String(status || "")
      .trim()
      .toUpperCase();
  }

  async function fetchBookings() {
    if (!token) return;

    try {
      setLoading(true);

      const res = await getHelperBookings(token);
      const fetchedBookings = res.bookings || [];

      setBookings(fetchedBookings);

      const activeTrackedBooking = fetchedBookings.find(
        (booking: Booking) => normalizeStatus(booking.status) === "ON_THE_WAY",
      );

      if (activeTrackedBooking && !locationIntervalRef.current) {
        setTrackingBookingId(activeTrackedBooking.id);
        startLiveTracking(activeTrackedBooking.id);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  async function handleAction(
    action: () => Promise<any>,
    successMessage: string,
    bookingId: number,
  ) {
    try {
      setActionLoadingId(bookingId);
      await action();
      Alert.alert("Success", successMessage);
      fetchBookings();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Action failed");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function sendCurrentLocation(bookingId: number | string) {
    if (!token) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") return;

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      await updateHelperLiveLocation(
        bookingId,
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        token,
      );
    } catch (error) {
      console.log("sendCurrentLocation error:", error);
    }
  }

  function stopLiveTracking() {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }

    setTrackingBookingId(null);
  }

  function startLiveTracking(bookingId: number | string) {
    stopLiveTracking();
    setTrackingBookingId(Number(bookingId));

    sendCurrentLocation(bookingId);

    locationIntervalRef.current = setInterval(() => {
      sendCurrentLocation(bookingId);
    }, 10000);
  }

  async function handleOnTheWay(bookingId: number) {
    if (!token) return;

    try {
      setActionLoadingId(bookingId);

      await markOnTheWay(bookingId, token);
      startLiveTracking(bookingId);

      Alert.alert("Success", "Marked as on the way");
      fetchBookings();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to mark on the way");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleStartJob(bookingId: number) {
    if (!token) return;

    try {
      setActionLoadingId(bookingId);

      await startBooking(bookingId, token);

      Alert.alert("Success", "Booking started");
      fetchBookings();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to start booking");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleCompleteJob(bookingId: number) {
    if (!token) return;

    try {
      setActionLoadingId(bookingId);

      await completeBooking(bookingId, token);
      stopLiveTracking();

      Alert.alert("Success", "Booking completed");
      fetchBookings();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to complete booking");
    } finally {
      setActionLoadingId(null);
    }
  }

  const getStatusConfig = (status: string) => {
    switch (normalizeStatus(status)) {
      case "PENDING":
        return {
          bg: "#FEF3C7",
          text: "#92400E",
          icon: "time-outline",
          label: "Pending",
        };

      case "RESCHEDULED":
        return {
          bg: "#E0E7FF",
          text: "#4338CA",
          icon: "calendar-outline",
          label: "Rescheduled",
        };

      case "ACCEPTED":
        return {
          bg: "#DBEAFE",
          text: "#1E40AF",
          icon: "checkmark-circle-outline",
          label: "Accepted",
        };

      case "ON_THE_WAY":
        return {
          bg: "#EDE9FE",
          text: "#6B21A5",
          icon: "car-outline",
          label: "On The Way",
        };

      case "IN_PROGRESS":
        return {
          bg: "#FFEDD5",
          text: "#C2410C",
          icon: "construct-outline",
          label: "In Progress",
        };

      case "COMPLETED":
        return {
          bg: "#DCFCE7",
          text: "#166534",
          icon: "checkmark-done-outline",
          label: "Completed",
        };

      case "CANCELLED":
        return {
          bg: "#FEE2E2",
          text: "#991B1B",
          icon: "close-circle-outline",
          label: "Cancelled",
        };

      case "REJECTED":
        return {
          bg: "#FEE2E2",
          text: "#991B1B",
          icon: "close-circle-outline",
          label: "Rejected",
        };

      default:
        return {
          bg: "#F3F4F6",
          text: "#374151",
          icon: "help-outline",
          label: status || "Unknown",
        };
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";

    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return date;
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return "N/A";
    return time;
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#FE8B4C" />
        <Text className="text-gray-500 mt-3">Loading helper bookings...</Text>
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
                My Bookings
              </Text>

              <Text className="text-gray-500 text-sm mt-1">
                {bookings.length}{" "}
                {bookings.length === 1 ? "booking" : "bookings"} found
              </Text>
            </View>

            <View className="bg-[#FEF3E8] p-3 rounded-full">
              <MaterialCommunityIcons
                name="calendar-clock"
                size={28}
                color="#FE8B4C"
              />
            </View>
          </View>
        </View>

        <View className="px-5 pt-4">
          {bookings.map((booking) => {
            const bookingStatus = normalizeStatus(booking.status);
            const statusConfig = getStatusConfig(bookingStatus);
            const isActionLoading = actionLoadingId === booking.id;
            const isTrackingThisBooking = trackingBookingId === booking.id;

            const canAcceptOrReject = ["PENDING", "RESCHEDULED"].includes(
              bookingStatus,
            );

            const canOpenChat = [
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

                    <Text className="text-xs text-gray-500 mt-1">
                      #{booking.booking_number}
                    </Text>
                  </View>

                  <View
                    style={{ backgroundColor: statusConfig.bg }}
                    className="px-3 py-1 rounded-full flex-row items-center"
                  >
                    <Ionicons
                      name={statusConfig.icon as any}
                      size={12}
                      color={statusConfig.text}
                    />

                    <Text
                      style={{ color: statusConfig.text }}
                      className="text-xs font-medium ml-1"
                    >
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center mb-3 pb-3 border-b border-gray-100">
                  <View className="w-10 h-10 bg-[#FEF3E8] rounded-full items-center justify-center">
                    <Text className="text-[#FE8B4C] font-bold text-lg">
                      {booking.user_name?.charAt(0)?.toUpperCase() || "U"}
                    </Text>
                  </View>

                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-semibold text-gray-800">
                      {booking.user_name || "Customer"}
                    </Text>

                    <Text className="text-xs text-gray-500">Customer</Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap mb-3">
                  <View className="w-1/2 flex-row items-center mb-2">
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#9ca3af"
                    />

                    <Text className="text-sm text-gray-600 ml-2">
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

                  <View className="w-1/2 flex-row items-center mb-2">
                    <Ionicons name="time-outline" size={14} color="#9ca3af" />

                    <Text className="text-sm text-gray-600 ml-2">
                      {new Date(booking.start_time).toLocaleTimeString(
                        "en-GB",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </Text>
                  </View>

                  {booking.service_address && (
                    <View className="w-full flex-row items-start mt-1">
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#9ca3af"
                      />

                      <Text
                        className="text-sm text-gray-600 ml-2 flex-1"
                        numberOfLines={2}
                      >
                        {booking.service_address}
                      </Text>
                    </View>
                  )}
                </View>

                {canOpenChat && (
                  <TouchableOpacity
                    className="bg-[#FE8B4C] rounded-xl py-3 mb-3 items-center"
                    onPress={() =>
                      router.push({
                        pathname: "../chat/[bookingId]",
                        params: { bookingId: String(booking.id) },
                      })
                    }
                  >
                    <Text className="text-white font-semibold">Open Chat</Text>
                  </TouchableOpacity>
                )}

                {bookingStatus === "ON_THE_WAY" && isTrackingThisBooking && (
                  <View className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-3">
                    <Text className="text-green-700 text-sm font-medium">
                      Live tracking active
                    </Text>

                    <Text className="text-green-600 text-xs mt-1">
                      Your location is being updated every 10 seconds
                    </Text>
                  </View>
                )}

                {booking.final_amount && bookingStatus === "COMPLETED" && (
                  <View className="mb-3 pt-2 border-t border-gray-100">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm text-gray-500">
                        Total Amount
                      </Text>

                      <Text className="text-lg font-bold text-[#FE8B4C]">
                        Rs. {booking.final_amount}
                      </Text>
                    </View>
                  </View>
                )}

                {canAcceptOrReject && (
                  <View className="flex-row gap-2 mt-2">
                    <TouchableOpacity
                      className="flex-1 bg-[#FE8B4C] rounded-xl py-3 items-center"
                      onPress={() =>
                        handleAction(
                          () => acceptBooking(booking.id, token!),
                          "Booking accepted",
                          booking.id,
                        )
                      }
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-semibold">Accept</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-1 bg-red-500 rounded-xl py-3 items-center"
                      onPress={() =>
                        handleAction(
                          () =>
                            rejectBooking(
                              booking.id,
                              token!,
                              "Rejected by helper",
                            ),
                          "Booking rejected",
                          booking.id,
                        )
                      }
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-semibold">Reject</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {bookingStatus === "ACCEPTED" && (
                  <TouchableOpacity
                    className="bg-[#FE8B4C] rounded-xl py-3 mt-2 items-center"
                    onPress={() => handleOnTheWay(booking.id)}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-semibold">
                        On The Way
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {bookingStatus === "ON_THE_WAY" && (
                  <TouchableOpacity
                    className="bg-blue-500 rounded-xl py-3 mt-2 items-center"
                    onPress={() => handleStartJob(booking.id)}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-semibold">
                        Start Job
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {bookingStatus === "IN_PROGRESS" && (
                  <TouchableOpacity
                    className="bg-green-500 rounded-xl py-3 mt-2 items-center"
                    onPress={() => handleCompleteJob(booking.id)}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-semibold">
                        Complete Job
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {!bookings.length && (
          <View className="items-center justify-center py-16">
            <MaterialCommunityIcons
              name="calendar-blank"
              size={64}
              color="#d1d5db"
            />

            <Text className="text-gray-400 text-lg font-medium mt-4">
              No Bookings Yet
            </Text>

            <Text className="text-gray-400 text-sm mt-1 text-center">
              You don&apos;t have any bookings at the moment
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
