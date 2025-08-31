import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import {
  getAllHelpersForAdmin,
  approveHelper,
  rejectHelper,
  suspendHelper,
} from "../../services/adminService";
import { getFullImageUrl } from "../../services/profileService";
import { AdminHelperItem } from "../../types/admin";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

type HelperFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export default function AdminHelpersScreen() {
  const { token } = useAuth();

  const [helpers, setHelpers] = useState<AdminHelperItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<HelperFilter>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [showRejectBoxFor, setShowRejectBoxFor] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchHelpers();
  }, []);

  async function fetchHelpers() {
    if (!token) return;

    try {
      setLoading(true);
      const res = await getAllHelpersForAdmin(token);
      setHelpers(res.helpers || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load helpers");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchHelpers();
  };

  const filteredHelpers = useMemo(() => {
    if (selectedFilter === "ALL") return helpers;
    return helpers.filter(
      (helper) => helper.verification_status === selectedFilter,
    );
  }, [helpers, selectedFilter]);

  function getVerificationBadgeStyle(status?: string) {
    switch (status) {
      case "APPROVED":
        return { bg: "#DCFCE7", text: "#166534", icon: "checkmark-circle" };
      case "REJECTED":
        return { bg: "#FEE2E2", text: "#991B1B", icon: "close-circle" };
      case "SUSPENDED":
        return { bg: "#F3F4F6", text: "#374151", icon: "pause-circle" };
      default:
        return { bg: "#FEF3C7", text: "#92400E", icon: "time-outline" };
    }
  }

  function confirmApprove(helper: AdminHelperItem) {
    Alert.alert(
      "Approve Helper",
      `Are you sure you want to approve ${helper.full_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => handleApprove(helper.user_id),
        },
      ],
    );
  }

  function confirmSuspend(helper: AdminHelperItem) {
    Alert.alert(
      "Suspend Helper",
      `Are you sure you want to suspend ${helper.full_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Suspend",
          style: "destructive",
          onPress: () => handleSuspend(helper.user_id),
        },
      ],
    );
  }

  async function handleApprove(helperUserId: number) {
    if (!token) return;

    try {
      setActionLoadingId(helperUserId);
      await approveHelper(helperUserId, token);
      Alert.alert("Success", "Helper approved successfully");
      await fetchHelpers();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to approve helper");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleSuspend(helperUserId: number) {
    if (!token) return;

    try {
      setActionLoadingId(helperUserId);
      await suspendHelper(helperUserId, token);
      Alert.alert("Success", "Helper suspended successfully");
      await fetchHelpers();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to suspend helper");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(helperUserId: number) {
    if (!token) return;

    try {
      setActionLoadingId(helperUserId);
      await rejectHelper(
        helperUserId,
        token,
        rejectionReason.trim() || undefined,
      );
      Alert.alert("Success", "Helper rejected successfully");
      setShowRejectBoxFor(null);
      setRejectionReason("");
      await fetchHelpers();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to reject helper");
    } finally {
      setActionLoadingId(null);
    }
  }

  function openDocument(helper: AdminHelperItem) {
    router.push({
      pathname: "/(admin)/helper-document",
      params: {
        full_name: helper.full_name || "",
        document_url: helper.document_url || "",
        document_type: helper.document_type || "",
        document_number: helper.document_number || "",
      },
    });
  }

  const getFilterCount = (filter: HelperFilter) => {
    if (filter === "ALL") return helpers.length;
    return helpers.filter((h) => h.verification_status === filter).length;
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
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
                Manage Helpers
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {helpers.length} total helpers registered
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
              {(
                [
                  "ALL",
                  "PENDING",
                  "APPROVED",
                  "REJECTED",
                  "SUSPENDED",
                ] as HelperFilter[]
              ).map((filter) => (
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
                      selectedFilter === filter ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {filter} ({getFilterCount(filter)})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Helpers List */}
        <View className="px-5 pt-4">
          {filteredHelpers.map((helper) => {
            const isActionLoading = actionLoadingId === helper.user_id;
            const status = helper.verification_status || "PENDING";
            const badgeStyle = getVerificationBadgeStyle(status);

            return (
              <View
                key={helper.user_id}
                className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
              >
                {/* Header */}
                <View className="flex-row items-center mb-4">
                  {helper.profile_photo_url ? (
                    <Image
                      source={{
                        uri:
                          getFullImageUrl(helper.profile_photo_url) ||
                          undefined,
                      }}
                      className="w-14 h-14 rounded-full border border-gray-100"
                    />
                  ) : (
                    <View className="w-14 h-14 rounded-full bg-[#FEF3E8] items-center justify-center">
                      <Text className="text-xl font-bold text-[#FE8B4C]">
                        {helper.full_name?.charAt(0)?.toUpperCase() || "H"}
                      </Text>
                    </View>
                  )}

                  <View className="flex-1 ml-3">
                    <Text className="text-lg font-bold text-gray-800">
                      {helper.full_name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {helper.email}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View
                    style={{ backgroundColor: badgeStyle.bg }}
                    className="px-3 py-1 rounded-full flex-row items-center"
                  >
                    <Ionicons
                      name={badgeStyle.icon as any}
                      size={12}
                      color={badgeStyle.text}
                    />
                    <Text
                      style={{ color: badgeStyle.text }}
                      className="text-xs font-medium ml-1"
                    >
                      {status}
                    </Text>
                  </View>
                </View>

                {/* Details Grid */}
                <View className="flex-row flex-wrap mb-3">
                  <View className="w-1/2 flex-row items-center mb-2">
                    <Ionicons name="call-outline" size={14} color="#9ca3af" />
                    <Text className="text-sm text-gray-600 ml-2">
                      {helper.phone_number || "N/A"}
                    </Text>
                  </View>
                  <View className="w-1/2 flex-row items-center mb-2">
                    <Ionicons
                      name="briefcase-outline"
                      size={14}
                      color="#9ca3af"
                    />
                    <Text className="text-sm text-gray-600 ml-2">
                      {helper.experience_years || 0} yrs exp
                    </Text>
                  </View>
                  <View className="w-1/2 flex-row items-center mb-2">
                    <Ionicons name="cash-outline" size={14} color="#9ca3af" />
                    <Text className="text-sm text-gray-600 ml-2">
                      Rs. {helper.hourly_rate || 0}/hr
                    </Text>
                  </View>
                  <View className="w-1/2 flex-row items-center mb-2">
                    <Ionicons
                      name={
                        helper.is_active ? "checkmark-circle" : "close-circle"
                      }
                      size={14}
                      color={helper.is_active ? "#10b981" : "#ef4444"}
                    />
                    <Text
                      className={`text-sm ml-2 ${
                        helper.is_active ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {helper.is_active ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>

                {/* Bio */}
                {helper.bio && (
                  <Text
                    className="text-sm text-gray-500 mb-3"
                    numberOfLines={2}
                  >
                    {helper.bio}
                  </Text>
                )}

                {/* Rejection Reason */}
                {helper.rejection_reason && (
                  <View className="bg-red-50 rounded-lg p-2 mb-3">
                    <Text className="text-xs text-red-600">
                      Rejection: {helper.rejection_reason}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    className="flex-1 bg-gray-100 rounded-xl py-2 items-center flex-row justify-center"
                    onPress={() => openDocument(helper)}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={16}
                      color="#FE8B4C"
                    />
                    <Text className="text-[#FE8B4C] font-medium ml-1 text-sm">
                      Document
                    </Text>
                  </TouchableOpacity>

                  {status === "PENDING" && (
                    <>
                      <TouchableOpacity
                        className="flex-1 bg-[#FE8B4C] rounded-xl py-2 items-center flex-row justify-center"
                        onPress={() => confirmApprove(helper)}
                        disabled={isActionLoading}
                      >
                        {isActionLoading ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="white"
                            />
                            <Text className="text-white font-medium ml-1 text-sm">
                              Approve
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 bg-red-500 rounded-xl py-2 items-center flex-row justify-center"
                        onPress={() => {
                          setShowRejectBoxFor(helper.user_id);
                          setRejectionReason("");
                        }}
                        disabled={isActionLoading}
                      >
                        <Ionicons name="close" size={16} color="white" />
                        <Text className="text-white font-medium ml-1 text-sm">
                          Reject
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {status === "APPROVED" && (
                    <TouchableOpacity
                      className="flex-1 bg-gray-500 rounded-xl py-2 items-center flex-row justify-center"
                      onPress={() => confirmSuspend(helper)}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name="pause" size={16} color="white" />
                          <Text className="text-white font-medium ml-1 text-sm">
                            Suspend
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {(status === "REJECTED" || status === "SUSPENDED") && (
                    <TouchableOpacity
                      className="flex-1 bg-[#FE8B4C] rounded-xl py-2 items-center flex-row justify-center"
                      onPress={() => confirmApprove(helper)}
                      disabled={isActionLoading}
                    >
                      {isActionLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name="refresh" size={16} color="white" />
                          <Text className="text-white font-medium ml-1 text-sm">
                            Approve
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {/* Reject Reason Input */}
                {showRejectBoxFor === helper.user_id && (
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <Text className="text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason
                    </Text>
                    <TextInput
                      placeholder="Enter rejection reason (optional)"
                      value={rejectionReason}
                      onChangeText={setRejectionReason}
                      className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 text-gray-800"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                    <View className="flex-row gap-2 mt-3">
                      <TouchableOpacity
                        className="flex-1 bg-red-500 rounded-xl py-2 items-center"
                        onPress={() => handleReject(helper.user_id)}
                        disabled={isActionLoading}
                      >
                        <Text className="text-white font-medium">
                          Confirm Reject
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-gray-200 rounded-xl py-2 items-center"
                        onPress={() => {
                          setShowRejectBoxFor(null);
                          setRejectionReason("");
                        }}
                      >
                        <Text className="text-gray-700 font-medium">
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Empty State */}
        {!filteredHelpers.length && (
          <View className="items-center justify-center py-16">
            <MaterialCommunityIcons
              name="account-off"
              size={64}
              color="#d1d5db"
            />
            <Text className="text-gray-400 text-lg font-medium mt-4">
              No helpers found
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              No {selectedFilter !== "ALL" ? selectedFilter.toLowerCase() : ""}{" "}
              helpers available
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
