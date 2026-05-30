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
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }
    try {
      setLoading(true);
      await signIn({ email, password });
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid credentials");
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          bounces={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="flex-1"
          >
            {/* Header */}
            <LinearGradient
              colors={["#FEF3E8", "#FEE2D6", "#FFE0D0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-b-[40px] px-6 pt-12 pb-12"
            >
              <Animated.View
                style={{ transform: [{ scale: scaleAnim }] }}
                className="items-center"
              >
                <View className="w-24 h-24 bg-white rounded-2xl items-center justify-center mb-4 shadow-xl">
                  <MaterialCommunityIcons
                    name="home-outline"
                    size={48}
                    color="#FE8B4C"
                  />
                </View>
                <Text className="text-4xl font-bold text-[#FE8B4C] mb-2">
                  Homigo
                </Text>
                <Text className="text-[#FE8B4C]/80 text-center text-sm max-w-[250px]">
                  Find professional services in your area
                </Text>
              </Animated.View>
            </LinearGradient>

            {/* Form */}
            <View className="flex-1 px-6 pt-6 pb-8">
              <View className="mb-6">
                <Text className="text-3xl font-bold text-[#FE8B4C] mb-2">
                  Welcome Back!
                </Text>
                <Text className="text-gray-500 text-base">
                  Sign in to access your account
                </Text>
              </View>

              <View className="space-y-5">
                {/* Email Input */}
                <View>
                  <Text
                    className={`text-sm font-medium mb-2 ml-1 ${emailFocused || email ? "text-[#FE8B4C]" : "text-gray-400"}`}
                  >
                    Email Address
                  </Text>
                  <View
                    className={`flex-row items-center rounded-2xl border px-4 ${emailFocused ? "border-[#FE8B4C] bg-[#FEF3E8] border-2" : "border-gray-200 bg-gray-50"}`}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={emailFocused ? "#FE8B4C" : "#9ca3af"}
                    />
                    <TextInput
                      className="flex-1 py-4 ml-3 text-gray-800 text-base"
                      placeholder="your@email.com"
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
                      <Pressable onPress={() => setEmail("")}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#9ca3af"
                        />
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Password Input */}
                <View>
                  <Text
                    className={`text-sm font-medium mb-2 ml-1 ${passwordFocused || password ? "text-[#FE8B4C]" : "text-gray-400"}`}
                  >
                    Password
                  </Text>
                  <View
                    className={`flex-row items-center rounded-2xl border px-4 ${passwordFocused ? "border-[#FE8B4C] bg-[#FEF3E8] border-2" : "border-gray-200 bg-gray-50"}`}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={passwordFocused ? "#FE8B4C" : "#9ca3af"}
                    />
                    <TextInput
                      className="flex-1 py-4 ml-3 text-gray-800 text-base"
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      className="p-1"
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#9ca3af"
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/forgot-password")}
                  className="self-end mt-1"
                >
                  <Text className="text-[#FE8B4C] text-sm font-semibold">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* SIGN IN BUTTON - FIXED WITH ORIGINAL ORANGE */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                  className="mt-4 bg-[#FE4D01] rounded-2xl py-4 items-center justify-center shadow-md"
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
                    <Text className="text-white font-bold text-lg">
                      Sign In
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View className="flex-row items-center my-4">
                  <View className="flex-1 h-px bg-gray-200" />
                  <Text className="mx-4 text-gray-400 text-sm font-medium">
                    or continue with
                  </Text>
                  <View className="flex-1 h-px bg-gray-200" />
                </View>

                {/* Social Login */}
                <View className="flex-row space-x-4">
                  <TouchableOpacity className="flex-1 flex-row items-center justify-center bg-white border border-gray-200 rounded-2xl py-3 shadow-sm">
                    <Ionicons name="logo-google" size={20} color="#DB4437" />
                    <Text className="text-gray-700 font-semibold ml-2">
                      Google
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Register Link */}
                <View className="flex-row justify-center mt-6">
                  <Text className="text-gray-500">
                    {"Don't have an account? "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/register")}
                  >
                    <Text className="text-[#FE8B4C] font-bold text-base">
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Features */}
              <View className="mt-8 mb-4">
                <View className="flex-row justify-between space-x-3">
                  <View className="flex-1 items-center bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
                    <View className="w-12 h-12 bg-[#FEF3E8] rounded-full items-center justify-center mb-2">
                      <Ionicons
                        name="calendar-outline"
                        size={24}
                        color="#FE8B4C"
                      />
                    </View>
                    <Text className="text-xs font-semibold text-gray-700 text-center">
                      Easy Booking
                    </Text>
                    <Text className="text-[10px] text-gray-400 text-center mt-1">
                      Book in seconds
                    </Text>
                  </View>
                  <View className="flex-1 items-center bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
                    <View className="w-12 h-12 bg-[#FEF3E8] rounded-full items-center justify-center mb-2">
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={24}
                        color="#FE8B4C"
                      />
                    </View>
                    <Text className="text-xs font-semibold text-gray-700 text-center">
                      Secure Payment
                    </Text>
                    <Text className="text-[10px] text-gray-400 text-center mt-1">
                      100% protected
                    </Text>
                  </View>
                  <View className="flex-1 items-center bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
                    <View className="w-12 h-12 bg-[#FEF3E8] rounded-full items-center justify-center mb-2">
                      <Ionicons name="star-outline" size={24} color="#FE8B4C" />
                    </View>
                    <Text className="text-xs font-semibold text-gray-700 text-center">
                      Vetted Pros
                    </Text>
                    <Text className="text-[10px] text-gray-400 text-center mt-1">
                      Trusted experts
                    </Text>
                  </View>
                </View>
              </View>

              {/* Footer */}
              <View className="items-center">
                <Text className="text-gray-400 text-[10px] text-center">
                  By continuing, you agree to our{" "}
                  <Text className="text-[#FE8B4C] font-medium">
                    Terms of Service
                  </Text>{" "}
                  and{" "}
                  <Text className="text-[#FE8B4C] font-medium">
                    Privacy Policy
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
