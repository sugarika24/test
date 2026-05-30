import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// Responsive scale helpers
const scale = (size: number) => (width / 390) * size;
const vs = (size: number) => (height / 844) * size;

const slides = [
  {
    id: "1",
    tag: "HOME SERVICES",
    title: "Find Trusted Home Services",
    description:
      "Browse verified helpers for cleaning, plumbing, electrical work, and other household services.",
    photo:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=700&q=80",
  },
  {
    id: "2",
    tag: "EASY BOOKING",
    title: "Book and Track Easily",
    description:
      "Choose your service, select date and time, add your location, and track booking progress.",
    photo:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=700&q=80",
  },
  {
    id: "3",
    tag: "SECURE PAYMENTS",
    title: "Pay, Chat, and Review",
    description:
      "Chat with helpers, pay securely, and share reviews after your service is completed.",
    photo:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=700&q=80",
  },
];

// Brand colors
const PRIMARY = "#EA4C1E";
const PRIMARY_LIGHT = "#FF6B35";
const PRIMARY_DARK = "#D93A0B";
const PRIMARY_PALE = "#FDCDB8";

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  async function finishOnboarding() {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/(auth)/login");
  }

  const handleNext = () => {
    if (currentIndex === slides.length - 1) {
      finishOnboarding();
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => finishOnboarding();
  const isLast = currentIndex === slides.length - 1;

  const renderItem = ({ item }: { item: (typeof slides)[0] }) => (
    <View style={[styles.slide, { width }]}>
      {/* Photo Card */}
      <View style={styles.photoCard}>
        <Image
          source={{ uri: item.photo }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(255,248,245,0.55)", "#FFF2EB"]}
          start={{ x: 0, y: 0.35 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Tag */}
      <View style={styles.tag}>
        <View style={styles.tagDot} />
        <Text style={styles.tagText}>{item.tag}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{item.title}</Text>

      {/* Description */}
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderDots = () => {
    const dotPosition = Animated.divide(scrollX, width);
    return (
      <View style={styles.dotsRow}>
        {slides.map((_, i) => {
          const dotWidth = dotPosition.interpolate({
            inputRange: [i - 1, i, i + 1],
            outputRange: [8, 28, 8],
            extrapolate: "clamp",
          });
          const opacity = dotPosition.interpolate({
            inputRange: [i - 1, i, i + 1],
            outputRange: [0.4, 1, 0.4],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: i === currentIndex ? PRIMARY : PRIMARY_PALE,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Warm background */}
      <LinearGradient
        colors={["#FFFFFF", "#FFF8F5", "#FFF2EB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Blobs */}
      <View
        style={[
          styles.blob,
          {
            width: scale(220),
            height: scale(220),
            top: -scale(60),
            right: -scale(60),
            backgroundColor: PRIMARY_LIGHT,
            opacity: 0.08,
          },
        ]}
      />
      <View
        style={[
          styles.blob,
          {
            width: scale(150),
            height: scale(150),
            top: vs(160),
            left: -scale(60),
            backgroundColor: PRIMARY,
            opacity: 0.05,
          },
        ]}
      />
      <View
        style={[
          styles.blob,
          {
            width: scale(180),
            height: scale(180),
            bottom: -scale(30),
            right: scale(20),
            backgroundColor: PRIMARY_LIGHT,
            opacity: 0.06,
          },
        ]}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <LinearGradient
              colors={[PRIMARY_LIGHT, PRIMARY]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandIcon}
            >
              <Ionicons name="home" size={scale(20)} color="#fff" />
            </LinearGradient>
            <Text style={styles.brandName}>
              homi<Text style={{ color: PRIMARY }}>go</Text>
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.7}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          keyExtractor={(item) => item.id}
        />

        {/* Bottom */}
        <View style={styles.bottom}>
          {renderDots()}

          <Text style={styles.stepLabel}>
            {currentIndex + 1} / {slides.length}
          </Text>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={styles.ctaWrapper}
          >
            <LinearGradient
              colors={[PRIMARY_LIGHT, PRIMARY, PRIMARY_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.2)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.ctaLabel}>
                {isLast ? "Get Started" : "Continue"}
              </Text>
              <View style={styles.ctaArrow}>
                <Ionicons
                  name={isLast ? "checkmark" : "arrow-forward"}
                  size={scale(18)}
                  color={PRIMARY}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign in row */}
          <View style={styles.signinRow}>
            <Text style={styles.signinMuted}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/login")}
              activeOpacity={0.7}
            >
              <Text style={styles.signinLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  blob: {
    position: "absolute",
    borderRadius: 999,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingTop: vs(8),
    paddingBottom: vs(12),
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  brandIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: scale(20),
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  skipBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    backgroundColor: "rgba(234,76,30,0.08)",
  },
  skipText: {
    fontSize: scale(14),
    fontWeight: "600",
    color: PRIMARY,
  },

  // Slide
  slide: {
    alignItems: "center",
    paddingHorizontal: scale(20),
  },
  photoCard: {
    width: "100%",
    height: vs(300),
    borderRadius: scale(24),
    overflow: "hidden",
    marginBottom: vs(20),
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    paddingHorizontal: scale(14),
    paddingVertical: scale(7),
    borderRadius: scale(30),
    borderWidth: 1,
    borderColor: "rgba(194,65,12,0.2)",
    backgroundColor: "rgba(194,65,12,0.07)",
    marginBottom: vs(12),
  },
  tagDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
    backgroundColor: "#C2410C",
  },
  tagText: {
    fontSize: scale(11),
    fontWeight: "700",
    letterSpacing: 1,
    color: "#C2410C",
  },
  title: {
    fontSize: scale(24),
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    lineHeight: scale(33),
    marginBottom: vs(10),
    letterSpacing: -0.5,
  },
  description: {
    fontSize: scale(15),
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: scale(24),
    paddingHorizontal: scale(8),
  },

  // Bottom
  bottom: {
    paddingHorizontal: scale(24),
    paddingBottom: vs(20),
    paddingTop: vs(8),
    gap: vs(12),
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scale(6),
  },
  dot: {
    height: scale(5),
    borderRadius: scale(5),
  },
  stepLabel: {
    textAlign: "center",
    fontSize: scale(12),
    fontWeight: "600",
    letterSpacing: 2,
    color: PRIMARY_PALE,
  },

  // CTA
  ctaWrapper: {
    borderRadius: scale(18),
    overflow: "hidden",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.35,
    shadowRadius: scale(16),
    elevation: 8,
  },
  ctaGradient: {
    height: vs(60),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(12),
    borderRadius: scale(18),
  },
  ctaLabel: {
    color: "#fff",
    fontSize: scale(17),
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  ctaArrow: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Sign in
  signinRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signinMuted: {
    fontSize: scale(14),
    color: "#9CA3AF",
  },
  signinLink: {
    fontSize: scale(14),
    fontWeight: "700",
    color: PRIMARY,
  },
});
