import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  Easing,
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  AnimatedRegion,
} from "react-native-maps";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { getHelperLiveLocation } from "../services/bookingService";

const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY || "";

type Coordinate = {
  latitude: number;
  longitude: number;
};

export default function TrackBookingScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams();

  const mapRef = useRef<MapView>(null);
  const markerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRouteRef = useRef(false);
  const lastRouteKeyRef = useRef<string>("");

  const rotationAnim = useRef(new Animated.Value(0)).current;

  const bookingId = String(params.booking_id || "");
  const serviceLatitude = Number(params.latitude);
  const serviceLongitude = Number(params.longitude);
  const address = String(params.address || "Destination");
  const serviceName = String(params.service_name || "Service Location");

  const destination = useMemo<Coordinate | null>(() => {
    if (Number.isNaN(serviceLatitude) || Number.isNaN(serviceLongitude)) {
      return null;
    }

    return {
      latitude: serviceLatitude,
      longitude: serviceLongitude,
    };
  }, [serviceLatitude, serviceLongitude]);

  const animatedHelper = useRef<any>(
    new AnimatedRegion({
      latitude: destination?.latitude || 27.7172,
      longitude: destination?.longitude || 85.324,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
  ).current;

  const [helperLocation, setHelperLocation] = useState<Coordinate | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);

  function fitMapToPoints(points: Coordinate[]) {
    if (!mapRef.current || points.length === 0) return;

    mapRef.current.fitToCoordinates(points, {
      edgePadding: {
        top: 120,
        right: 60,
        bottom: 280,
        left: 60,
      },
      animated: true,
    });
  }

  function toRad(value: number) {
    return (value * Math.PI) / 180;
  }

  function toDeg(value: number) {
    return (value * 180) / Math.PI;
  }

  function getHeading(start: Coordinate, end: Coordinate) {
    const lat1 = toRad(start.latitude);
    const lon1 = toRad(start.longitude);
    const lat2 = toRad(end.latitude);
    const lon2 = toRad(end.longitude);

    const dLon = lon2 - lon1;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const bearing = toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360;
  }

  function animateRotation(nextHeading: number) {
    Animated.timing(rotationAnim, {
      toValue: nextHeading,
      duration: 800,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }

  function animateHelperMarker(next: Coordinate) {
    if (!helperLocation) {
      animatedHelper.setValue({
        latitude: next.latitude,
        longitude: next.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      return;
    }

    const heading = getHeading(helperLocation, next);
    animateRotation(heading);

    if (
      Platform.OS === "android" &&
      markerRef.current?.animateMarkerToCoordinate
    ) {
      markerRef.current.animateMarkerToCoordinate(next, 1000);
    } else {
      animatedHelper
        .timing({
          latitude: next.latitude,
          longitude: next.longitude,
          duration: 1000,
        })
        .start();
    }
  }

  async function fetchRoute(origin: Coordinate, dest: Coordinate) {
    if (!ORS_API_KEY) {
      console.log("Missing ORS API key");
      return;
    }

    const routeKey = `${origin.latitude.toFixed(5)},${origin.longitude.toFixed(
      5,
    )}-${dest.latitude.toFixed(5)},${dest.longitude.toFixed(5)}`;

    if (lastRouteKeyRef.current === routeKey) return;
    if (isFetchingRouteRef.current) return;

    try {
      isFetchingRouteRef.current = true;
      setRouteLoading(true);

      const response = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          method: "POST",
          headers: {
            Authorization: ORS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            coordinates: [
              [origin.longitude, origin.latitude],
              [dest.longitude, dest.latitude],
            ],
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.log("ORS route error:", data);
        return;
      }

      const feature = data?.features?.[0];
      const geometryCoords = feature?.geometry?.coordinates || [];
      const summary = feature?.properties?.summary;

      const convertedCoords: Coordinate[] = geometryCoords.map(
        (coord: number[]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }),
      );

      setRouteCoordinates(convertedCoords);
      setDistanceKm(
        typeof summary?.distance === "number" ? summary.distance / 1000 : null,
      );
      setDurationMin(
        typeof summary?.duration === "number" ? summary.duration / 60 : null,
      );

      lastRouteKeyRef.current = routeKey;

      if (convertedCoords.length > 0) {
        fitMapToPoints(convertedCoords);
      } else {
        fitMapToPoints([origin, dest]);
      }
    } catch (error) {
      console.log("Failed to fetch ORS route:", error);
    } finally {
      isFetchingRouteRef.current = false;
      setRouteLoading(false);
    }
  }

  async function fetchLiveLocation() {
    if (!token || !bookingId) return;

    try {
      const res = await getHelperLiveLocation(bookingId, token);

      if (res?.live_location) {
        const lat = Number(res.live_location.latitude);
        const lng = Number(res.live_location.longitude);

        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          const nextHelperLocation = {
            latitude: lat,
            longitude: lng,
          };

          setHelperLocation((prev) => {
            const hasChanged =
              !prev ||
              prev.latitude.toFixed(6) !==
                nextHelperLocation.latitude.toFixed(6) ||
              prev.longitude.toFixed(6) !==
                nextHelperLocation.longitude.toFixed(6);

            if (hasChanged) {
              animateHelperMarker(nextHelperLocation);

              if (destination) {
                fetchRoute(nextHelperLocation, destination);
              }
            }

            return nextHelperLocation;
          });
        }
      }
    } catch (error) {
      console.log("Live location not available yet", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!destination) {
      Alert.alert("Error", "Service destination coordinates are missing.");
      setLoading(false);
      return;
    }

    fetchLiveLocation();

    intervalRef.current = setInterval(() => {
      fetchLiveLocation();
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [bookingId, token, destination]);

  const rotate = rotationAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: destination?.latitude || 27.7172,
          longitude: destination?.longitude || 85.324,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {destination && (
          <Marker
            coordinate={destination}
            title={serviceName}
            description={address}
            pinColor="#FE8B4C"
          />
        )}

        {helperLocation && (
          <Marker.Animated
            ref={markerRef}
            coordinate={animatedHelper as any}
            title="Helper Location"
            description="Helper is moving"
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <Animated.View
              style={{
                transform: [{ rotate }],
              }}
            >
              <View
                style={{
                  backgroundColor: "#FE4D01",
                  padding: 10,
                  borderRadius: 24,
                  borderWidth: 2,
                  borderColor: "white",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <MaterialCommunityIcons name="car" size={20} color="white" />
              </View>
            </Animated.View>
          </Marker.Animated>
        )}

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#FE8B4C"
          />
        )}
      </MapView>

      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-5 w-12 h-12 bg-white rounded-full items-center justify-center shadow-md"
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
      </TouchableOpacity>

      {/* Re-center Button */}
      <TouchableOpacity
        onPress={() => {
          if (routeCoordinates.length > 0) {
            fitMapToPoints(routeCoordinates);
          } else if (helperLocation && destination) {
            fitMapToPoints([helperLocation, destination]);
          }
        }}
        className="absolute top-12 right-5 w-12 h-12 bg-white rounded-full items-center justify-center shadow-md"
        activeOpacity={0.7}
      >
        <Ionicons name="locate" size={22} color="#FE8B4C" />
      </TouchableOpacity>

      {/* Info Card */}
      <View className="absolute bottom-8 left-5 right-5 bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
        <View className="flex-row items-center mb-2">
          <Ionicons name="location-outline" size={22} color="#FE8B4C" />
          <Text className="text-lg font-bold text-gray-800 ml-2">
            Service Location
          </Text>
        </View>

        <Text className="text-base font-semibold text-gray-800 mb-1">
          {serviceName}
        </Text>

        <Text className="text-sm text-gray-500 mb-3">
          {address || "Address not provided"}
        </Text>

        {/* Status Section */}
        <View className="bg-[#FEF3E8] rounded-xl p-3 mt-2">
          {loading ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#FE8B4C" />
              <Text className="ml-2 text-gray-500 text-sm">
                Loading helper location...
              </Text>
            </View>
          ) : helperLocation ? (
            <View>
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-green-600 font-medium text-sm flex-1">
                  Helper is on the way
                </Text>
                <MaterialCommunityIcons name="car" size={16} color="#FE8B4C" />
              </View>

              <View className="flex-row mt-3 gap-3">
                <View className="flex-1 bg-white rounded-xl px-3 py-2">
                  <Text className="text-[10px] text-gray-500">Distance</Text>
                  <Text className="text-base font-bold text-gray-800">
                    {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : "--"}
                  </Text>
                </View>

                <View className="flex-1 bg-white rounded-xl px-3 py-2">
                  <Text className="text-[10px] text-gray-500">ETA</Text>
                  <Text className="text-base font-bold text-gray-800">
                    {durationMin !== null
                      ? `${Math.ceil(durationMin)} min`
                      : "--"}
                  </Text>
                </View>
              </View>

              {routeLoading && (
                <View className="flex-row items-center mt-3">
                  <ActivityIndicator size="small" color="#FE8B4C" />
                  <Text className="ml-2 text-gray-500 text-xs">
                    Updating route...
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View className="flex-row items-center">
              <View className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
              <Text className="text-gray-500 text-sm flex-1">
                Waiting for helper to start...
              </Text>
              <Ionicons name="time-outline" size={16} color="#9ca3af" />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
