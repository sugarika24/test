import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createAdminSkill,
  getAdminSkillById,
  updateAdminSkill,
} from "@/services/adminSkillService";
import { getCategories } from "@/services/categoryService";
import type { Category } from "@/types/category";

const PRICE_MODELS = ["fixed", "hourly", "variable"];
const SKILL_LEVELS = ["beginner", "intermediate", "expert"];

export default function AdminSkillFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [nameNepali, setNameNepali] = useState("");
  const [description, setDescription] = useState("");
  const [priceModel, setPriceModel] = useState("fixed");
  const [basePrice, setBasePrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minimumHours, setMinimumHours] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [durationMax, setDurationMax] = useState("");
  const [skillLevel, setSkillLevel] = useState("beginner");
  const [icon, setIcon] = useState("");
  const [popular, setPopular] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [displayOrder, setDisplayOrder] = useState("0");

  // Focus states
  const [focusedFields, setFocusedFields] = useState<{
    [key: string]: boolean;
  }>({});

  const handleFocus = (field: string) => {
    setFocusedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: string) => {
    setFocusedFields((prev) => ({ ...prev, [field]: false }));
  };

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      const categoryRes = await getCategories();
      setCategories(categoryRes?.categories || categoryRes?.data || []);

      if (isEdit) {
        const res = await getAdminSkillById(id!);
        const skill = res?.skill;

        if (!skill) {
          Alert.alert("Error", "Skill not found");
          router.back();
          return;
        }

        setCategoryId(String(skill.category_id ?? ""));
        setName(skill.name ?? "");
        setNameNepali(skill.name_nepali ?? "");
        setDescription(skill.description ?? "");
        setPriceModel(skill.price_model ?? "fixed");
        setBasePrice(skill.base_price != null ? String(skill.base_price) : "");
        setMinPrice(skill.min_price != null ? String(skill.min_price) : "");
        setMaxPrice(skill.max_price != null ? String(skill.max_price) : "");
        setMinimumHours(
          skill.minimum_hours != null ? String(skill.minimum_hours) : "",
        );
        setDurationMin(
          skill.estimated_duration_min != null
            ? String(skill.estimated_duration_min)
            : "",
        );
        setDurationMax(
          skill.estimated_duration_max != null
            ? String(skill.estimated_duration_max)
            : "",
        );
        setSkillLevel(skill.skill_level ?? "beginner");
        setIcon(skill.icon ?? "");
        setPopular(!!skill.popular);
        setRequiresVerification(!!skill.requires_verification);
        setDisplayOrder(
          skill.display_order != null ? String(skill.display_order) : "0",
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load form data");
      if (isEdit) router.back();
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    if (!categoryId) {
      Alert.alert("Validation", "Please select a category");
      return false;
    }

    if (!name.trim()) {
      Alert.alert("Validation", "Skill name is required");
      return false;
    }

    if (!priceModel.trim()) {
      Alert.alert("Validation", "Please select a price model");
      return false;
    }

    return true;
  };

  const buildPayload = () => ({
    category_id: Number(categoryId),
    name: name.trim(),
    name_nepali: nameNepali.trim() || null,
    description: description.trim() || null,
    price_model: priceModel,
    base_price: basePrice ? Number(basePrice) : null,
    min_price: minPrice ? Number(minPrice) : null,
    max_price: maxPrice ? Number(maxPrice) : null,
    minimum_hours: minimumHours ? Number(minimumHours) : null,
    estimated_duration_min: durationMin ? Number(durationMin) : null,
    estimated_duration_max: durationMax ? Number(durationMax) : null,
    skill_level: skillLevel || null,
    icon: icon.trim() || null,
    popular,
    requires_verification: requiresVerification,
    display_order: displayOrder ? Number(displayOrder) : 0,
  });

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      if (isEdit) {
        const res = await updateAdminSkill(id!, buildPayload());
        Alert.alert("Success", res?.message || "Skill updated successfully");
      } else {
        const res = await createAdminSkill(buildPayload());
        Alert.alert("Success", res?.message || "Skill created successfully");
      }

      router.back();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to save skill");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#FE8B4C" />
        <Text className="mt-3 text-gray-500">Loading form...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View className="bg-[#FEF3E8] pt-8 pb-6 px-5 border-b border-[#FDD867]/30">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#FE8B4C" />
          </TouchableOpacity>

          <View className="flex-row items-center">
            <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center shadow-md">
              <Ionicons name="create-outline" size={28} color="#FE8B4C" />
            </View>
            <View className="ml-4">
              <Text className="text-2xl font-bold text-gray-800">
                {isEdit ? "Edit Skill" : "Add New Skill"}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {isEdit
                  ? "Update skill information"
                  : "Create a new service skill"}
              </Text>
            </View>
          </View>
        </View>

        {/* Form Fields */}
        <View className="px-5 pt-6">
          {/* Category Selection */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Category <Text className="text-[#FE4D01]">*</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {categories.map((cat) => {
                  const selected = String(cat.id) === categoryId;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setCategoryId(String(cat.id))}
                      className={`px-4 py-2 rounded-full border ${
                        selected
                          ? "bg-[#FE8B4C] border-[#FE8B4C]"
                          : "bg-white border-gray-200"
                      }`}
                      activeOpacity={0.7}
                    >
                      <Text
                        className={`font-medium ${
                          selected ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <Input
            label="Skill Name"
            value={name}
            onChangeText={setName}
            isFocused={focusedFields.name}
            onFocus={() => handleFocus("name")}
            onBlur={() => handleBlur("name")}
            required
          />

          <Input
            label="Nepali Name"
            value={nameNepali}
            onChangeText={setNameNepali}
            isFocused={focusedFields.nameNepali}
            onFocus={() => handleFocus("nameNepali")}
            onBlur={() => handleBlur("nameNepali")}
          />

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            isFocused={focusedFields.description}
            onFocus={() => handleFocus("description")}
            onBlur={() => handleBlur("description")}
          />

          {/* Price Model Selection */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Price Model <Text className="text-[#FE4D01]">*</Text>
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {PRICE_MODELS.map((model) => {
                const selected = priceModel === model;
                return (
                  <TouchableOpacity
                    key={model}
                    onPress={() => setPriceModel(model)}
                    className={`px-4 py-2 rounded-full border ${
                      selected
                        ? "bg-[#FE8B4C] border-[#FE8B4C]"
                        : "bg-white border-gray-200"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`font-medium capitalize ${
                        selected ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {model}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Input
            label="Base Price"
            value={basePrice}
            onChangeText={setBasePrice}
            keyboardType="numeric"
            isFocused={focusedFields.basePrice}
            onFocus={() => handleFocus("basePrice")}
            onBlur={() => handleBlur("basePrice")}
          />

          <Input
            label="Min Price"
            value={minPrice}
            onChangeText={setMinPrice}
            keyboardType="numeric"
            isFocused={focusedFields.minPrice}
            onFocus={() => handleFocus("minPrice")}
            onBlur={() => handleBlur("minPrice")}
          />

          <Input
            label="Max Price"
            value={maxPrice}
            onChangeText={setMaxPrice}
            keyboardType="numeric"
            isFocused={focusedFields.maxPrice}
            onFocus={() => handleFocus("maxPrice")}
            onBlur={() => handleBlur("maxPrice")}
          />

          <Input
            label="Minimum Hours"
            value={minimumHours}
            onChangeText={setMinimumHours}
            keyboardType="numeric"
            isFocused={focusedFields.minimumHours}
            onFocus={() => handleFocus("minimumHours")}
            onBlur={() => handleBlur("minimumHours")}
          />

          <Input
            label="Estimated Duration Min"
            value={durationMin}
            onChangeText={setDurationMin}
            keyboardType="numeric"
            isFocused={focusedFields.durationMin}
            onFocus={() => handleFocus("durationMin")}
            onBlur={() => handleBlur("durationMin")}
          />

          <Input
            label="Estimated Duration Max"
            value={durationMax}
            onChangeText={setDurationMax}
            keyboardType="numeric"
            isFocused={focusedFields.durationMax}
            onFocus={() => handleFocus("durationMax")}
            onBlur={() => handleBlur("durationMax")}
          />

          {/* Skill Level Selection */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Skill Level
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {SKILL_LEVELS.map((level) => {
                const selected = skillLevel === level;
                return (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setSkillLevel(level)}
                    className={`px-4 py-2 rounded-full border ${
                      selected
                        ? "bg-[#FE8B4C] border-[#FE8B4C]"
                        : "bg-white border-gray-200"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`font-medium capitalize ${
                        selected ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Input
            label="Icon (emoji or icon name)"
            value={icon}
            onChangeText={setIcon}
            isFocused={focusedFields.icon}
            onFocus={() => handleFocus("icon")}
            onBlur={() => handleBlur("icon")}
          />

          <Input
            label="Display Order"
            value={displayOrder}
            onChangeText={setDisplayOrder}
            keyboardType="numeric"
            isFocused={focusedFields.displayOrder}
            onFocus={() => handleFocus("displayOrder")}
            onBlur={() => handleBlur("displayOrder")}
          />

          {/* Switches */}
          <View className="mb-4 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
              <View>
                <Text className="text-base font-semibold text-gray-800">
                  Popular
                </Text>
                <Text className="text-xs text-gray-500">
                  Mark as popular service
                </Text>
              </View>
              <Switch
                value={popular}
                onValueChange={setPopular}
                trackColor={{ false: "#d1d5db", true: "#FE8B4C" }}
                thumbColor={popular ? "#FFFFFF" : "#FFFFFF"}
              />
            </View>

            <View className="flex-row items-center justify-between px-4 py-4">
              <View>
                <Text className="text-base font-semibold text-gray-800">
                  Requires Verification
                </Text>
                <Text className="text-xs text-gray-500">
                  Helper needs verification for this skill
                </Text>
              </View>
              <Switch
                value={requiresVerification}
                onValueChange={setRequiresVerification}
                trackColor={{ false: "#d1d5db", true: "#FE8B4C" }}
                thumbColor={requiresVerification ? "#FFFFFF" : "#FFFFFF"}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.8}
            className="bg-[#FE4D01] rounded-xl py-4 items-center justify-center shadow-md mt-4 mb-8"
            style={{
              opacity: saving ? 0.7 : 1,
              shadowColor: "#FE4D01",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            {saving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="save-outline" size={20} color="white" />
                <Text className="text-white font-semibold text-base ml-2">
                  {isEdit ? "Update Skill" : "Create Skill"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = "default",
  isFocused = false,
  onFocus,
  onBlur,
  required = false,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
  isFocused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  required?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <Text className="text-[#FE4D01]">*</Text>}
      </Text>
      <View
        className={`rounded-xl border ${
          isFocused
            ? "border-[#FE8B4C] bg-[#FEF3E8] border-2"
            : "border-gray-200 bg-white"
        }`}
      >
        <TextInput
          className={`px-4 py-3 text-gray-800 ${
            multiline ? "min-h-[100px]" : ""
          }`}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          keyboardType={keyboardType}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#9ca3af"
          textAlignVertical={multiline ? "top" : "center"}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
}
