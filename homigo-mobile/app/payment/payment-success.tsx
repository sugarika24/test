import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";

export default function PaymentSuccessScreen() {
  const { bookingId } = useLocalSearchParams();

  useEffect(() => {
    WebBrowser.dismissBrowser();
  }, []);

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-3xl font-bold text-green-600 mb-3">
        Payment Successful
      </Text>

      <Text className="text-gray-600 text-center mb-6">
        Your payment has been completed successfully.
      </Text>

      <TouchableOpacity
        onPress={() => router.replace("/(tabs)/bookings")}
        className="bg-green-600 px-6 py-4 rounded-2xl w-full"
      >
        <Text className="text-white text-center font-bold">
          Go to Booking List
        </Text>
      </TouchableOpacity>
    </View>
  );
}
