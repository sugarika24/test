import React, { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { WebView } from "react-native-webview";
import { router, useLocalSearchParams } from "expo-router";
import { verifyEsewaPayment } from "../../services/paymentService";
import { useAuth } from "../../context/AuthContext";

export default function EsewaPaymentScreen() {
  const { bookingId, formUrl, fields } = useLocalSearchParams();
  const { token } = useAuth();

  const webViewRef = useRef<WebView>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [alreadyHandled, setAlreadyHandled] = useState(false);

  const parsedFields = useMemo(() => {
    try {
      return JSON.parse(String(fields || "{}"));
    } catch {
      return {};
    }
  }, [fields]);

  const postBody = useMemo(() => {
    return Object.entries(parsedFields)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      )
      .join("&");
  }, [parsedFields]);

  const handleVerifyPayment = async () => {
    if (isVerifying || alreadyHandled) return;

    if (!token) {
      Alert.alert("Error", "You are not logged in");
      return;
    }

    try {
      setIsVerifying(true);
      setAlreadyHandled(true);

      const response = await verifyEsewaPayment(
        String(bookingId),
        token as string,
      );

      if (response?.ok) {
        router.replace("/(tabs)/bookings");
        return;
      }

      Alert.alert(
        "Verification Failed",
        response?.message || "Payment could not be verified.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/bookings"),
          },
        ],
      );
    } catch (error: any) {
      console.log("eSewa verify error:", error);

      Alert.alert("Error", error?.message || "Payment verification failed.", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/bookings"),
        },
      ]);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFailedPayment = () => {
    if (alreadyHandled) return;

    setAlreadyHandled(true);

    Alert.alert("Payment Failed", "Payment was cancelled or failed.", [
      {
        text: "OK",
        onPress: () => router.replace("/(tabs)/bookings"),
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        source={{
          uri: String(formUrl),
          method: "POST",
          body: postBody,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }}
        renderLoading={() => (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" />
          </View>
        )}
        onNavigationStateChange={(navState) => {
          const url = navState.url || "";
          console.log("eSewa URL:", url);
        }}
        onLoadEnd={(event) => {
          const url = event.nativeEvent.url || "";

          if (url.includes("/api/payments/esewa/success")) {
            handleVerifyPayment();
          }

          if (url.includes("/api/payments/esewa/failure")) {
            handleFailedPayment();
          }
        }}
      />
    </View>
  );
}
