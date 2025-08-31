import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  deleteAdminSkill,
  getAdminSkills,
  toggleAdminSkillStatus,
} from "@/services/adminSkillService";
import type { AdminSkill } from "../../types/adminSkills";

export default function AdminSkillsScreen() {
  const [skills, setSkills] = useState<AdminSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchSkills = async () => {
    try {
      const res = await getAdminSkills();
      setSkills(res?.skills || []);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load skills");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchSkills();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSkills();
  };

  const handleToggleStatus = async (skillId: number) => {
    try {
      setActionLoadingId(skillId);
      const res = await toggleAdminSkillStatus(skillId);
      Alert.alert("Success", res?.message || "Skill status updated");
      await fetchSkills();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update skill status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = (skillId: number, skillName: string) => {
    Alert.alert(
      "Delete Skill",
      `Are you sure you want to delete "${skillName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoadingId(skillId);
              const res = await deleteAdminSkill(skillId);
              Alert.alert(
                "Success",
                res?.message || "Skill deleted successfully",
              );
              await fetchSkills();
            } catch (error: any) {
              Alert.alert(
                "Delete Failed",
                error?.message || "Could not delete skill",
              );
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: AdminSkill }) => {
    const busy = actionLoadingId === item.id;

    return (
      <View className="mb-4 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-800 mb-1">
              {item.name}
            </Text>
            <Text className="text-xs text-gray-500">
              Category ID: {item.category_id}
            </Text>
            {!!item.description && (
              <Text className="text-sm text-gray-600 mt-2" numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>

          {/* Status Badge */}
          <View
            className={`px-3 py-1 rounded-full ${
              item.is_active ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                item.is_active ? "text-green-700" : "text-red-700"
              }`}
            >
              {item.is_active ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        {/* Pricing Info */}
        <View className="flex-row flex-wrap gap-4 mb-4 pb-3 border-b border-gray-100">
          <View className="flex-row items-center">
            <Ionicons name="pricetag-outline" size={14} color="#9ca3af" />
            <Text className="text-sm text-gray-600 ml-1">
              Price model: {item.price_model}
            </Text>
          </View>

          {item.base_price !== null && item.base_price !== undefined && (
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={14} color="#9ca3af" />
              <Text className="text-sm text-gray-600 ml-1">
                Base: Rs. {item.base_price}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-row items-center rounded-xl bg-[#FE8B4C] px-4 py-2.5"
            onPress={() =>
              router.push({
                pathname: "/(admin)/skill-form",
                params: { id: String(item.id) },
              })
            }
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={18} color="white" />
            <Text className="ml-2 font-semibold text-white">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center rounded-xl bg-amber-500 px-4 py-2.5"
            onPress={() => handleToggleStatus(item.id)}
            disabled={busy}
            activeOpacity={0.8}
          >
            {busy ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons
                  name={item.is_active ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="white"
                />
                <Text className="ml-2 font-semibold text-white">
                  {item.is_active ? "Deactivate" : "Activate"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center rounded-xl bg-red-500 px-4 py-2.5"
            onPress={() => handleDelete(item.id, item.name)}
            disabled={busy}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color="white" />
            <Text className="ml-2 font-semibold text-white">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#FE8B4C" />
        <Text className="mt-3 text-gray-500">Loading skills...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header with Back Button */}
      <View className="bg-[#FEF3E8] pt-8 pb-5 px-5 border-b border-[#FDD867]/30">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
        </TouchableOpacity>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-[#FE8B4C]">
              Manage Skills
            </Text>
            <Text className="text-gray-500 text-sm mt-1">
              {skills.length} total skills
            </Text>
          </View>
          <View className="bg-[#FE8B4C]/10 p-3 rounded-full">
            <MaterialCommunityIcons name="tools" size={28} color="#FE8B4C" />
          </View>
        </View>
      </View>

      {/* Add Skill Button */}
      <View className="px-5 pt-4 pb-2">
        <TouchableOpacity
          className="flex-row items-center justify-center rounded-xl bg-[#FE4D01] py-3 shadow-md"
          onPress={() => router.push("/(admin)/skill-form")}
          activeOpacity={0.8}
          style={{
            shadowColor: "#FE4D01",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text className="ml-2 text-base font-semibold text-white">
            Add New Skill
          </Text>
        </TouchableOpacity>
      </View>

      {/* Skills List */}
      <FlatList
        data={skills}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FE8B4C"]}
            tintColor="#FE8B4C"
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <View className="w-20 h-20 bg-[#FEF3E8] rounded-full items-center justify-center mb-4">
              <MaterialCommunityIcons name="tools" size={40} color="#FE8B4C" />
            </View>
            <Text className="text-gray-400 text-lg font-medium">
              No skills found
            </Text>
            <Text className="text-gray-400 text-sm mt-1 text-center">
              Tap the "Add New Skill" button to create one
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
