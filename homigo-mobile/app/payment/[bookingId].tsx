import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { getBookingById, payBooking } from "../../services/bookingService";

export default function PaymentScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { token } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"COD" | "ONLINE" | null>(
    null,
  );

  useEffect(() => {
    console.log("payment bookingId:", bookingId);
    console.log("payment token:", token);

    if (!bookingId) {
      setLoading(false);
      Alert.alert("Error", "Booking ID not found");
      return;
    }

    if (!token) {
      setLoading(false);
      Alert.alert("Error", "User token not found");
      return;
    }

    loadBooking();
  }, [bookingId, token]);

  async function loadBooking() {
    try {
      setLoading(true);

      console.log("Fetching booking with:", bookingId, token);

      const res = await getBookingById(bookingId as string, token as string);

      console.log("getBookingById response:", res);

      if (res?.ok) {
        setBooking(res.booking);
      } else {
        Alert.alert("Error", res?.message || "Failed to load booking");
      }
    } catch (error: any) {
      console.log("loadBooking error:", error);
      Alert.alert("Error", error?.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPayment() {
    if (!token) {
      Alert.alert("Error", "You are not logged in");
      return;
    }

    if (!bookingId) {
      Alert.alert("Error", "Booking ID not found");
      return;
    }

    if (!selectedMethod) {
      Alert.alert("Select Payment Method", "Please choose a payment method");
      return;
    }

    try {
      setPaying(true);

      const res = await payBooking(
        bookingId as string,
        selectedMethod,
        token as string,
      );

      console.log("payBooking response:", res);

      if (res?.ok) {
        Alert.alert(
          "Success",
          selectedMethod === "ONLINE"
            ? "Payment completed successfully"
            : "Cash on Delivery selected successfully",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(tabs)/bookings"),
            },
          ],
        );
      } else {
        Alert.alert("Error", res?.message || "Payment update failed");
      }
    } catch (error: any) {
      console.log("payBooking error:", error);
      Alert.alert("Error", error?.message || "Something went wrong");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FE4D01" />
          <Text className="mt-3 text-gray-500">Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
          <Text className="text-lg font-semibold text-gray-800 mt-3">
            Booking not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-5 bg-[#FE4D01] px-5 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const amount = booking.final_amount || booking.estimated_amount || 0;
  const isAlreadyPaid = booking.payment_status === "PAID";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-[#FEF3E8] pt-8 pb-6 px-5 border-b border-[#FDD867]/30">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
          </TouchableOpacity>

          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center shadow-md">
              <Ionicons name="card-outline" size={28} color="#FE8B4C" />
            </View>
            <View className="ml-4">
              <Text className="text-2xl font-bold text-gray-800">Payment</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Complete your booking payment
              </Text>
            </View>
          </View>
        </View>

        <View className="px-5 pt-6">
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-5">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Booking Summary
            </Text>

            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500">Booking ID</Text>
              <Text className="text-gray-800 font-medium">#{booking.id}</Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500">Service</Text>
              <Text className="text-gray-800 font-medium">
                {booking.service_name || "Service"}
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500">Helper</Text>
              <Text className="text-gray-800 font-medium">
                {booking.helper_name || "Assigned Helper"}
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500">Date</Text>
              <Text className="text-gray-800 font-medium">
                {booking.booking_date}
              </Text>
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500">Time</Text>
              <Text className="text-gray-800 font-medium">
                {booking.start_time}
              </Text>
            </View>

            <View className="mb-3">
              <Text className="text-gray-500 mb-1">Address</Text>
              <Text className="text-gray-800 font-medium">
                {booking.service_address}
              </Text>
            </View>

            <View className="border-t border-gray-100 pt-4 mt-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-semibold text-gray-700">
                  Total Amount
                </Text>
                <Text className="text-xl font-bold text-[#FE4D01]">
                  Rs. {amount}
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm mb-5">
            <Text className="text-base font-bold text-gray-800 mb-3">
              Current Payment Status
            </Text>

            {isAlreadyPaid && (
              <View className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5">
                <Text className="text-green-700 font-semibold text-sm">
                  This booking has already been paid successfully.
                </Text>
              </View>
            )}

            <View className="flex-row items-center">
              <View
                className={`px-3 py-1 rounded-full ${
                  booking.payment_status === "PAID"
                    ? "bg-green-100"
                    : "bg-yellow-100"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${
                    booking.payment_status === "PAID"
                      ? "text-green-700"
                      : "text-yellow-700"
                  }`}
                >
                  {booking.payment_status || "PENDING"}
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <Text className="text-base font-bold text-gray-800 mb-4">
              Choose Payment Method
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => !isAlreadyPaid && setSelectedMethod("ONLINE")}
              disabled={isAlreadyPaid}
              style={{ opacity: isAlreadyPaid ? 0.6 : 1 }}
              className={`rounded-2xl border p-4 mb-3 ${
                selectedMethod === "ONLINE"
                  ? "border-[#FE4D01] bg-[#FEF3E8]"
                  : "border-gray-200 bg-white"
              }`}
            >
              <View className="flex-row items-center">
                <View className="w-11 h-11 rounded-xl bg-white items-center justify-center">
                  <Ionicons name="card-outline" size={22} color="#FE4D01" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-800 font-semibold">
                    Online Payment
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    Pay now and mark booking as paid
                  </Text>
                </View>
                {selectedMethod === "ONLINE" && (
                  <Ionicons name="checkmark-circle" size={24} color="#FE4D01" />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => !isAlreadyPaid && setSelectedMethod("COD")}
              disabled={isAlreadyPaid}
              style={{ opacity: isAlreadyPaid ? 0.6 : 1 }}
              className={`rounded-2xl border p-4 ${
                selectedMethod === "COD"
                  ? "border-[#FE4D01] bg-[#FEF3E8]"
                  : "border-gray-200 bg-white"
              }`}
            >
              <View className="flex-row items-center">
                <View className="w-11 h-11 rounded-xl bg-white items-center justify-center">
                  <Ionicons name="cash-outline" size={22} color="#FE4D01" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-800 font-semibold">
                    Cash on Delivery
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    Pay physically after service delivery
                  </Text>
                </View>
                {selectedMethod === "COD" && (
                  <Ionicons name="checkmark-circle" size={24} color="#FE4D01" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleConfirmPayment}
            disabled={paying || isAlreadyPaid}
            activeOpacity={0.8}
            className="bg-[#FE4D01] rounded-xl py-4 items-center justify-center shadow-md"
            style={{
              opacity: paying || isAlreadyPaid ? 0.7 : 1,
              shadowColor: "#FE4D01",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            {paying ? (
              <ActivityIndicator color="white" size="small" />
            ) : isAlreadyPaid ? (
              <View className="flex-row items-center">
                <Ionicons
                  name="checkmark-done-circle"
                  size={20}
                  color="white"
                />
                <Text className="text-white font-semibold text-base ml-2">
                  Already Paid
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  Confirm Payment
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View className="mt-6 px-2">
            <View className="flex-row items-center justify-center">
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#9ca3af"
              />
              <Text className="text-gray-400 text-xs ml-1 text-center">
                Online payment marks booking as paid. COD keeps payment pending.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
