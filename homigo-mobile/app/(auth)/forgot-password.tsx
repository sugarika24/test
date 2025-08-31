import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function handleForgotPassword() {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email);
      Alert.alert(
        "✅ OTP Sent!",
        "We've sent a password reset OTP to your email address. Please check your inbox.",
        [
          {
            text: "OK",
            onPress: () => {
              router.push({
                pathname: "/(auth)/reset-password",
                params: { email },
              });
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to send OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="flex-1"
          >
            {/* Header Section with Gradient */}
            <LinearGradient
              colors={["#FDD867", "#FE4D01", "#FD8B01"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-b-[40px] px-6 pt-12 pb-8"
              style={{
                shadowColor: "#FE4D01",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <Animated.View
                style={{ transform: [{ scale: scaleAnim }] }}
                className="items-center"
              >
                <View className="w-20 h-20 bg-white rounded-2xl items-center justify-center mb-4 shadow-lg">
                  <Text className="text-4xl">🔐</Text>
                </View>
                <Text className="text-3xl font-bold text-white mb-2">
                  Forgot Password?
                </Text>
                <Text className="text-white/90 text-center text-sm">
                  Don't worry! We'll help you reset it
                </Text>
              </Animated.View>
            </LinearGradient>

            {/* Form Section */}
            <View className="flex-1 px-6 pt-8">
              {/* Info Card */}
              <View className="mb-6 bg-[#FDD867]/10 rounded-2xl p-4 border border-[#FDD867]/30">
                <View className="flex-row items-start">
                  <Text className="text-2xl mr-3">📧</Text>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold mb-1">
                      Reset Password Instructions
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Enter your registered email address and we'll send you an
                      OTP to reset your password.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Welcome Text */}
              <View className="mb-6">
                <Text className="text-2xl font-bold text-gray-800 mb-2">
                  Reset Your Password
                </Text>
                <Text className="text-gray-500 text-sm">
                  We'll send a verification code to your email
                </Text>
              </View>

              {/* Email Input */}
              <View className="mb-6">
                <Text
                  className={`text-sm font-medium mb-2 ml-1 ${
                    emailFocused || email ? "text-[#FE4D01]" : "text-gray-400"
                  }`}
                >
                  Email Address
                </Text>
                <View
                  className={`flex-row items-center bg-gray-50 rounded-xl border px-4 ${
                    emailFocused
                      ? "border-[#FE4D01] border-2 bg-white"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <Text
                    className={`text-lg mr-3 ${
                      emailFocused ? "text-[#FE4D01]" : "text-gray-400"
                    }`}
                  >
                    ✉️
                  </Text>
                  <TextInput
                    className="flex-1 py-4 text-gray-800 text-base"
                    placeholder={
                      !emailFocused && !email ? "your@email.com" : ""
                    }
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                  {email.length > 0 && (
                    <TouchableOpacity onPress={() => setEmail("")}>
                      <Text className="text-gray-400 text-lg">✖️</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text className="text-xs text-gray-400 mt-2 ml-1">
                  Enter the email you used to register
                </Text>
              </View>

              {/* Send OTP Button */}
              <TouchableOpacity
                className={`bg-[#FE4D01] rounded-xl py-4 mb-4 overflow-hidden ${
                  loading ? "opacity-70" : ""
                }`}
                onPress={handleForgotPassword}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#FE4D01", "#FD8B01"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="absolute inset-0"
                />
                {loading ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="white" />
                    <Text className="text-white text-center font-bold ml-2">
                      Sending OTP...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white text-center font-bold text-lg">
                    Send Reset OTP
                  </Text>
                )}
              </TouchableOpacity>

              {/* Additional Info */}
              <View className="mb-6 bg-gray-50 rounded-xl p-4">
                <Text className="text-gray-600 text-sm text-center">
                  ⏱️ OTP will expire in 10 minutes
                </Text>
              </View>

              {/* Back to Login Link */}
              <View className="flex-row justify-center">
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/login")}
                  className="flex-row items-center"
                >
                  <Text className="text-gray-500 text-base mr-1">←</Text>
                  <Text className="text-gray-500 text-base">Back to</Text>
                  <Text className="text-[#FE4D01] font-bold ml-1">Sign In</Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View className="mt-12 items-center pb-4">
                <Text className="text-gray-400 text-[10px] text-center">
                  Need help?{" "}
                  <Text className="text-[#FE4D01] font-medium">
                    Contact Support
                  </Text>
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
