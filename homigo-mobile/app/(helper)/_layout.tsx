import { Stack, router, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function HelperLayout() {
  const { user, isReady } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    if (user.role !== "HELPER") {
      if (user.role === "USER") {
        router.replace("/(tabs)");
      } else if (user.role === "ADMIN") {
        router.replace("/(admin)/dashboard");
      }
    }
  }, [user, isReady, segments]);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user || user.role !== "HELPER") {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
