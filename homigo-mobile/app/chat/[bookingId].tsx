import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  getBookingMessages,
  sendBookingMessage,
  markBookingMessagesRead,
} from "../../services/chat";
import { useAuth } from "../../context/AuthContext";
import { getFullImageUrl } from "../../services/profileService";

type ChatMessage = {
  id: number;
  booking_id: number;
  sender_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  full_name: string;
  profile_photo_url?: string | null;
  role?: string;
};

export default function BookingChatScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const intervalRef = useRef<any>(null);

  const loadMessages = useCallback(
    async (showLoader = false) => {
      try {
        if (!bookingId) return;

        if (showLoader) setLoading(true);

        const res = await getBookingMessages(bookingId);

        if (res?.ok) {
          setMessages(res.messages || []);
          await markBookingMessagesRead(bookingId);
        }
      } catch (error) {
        console.log("loadMessages error:", error);
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [bookingId],
  );

  useEffect(() => {
    loadMessages(true);
  }, [loadMessages]);

  useEffect(() => {
    if (!bookingId) return;

    intervalRef.current = setInterval(() => {
      loadMessages(false);
    }, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bookingId, loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 120);
    }
  }, [messages]);

  async function handleSend() {
    try {
      if (!bookingId) return;

      const trimmed = text.trim();
      if (!trimmed) return;

      setSending(true);

      const res = await sendBookingMessage(bookingId, trimmed);

      if (res?.ok) {
        setText("");
        await loadMessages(false);
      } else {
        Alert.alert("Error", res?.message || "Failed to send message");
      }
    } catch (error) {
      console.log("handleSend error:", error);
      Alert.alert("Error", "Something went wrong while sending message");
    } finally {
      setSending(false);
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitial = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "U";
  };

  function renderMessage({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) {
    const isMine = Number(item.sender_id) === Number(user?.id);
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showAvatarAndName =
      !isMine &&
      (!previousMessage ||
        Number(previousMessage.sender_id) !== Number(item.sender_id));

    return (
      <View
        className={`mb-2 ${isMine ? "items-end" : "items-start"}`}
        style={{
          maxWidth: "80%",
          alignSelf: isMine ? "flex-end" : "flex-start",
        }}
      >
        {!isMine && showAvatarAndName && (
          <View className="flex-row items-center mb-1 ml-1">
            {item.profile_photo_url ? (
              <Image
                source={{
                  uri: getFullImageUrl(item.profile_photo_url) || undefined,
                }}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <View className="w-6 h-6 rounded-full bg-[#FEF3E8] items-center justify-center">
                <Text className="text-xs font-bold text-[#FE8B4C]">
                  {getInitial(item.full_name)}
                </Text>
              </View>
            )}
            <Text className="text-xs font-medium text-gray-500 ml-1">
              {item.full_name}
            </Text>
          </View>
        )}

        <View
          className={`rounded-2xl px-4 py-3 ${
            isMine
              ? "bg-[#FE4D01] rounded-tr-none"
              : "bg-gray-100 rounded-tl-none"
          }`}
          style={{ maxWidth: "100%" }}
        >
          <Text
            className={`text-base ${isMine ? "text-white" : "text-gray-800"}`}
          >
            {item.message}
          </Text>

          <View className="flex-row items-center justify-end mt-1">
            <Text
              className={`text-[10px] ${
                isMine ? "text-white/70" : "text-gray-400"
              }`}
            >
              {formatTime(item.created_at)}
            </Text>

            {isMine && (
              <Ionicons
                name={item.is_read ? "checkmark-done" : "checkmark"}
                size={12}
                color="rgba(255,255,255,0.7)"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#FE8B4C" />
        <Text className="mt-3 text-gray-500">Loading chat...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View className="bg-white pt-6 pb-4 px-5 border-b border-gray-100">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
            </TouchableOpacity>
            <View>
              <Text className="text-xl font-bold text-gray-800">
                Booking Chat
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                Booking ID: #{bookingId}
              </Text>
            </View>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          onRefresh={() => loadMessages(false)}
          refreshing={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <View className="w-20 h-20 bg-[#FEF3E8] rounded-full items-center justify-center mb-4">
                <Ionicons
                  name="chatbubbles-outline"
                  size={32}
                  color="#FE8B4C"
                />
              </View>
              <Text className="text-gray-400 text-base font-medium">
                No messages yet
              </Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">
                Start the conversation by sending a message
              </Text>
            </View>
          }
        />

        <View className="flex-row items-end p-3 bg-white border-t border-gray-100 gap-2">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            multiline
            className="flex-1 min-h-[48px] max-h-[100px] border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 bg-gray-50"
            style={{ textAlignVertical: "center" }}
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || !text.trim()}
            className={`rounded-2xl px-5 py-3 items-center justify-center ${
              sending || !text.trim() ? "bg-gray-300" : "bg-[#FE4D01]"
            }`}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
