import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { getAllCategories } from "../../services/categoryService";
import { getPopularSubcategories } from "../../services/subcategoryService";
import { Category, Subcategory } from "../../types/category";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ChatHeaderButton from "@/components/ChatHeaderButton";

export default function UserHomeScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularSubcategories, setPopularSubcategories] = useState<
    Subcategory[]
  >([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHomeData();
  }, []);

  async function fetchHomeData() {
    try {
      setLoading(true);

      const [categoryRes, popularRes] = await Promise.all([
        getAllCategories(),
        getPopularSubcategories(),
      ]);

      setCategories(categoryRes.categories || []);
      setPopularSubcategories(popularRes.subcategories || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load home data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  function handleSearch() {
    if (!search.trim()) return;
    router.push({
      pathname: "/(tabs)/subcategory/[id]",
      params: { id: "search", q: search.trim() },
    });
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
        <View className="px-5 pt-4 pb-2">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-5">
            <View>
              <Text className="text-3xl font-bold text-[#FE8B4C]">Homigo</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Find professional services
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <ChatHeaderButton />
              <TouchableOpacity
                className="bg-[#FEF3E8] p-3 rounded-full"
                onPress={() => router.push("/notifications")}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#FE8B4C"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View className="flex-row mb-8 gap-3">
            <View className="flex-1 flex-row items-center bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
              <Ionicons name="search-outline" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 ml-2 py-2 text-gray-800 text-base"
                placeholder="Search services..."
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              className="bg-[#FE8B4C] rounded-xl px-5 items-center justify-center shadow-sm"
              onPress={handleSearch}
            >
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Categories Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Categories
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push("/(tabs)/categories/${item.id}" as any)
                }
              >
                <Text className="text-[#FE8B4C] text-sm font-medium">
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              numColumns={2}
              columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  onPress={() =>
                    router.push(`/(tabs)/category/${item.id}` as any)
                  }
                  activeOpacity={0.8}
                >
                  <View className="w-12 h-12 bg-[#FEF3E8] rounded-lg items-center justify-center mb-3">
                    <Text className="text-2xl">
                      {item.name === "Cleaning"
                        ? "🧹"
                        : item.name === "Plumbing"
                          ? "🔧"
                          : item.name === "Electrician"
                            ? "⚡"
                            : item.name === "Babysitting"
                              ? "👶"
                              : item.name === "Cooking"
                                ? "🍳"
                                : item.name === "Gardening"
                                  ? "🌿"
                                  : "🏠"}
                    </Text>
                  </View>
                  <Text className="text-base font-semibold text-gray-800 mb-1">
                    {item.name}
                  </Text>
                  <Text
                    className="text-xs text-gray-500 mb-2"
                    numberOfLines={1}
                  >
                    {item.description || `${item.name} services`}
                  </Text>
                  <Text className="text-xs text-[#FE8B4C] font-medium">
                    {item.helper_count || 0} helpers
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Popular Services Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Popular Services
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push("/(tabs)/subcategories/${item.id}" as any)
                }
              >
                <Text className="text-[#FE8B4C] text-sm font-medium">
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            {popularSubcategories.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                onPress={() =>
                  router.push(`/(tabs)/subcategory/${item.id}` as any)
                }
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <View className="w-14 h-14 bg-[#FEF3E8] rounded-xl items-center justify-center mr-4">
                    <Text className="text-3xl">
                      {item.name === "House Cleaning"
                        ? "🧹"
                        : item.name === "Plumbing Repair"
                          ? "🔧"
                          : item.name === "Electrical Work"
                            ? "⚡"
                            : item.name === "Babysitting"
                              ? "👶"
                              : item.name === "Cooking"
                                ? "🍳"
                                : "⭐"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-800">
                      {item.name}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {item.category_name}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Ionicons
                        name="people-outline"
                        size={12}
                        color="#FE8B4C"
                      />
                      <Text className="text-xs text-[#FE8B4C] ml-1">
                        {item.helper_count || 0} helpers
                      </Text>
                      {item.price_model && (
                        <>
                          <View className="w-1 h-1 bg-gray-300 rounded-full mx-2" />
                          <Text className="text-xs text-gray-500">
                            {item.price_model === "HOURLY"
                              ? "Hourly rate"
                              : "Fixed price"}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Action Buttons */}
          <View className="flex-row gap-3 mt-2">
            <TouchableOpacity
              className="flex-1 bg-[#FEF3E8] rounded-xl py-4 items-center"
              onPress={() => router.push("/(tabs)/bookings")}
            >
              <Ionicons name="calendar-outline" size={24} color="#FE8B4C" />
              <Text className="text-gray-700 font-medium mt-2 text-sm">
                My Bookings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-[#FEF3E8] rounded-xl py-4 items-center"
              onPress={() => router.push("/(tabs)/profile")}
            >
              <Ionicons name="person-outline" size={24} color="#FE8B4C" />
              <Text className="text-gray-700 font-medium mt-2 text-sm">
                My Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
