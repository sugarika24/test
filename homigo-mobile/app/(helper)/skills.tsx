import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  RefreshControl,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  getAllCategories,
  getSubcategoriesByCategory,
} from "../../services/categoryService";
import {
  addHelperSkill,
  deleteHelperSkill,
  getMyHelperSkills,
  updateHelperSkill,
} from "../../services/helperSkillService";
import { Category, Subcategory } from "../../types/category";
import { HelperSkill } from "../../types/helperSkill";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function HelperSkillsScreen() {
  const { token } = useAuth();

  const [skills, setSkills] = useState<HelperSkill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    number | null
  >(null);
  const [experienceYears, setExperienceYears] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [fixedRate, setFixedRate] = useState("");
  const [available, setAvailable] = useState(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitial();
  }, []);

  async function fetchInitial() {
    if (!token) return;

    try {
      setLoading(true);
      const [skillsRes, categoryRes] = await Promise.all([
        getMyHelperSkills(token),
        getAllCategories(),
      ]);

      setSkills(skillsRes.skills || []);
      setCategories(categoryRes.categories || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load helper skills");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchInitial();
  };

  async function fetchSubcategories(categoryId: number) {
    try {
      setSubLoading(true);
      const res = await getSubcategoriesByCategory(categoryId);
      setSubcategories(res.subcategories || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load subcategories");
    } finally {
      setSubLoading(false);
    }
  }

  async function handleSelectCategory(id: number) {
    setSelectedCategoryId(id);
    setSelectedSubcategoryId(null);
    setSubcategories([]);
    await fetchSubcategories(id);
  }

  async function handleAddSkill() {
    if (!token) return;

    if (!selectedSubcategoryId) {
      Alert.alert("Error", "Please select a subcategory");
      return;
    }

    try {
      setSubmitting(true);

      await addHelperSkill(
        {
          subcategory_id: selectedSubcategoryId,
          experience_years: experienceYears ? Number(experienceYears) : 0,
          hourly_rate: hourlyRate ? Number(hourlyRate) : null,
          fixed_rate: fixedRate ? Number(fixedRate) : null,
          available,
        },
        token,
      );

      Alert.alert("Success", "Skill added successfully");

      setSelectedSubcategoryId(null);
      setExperienceYears("");
      setHourlyRate("");
      setFixedRate("");
      setAvailable(true);

      fetchInitial();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add skill");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleSkill(skill: HelperSkill) {
    if (!token) return;

    try {
      await updateHelperSkill(
        skill.id,
        {
          available: !skill.available,
        },
        token,
      );

      fetchInitial();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update skill");
    }
  }

  async function handleDeleteSkill(id: number) {
    if (!token) return;

    Alert.alert("Delete Skill", "Are you sure you want to delete this skill?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteHelperSkill(id, token);
            Alert.alert("Success", "Skill deleted");
            fetchInitial();
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete skill");
          }
        },
      },
    ]);
  }

  const getVerificationStatusStyle = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return { bg: "#DCFCE7", text: "#166534", icon: "checkmark-circle" };
      case "REJECTED":
        return { bg: "#FEE2E2", text: "#991B1B", icon: "close-circle" };
      default:
        return { bg: "#FEF3C7", text: "#92400E", icon: "time-outline" };
    }
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
        {/* Header */}
        <View className="bg-white pt-12 pb-5 px-5 border-b border-gray-100">
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
                My Skills
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {skills.length} {skills.length === 1 ? "skill" : "skills"} added
              </Text>
            </View>
            <View className="bg-[#FEF3E8] p-3 rounded-full">
              <MaterialCommunityIcons name="tools" size={28} color="#FE8B4C" />
            </View>
          </View>
        </View>

        {/* Add New Skill Section */}
        <View className="mx-5 mt-5 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Add New Skill
          </Text>

          {/* Categories */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Select Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row gap-2">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => handleSelectCategory(cat.id)}
                  className={`px-4 py-2 rounded-full ${
                    selectedCategoryId === cat.id
                      ? "bg-[#FE8B4C]"
                      : "bg-gray-100 border border-gray-200"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      selectedCategoryId === cat.id
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Subcategories */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Select Subcategory
          </Text>
          {subLoading ? (
            <ActivityIndicator size="small" color="#FE8B4C" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              <View className="flex-row gap-2">
                {subcategories.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    onPress={() => setSelectedSubcategoryId(sub.id)}
                    className={`px-4 py-2 rounded-full ${
                      selectedSubcategoryId === sub.id
                        ? "bg-[#FE8B4C]"
                        : "bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selectedSubcategoryId === sub.id
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Experience Years */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Experience Years
          </Text>
          <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4 mb-4">
            <Ionicons name="briefcase-outline" size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 py-3 ml-3 text-gray-800"
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="numeric"
              placeholder="e.g., 2"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Hourly Rate */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Hourly Rate (Rs.)
          </Text>
          <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4 mb-4">
            <Ionicons name="cash-outline" size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 py-3 ml-3 text-gray-800"
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="numeric"
              placeholder="e.g., 500"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Fixed Rate */}
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Fixed Rate (Rs.)
          </Text>
          <View className="flex-row items-center bg-gray-50 rounded-xl border border-gray-200 px-4 mb-4">
            <Ionicons name="cash-outline" size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 py-3 ml-3 text-gray-800"
              value={fixedRate}
              onChangeText={setFixedRate}
              keyboardType="numeric"
              placeholder="e.g., 1500"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Availability Toggle */}
          <TouchableOpacity
            className={`rounded-xl py-3 mb-4 flex-row items-center justify-center ${
              available ? "bg-[#FE8B4C]" : "bg-gray-400"
            }`}
            onPress={() => setAvailable((prev) => !prev)}
          >
            <Ionicons
              name={available ? "toggle" : "toggle-outline"}
              size={20}
              color="white"
            />
            <Text className="text-white font-semibold ml-2">
              {available ? "Skill Available: ON" : "Skill Available: OFF"}
            </Text>
          </TouchableOpacity>

          {/* Add Button */}
          <TouchableOpacity
            className="bg-[#FE8B4C] rounded-xl py-3 items-center"
            onPress={handleAddSkill}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Add Skill
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Existing Skills Section */}
        <View className="mx-5 mt-5">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Existing Skills
          </Text>

          {skills.map((skill) => {
            const statusStyle = getVerificationStatusStyle(
              skill.verification_status,
            );

            return (
              <View
                key={skill.id}
                className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-lg font-bold text-gray-800">
                    {skill.subcategory_name}
                  </Text>
                  <View
                    style={{ backgroundColor: statusStyle.bg }}
                    className="px-2 py-1 rounded-full flex-row items-center"
                  >
                    <Ionicons
                      name={statusStyle.icon as any}
                      size={10}
                      color={statusStyle.text}
                    />
                    <Text
                      style={{ color: statusStyle.text }}
                      className="text-[10px] font-medium ml-1"
                    >
                      {skill.verification_status || "PENDING"}
                    </Text>
                  </View>
                </View>

                <Text className="text-sm text-gray-500 mb-2">
                  {skill.category_name}
                </Text>

                <View className="flex-row flex-wrap mb-3">
                  <View className="w-1/2 flex-row items-center mb-1">
                    <Ionicons
                      name="briefcase-outline"
                      size={12}
                      color="#9ca3af"
                    />
                    <Text className="text-xs text-gray-600 ml-1">
                      {skill.experience_years || 0} yrs exp
                    </Text>
                  </View>
                  <View className="w-1/2 flex-row items-center mb-1">
                    <Ionicons name="cash-outline" size={12} color="#9ca3af" />
                    <Text className="text-xs text-gray-600 ml-1">
                      Hourly: Rs. {skill.hourly_rate || 0}
                    </Text>
                  </View>
                  <View className="w-1/2 flex-row items-center">
                    <Ionicons name="cash-outline" size={12} color="#9ca3af" />
                    <Text className="text-xs text-gray-600 ml-1">
                      Fixed: Rs. {skill.fixed_rate || 0}
                    </Text>
                  </View>
                  <View className="w-1/2 flex-row items-center">
                    <Ionicons
                      name={
                        skill.available ? "checkmark-circle" : "close-circle"
                      }
                      size={12}
                      color={skill.available ? "#10b981" : "#ef4444"}
                    />
                    <Text
                      className={`text-xs ml-1 ${skill.available ? "text-green-600" : "text-red-600"}`}
                    >
                      {skill.available ? "Available" : "Unavailable"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    className={`flex-1 rounded-xl py-2 items-center ${
                      skill.available ? "bg-gray-500" : "bg-[#FE8B4C]"
                    }`}
                    onPress={() => handleToggleSkill(skill)}
                  >
                    <Text className="text-white font-medium text-sm">
                      {skill.available ? "Turn OFF" : "Turn ON"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 bg-red-500 rounded-xl py-2 items-center"
                    onPress={() => handleDeleteSkill(skill.id)}
                  >
                    <Text className="text-white font-medium text-sm">
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {!skills.length && (
            <View className="items-center justify-center py-12 bg-white rounded-2xl border border-gray-100">
              <MaterialCommunityIcons name="tools" size={48} color="#d1d5db" />
              <Text className="text-gray-400 text-base font-medium mt-3">
                No Skills Added
              </Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">
                Add your first skill to start offering services
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
