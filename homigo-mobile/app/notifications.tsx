import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  deleteNotification,
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationItem,
} from "../services/notificationService";
import { getSocket } from "../services/socketService";

function formatNotificationTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "BOOKING_CREATED":
      return "calendar-outline";
    case "BOOKING_ACCEPTED":
      return "checkmark-circle-outline";
    case "BOOKING_REJECTED":
      return "close-circle-outline";
    case "BOOKING_ON_THE_WAY":
      return "car-outline";
    case "BOOKING_STARTED":
      return "construct-outline";
    case "BOOKING_COMPLETED":
      return "checkmark-done-outline";
    case "BOOKING_CANCELLED":
      return "trash-outline";
    case "BOOKING_RESCHEDULED":
      return "refresh-outline";
    case "NEW_BOOKING_REQUEST":
      return "briefcase-outline";
    case "PAYMENT_RELEASED":
      return "cash-outline";
    case "HELPER_APPROVED":
      return "shield-checkmark-outline";
    case "HELPER_REJECTED":
      return "alert-circle-outline";
    case "NEW_REVIEW":
      return "star-outline";
    case "CHAT_MESSAGE":
      return "chatbubble-outline";
    case "EMERGENCY_ALERT":
      return "warning-outline";

    case "EMERGENCY_STATUS_UPDATED":
      return "shield-checkmark-outline";

    case "REFUND_REQUESTED":
      return "receipt-outline";

    case "REFUND_STATUS_UPDATED":
      return "cash-outline";
    default:
      return "notifications-outline";
  }
}

export default function NotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    let cleanupSocket: any = null;

    const attachSocketListener = () => {
      const socket = getSocket();

      if (!socket) {
        return;
      }

      const handleNotification = async () => {
        try {
          console.log("Notification screen auto-refresh triggered");
          const data = await getMyNotifications();
          setNotifications(data);
        } catch (error) {
          console.log("Failed to refresh notifications:", error);
        }
      };

      socket.on("notification", handleNotification);

      cleanupSocket = () => {
        socket.off("notification", handleNotification);
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

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load notifications");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const run = async () => {
        setLoading(true);
        try {
          const data = await getMyNotifications();
          if (active) {
            setNotifications(data);
          }
        } catch (error: any) {
          if (active) {
            Alert.alert(
              "Error",
              error?.message || "Failed to load notifications",
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };

      run();

      return () => {
        active = false;
      };
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_read: true } : item,
        ),
      );
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true })),
      );
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to delete notification");
    }
  };

  const confirmDelete = (id: number) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(id),
        },
      ],
    );
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    try {
      // mark as read first
      if (!item.is_read) {
        await handleMarkAsRead(item.id);
      }

      // 🔥 CHAT NOTIFICATION NAVIGATION
      if (item.type === "CHAT_MESSAGE" && item.ref_id) {
        router.push({
          pathname: "/chat/[bookingId]",
          params: { bookingId: String(item.ref_id) },
        });
        return;
      }

      // (Optional later) other types navigation
      // if (item.type === "BOOKING_CREATED") { ... }
    } catch (error) {
      console.log("notification press error:", error);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => confirmDelete(item.id)}
      className={`mx-4 mb-3 rounded-2xl border p-4 ${
        item.is_read
          ? "border-gray-100 bg-white"
          : "border-[#FE8B4C] bg-[#FEF3E8]"
      }`}
    >
      <View className="flex-row">
        <View
          className={`mr-3 h-12 w-12 items-center justify-center rounded-full ${
            item.is_read ? "bg-gray-100" : "bg-[#FE8B4C]/20"
          }`}
        >
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={24}
            color={item.is_read ? "#9ca3af" : "#FE8B4C"}
          />
        </View>

        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <Text className="mr-2 flex-1 text-base font-bold text-gray-900">
              {item.title}
            </Text>

            {!item.is_read && (
              <View className="rounded-full bg-[#FE8B4C] px-2 py-1">
                <Text className="text-[10px] font-semibold text-white">
                  NEW
                </Text>
              </View>
            )}
          </View>

          <Text className="mt-1 text-sm leading-5 text-gray-600">
            {item.message}
          </Text>

          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-xs text-gray-400">
              {formatNotificationTime(item.created_at)}
            </Text>

            <View className="flex-row items-center gap-3">
              {!item.is_read && (
                <TouchableOpacity onPress={() => handleMarkAsRead(item.id)}>
                  <Text className="text-sm font-medium text-[#FE8B4C]">
                    Mark read
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-[#FEF3E8] pt-6 pb-4 px-5 border-b border-[#FDD867]/30">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-[#FE8B4C]">
              Notifications
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              {unreadCount} unread{" "}
              {unreadCount === 1 ? "notification" : "notifications"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mark All Button */}
      {notifications.length > 0 && (
        <View className="px-5 pt-4 pb-2">
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            disabled={markingAll}
            className="bg-[#f08c61] rounded-xl py-3 items-center shadow-md"
            activeOpacity={0.8}
            style={{
              opacity: markingAll ? 0.7 : 1,
              shadowColor: "#FE4D01",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text className="text-white font-semibold text-base">
              {markingAll ? "Please wait..." : "Mark all as read"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FE8B4C" />
          <Text className="mt-3 text-gray-500">Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 bg-[#FEF3E8] rounded-full items-center justify-center mb-4">
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color="#FE8B4C"
            />
          </View>
          <Text className="text-xl font-bold text-gray-800 mb-2">
            No notifications yet
          </Text>
          <Text className="text-center text-gray-500">
            Your booking, payment, and review updates will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FE8B4C"]}
              tintColor="#FE8B4C"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
