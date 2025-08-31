import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getAllUsersForAdmin } from "../../services/adminService";
import { getFullImageUrl } from "../../services/profileService";
import { AdminUserItem } from "../../types/admin";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

type UserFilter = "ALL" | "USER" | "HELPER" | "ADMIN";

export default function AdminUsersScreen() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<UserFilter>("ALL");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    if (!token) return;

    try {
      setLoading(true);
      const res = await getAllUsersForAdmin(token);
      setUsers(res.users || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const filteredUsers =
    selectedFilter === "ALL"
      ? users
      : users.filter((user) => user.role === selectedFilter);

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "ADMIN":
        return { bg: "#FEF3C7", text: "#92400E", icon: "shield-checkmark" };
      case "HELPER":
        return { bg: "#DCFCE7", text: "#166534", icon: "briefcase" };
      default:
        return { bg: "#DBEAFE", text: "#1E40AF", icon: "person" };
    }
  };

  const getFilterCount = (filter: UserFilter) => {
    if (filter === "ALL") return users.length;
    return users.filter((u) => u.role === filter).length;
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#FE8B4C" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FE8B4C"]}
          />
        }
      >
        {/* Header with Back Button */}
        <View className="bg-white pt-12 pb-5 px-5 border-b border-gray-100">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
          </TouchableOpacity>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-[#FE8B4C]">
                All Users
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {users.length} total users registered
              </Text>
            </View>
            <View className="bg-[#FEF3E8] p-3 rounded-full">
              <MaterialCommunityIcons
                name="account-group"
                size={28}
                color="#FE8B4C"
              />
            </View>
          </View>
        </View>

        {/* Filter Buttons */}
        <View className="px-5 pt-5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {(["ALL", "USER", "HELPER", "ADMIN"] as UserFilter[]).map(
                (filter) => (
                  <TouchableOpacity
                    key={filter}
                    className={`px-4 py-2 rounded-full ${
                      selectedFilter === filter
                        ? "bg-[#FE8B4C]"
                        : "bg-white border border-gray-200"
                    }`}
                    onPress={() => setSelectedFilter(filter)}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`font-semibold ${
                        selectedFilter === filter
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {filter} ({getFilterCount(filter)})
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </ScrollView>
        </View>

        {/* Users List */}
        <View className="px-5 pt-4">
          {filteredUsers.map((user) => {
            const roleBadge = getRoleBadgeStyle(user.role);

            return (
              <View
                key={user.id}
                className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
              >
                {/* Header with Avatar and Name */}
                <View className="flex-row items-center mb-4">
                  {user.profile_photo_url ? (
                    <Image
                      source={{
                        uri:
                          getFullImageUrl(user.profile_photo_url) || undefined,
                      }}
                      className="w-14 h-14 rounded-full border border-gray-100"
                    />
                  ) : (
                    <View className="w-14 h-14 rounded-full bg-[#FEF3E8] items-center justify-center">
                      <Text className="text-xl font-bold text-[#FE8B4C]">
                        {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                      </Text>
                    </View>
                  )}

                  <View className="flex-1 ml-3">
                    <Text className="text-lg font-bold text-gray-800">
                      {user.full_name}
                    </Text>
                    <Text className="text-sm text-gray-500">{user.email}</Text>
                  </View>

                  {/* Role Badge */}
                  <View
                    style={{ backgroundColor: roleBadge.bg }}
                    className="px-3 py-1 rounded-full flex-row items-center"
                  >
                    <Ionicons
                      name={roleBadge.icon as any}
                      size={12}
                      color={roleBadge.text}
                    />
                    <Text
                      style={{ color: roleBadge.text }}
                      className="text-xs font-medium ml-1"
                    >
                      {user.role}
                    </Text>
                  </View>
                </View>

                {/* User Details Grid */}
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 flex-row items-center mb-2">
                    <Ionicons name="call-outline" size={14} color="#9ca3af" />
                    <Text className="text-sm text-gray-600 ml-2">
                      {user.phone_number || "N/A"}
                    </Text>
                  </View>
                  <View className="w-1/2 flex-row items-center mb-2">
                    <Ionicons
                      name={
                        user.is_active ? "checkmark-circle" : "close-circle"
                      }
                      size={14}
                      color={user.is_active ? "#10b981" : "#ef4444"}
                    />
                    <Text
                      className={`text-sm ml-2 ${
                        user.is_active ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </Text>
                  </View>
                  <View className="w-full flex-row items-start mb-2">
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#9ca3af"
                    />
                    <Text className="text-sm text-gray-600 ml-2 flex-1">
                      {user.address || "No address provided"}
                    </Text>
                  </View>
                </View>

                {/* Additional Info */}
                {/* Additional Info */}
                <View className="mt-3 pt-3 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color="#9ca3af"
                    />
                    <Text className="text-xs text-gray-400 ml-1">
                      Joined:{" "}
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "N/A"}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Empty State */}
        {!filteredUsers.length && (
          <View className="items-center justify-center py-16">
            <MaterialCommunityIcons
              name="account-off"
              size={64}
              color="#d1d5db"
            />
            <Text className="text-gray-400 text-lg font-medium mt-4">
              No users found
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              No {selectedFilter !== "ALL" ? selectedFilter.toLowerCase() : ""}{" "}
              users available
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
