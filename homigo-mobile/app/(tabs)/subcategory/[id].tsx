import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  getSubcategoryById,
  searchSubcategories,
} from "../../../services/subcategoryService";
import { getHelpers } from "../../../services/helperService";
import { getFullImageUrl } from "../../../services/profileService";
import { HelperListItem } from "../../../types/helper";
import { Subcategory } from "../../../types/category";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function SubcategoryDetailsScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const q = params.q as string | undefined;

  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [helpers, setHelpers] = useState<HelperListItem[]>([]);
  const [searchResults, setSearchResults] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, q]);

  async function fetchData() {
    try {
      setLoading(true);

      if (id === "search" && q) {
        const result = await searchSubcategories(q);
        setSearchResults(result.subcategories || []);
        setSubcategory(null);
        setHelpers([]);
        return;
      }

      const [subcategoryRes, helperRes] = await Promise.all([
        getSubcategoryById(id),
        getHelpers({ subcategory_id: id }),
      ]);

      const sortedHelpers = [...(helperRes.helpers || [])].sort((a, b) => {
        const ratingA = Number(a.avg_rating || 0);
        const ratingB = Number(b.avg_rating || 0);

        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }

        const countA = Number(a.rating_count || 0);
        const countB = Number(b.rating_count || 0);

        return countB - countA;
      });

      setSubcategory(subcategoryRes.subcategory || null);
      setHelpers(sortedHelpers);
      setSearchResults([]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load subcategory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getSubcategoryIcon = (name: string) => {
    if (name?.includes("Clean")) return "🧹";
    if (name?.includes("Plumb")) return "🔧";
    if (name?.includes("Electric")) return "⚡";
    if (name?.includes("Baby")) return "👶";
    if (name?.includes("Cook")) return "🍳";
    if (name?.includes("Garden")) return "🌿";
    if (name?.includes("Laundry")) return "👕";
    if (name?.includes("Repair")) return "🔨";
    return "⭐";
  };

  const getHelperInitial = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "H";
  };

  const filteredHelpers = showAvailableOnly
    ? helpers.filter((helper) => helper.helper_available)
    : helpers;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#FE8B4C" />
      </View>
    );
  }

  if (id === "search") {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-[#FEF3E8] pt-8 pb-4 px-5 border-b border-[#FDD867]/30">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-3 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">
            Search Results
          </Text>
          <Text className="text-gray-500 text-sm mt-1">
            Found {searchResults.length} results for "{q}"
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FE8B4C"]}
            />
          }
        >
          {searchResults.length === 0 ? (
            <View className="items-center justify-center py-16">
              <MaterialCommunityIcons
                name="emoticon-sad-outline"
                size={64}
                color="#d1d5db"
              />
              <Text className="text-gray-400 text-lg font-medium mt-4">
                No results found
              </Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                Try searching with different keywords
              </Text>
            </View>
          ) : (
            searchResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                onPress={() =>
                  router.replace(`/(tabs)/subcategory/${item.id}` as any)
                }
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-[#FEF3E8] rounded-xl items-center justify-center">
                    <Text className="text-2xl">
                      {getSubcategoryIcon(item.name)}
                    </Text>
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-semibold text-gray-800 mb-1">
                      {item.name}
                    </Text>
                    <Text className="text-xs text-gray-500 mb-1">
                      {item.category_name}
                    </Text>
                    <View className="flex-row items-center">
                      <Ionicons
                        name="people-outline"
                        size={12}
                        color="#FE8B4C"
                      />
                      <Text className="text-xs text-[#FE8B4C] ml-1">
                        {item.helper_count || 0} helpers
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
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
        <View className="bg-[#FEF3E8] pt-8 pb-6 px-5 border-b border-[#FDD867]/30">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
          >
            <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
          </TouchableOpacity>

          <View className="flex-row items-center">
            <View className="w-20 h-20 bg-white rounded-2xl items-center justify-center shadow-md">
              <Text className="text-5xl">
                {getSubcategoryIcon(subcategory?.name || "")}
              </Text>
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-2xl font-bold text-gray-800 mb-1">
                {subcategory?.name}
              </Text>
              <Text className="text-gray-500 text-sm">
                {subcategory?.category_name}
              </Text>
              <View className="flex-row items-center mt-2">
                <Ionicons name="people-outline" size={14} color="#FE8B4C" />
                <Text className="text-[#FE8B4C] text-sm ml-1">
                  {filteredHelpers.length}{" "}
                  {filteredHelpers.length === 1 ? "helper" : "helpers"}{" "}
                  available
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-gray-600 mt-4 leading-5">
            {subcategory?.description ||
              `Find the best ${subcategory?.name} services in your area.`}
          </Text>

          {(subcategory?.price_model === "HOURLY" ||
            subcategory?.price_model === "FIXED") && (
            <View className="flex-row items-center mt-4 bg-white/60 rounded-xl p-3">
              <Ionicons name="cash-outline" size={18} color="#FE8B4C" />
              <Text className="text-gray-700 text-sm ml-2">
                {subcategory?.price_model === "HOURLY"
                  ? "Hourly rate pricing"
                  : "Fixed price per job"}
              </Text>
              {subcategory?.base_price && (
                <Text className="text-[#FE8B4C] font-medium text-sm ml-auto">
                  From Rs. {subcategory.base_price}
                </Text>
              )}
            </View>
          )}
        </View>

        <View className="px-5 pt-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-800">
              Available Helpers
            </Text>
            <Text className="text-[#FE8B4C] text-xs font-medium">
              {filteredHelpers.length}{" "}
              {filteredHelpers.length === 1 ? "pro" : "pros"}
            </Text>
          </View>

          <View className="flex-row mb-4">
            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${
                !showAvailableOnly ? "bg-black" : "bg-gray-200"
              }`}
              onPress={() => setShowAvailableOnly(false)}
            >
              <Text
                className={`${
                  !showAvailableOnly ? "text-white" : "text-black"
                } font-semibold`}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`px-4 py-2 rounded-full ${
                showAvailableOnly ? "bg-green-600" : "bg-gray-200"
              }`}
              onPress={() => setShowAvailableOnly(true)}
            >
              <Text
                className={`${
                  showAvailableOnly ? "text-white" : "text-black"
                } font-semibold`}
              >
                Available Now
              </Text>
            </TouchableOpacity>
          </View>

          {filteredHelpers.length === 0 ? (
            <View className="items-center justify-center py-12 bg-white rounded-2xl border border-gray-100">
              <MaterialCommunityIcons
                name="emoticon-sad-outline"
                size={48}
                color="#d1d5db"
              />
              <Text className="text-gray-400 text-base mt-3">
                No helpers available
              </Text>
              <Text className="text-gray-400 text-sm mt-1 text-center">
                {showAvailableOnly
                  ? "No helpers are available right now."
                  : "Check back later"}
              </Text>
            </View>
          ) : (
            filteredHelpers.map((helper, index) => {
              const primarySkill = helper.skills?.[0];

              return (
                <TouchableOpacity
                  key={String(helper.id)}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                  onPress={() =>
                    router.push(`/(tabs)/helper/${helper.id}` as any)
                  }
                  activeOpacity={0.8}
                >
                  <View className="flex-row">
                    <View className="w-14 h-14 bg-[#FEF3E8] rounded-full items-center justify-center">
                      {helper.profile_photo_url ? (
                        <Image
                          source={{
                            uri:
                              getFullImageUrl(helper.profile_photo_url) ||
                              undefined,
                          }}
                          style={{ width: 56, height: 56, borderRadius: 28 }}
                        />
                      ) : (
                        <Text className="text-2xl font-bold text-[#FE8B4C]">
                          {getHelperInitial(helper.full_name)}
                        </Text>
                      )}
                    </View>

                    <View className="flex-1 ml-4">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-2">
                          <Text className="text-base font-semibold text-gray-800">
                            {helper.full_name}
                          </Text>

                          {Number(helper.avg_rating || 0) >= 4 ? (
                            <View className="bg-yellow-100 self-start px-2 py-1 rounded-full mt-1">
                              <Text className="text-yellow-700 text-[10px] font-semibold">
                                Top Rated
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <View className="flex-row items-center">
                          <Ionicons name="star" size={14} color="#F59E0B" />
                          <Text className="text-xs text-gray-700 font-medium ml-1">
                            {helper.avg_rating
                              ? Number(helper.avg_rating).toFixed(1)
                              : "New"}
                          </Text>
                          <Text className="text-xs text-gray-400 ml-1">
                            ({helper.rating_count || 0})
                          </Text>
                        </View>
                      </View>

                      <Text
                        className="text-xs text-gray-500 mt-1"
                        numberOfLines={2}
                      >
                        {helper.bio || "Experienced and reliable professional"}
                      </Text>

                      <View className="flex-row items-center mt-2 flex-wrap">
                        <View className="flex-row items-center mr-3">
                          <Ionicons
                            name="briefcase-outline"
                            size={12}
                            color="#9ca3af"
                          />
                          <Text className="text-xs text-gray-500 ml-1">
                            {primarySkill?.experience_years || 0} yrs exp
                          </Text>
                        </View>

                        {helper.completed_jobs_count ? (
                          <View className="flex-row items-center mr-3">
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={12}
                              color="#9ca3af"
                            />
                            <Text className="text-xs text-gray-500 ml-1">
                              {helper.completed_jobs_count} jobs
                            </Text>
                          </View>
                        ) : null}

                        {helper.helper_available ? (
                          <View className="flex-row items-center">
                            <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                            <Text className="text-xs text-green-600">
                              Available
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {helper.skills && helper.skills.length > 0 ? (
                        <View className="flex-row flex-wrap mt-2">
                          {helper.skills.slice(0, 3).map((skill: any) => (
                            <View
                              key={skill.helper_skill_id}
                              className="bg-gray-100 px-2 py-1 rounded-full mr-2 mb-1"
                            >
                              <Text className="text-xs text-gray-700">
                                {skill.subcategory_name}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      <View className="mt-2 pt-2 border-t border-gray-100">
                        {subcategory?.price_model === "FIXED" ? (
                          <Text className="text-[#FE8B4C] font-bold text-base">
                            Rs. {primarySkill?.fixed_rate || 0} fixed
                          </Text>
                        ) : (
                          <Text className="text-[#FE8B4C] font-bold text-base">
                            Rs. {primarySkill?.hourly_rate || 0}/hr
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
