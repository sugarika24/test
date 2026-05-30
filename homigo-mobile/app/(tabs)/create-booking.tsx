import { useEffect, useState } from "react";
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
import {
  createBooking,
  rescheduleBooking,
} from "../../services/bookingService";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function CreateBookingScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams();

  const isRescheduleMode = params.mode === "reschedule";
  const bookingId = params.booking_id as string;

  const helperId = params.helper_id as string;
  const subcategoryId = params.subcategory_id as string;
  const helperName = params.helperName as string;

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
    if (params.latitude) setLatitude(String(params.latitude));
    if (params.longitude) setLongitude(String(params.longitude));
    if (params.address) setServiceAddress(String(params.address));

    if (params.booking_date) {
      const existingDate = new Date(String(params.booking_date));
      if (!Number.isNaN(existingDate.getTime())) {
        setBookingDate(existingDate);
      }
    }

    if (params.start_time) {
      const date = new Date();
      const [hour, minute] = String(params.start_time).split(":");
      date.setHours(Number(hour) || 9, Number(minute) || 0, 0);
      setStartTime(date);
    }

    if (params.end_time) {
      const date = new Date();
      const [hour, minute] = String(params.end_time).split(":");
      date.setHours(Number(hour) || 10, Number(minute) || 0, 0);
      setEndTime(date);
    }
  }, []);

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
    if (selectedDate) setBookingDate(selectedDate);
  };

  const onStartTimeChange = (_event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) setStartTime(selectedTime);
  };

  const onEndTimeChange = (_event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) setEndTime(selectedTime);
  };

  const calculateDuration = () => {
    if (!startTime || !endTime) return null;

    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMins = Math.round(diffMs / 60000);

    return diffMins > 0 ? diffMins : null;
  };

  const calculatedDuration = calculateDuration();

  async function handleSubmitBooking() {
    if (!token) {
      Alert.alert("Error", "You are not logged in");
      return;
    }

    if (!bookingDate || !startTime) {
      Alert.alert("Error", "Please select booking date and start time");
      return;
    }

    if (!isRescheduleMode) {
      if (
        !helperId ||
        !subcategoryId ||
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
    }

    if (isRescheduleMode && !bookingId) {
      Alert.alert("Error", "Booking ID is missing for reschedule");
      return;
    }

    try {
      setLoading(true);

      const formattedDate = formatDate(bookingDate);
      const formattedStartTime = formatTime(startTime);
      const formattedEndTime = endTime ? formatTime(endTime) : undefined;

      if (isRescheduleMode) {
        const res = await rescheduleBooking(bookingId, token, {
          booking_date: formattedDate,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
        });

        Alert.alert(
          "Booking Rescheduled",
          res?.message || "Your booking has been rescheduled successfully.",
          [
            {
              text: "View My Bookings",
              onPress: () => router.replace("/(tabs)/bookings"),
            },
          ],
        );

        return;
      }

      const payload = {
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
      };

      const res = await createBooking(payload, token);

      if (res?.ok && res?.booking?.id) {
        Alert.alert(
          "Booking Created",
          "Your booking request has been submitted successfully. Please wait for the helper to accept it before payment.",
          [
            {
              text: "View My Bookings",
              onPress: () => router.replace("/(tabs)/bookings"),
            },
          ],
        );
      } else {
        Alert.alert(
          "Error",
          res?.message || res?.detail || "Failed to create booking",
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Something went wrong");
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
          <View className="bg-[#FEF3E8] pt-8 pb-6 px-5 border-b border-[#FDD867]/30">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mb-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm"
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
                  {isRescheduleMode ? "Reschedule Booking" : "Create Booking"}
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
            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">
                Booking Date *
              </Text>

              <TouchableOpacity
                className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3"
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#FE8B4C" />
                <Text className="flex-1 ml-3 text-gray-800">
                  {formatDate(bookingDate)}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#FE8B4C" />
              </TouchableOpacity>
            </View>

            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">
                Start Time *
              </Text>

              <TouchableOpacity
                className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3"
                onPress={() => setShowStartTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#FE8B4C" />
                <Text className="flex-1 ml-3 text-gray-800">
                  {formatTime12(startTime)}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#FE8B4C" />
              </TouchableOpacity>
            </View>

            <View className="mb-5">
              <Text className="text-gray-700 font-semibold mb-2">
                End Time Optional
              </Text>

              <TouchableOpacity
                className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3"
                onPress={() => setShowEndTimePicker(true)}
              >
                <Ionicons name="time-outline" size={20} color="#FE8B4C" />
                <Text className="flex-1 ml-3 text-gray-800">
                  {endTime ? formatTime12(endTime) : "Not set"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#FE8B4C" />
              </TouchableOpacity>
            </View>

            {!isRescheduleMode && (
              <>
                <View className="mb-5">
                  <Text className="text-gray-700 font-semibold mb-2">
                    Duration minutes
                  </Text>

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

                  {calculatedDuration && !durationMinutes && (
                    <Text className="text-[#FE8B4C] text-xs mt-2">
                      Auto duration: {calculatedDuration} minutes
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/select-location",
                      params: {
                        helper_id: helperId,
                        subcategory_id: subcategoryId,
                        helperName,
                      },
                    })
                  }
                  className="bg-[#FEF3E8] rounded-xl py-3 px-4 mb-4 flex-row items-center justify-center"
                >
                  <Ionicons name="map-outline" size={20} color="#FE8B4C" />
                  <Text className="text-[#FE8B4C] font-semibold ml-2">
                    {latitude && longitude
                      ? "Change Location on Map"
                      : "Select Location on Map"}
                  </Text>
                </TouchableOpacity>

                <View className="mb-5">
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
                </View>

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
                      placeholder="Any special requests..."
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
              </>
            )}

            <View className="bg-[#FEF3E8] rounded-2xl p-4 mb-6">
              <Text className="text-sm font-bold text-gray-800 mb-3">
                Booking Summary
              </Text>

              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-gray-600">Helper</Text>
                <Text className="text-xs font-medium text-gray-800">
                  {helperName || "Selected Helper"}
                </Text>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-gray-600">Date</Text>
                <Text className="text-xs font-medium text-gray-800">
                  {formatDate(bookingDate)}
                </Text>
              </View>

              <View className="flex-row justify-between mb-2">
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
            </View>

            <TouchableOpacity
              onPress={handleSubmitBooking}
              disabled={loading}
              className="bg-[#FE4D01] rounded-xl py-4 items-center justify-center"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text className="text-white font-semibold text-base ml-2">
                    {isRescheduleMode ? "Submit Reschedule" : "Create Booking"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View className="mt-6 mb-4 flex-row items-center justify-center">
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#9ca3af"
              />
              <Text className="text-gray-400 text-xs ml-1 text-center">
                Payment will be available after the helper accepts your booking.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={bookingDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
          minimumDate={new Date()}
          accentColor="#FE8B4C"
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onStartTimeChange}
          is24Hour={false}
          accentColor="#FE8B4C"
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endTime || new Date()}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onEndTimeChange}
          is24Hour={false}
          accentColor="#FE8B4C"
        />
      )}
    </SafeAreaView>
  );
}
