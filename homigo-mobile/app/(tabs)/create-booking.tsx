import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { createBooking } from "../../services/bookingService";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function CreateBookingScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams();

  const [bookingDate, setBookingDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(() => {
    const date = new Date();
    date.setHours(9, 0, 0);
    return date;
  });
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [isFocused, setIsFocused] = useState({
    address: false,
    instructions: false,
  });

  useEffect(() => {
    if (params.latitude && params.longitude) {
      setLatitude(String(params.latitude));
      setLongitude(String(params.longitude));
    }

    if (params.address) {
      setServiceAddress(String(params.address));
    }
  }, [params.latitude, params.longitude, params.address]);

  const helperId = params.helper_id as string;
  const subcategoryId = params.subcategory_id as string;
  const helperName = params.helperName as string;

  const handleFocus = (field: "address" | "instructions") => {
    setIsFocused((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: "address" | "instructions") => {
    setIsFocused((prev) => ({ ...prev, [field]: false }));
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatTime12 = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBookingDate(selectedDate);
    }
  };

  const onStartTimeChange = (_event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  const onEndTimeChange = (_event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const calculateDuration = () => {
    if (startTime && endTime) {
      const diffMs = endTime.getTime() - startTime.getTime();
      const diffMins = Math.round(diffMs / 60000);
      if (diffMins > 0) {
        return diffMins;
      }
    }
    return null;
  };

  const calculatedDuration = calculateDuration();

  async function handleCreateBooking() {
    if (!token) {
      Alert.alert("Error", "You are not logged in");
      return;
    }

    if (
      !helperId ||
      !subcategoryId ||
      !bookingDate ||
      !startTime ||
      !serviceAddress.trim() ||
      !latitude ||
      !longitude
    ) {
      Alert.alert(
        "Error",
        "Please fill all required fields and select location on map",
      );
      return;
    }

    try {
      setLoading(true);

      const formattedDate = formatDate(bookingDate);
      const formattedStartTime = formatTime(startTime);
      const formattedEndTime = endTime ? formatTime(endTime) : undefined;

      const res = await createBooking(
        {
          helper_id: helperId,
          subcategory_id: subcategoryId,
          booking_date: formattedDate,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          duration_minutes: durationMinutes
            ? Number(durationMinutes)
            : calculatedDuration || undefined,
          service_address: serviceAddress.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
          special_instructions: specialInstructions.trim() || undefined,
        },
        token,
      );

      if (res?.ok && res?.booking?.id) {
        router.push(`/payment/${res.booking.id}`);
      } else {
        Alert.alert(
          "Error",
          res?.message ||
            res?.detail ||
            res?.code ||
            "Failed to create booking",
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
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
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={28}
                  color="#FE8B4C"
                />
              </View>
              <View className="ml-4">
                <Text className="text-2xl font-bold text-gray-800">
                  Create Booking
                </Text>
                <Text className="text-gray-500 text-sm mt-1">
                  {helperName
                    ? `Booking with ${helperName}`
                    : "Schedule your service"}
                </Text>
              </View>
            </View>
          </View>

          <View className="px-5 pt-6">
            {/* Booking Date */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">
                Booking Date *
              </Text>
              <TouchableOpacity
                className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3"
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color="#FE8B4C" />
                <Text className="flex-1 ml-3 text-gray-800">
                  {formatDate(bookingDate)}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#FE8B4C" />
              </TouchableOpacity>
            </View>

            {/* Start Time */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">
                Start Time *
              </Text>
              <TouchableOpacity
                className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3"
                onPress={() => setShowStartTimePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={20} color="#FE8B4C" />
                <Text className="flex-1 ml-3 text-gray-800">
                  {formatTime12(startTime)}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#FE8B4C" />
              </TouchableOpacity>
            </View>

            {/* End Time */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">
                End Time (Optional)
              </Text>
              <TouchableOpacity
                className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3"
                onPress={() => setShowEndTimePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={20} color="#FE8B4C" />
                <Text className="flex-1 ml-3 text-gray-800">
                  {endTime ? formatTime12(endTime) : "Not set"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#FE8B4C" />
              </TouchableOpacity>
            </View>

            {/* Duration */}
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">
                Duration (minutes)
              </Text>
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <View className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <Ionicons
                      name="hourglass-outline"
                      size={20}
                      color="#9ca3af"
                    />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800"
                      placeholder="Optional"
                      placeholderTextColor="#9ca3af"
                      value={durationMinutes}
                      onChangeText={setDurationMinutes}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {calculatedDuration && !durationMinutes && (
                  <View className="bg-[#FEF3E8] rounded-xl px-3 py-3">
                    <Text className="text-[#FE8B4C] text-sm font-medium">
                      Auto: {calculatedDuration} min
                    </Text>
                  </View>
                )}
              </View>

              {calculatedDuration && !durationMinutes && (
                <Text className="text-xs text-gray-400 mt-1 ml-1">
                  Calculated from start and end time
                </Text>
              )}
            </View>

            {/* Location Map Button */}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/select-location",
                  params: {
                    helper_id: helperId,
                    subcategory_id: subcategoryId,
                    helperName: helperName,
                  },
                })
              }
              className="bg-[#FEF3E8] rounded-xl py-3 px-4 mt-3 flex-row items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="map-outline" size={20} color="#FE8B4C" />
              <Text className="text-[#FE8B4C] font-semibold ml-2">
                {latitude && longitude
                  ? "Change Location on Map"
                  : "Select Location on Map"}
              </Text>
            </TouchableOpacity>

            {/* Location Selected Status */}
            {latitude && longitude ? (
              <View className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
                <View className="flex-row items-start">
                  <Ionicons
                    name="location"
                    size={18}
                    color="#16a34a"
                    style={{ marginTop: 2 }}
                  />
                  <View className="ml-2 flex-1">
                    <Text className="text-green-700 font-semibold text-sm">
                      Location selected
                    </Text>
                    <Text className="text-gray-700 text-sm mt-1">
                      {serviceAddress || "Selected location"}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      {latitude}, {longitude}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text className="text-gray-400 text-sm mt-2 text-center">
                No map location selected yet
              </Text>
            )}

            {/* Service Address */}
            <View className="mb-5 mt-5">
              <Text className="text-gray-700 font-semibold mb-2">
                Service Address *
              </Text>
              <View
                className={`flex-row items-center rounded-xl border px-4 ${
                  isFocused.address
                    ? "border-[#FE8B4C] bg-[#FEF3E8] border-2"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={isFocused.address ? "#FE8B4C" : "#9ca3af"}
                />
                <TextInput
                  className="flex-1 py-3 ml-3 text-gray-800"
                  placeholder="Enter your full address"
                  placeholderTextColor="#9ca3af"
                  value={serviceAddress}
                  onChangeText={setServiceAddress}
                  onFocus={() => handleFocus("address")}
                  onBlur={() => handleBlur("address")}
                />
              </View>
              <Text className="text-xs text-gray-400 mt-1 ml-1">
                This will auto-fill when you select a location from the map
              </Text>
            </View>

            {/* Special Instructions */}
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2">
                Special Instructions
              </Text>
              <View
                className={`rounded-xl border px-4 ${
                  isFocused.instructions
                    ? "border-[#FE8B4C] bg-[#FEF3E8] border-2"
                    : "border-gray-200 bg-white"
                }`}
              >
                <TextInput
                  className="py-3 text-gray-800"
                  placeholder="Any special requests or notes for the helper..."
                  placeholderTextColor="#9ca3af"
                  value={specialInstructions}
                  onChangeText={setSpecialInstructions}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  onFocus={() => handleFocus("instructions")}
                  onBlur={() => handleBlur("instructions")}
                />
              </View>
            </View>

            {/* Booking Summary */}
            <View className="bg-[#FEF3E8] rounded-2xl p-4 mb-6">
              <Text className="text-sm font-bold text-gray-800 mb-3">
                Booking Summary
              </Text>

              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Helper</Text>
                  <Text className="text-xs font-medium text-gray-800">
                    {helperName || "Selected Helper"}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Date</Text>
                  <Text className="text-xs font-medium text-gray-800">
                    {formatDate(bookingDate)}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Start Time</Text>
                  <Text className="text-xs font-medium text-gray-800">
                    {formatTime12(startTime)}
                  </Text>
                </View>

                {endTime && (
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-600">End Time</Text>
                    <Text className="text-xs font-medium text-gray-800">
                      {formatTime12(endTime)}
                    </Text>
                  </View>
                )}

                {(durationMinutes || calculatedDuration) && (
                  <View className="flex-row justify-between mt-2 pt-2 border-t border-[#FDD867]/50">
                    <Text className="text-xs text-gray-600">Duration</Text>
                    <Text className="text-xs font-medium text-[#FE8B4C]">
                      {durationMinutes
                        ? `${durationMinutes} minutes`
                        : `${calculatedDuration} minutes (auto)`}
                    </Text>
                  </View>
                )}

                {serviceAddress ? (
                  <View className="flex-row justify-between mt-2 pt-2 border-t border-[#FDD867]/50">
                    <Text className="text-xs text-gray-600">Location</Text>
                    <Text className="text-xs font-medium text-gray-800 flex-1 text-right ml-2">
                      {serviceAddress}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Create Booking Button */}
            <TouchableOpacity
              onPress={handleCreateBooking}
              disabled={loading}
              activeOpacity={0.8}
              className="bg-[#FE4D01] rounded-xl py-4 items-center justify-center shadow-md"
              style={{
                opacity: loading ? 0.7 : 1,
                shadowColor: "#FE4D01",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Create Booking
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Info Note */}
            <View className="mt-6 mb-4">
              <View className="flex-row items-center justify-center">
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#9ca3af"
                />
                <Text className="text-gray-400 text-xs ml-1">
                  You'll be redirected to payment after booking creation
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={bookingDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
          minimumDate={new Date()}
          textColor={Platform.OS === "ios" ? "#FE8B4C" : undefined}
          accentColor="#FE8B4C"
        />
      )}

      {/* Start Time Picker */}
      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onStartTimeChange}
          is24Hour={false}
          textColor={Platform.OS === "ios" ? "#FE8B4C" : undefined}
          accentColor="#FE8B4C"
          themeVariant="light"
        />
      )}

      {/* End Time Picker */}
      {showEndTimePicker && (
        <DateTimePicker
          value={endTime || new Date()}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onEndTimeChange}
          is24Hour={false}
          textColor={Platform.OS === "ios" ? "#FE8B4C" : undefined}
          accentColor="#FE8B4C"
          themeVariant="light"
        />
      )}
    </SafeAreaView>
  );
}
