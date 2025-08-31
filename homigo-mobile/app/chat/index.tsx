import React, { useCallback, useState } from "react";
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
import { getChatList } from "../../services/chat";
import { useAuth } from "../../context/AuthContext";

type ChatListItem = {
  booking_id: number;
  service_name: string;
  booking_status: string;
  booking_date?: string;
  other_person_name: string;
  other_person_id: number;
  other_person_role: string;
  last_message: string | null;
  last_message_time: string | null;
  last_message_sender_id: number | string | null;
  unread_count: number | string;
};

function formatChatTime(dateString?: string | null) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString();
}

function getBookingStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700";
    case "ACCEPTED":
      return "bg-purple-100 text-purple-700";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getBookingStatusLabel(status: string) {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return "Completed";
    case "IN_PROGRESS":
      return "In Progress";
    case "ACCEPTED":
      return "Accepted";
    case "PENDING":
      return "Pending";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status || "Unknown";
  }
}

export default function ChatListScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    try {
      const res = await getChatList();
      setChats(res?.chats || []);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load chats");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const run = async () => {
        setLoading(true);
        try {
          const res = await getChatList();
          if (active) {
            setChats(res?.chats || []);
          }
        } catch (error: any) {
          if (active) {
            Alert.alert("Error", error?.message || "Failed to load chats");
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
      await loadChats();
    } finally {
      setRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: ChatListItem }) => {
    const unreadCount = Number(item.unread_count || 0);
    const statusColor = getBookingStatusColor(item.booking_status);
    const statusLabel = getBookingStatusLabel(item.booking_status);
    const isMine = Number(item.last_message_sender_id) === Number(user?.id);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: "/chat/[bookingId]",
            params: { bookingId: String(item.booking_id) },
          })
        }
        className={`mx-4 mb-3 rounded-2xl border bg-white p-4 ${
          unreadCount > 0 ? "border-[#FE8B4C] shadow-sm" : "border-gray-100"
        }`}
      >
        <View className="flex-row items-center">
          <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-[#FEF3E8]">
            <Text className="text-lg font-bold text-[#FE8B4C]">
              {item.other_person_name?.charAt(0)?.toUpperCase() || "C"}
            </Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center">
                  <Text className="text-base font-bold text-gray-900">
                    {item.other_person_name || "Chat"}
                  </Text>
                  <View
                    className={`ml-2 px-2 py-0.5 rounded-full ${statusColor.split(" ")[0]}`}
                  >
                    <Text
                      className={`text-[10px] font-medium ${statusColor.split(" ")[1]}`}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                </View>
                <Text className="mt-0.5 text-xs text-gray-500">
                  {item.service_name || "Service"}
                </Text>
              </View>

              <Text className="text-xs text-gray-400">
                {formatChatTime(item.last_message_time)}
              </Text>
            </View>

            <View className="mt-2 flex-row items-center justify-between">
              <Text
                className={`flex-1 pr-3 text-sm ${
                  unreadCount > 0
                    ? "font-semibold text-gray-900"
                    : "text-gray-500"
                }`}
                numberOfLines={1}
              >
                {item.last_message
                  ? isMine
                    ? `You: ${item.last_message}`
                    : item.last_message
                  : "No messages yet"}
              </Text>

              {unreadCount > 0 && (
                <View className="min-w-[24px] rounded-full bg-[#FE4D01] px-2 py-1 items-center justify-center">
                  <Text className="text-xs font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-[#FEF3E8] pt-6 pb-4 px-5 border-b border-[#FDD867]/30">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-[#FE8B4C]">Chats</Text>
            <Text className="mt-1 text-sm text-gray-500">
              {chats.length}{" "}
              {chats.length === 1 ? "conversation" : "conversations"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FE8B4C" />
          <Text className="mt-3 text-gray-500">Loading chats...</Text>
        </View>
      ) : chats.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-[#FEF3E8]">
            <Ionicons name="chatbubbles-outline" size={48} color="#FE8B4C" />
          </View>
          <Text className="mb-2 text-xl font-bold text-gray-800">
            No chats yet
          </Text>
          <Text className="text-center text-gray-500">
            Your conversations with users and helpers will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.booking_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
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
