import { Alert } from "react-native";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket: Socket | null = null;

const SOCKET_URL = API_BASE_URL.replace("/api", "");

export function connectSocket(userId: number | string) {
  if (socket?.connected) {
    socket.emit("join", userId);
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
    socket?.emit("join", userId);
  });

  socket.on("notification", (notification) => {
    console.log("Real-time notification:", notification);

    Alert.alert(
      notification.title || "New Notification",
      notification.message || "You have a new notification."
    );
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (error) => {
    console.log("Socket connection error:", error.message);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.off("notification");
    socket.disconnect();
    socket = null;
  }
}