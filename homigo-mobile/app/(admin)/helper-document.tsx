import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getFullImageUrl } from "../../services/profileService";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";

export default function HelperDocumentScreen() {
  const params = useLocalSearchParams();
  const fullName = params.full_name as string;
  const documentUrl = params.document_url as string;
  const documentType = params.document_type as string;
  const documentNumber = params.document_number as string;

  const fullImageUrl = getFullImageUrl(documentUrl);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const getDocumentTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "citizenship":
        return "📇";
      case "national_id":
        return "🆔";
      case "passport":
        return "📘";
      case "driving_license":
        return "🚗";
      default:
        return "📄";
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case "citizenship":
        return "Citizenship";
      case "national_id":
        return "National ID";
      case "passport":
        return "Passport";
      case "driving_license":
        return "Driving License";
      default:
        return type || "Document";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View className="bg-white pt-8 pb-5 px-5 border-b border-gray-100">
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
                Verification Document
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                Helper identification document
              </Text>
            </View>
            <View className="bg-[#FEF3E8] p-3 rounded-full">
              <MaterialCommunityIcons
                name="file-document"
                size={28}
                color="#FE8B4C"
              />
            </View>
          </View>
        </View>

        {/* Helper Info Card */}
        <View className="mx-5 mt-5 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-full bg-gradient-to-r from-[#FDD867] to-[#FE8B4C] items-center justify-center">
              <Text className="text-2xl font-bold text-white">
                {fullName?.charAt(0)?.toUpperCase() || "H"}
              </Text>
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold text-gray-800">
                {fullName || "Helper"}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className="bg-[#FEF3E8] px-2 py-1 rounded-full flex-row items-center">
                  <Text className="text-sm mr-1">
                    {getDocumentTypeIcon(documentType)}
                  </Text>
                  <Text className="text-xs text-[#FE8B4C] font-medium">
                    {getDocumentTypeLabel(documentType)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Document Number */}
          {documentNumber && (
            <View className="mt-3 pt-3 border-t border-gray-100">
              <View className="flex-row items-center">
                <Ionicons
                  name="document-text-outline"
                  size={14}
                  color="#9ca3af"
                />
                <Text className="text-xs text-gray-500 ml-1">
                  Document Number:
                </Text>
                <Text className="text-xs font-medium text-gray-700 ml-1">
                  {documentNumber}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Document Image Section */}
        <View className="mx-5 mt-5">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            Document Image
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            {fullImageUrl ? (
              <View className="relative">
                {imageLoading && (
                  <View className="absolute inset-0 items-center justify-center bg-gray-100 rounded-xl z-10">
                    <ActivityIndicator size="large" color="#FE8B4C" />
                    <Text className="text-gray-500 text-sm mt-2">
                      Loading document...
                    </Text>
                  </View>
                )}
                <Image
                  source={{ uri: fullImageUrl }}
                  style={{
                    width: "100%",
                    height: 450,
                    borderRadius: 12,
                    backgroundColor: "#f3f4f6",
                  }}
                  resizeMode="contain"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={(e) => {
                    setImageLoading(false);
                    setImageError(true);
                    console.log("Image load error:", e.nativeEvent);
                  }}
                />
                {imageError && (
                  <View className="items-center justify-center py-12">
                    <MaterialCommunityIcons
                      name="file-image-remove"
                      size={48}
                      color="#d1d5db"
                    />
                    <Text className="text-gray-400 text-sm mt-2">
                      Failed to load document
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="items-center justify-center py-16">
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={64}
                  color="#d1d5db"
                />
                <Text className="text-gray-400 text-lg font-medium mt-4">
                  No Document Found
                </Text>
                <Text className="text-gray-400 text-sm mt-1">
                  This helper has not uploaded any document
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Document Info Note */}
        <View className="mx-5 mt-5">
          <View className="bg-[#FEF3E8] rounded-xl p-4 border border-[#FDD867]/30">
            <View className="flex-row items-start">
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#FE8B4C"
              />
              <View className="flex-1 ml-2">
                <Text className="text-sm font-semibold text-gray-800">
                  Verification Details
                </Text>
                <Text className="text-xs text-gray-600 mt-1">
                  This document is used to verify the helper's identity. Please
                  ensure all details are clearly visible and match the
                  information provided.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-5 mt-6 gap-3">
          <TouchableOpacity
            className="bg-[#FE8B4C] rounded-xl py-3 items-center flex-row justify-center"
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color="white" />
            <Text className="text-white font-semibold ml-2">
              Back to Helper List
            </Text>
          </TouchableOpacity>

          {fullImageUrl && !imageError && (
            <TouchableOpacity
              className="bg-white border border-gray-200 rounded-xl py-3 items-center flex-row justify-center"
              onPress={() =>
                Alert.alert("Download", "Download feature coming soon")
              }
              activeOpacity={0.7}
            >
              <Ionicons name="download-outline" size={18} color="#FE8B4C" />
              <Text className="text-[#FE8B4C] font-semibold ml-2">
                Download Document
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
