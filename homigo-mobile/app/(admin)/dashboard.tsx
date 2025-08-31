import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import {
  getAllHelpersForAdmin,
  getCompletedBookingsForAdmin,
  getAllUsersForAdmin,
} from "../../services/adminService";
import { getUnreadNotificationCount } from "../../services/notificationService";
import {
  AdminHelperItem,
  AdminCompletedBooking,
  AdminUserItem,
} from "../../types/admin";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function AdminDashboardScreen() {
  const { token, user, signOut } = useAuth();

  const [helpers, setHelpers] = useState<AdminHelperItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [completedBookings, setCompletedBookings] = useState<
    AdminCompletedBooking[]
  >([]);
  const [pendingPayouts, setPendingPayouts] = useState<AdminCompletedBooking[]>(
    [],
  );
  const [releasedPayouts, setReleasedPayouts] = useState<
    AdminCompletedBooking[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUnreadCount();
    }, []),
  );

  async function loadUnreadCount() {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count || 0);
    } catch (error) {
      console.log("Failed to load unread count:", error);
    }
  }

  async function loadDashboardData() {
    if (!token) return;

    try {
      setLoading(true);
      const [helpersRes, usersRes, completedRes, pendingRes, releasedRes] =
        await Promise.all([
          getAllHelpersForAdmin(token),
          getAllUsersForAdmin(token),
          getCompletedBookingsForAdmin(token),
          getCompletedBookingsForAdmin(token, "PENDING"),
          getCompletedBookingsForAdmin(token, "RELEASED"),
        ]);

      setHelpers(helpersRes.helpers || []);
      setUsers(usersRes.users || []);
      setCompletedBookings(completedRes.bookings || []);
      setPendingPayouts(pendingRes.bookings || []);
      setReleasedPayouts(releasedRes.bookings || []);
      await loadUnreadCount();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const pendingHelpersCount = helpers.filter(
    (helper) => helper.verification_status === "PENDING",
  ).length;

  const approvedHelpersCount = helpers.filter(
    (helper) => helper.verification_status === "APPROVED",
  ).length;

  const rejectedHelpersCount = helpers.filter(
    (helper) => helper.verification_status === "REJECTED",
  ).length;

  const suspendedHelpersCount = helpers.filter(
    (helper) => helper.verification_status === "SUSPENDED",
  ).length;

  const totalUsersCount = users.filter((item) => item.role === "USER").length;

  const totalAdminEarnings = completedBookings.reduce(
    (sum, booking) => sum + Number(booking.commission_amount || 0),
    0,
  );

  const releasedEarnings = releasedPayouts.reduce(
    (sum, booking) => sum + Number(booking.commission_amount || 0),
    0,
  );

  const pendingEarnings = pendingPayouts.reduce(
    (sum, booking) => sum + Number(booking.commission_amount || 0),
    0,
  );

  function DashboardCard({
    title,
    value,
    subtitle,
    icon,
    color,
  }: {
    title: string;
    value: number;
    subtitle?: string;
    icon: string;
    color: string;
  }) {
    return (
      <View className="bg-white rounded-2xl p-4 flex-1 min-w-[47%] mb-4 shadow-sm border border-gray-100">
        <View className="flex-row justify-between items-start">
          <Text className="text-gray-500 text-sm">{title}</Text>
          <View className={`${color} p-2 rounded-full`}>
            <Ionicons name={icon as any} size={16} color="#FE8B4C" />
          </View>
        </View>

        <Text className="text-2xl font-bold text-gray-800 mt-2">
          {title.includes("Earnings") ? `Rs. ${value.toFixed(2)}` : value}
        </Text>

        {subtitle ? (
          <Text className="text-gray-400 text-xs mt-1">{subtitle}</Text>
        ) : null}
      </View>
    );
  }

  function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  function NavButton({
    title,
    subtitle,
    onPress,
    icon,
  }: {
    title: string;
    subtitle: string;
    onPress: () => void;
    icon: string;
  }) {
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 flex-row items-center"
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View className="bg-[#FEF3E8] p-3 rounded-full mr-4">
          <Ionicons name={icon as any} size={24} color="#FE8B4C" />
        </View>

        <View className="flex-1">
          <Text className="text-gray-800 text-lg font-semibold">{title}</Text>
          <Text className="text-gray-500 text-sm mt-1">{subtitle}</Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
      </TouchableOpacity>
    );
  }

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
        <LinearGradient
          colors={["#FEF3E8", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          className="pt-8 pb-6 px-5"
        >
          {/* Header Row */}
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-[#FE8B4C]">
                Admin Dashboard
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                Welcome back, {user?.full_name?.split(" ")[0] || "Admin"}
              </Text>
            </View>

            {/* Right Side Buttons */}
            <View className="flex-row items-center gap-2">
              {/* Notifications Button */}
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                className="bg-white p-3 rounded-full shadow-sm border border-gray-100"
                activeOpacity={0.8}
              >
                <View className="relative">
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color="#FE8B4C"
                  />
                  {unreadCount > 0 && (
                    <View className="absolute -top-2 -right-2 bg-[#FE4D01] rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                      <Text className="text-white text-[10px] font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Logout Button */}
              <TouchableOpacity
                className="bg-white px-4 py-2.5 rounded-full shadow-sm border border-gray-100 flex-row items-center"
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={18} color="#FE8B4C" />
                <Text className="text-[#FE8B4C] font-semibold ml-1">
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Summary Row */}
          <View className="flex-row justify-between mt-6 gap-3">
            <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 items-center">
              <Text className="text-2xl font-bold text-[#FE8B4C]">
                {helpers.length}
              </Text>
              <Text className="text-xs text-gray-500">Total Helpers</Text>
            </View>

            <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 items-center">
              <Text className="text-2xl font-bold text-[#FE8B4C]">
                {totalUsersCount}
              </Text>
              <Text className="text-xs text-gray-500">Total Users</Text>
            </View>

            <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 items-center">
              <Text className="text-2xl font-bold text-[#FE8B4C]">
                {completedBookings.length}
              </Text>
              <Text className="text-xs text-gray-500">Completed Jobs</Text>
            </View>
          </View>

          {/* Manage Skills Button - FIXED */}
          <TouchableOpacity
            onPress={() => router.push("/(admin)/skills")}
            className="mt-5 rounded-xl bg-[#FE4D01] py-3.5 items-center flex-row justify-center shadow-md"
            activeOpacity={0.8}
            style={{
              shadowColor: "#FE4D01",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Ionicons name="build-outline" size={20} color="white" />
            <Text className="ml-2 text-base font-bold text-white">
              Manage Skills
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Helper Overview Section */}
        <View className="px-5 pt-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-800">
              Helper Overview
            </Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/helpers")}>
              <Text className="text-[#FE8B4C] text-sm font-medium">
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap justify-between">
            <DashboardCard
              title="Pending Helpers"
              value={pendingHelpersCount}
              subtitle="Waiting for review"
              icon="time-outline"
              color="bg-yellow-50"
            />
            <DashboardCard
              title="Approved Helpers"
              value={approvedHelpersCount}
              subtitle="Verified helpers"
              icon="checkmark-circle-outline"
              color="bg-green-50"
            />
            <DashboardCard
              title="Rejected Helpers"
              value={rejectedHelpersCount}
              subtitle="Rejected accounts"
              icon="close-circle-outline"
              color="bg-red-50"
            />
            <DashboardCard
              title="Suspended Helpers"
              value={suspendedHelpersCount}
              subtitle="Blocked helpers"
              icon="pause-circle-outline"
              color="bg-gray-50"
            />
          </View>
        </View>

        {/* Platform Overview Section */}
        <View className="px-5 pt-2">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Platform Overview
          </Text>

          <View className="flex-row flex-wrap justify-between">
            <DashboardCard
              title="Total Users"
              value={totalUsersCount}
              subtitle="All registered customers"
              icon="people-outline"
              color="bg-blue-50"
            />
            <DashboardCard
              title="Completed Bookings"
              value={completedBookings.length}
              subtitle="All completed jobs"
              icon="checkmark-done-outline"
              color="bg-green-50"
            />
            <DashboardCard
              title="Pending Payouts"
              value={pendingPayouts.length}
              subtitle="Need payment release"
              icon="hourglass-outline"
              color="bg-yellow-50"
            />
            <DashboardCard
              title="Released Payouts"
              value={releasedPayouts.length}
              subtitle="Already released"
              icon="cash-outline"
              color="bg-green-50"
            />
          </View>
        </View>

        {/* Earnings Overview Section */}
        <View className="px-5 pt-2">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Earnings Overview
          </Text>

          <View className="rounded-2xl p-4 mb-4 border border-[#FDD867]/30 bg-[#FFF8F2]">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-600 text-sm">
                Total Platform Earnings
              </Text>
              <View className="bg-[#FE8B4C]/10 p-2 rounded-full">
                <Ionicons name="wallet-outline" size={20} color="#FE8B4C" />
              </View>
            </View>

            <Text className="text-3xl font-bold text-[#FE8B4C]">
              Rs. {totalAdminEarnings.toFixed(2)}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              From all completed bookings
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-between">
            <DashboardCard
              title="Released Earnings"
              value={releasedEarnings}
              subtitle="Already paid out"
              icon="checkmark-circle-outline"
              color="bg-green-50"
            />
            <DashboardCard
              title="Pending Earnings"
              value={pendingEarnings}
              subtitle="Not yet released"
              icon="time-outline"
              color="bg-yellow-50"
            />
          </View>
        </View>

        {/* Quick Actions Section */}
        <View className="px-5 pt-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Quick Actions
          </Text>

          <NavButton
            title="Manage Helpers"
            subtitle="Approve, reject, suspend, and review helper accounts"
            onPress={() => router.push("/(admin)/helpers")}
            icon="people-outline"
          />

          <NavButton
            title="Manage Payments"
            subtitle="Review completed bookings and release helper payments"
            onPress={() => router.push("/(admin)/payments")}
            icon="cash-outline"
          />

          <NavButton
            title="View Users"
            subtitle="See all customer accounts"
            onPress={() => router.push("/(admin)/users")}
            icon="person-outline"
          />

          <TouchableOpacity
            className="bg-[#FEF3E8] rounded-2xl p-4 mt-2 items-center flex-row justify-center border border-[#FDD867]/30"
            onPress={loadDashboardData}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={18} color="#FE8B4C" />
            <Text className="text-[#FE8B4C] font-semibold ml-2">
              Refresh Dashboard
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="px-5 mt-6 mb-4">
          <Text className="text-center text-gray-400 text-xs">
            Homigo Admin Panel v1.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
