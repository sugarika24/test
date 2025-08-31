import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function IndexScreen() {
  const { user, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    if (user.role === "HELPER") {
      router.replace("/(helper)/helper-home");
      return;
    }

    if (user.role === "ADMIN") {
      router.replace("/(admin)/dashboard");
      return;
    }

    router.replace("/(tabs)");
  }, [user, isReady]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" />
    </View>
  );
}
