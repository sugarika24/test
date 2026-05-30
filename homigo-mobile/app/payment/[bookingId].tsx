import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";
import { getBookingById, payBooking } from "../../services/bookingService";
import { API_BASE_URL } from "../../services/api";
import { requestRefund } from "../../services/paymentService";

export default function PaymentScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { token } = useAuth();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [requestingRefund, setRequestingRefund] = useState(false);
  const [showRefundBox, setShowRefundBox] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  const [selectedMethod, setSelectedMethod] = useState<"COD" | "ESEWA" | null>(
    null,
  );

  useEffect(() => {
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

      const res = await getBookingById(bookingId as string, token as string);

      if (res?.ok) {
        setBooking(res.booking);
      } else {
        Alert.alert("Error", res?.message || "Failed to load booking");
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }

  function normalize(value: any) {
    return String(value || "")
      .trim()
      .toUpperCase();
  }

  async function handleRefundRequest() {
    if (!bookingId) return;

    if (!refundReason.trim()) {
      Alert.alert("Refund Reason Required", "Please enter a refund reason.");
      return;
    }

    try {
      setRequestingRefund(true);

      const res = await requestRefund(bookingId, refundReason.trim());

      if (res?.ok) {
        Alert.alert("Success", "Refund request submitted successfully.");
        setShowRefundBox(false);
        setRefundReason("");
        await loadBooking();
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to request refund");
    } finally {
      setRequestingRefund(false);
    }
  }

  async function handleConfirmPayment() {
    if (!token || !bookingId || !booking) {
      Alert.alert("Error", "Booking or user information missing");
      return;
    }

    const bookingStatus = normalize(booking.status);
    const paymentStatus = normalize(booking.payment_status);

    const isPaymentAllowed = ["ACCEPTED", "ON_THE_WAY", "IN_PROGRESS"].includes(
      bookingStatus,
    );

    const isAlreadyPaid = ["PAID", "COMPLETED", "SUCCESS"].includes(
      paymentStatus,
    );

    if (!selectedMethod) {
      Alert.alert("Select Payment Method", "Please choose a payment method");
      return;
    }

    if (!isPaymentAllowed) {
      Alert.alert(
        "Payment Not Allowed",
        "Payment is available only after the helper accepts your booking.",
      );
      return;
    }

    if (isAlreadyPaid) {
      Alert.alert("Already Paid", "This booking is already paid.");
      return;
    }

    try {
      setPaying(true);

      if (selectedMethod === "COD") {
        const res = await payBooking(bookingId as string, "COD", token);

        if (res?.ok) {
          Alert.alert("Success", "Cash on Delivery selected", [
            {
              text: "OK",
              onPress: () => router.replace("/(tabs)/bookings"),
            },
          ]);
        } else {
          Alert.alert("Error", res?.message || "Failed to select COD");
        }

        return;
      }

      if (selectedMethod === "ESEWA") {
        const checkoutUrl = `${API_BASE_URL}/payments/esewa/checkout/${bookingId}`;
        await Linking.openURL(checkoutUrl);
      }
    } catch (error: any) {
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

  const bookingStatus = normalize(booking.status);
  const paymentStatus = normalize(booking.payment_status);
  const refundStatus = normalize(booking.refund_status || "NO_REFUND");

  const isAlreadyPaid = ["PAID", "COMPLETED", "SUCCESS"].includes(
    paymentStatus,
  );

  const isPaymentAllowed = ["ACCEPTED", "ON_THE_WAY", "IN_PROGRESS"].includes(
    bookingStatus,
  );

  const canRequestRefund =
    isAlreadyPaid && ["NO_REFUND", "REFUND_REJECTED"].includes(refundStatus);

  const statusLabel =
    bookingStatus === "ON_THE_WAY"
      ? "On The Way"
      : bookingStatus === "IN_PROGRESS"
        ? "In Progress"
        : bookingStatus === "ACCEPTED"
          ? "Accepted"
          : "Pending Acceptance";

  const refundLabel =
    refundStatus === "NO_REFUND"
      ? "No Refund"
      : refundStatus === "REFUND_REQUESTED"
        ? "Refund Requested"
        : refundStatus === "REFUND_APPROVED"
          ? "Refund Approved"
          : refundStatus === "REFUND_REJECTED"
            ? "Refund Rejected"
            : refundStatus === "REFUNDED"
              ? "Refunded"
              : refundStatus;

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
              Current Status
            </Text>

            {isAlreadyPaid && (
              <View className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
                <Text className="text-green-700 font-semibold text-sm">
                  This booking has already been paid successfully.
                </Text>
              </View>
            )}

            {!isPaymentAllowed && !isAlreadyPaid && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
                <View className="flex-row items-start">
                  <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color="#ca8a04"
                  />
                  <Text className="text-yellow-800 font-semibold text-sm ml-3 flex-1">
                    Payment will be available after the helper accepts your
                    booking.
                  </Text>
                </View>
              </View>
            )}

            <View className="flex-row items-center gap-3 flex-wrap">
              <View
                className={`px-3 py-1 rounded-full ${
                  isAlreadyPaid
                    ? "bg-green-100"
                    : paymentStatus === "INITIATED"
                      ? "bg-orange-100"
                      : "bg-yellow-100"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${
                    isAlreadyPaid
                      ? "text-green-700"
                      : paymentStatus === "INITIATED"
                        ? "text-orange-700"
                        : "text-yellow-700"
                  }`}
                >
                  {paymentStatus || "UNPAID"}
                </Text>
              </View>

              <View
                className={`px-3 py-1 rounded-full ${
                  isPaymentAllowed ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${
                    isPaymentAllowed ? "text-blue-700" : "text-gray-700"
                  }`}
                >
                  {statusLabel}
                </Text>
              </View>

              <View
                className={`px-3 py-1 rounded-full ${
                  refundStatus === "REFUND_REQUESTED"
                    ? "bg-orange-100"
                    : refundStatus === "REFUND_APPROVED" ||
                        refundStatus === "REFUNDED"
                      ? "bg-green-100"
                      : refundStatus === "REFUND_REJECTED"
                        ? "bg-red-100"
                        : "bg-gray-100"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${
                    refundStatus === "REFUND_REQUESTED"
                      ? "text-orange-700"
                      : refundStatus === "REFUND_APPROVED" ||
                          refundStatus === "REFUNDED"
                        ? "text-green-700"
                        : refundStatus === "REFUND_REJECTED"
                          ? "text-red-700"
                          : "text-gray-700"
                  }`}
                >
                  {refundLabel}
                </Text>
              </View>
            </View>
          </View>

          {!isAlreadyPaid && (
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
              <Text className="text-base font-bold text-gray-800 mb-4">
                Choose Payment Method
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => isPaymentAllowed && setSelectedMethod("ESEWA")}
                disabled={!isPaymentAllowed}
                style={{ opacity: !isPaymentAllowed ? 0.6 : 1 }}
                className={`rounded-2xl border p-4 mb-3 ${
                  selectedMethod === "ESEWA"
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
                      eSewa Payment
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      Pay securely via eSewa
                    </Text>
                  </View>

                  {selectedMethod === "ESEWA" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#FE4D01"
                    />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => isPaymentAllowed && setSelectedMethod("COD")}
                disabled={!isPaymentAllowed}
                style={{ opacity: !isPaymentAllowed ? 0.6 : 1 }}
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
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#FE4D01"
                    />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {!isAlreadyPaid && (
            <TouchableOpacity
              onPress={handleConfirmPayment}
              disabled={paying || !isPaymentAllowed}
              activeOpacity={0.8}
              className="bg-[#FE4D01] rounded-xl py-4 items-center justify-center shadow-md"
              style={{
                opacity: paying || !isPaymentAllowed ? 0.7 : 1,
              }}
            >
              {paying ? (
                <ActivityIndicator color="white" size="small" />
              ) : !isPaymentAllowed ? (
                <Text className="text-white font-semibold text-base">
                  Waiting for Helper to Accept
                </Text>
              ) : (
                <Text className="text-white font-semibold text-base">
                  Confirm Payment
                </Text>
              )}
            </TouchableOpacity>
          )}

          {isAlreadyPaid && (
            <View className="bg-white rounded-2xl p-4 shadow-sm mt-2">
              <Text className="text-base font-bold text-gray-800 mb-2">
                Refund
              </Text>

              {canRequestRefund ? (
                <>
                  {!showRefundBox ? (
                    <TouchableOpacity
                      onPress={() => setShowRefundBox(true)}
                      className="bg-red-500 rounded-xl py-3 items-center"
                    >
                      <Text className="text-white font-semibold">
                        Request Refund
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TextInput
                        value={refundReason}
                        onChangeText={setRefundReason}
                        placeholder="Enter refund reason"
                        placeholderTextColor="#9ca3af"
                        multiline
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 min-h-[90px] mb-3"
                      />

                      <TouchableOpacity
                        onPress={handleRefundRequest}
                        disabled={requestingRefund}
                        className="bg-red-500 rounded-xl py-3 items-center mb-2"
                        style={{ opacity: requestingRefund ? 0.7 : 1 }}
                      >
                        {requestingRefund ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <Text className="text-white font-semibold">
                            Submit Refund Request
                          </Text>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setShowRefundBox(false);
                          setRefundReason("");
                        }}
                        className="bg-gray-200 rounded-xl py-3 items-center"
                      >
                        <Text className="text-gray-700 font-semibold">
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              ) : (
                <Text className="text-gray-600 text-sm">
                  Current refund status: {refundLabel}
                </Text>
              )}
            </View>
          )}

          <View className="mt-6 px-2">
            <View className="flex-row items-center justify-center">
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#9ca3af"
              />
              <Text className="text-gray-400 text-xs ml-1 text-center">
                eSewa payment will open in your browser.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
