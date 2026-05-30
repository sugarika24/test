import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  fetchRefundRequests,
  approveRefund,
  rejectRefund,
  markRefunded,
} from "../../services/refundService";

export default function RefundRequestsScreen() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRefunds();
  }, []);

  async function loadRefunds() {
    try {
      const res = await fetchRefundRequests();
      setRefunds(res.refunds || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load refunds");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleApprove(id: number) {
    try {
      await approveRefund(id);
      Alert.alert("Success", "Refund approved");
      loadRefunds();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  }

  async function handleReject(id: number) {
    try {
      await rejectRefund(id);
      Alert.alert("Success", "Refund rejected");
      loadRefunds();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  }

  async function handleRefunded(id: number) {
    try {
      await markRefunded(id);
      Alert.alert("Success", "Refund marked completed");
      loadRefunds();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#FE4D01" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadRefunds();
            }}
          />
        }
      >
        <View className="p-5">
          <Text className="text-2xl font-bold text-[#FE4D01] mb-5">
            Refund Requests
          </Text>

          {refunds.length === 0 ? (
            <Text className="text-gray-500">No refund requests found.</Text>
          ) : (
            refunds.map((item) => (
              <View key={item.id} className="bg-white rounded-2xl p-4 mb-4">
                <Text className="font-bold text-lg">{item.service_name}</Text>

                <Text>Booking #{item.booking_number}</Text>

                <Text>Customer: {item.user_name}</Text>

                <Text>Amount: Rs. {item.final_amount}</Text>

                <Text>Reason:</Text>

                <Text className="text-gray-600 mb-3">{item.refund_reason}</Text>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 bg-green-600 py-3 rounded-xl items-center"
                    onPress={() => handleApprove(item.id)}
                  >
                    <Text className="text-white">Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 bg-red-600 py-3 rounded-xl items-center"
                    onPress={() => handleReject(item.id)}
                  >
                    <Text className="text-white">Reject</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  className="mt-3 bg-blue-600 py-3 rounded-xl items-center"
                  onPress={() => handleRefunded(item.id)}
                >
                  <Text className="text-white">Mark Refunded</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
