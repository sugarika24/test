import { Tabs, router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View, Platform } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function UserTabsLayout() {
  const { user, isReady } = useAuth();

  const role = String(user?.role || "").toUpperCase();

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      router.replace("/(auth)/login");
      return;
    }

    if (role === "HELPER") {
      router.replace("/(helper)/helper-home");
      return;
    }

    if (role === "ADMIN") {
      router.replace("/(admin)/dashboard");
      return;
    }
  }, [user, isReady, role]);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FE8B4C" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  if (role !== "USER") {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FE8B4C",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          height: Platform.OS === "ios" ? 90 : 70,
          paddingBottom: Platform.OS === "ios" ? 30 : 12,
          paddingTop: 8,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginBottom: Platform.OS === "ios" ? 0 : 4,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === "ios" ? 8 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen name="category/[id]" options={{ href: null }} />
      <Tabs.Screen name="subcategory/[id]" options={{ href: null }} />
      <Tabs.Screen name="helper/[id]" options={{ href: null }} />
      <Tabs.Screen name="create-booking" options={{ href: null }} />
      <Tabs.Screen name="review" options={{ href: null }} />
    </Tabs>
  );
}
