import { Stack, router, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function HelperLayout() {
  const { user, isReady } = useAuth();
  const segments = useSegments();

  const role = String(user?.role || "").toUpperCase();

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    if (role !== "HELPER") {
      if (role === "USER") {
        router.replace("/(tabs)");
      } else if (role === "ADMIN") {
        router.replace("/(admin)/dashboard");
      }
    }
  }, [user, isReady, segments, role]);

  if (!isReady || !user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (role !== "HELPER") {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
