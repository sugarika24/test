import { Stack, router, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function AuthLayout() {
  const { user, isReady } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!isReady) return;

    if (user) {
      if (user.role === "HELPER") {
        router.replace("/(helper)/helper-home");
      } else if (user.role === "ADMIN") {
        router.replace("/(admin)/dashboard");
      } else {
        router.replace("/(tabs)");
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

  if (user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
