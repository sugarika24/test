import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import {
  getAdminEmergencyAlerts,
  updateEmergencyAlertStatus,
} from "../../services/emergencyService";
import { getSocket } from "../../services/socketService";

type EmergencyStatus =
  | "ACTIVE"
  | "ACKNOWLEDGED"
  | "ESCALATED"
  | "RESOLVED"
  | "FALSE_ALARM";

type EmergencyAlert = {
  id: number;
  booking_id: number;
  booking_number?: string;
  service_name?: string;
  service_address?: string;
  status: EmergencyStatus;
  emergency_type: string;
  message?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  triggered_by_name?: string;
  triggered_by_phone?: string;
  helper_name?: string;
  helper_phone?: string;
  created_at: string;
};

export default function AdminEmergencyAlertsScreen() {
  const { token } = useAuth();

  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [token]);

  useEffect(() => {
    let cleanupSocket: any = null;

    const attachSocketListener = () => {
      const socket = getSocket();

      if (!socket) return;

      const handleSOSAlert = async (data: any) => {
        console.log("Admin SOS real-time alert:", data);

        Alert.alert(
          "🚨 Emergency Alert",
          `Emergency reported for booking ${
            data?.bookingNumber || data?.bookingId || ""
          }.`,
          [
            {
              text: "View",
              onPress: () => fetchAlerts(),
            },
            {
              text: "OK",
              onPress: () => fetchAlerts(),
            },
          ],
        );

        fetchAlerts();
      };

      socket.on("sos_alert", handleSOSAlert);

      cleanupSocket = () => {
        socket.off("sos_alert", handleSOSAlert);
      };
    };

    attachSocketListener();

    const timer = setTimeout(() => {
      attachSocketListener();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (cleanupSocket) cleanupSocket();
    };
  }, []);

  async function fetchAlerts() {
    if (!token) return;

    try {
      setLoading(true);
      const res = await getAdminEmergencyAlerts(token);
      setAlerts(res.alerts || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load emergency alerts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchAlerts();
  }

  function callPhone(phone?: string) {
    if (!phone) {
      Alert.alert("No Phone Number", "Phone number is not available.");
      return;
    }

    Linking.openURL(`tel:${phone}`);
  }

  function openLocation(
    latitude?: number | string | null,
    longitude?: number | string | null,
  ) {
    if (!latitude || !longitude) {
      Alert.alert("No Location", "Emergency location is not available.");
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  }

  async function handleUpdateStatus(
    alertId: number,
    status: "ACKNOWLEDGED" | "ESCALATED" | "RESOLVED" | "FALSE_ALARM",
  ) {
    if (!token) return;

    try {
      await updateEmergencyAlertStatus(token, alertId, {
        status,
        admin_note: `Marked as ${status} by admin.`,
      });

      Alert.alert("Success", `Emergency alert marked as ${status}`);
      fetchAlerts();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update status");
    }
  }

  function confirmStatusUpdate(
    alertId: number,
    status: "ACKNOWLEDGED" | "ESCALATED" | "RESOLVED" | "FALSE_ALARM",
  ) {
    Alert.alert(
      "Update Emergency Status",
      `Are you sure you want to mark this alert as ${status}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => handleUpdateStatus(alertId, status),
        },
      ],
    );
  }

  function getStatusColor(status: EmergencyStatus) {
    switch (status) {
      case "ACTIVE":
        return { bg: "bg-red-100", text: "text-red-700" };
      case "ACKNOWLEDGED":
        return { bg: "bg-blue-100", text: "text-blue-700" };
      case "ESCALATED":
        return { bg: "bg-orange-100", text: "text-orange-700" };
      case "RESOLVED":
        return { bg: "bg-green-100", text: "text-green-700" };
      case "FALSE_ALARM":
        return { bg: "bg-gray-100", text: "text-gray-700" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700" };
    }
  }

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-red-50 pt-12 pb-6 px-6 border-b border-red-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-4 w-10 h-10 bg-white rounded-full items-center justify-center"
        >
          <Ionicons name="arrow-back" size={22} color="#dc2626" />
        </TouchableOpacity>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-red-600">
              Emergency Alerts
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              {alerts.length} alert{alerts.length === 1 ? "" : "s"} found
            </Text>
          </View>

          <View className="bg-red-100 p-3 rounded-full">
            <Ionicons name="warning-outline" size={30} color="#dc2626" />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {alerts.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons
              name="shield-checkmark-outline"
              size={60}
              color="#d1d5db"
            />
            <Text className="text-gray-400 text-lg font-semibold mt-4">
              No Emergency Alerts
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2">
              Emergency cases will appear here when users send SOS.
            </Text>
          </View>
        ) : (
          alerts.map((alert) => {
            const statusStyle = getStatusColor(alert.status);

            return (
              <View
                key={alert.id}
                className="bg-white rounded-2xl p-4 mb-4 border border-red-100 shadow-sm"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      {alert.service_name || "Emergency Case"}
                    </Text>

                    <Text className="text-gray-500 text-xs mt-1">
                      Booking: {alert.booking_number || alert.booking_id}
                    </Text>
                  </View>

                  <View className={`${statusStyle.bg} px-3 py-1 rounded-full`}>
                    <Text className={`${statusStyle.text} text-xs font-bold`}>
                      {alert.status}
                    </Text>
                  </View>
                </View>

                <View className="bg-red-50 rounded-xl p-3 mb-3">
                  <Text className="text-red-700 font-semibold">
                    Type: {alert.emergency_type}
                  </Text>

                  {alert.message ? (
                    <Text className="text-gray-700 text-sm mt-1">
                      {alert.message}
                    </Text>
                  ) : null}
                </View>

                <View>
                  <Text className="text-gray-700 text-sm mb-2">
                    User: {alert.triggered_by_name || "N/A"}
                  </Text>

                  <Text className="text-gray-700 text-sm mb-2">
                    User Phone: {alert.triggered_by_phone || "N/A"}
                  </Text>

                  <Text className="text-gray-700 text-sm mb-2">
                    Helper: {alert.helper_name || "N/A"}
                  </Text>

                  <Text className="text-gray-700 text-sm mb-2">
                    Helper Phone: {alert.helper_phone || "N/A"}
                  </Text>

                  <Text className="text-gray-700 text-sm mb-2">
                    Address: {alert.service_address || "N/A"}
                  </Text>

                  <Text className="text-gray-700 text-sm mb-2">
                    Location:{" "}
                    {alert.latitude && alert.longitude
                      ? `${alert.latitude}, ${alert.longitude}`
                      : "Not available"}
                  </Text>

                  <Text className="text-gray-400 text-xs mt-1">
                    Created: {new Date(alert.created_at).toLocaleString()}
                  </Text>
                </View>

                {alert.status === "ACTIVE" && (
                  <>
                    <View className="flex-row flex-wrap gap-2 mt-4">
                      <TouchableOpacity
                        className="flex-1 min-w-[45%] bg-blue-600 rounded-xl py-3 items-center"
                        onPress={() => callPhone(alert.triggered_by_phone)}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name="call-outline"
                            size={16}
                            color="white"
                          />
                          <Text className="text-white font-semibold text-xs ml-1">
                            Call User
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 min-w-[45%] bg-purple-600 rounded-xl py-3 items-center"
                        onPress={() => callPhone(alert.helper_phone)}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name="call-outline"
                            size={16}
                            color="white"
                          />
                          <Text className="text-white font-semibold text-xs ml-1">
                            Call Helper
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="w-full bg-red-600 rounded-xl py-3 items-center"
                        onPress={() =>
                          openLocation(alert.latitude, alert.longitude)
                        }
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color="white"
                          />
                          <Text className="text-white font-semibold text-xs ml-1">
                            Track Location
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                      <TouchableOpacity
                        className="flex-1 min-w-[45%] bg-blue-600 rounded-xl py-3 items-center"
                        onPress={() =>
                          confirmStatusUpdate(alert.id, "ACKNOWLEDGED")
                        }
                      >
                        <Text className="text-white font-semibold text-xs">
                          Acknowledge
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 min-w-[45%] bg-orange-500 rounded-xl py-3 items-center"
                        onPress={() =>
                          confirmStatusUpdate(alert.id, "ESCALATED")
                        }
                      >
                        <Text className="text-white font-semibold text-xs">
                          Escalate
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 min-w-[45%] bg-green-600 rounded-xl py-3 items-center"
                        onPress={() =>
                          confirmStatusUpdate(alert.id, "RESOLVED")
                        }
                      >
                        <Text className="text-white font-semibold text-xs">
                          Resolve
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 min-w-[45%] bg-gray-500 rounded-xl py-3 items-center"
                        onPress={() =>
                          confirmStatusUpdate(alert.id, "FALSE_ALARM")
                        }
                      >
                        <Text className="text-white font-semibold text-xs">
                          False Alarm
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
