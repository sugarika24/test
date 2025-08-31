//Category details screen showing subcategories and option to browse helpers
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  getCategoryById,
  getSubcategoriesByCategory,
} from "../../../services/categoryService";
import { Category, Subcategory } from "../../../types/category";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function CategoryDetailsScreen() {
  const { id } = useLocalSearchParams();

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);

      const [categoryRes, subcategoryRes] = await Promise.all([
        getCategoryById(String(id)),
        getSubcategoriesByCategory(String(id)),
      ]);

      setCategory(categoryRes.category);
      setSubcategories(subcategoryRes.subcategories || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load category");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getCategoryIcon = (name: string) => {
    const icons: { [key: string]: string } = {
      Cleaning: "🧹",
      Plumbing: "🔧",
      Electrician: "⚡",
      Babysitting: "👶",
      Cooking: "🍳",
      Gardening: "🌿",
      Laundry: "👕",
      "Elder Care": "👴",
      Carpentry: "🔨",
      Painting: "🎨",
      Moving: "🚚",
      "Pet Care": "🐕",
    };
    return icons[name] || "🏠";
  };

  const getSubcategoryIcon = (name: string) => {
    if (name?.includes("Clean")) return "🧹";
    if (name?.includes("Plumb")) return "🔧";
    if (name?.includes("Electric")) return "⚡";
    if (name?.includes("Baby")) return "👶";
    if (name?.includes("Cook")) return "🍳";
    if (name?.includes("Garden")) return "🌿";
    if (name?.includes("Laundry")) return "👕";
    return "⭐";
  };

  const totalHelpers = subcategories.reduce(
    (sum, sub) => sum + (sub.helper_count || 0),
    0,
  );

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
        {/* Header Section */}
        <View className="bg-[#FEF3E8] pt-8 pb-6 px-5 border-b border-[#FDD867]/30">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
          </TouchableOpacity>

          {/* Category Info */}
          <View className="flex-row items-center">
            <View className="w-20 h-20 bg-white rounded-2xl items-center justify-center shadow-md">
              <Text className="text-5xl">
                {getCategoryIcon(category?.name || "")}
              </Text>
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-2xl font-bold text-gray-800 mb-1">
                {category?.name}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={14} color="#FE8B4C" />
                <Text className="text-[#FE8B4C] text-sm ml-1">
                  {totalHelpers} {totalHelpers === 1 ? "helper" : "helpers"}{" "}
                  available
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Text className="text-gray-600 mt-4 leading-5">
            {category?.description ||
              `Find the best ${category?.name} services in your area. Book trusted professionals with ease.`}
          </Text>
        </View>

        {/* Subcategories Section */}
        <View className="px-5 pt-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-800">
              Available Services
            </Text>
            <Text className="text-[#FE8B4C] text-xs font-medium">
              {subcategories.length} services
            </Text>
          </View>

          {subcategories.length === 0 ? (
            <View className="items-center justify-center py-12 bg-white rounded-2xl border border-gray-100">
              <MaterialCommunityIcons
                name="emoticon-sad-outline"
                size={48}
                color="#d1d5db"
              />
              <Text className="text-gray-400 text-base mt-3">
                No services available
              </Text>
              <Text className="text-gray-400 text-sm mt-1">
                Check back later
              </Text>
            </View>
          ) : (
            subcategories.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                onPress={() =>
                  router.push(`/(tabs)/subcategory/${item.id}` as any)
                }
                activeOpacity={0.8}
              >
                <View className="flex-row">
                  <View className="w-14 h-14 bg-[#FEF3E8] rounded-xl items-center justify-center">
                    <Text className="text-3xl">
                      {getSubcategoryIcon(item.name)}
                    </Text>
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-base font-semibold text-gray-800 mb-1">
                      {item.name}
                    </Text>
                    <Text
                      className="text-xs text-gray-500 mb-2"
                      numberOfLines={2}
                    >
                      {item.description ||
                        `${item.name} services for your home`}
                    </Text>
                    <View className="flex-row items-center flex-wrap">
                      <View className="flex-row items-center mr-3">
                        <Ionicons
                          name="people-outline"
                          size={12}
                          color="#FE8B4C"
                        />
                        <Text className="text-xs text-[#FE8B4C] ml-1">
                          {item.helper_count || 0} helpers
                        </Text>
                      </View>
                      {item.price_model && (
                        <View className="flex-row items-center">
                          <View className="w-1 h-1 bg-gray-300 rounded-full mr-2" />
                          <Text className="text-xs text-gray-500">
                            {item.price_model === "HOURLY"
                              ? "Hourly rate"
                              : "Fixed price"}
                          </Text>
                        </View>
                      )}
                      {item.base_price && (
                        <View className="flex-row items-center">
                          <View className="w-1 h-1 bg-gray-300 rounded-full mx-2" />
                          <Text className="text-xs text-gray-500">
                            From ${item.base_price}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Browse Helpers Button */}
        {subcategories.length > 0 && (
          <View className="px-5 mt-4">
            <TouchableOpacity
              className="bg-[#FE8B4C] rounded-xl py-4 items-center shadow-sm"
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/helpers",
                  params: { category_id: id },
                } as any)
              }
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <Ionicons name="search-outline" size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  Browse All Helpers
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Why Choose Us Section */}
        <View className="px-5 mt-6">
          <View className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-sm font-bold text-gray-800 mb-3 text-center">
              Why choose Homigo?
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <View className="w-10 h-10 bg-[#FEF3E8] rounded-full items-center justify-center mb-2">
                  <Ionicons name="checkmark-circle" size={18} color="#FE8B4C" />
                </View>
                <Text className="text-[10px] text-gray-600 text-center">
                  Verified Pros
                </Text>
              </View>
              <View className="items-center flex-1">
                <View className="w-10 h-10 bg-[#FEF3E8] rounded-full items-center justify-center mb-2">
                  <Ionicons name="shield-checkmark" size={18} color="#FE8B4C" />
                </View>
                <Text className="text-[10px] text-gray-600 text-center">
                  Secure Payment
                </Text>
              </View>
              <View className="items-center flex-1">
                <View className="w-10 h-10 bg-[#FEF3E8] rounded-full items-center justify-center mb-2">
                  <Ionicons name="time" size={18} color="#FE8B4C" />
                </View>
                <Text className="text-[10px] text-gray-600 text-center">
                  On-Time Service
                </Text>
              </View>
              <View className="items-center flex-1">
                <View className="w-10 h-10 bg-[#FEF3E8] rounded-full items-center justify-center mb-2">
                  <Ionicons name="star" size={18} color="#FE8B4C" />
                </View>
                <Text className="text-[10px] text-gray-600 text-center">
                  Top Rated
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer Padding */}
        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
