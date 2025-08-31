import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, MapPressEvent } from "react-native-maps";
import * as Location from "expo-location";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type SelectedLocation = {
  latitude: number;
  longitude: number;
};

export default function SelectLocationScreen() {
  const params = useLocalSearchParams();

  const helperId = params.helper_id;
  const subcategoryId = params.subcategory_id;
  const helperName = params.helperName;

  const [region, setRegion] = useState({
    latitude: 27.7172,
    longitude: 85.324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);

  const [selectedAddress, setSelectedAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission required", "Enable location access");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      setLoading(false);
    })();
  }, []);

  const formatAddress = (place: Location.LocationGeocodedAddress) => {
    const parts = [
      place.name,
      place.street,
      place.district,
      place.city,
      place.region,
      place.country,
    ].filter(Boolean);

    return parts.join(", ");
  };

  const getAddress = async (lat: number, lng: number) => {
    try {
      setAddressLoading(true);

      const result = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (result.length > 0) {
        setSelectedAddress(formatAddress(result[0]));
      } else {
        setSelectedAddress("Selected location");
      }
    } catch {
      setSelectedAddress("Selected location");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleMapPress = async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    setSelectedLocation({ latitude, longitude });
    await getAddress(latitude, longitude);
  };

  const handleCurrentLocation = async () => {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const lat = loc.coords.latitude;
    const lng = loc.coords.longitude;

    setRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    setSelectedLocation({ latitude: lat, longitude: lng });
    await getAddress(lat, lng);
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert("Select location first");
      return;
    }

    router.push({
      pathname: "/(tabs)/create-booking",
      params: {
        helper_id: String(helperId),
        subcategory_id: String(subcategoryId),
        helperName: String(helperName),
        latitude: String(selectedLocation.latitude),
        longitude: String(selectedLocation.longitude),
        address: selectedAddress || "Selected location",
      },
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FE8B4C" />
        <Text className="mt-2 text-gray-500">Getting your location...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        style={{ flex: 1 }}
        region={region}
        onPress={handleMapPress}
        showsUserLocation
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} pinColor="#FE8B4C" />
        )}
      </MapView>

      {/* Back */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-5 bg-white p-3 rounded-full"
      >
        <Ionicons name="arrow-back" size={20} color="#FE8B4C" />
      </TouchableOpacity>

      {/* Locate */}
      <TouchableOpacity
        onPress={handleCurrentLocation}
        className="absolute top-12 right-5 bg-white p-3 rounded-full"
      >
        <Ionicons name="locate" size={20} color="#FE8B4C" />
      </TouchableOpacity>

      {/* Bottom card */}
      <View className="absolute bottom-8 left-5 right-5 bg-white p-4 rounded-xl shadow">
        <Text className="font-bold text-lg mb-2">Selected Location</Text>

        {selectedLocation ? (
          addressLoading ? (
            <ActivityIndicator color="#FE8B4C" />
          ) : (
            <>
              <Text className="text-gray-800 font-medium">
                {selectedAddress}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">
                {selectedLocation.latitude.toFixed(6)},{" "}
                {selectedLocation.longitude.toFixed(6)}
              </Text>
            </>
          )
        ) : (
          <Text className="text-gray-400">Tap map to select location</Text>
        )}

        <TouchableOpacity
          onPress={handleConfirm}
          className="bg-[#FE4D01] mt-4 py-3 rounded-xl items-center"
        >
          <Text className="text-white font-bold">Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
