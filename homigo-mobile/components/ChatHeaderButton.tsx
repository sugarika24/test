import React, { useCallback, useMemo, useState } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { getChatList } from "../services/chat";

export default function ChatHeaderButton() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await getChatList();
      const chats = res?.chats || [];

      const totalUnread = chats.reduce(
        (sum: number, chat: any) => sum + Number(chat.unread_count || 0),
        0,
      );

      setUnreadCount(totalUnread);
    } catch (error) {
      console.log("loadUnreadCount error:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const run = async () => {
        try {
          const res = await getChatList();
          if (!active) return;

          const chats = res?.chats || [];
          const totalUnread = chats.reduce(
            (sum: number, chat: any) => sum + Number(chat.unread_count || 0),
            0,
          );

          setUnreadCount(totalUnread);
        } catch (error) {
          console.log("chat unread load error:", error);
        }
      };

      run();

      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <TouchableOpacity
      onPress={() => router.push("../../chat")}
      activeOpacity={0.8}
      style={{
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FE8B4C" />

      {unreadCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: 4,
            right: 2,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: "#ef4444",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
