import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function BookingLocationScreen() {
  const params = useLocalSearchParams();

  const latitude = Number(params.latitude);
  const longitude = Number(params.longitude);
  const address = params.address as string;
  const serviceName = params.service_name as string;

  return (
    <View className="flex-1">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: latitude || 27.7172,
          longitude: longitude || 85.324,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{
            latitude,
            longitude,
          }}
          title={serviceName || "Service Location"}
          description={address || "Location"}
          pinColor="#FE8B4C"
        />
      </MapView>

      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-5 w-12 h-12 bg-white rounded-full items-center justify-center shadow-md"
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
      </TouchableOpacity>

      {/* Bottom Info Card */}
      <View className="absolute bottom-8 left-5 right-5 bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
        <View className="flex-row items-center mb-2">
          <Ionicons name="location-outline" size={22} color="#FE8B4C" />
          <Text className="text-lg font-bold text-gray-800 ml-2">
            Service Location
          </Text>
        </View>

        <Text className="text-base font-semibold text-gray-800 mb-1">
          {serviceName || "Service Location"}
        </Text>

        <Text className="text-sm text-gray-500 mb-3">
          {address || "Address not provided"}
        </Text>

        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name="navigate-outline" size={16} color="#9ca3af" />
            <Text className="text-xs text-gray-400 ml-1">
              Lat: {latitude.toFixed(6)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="navigate-outline" size={16} color="#9ca3af" />
            <Text className="text-xs text-gray-400 ml-1">
              Lng: {longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
