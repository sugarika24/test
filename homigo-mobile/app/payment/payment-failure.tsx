import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";

export default function PaymentFailureScreen() {
  useEffect(() => {
    WebBrowser.dismissBrowser();
  }, []);

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-3xl font-bold text-red-600 mb-3">
        Payment Failed
      </Text>

      <Text className="text-gray-600 text-center mb-6">
        Your payment was not completed. Please try again.
      </Text>

      <TouchableOpacity
        onPress={() => router.replace("/(tabs)/bookings")}
        className="bg-red-600 px-6 py-4 rounded-2xl w-full"
      >
        <Text className="text-white text-center font-bold">
          Back to Bookings
        </Text>
      </TouchableOpacity>
    </View>
  );
}
