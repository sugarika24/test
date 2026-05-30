import { API_BASE_URL } from "./api";
import { getToken } from "../utils/storage";

export async function initiateEsewaPayment(
  bookingId: string,
  successUrl?: string,
  failureUrl?: string
) {
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/payments/esewa/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookingId, successUrl, failureUrl }),
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Failed to initiate payment");
  }

  return data;
}

export async function requestRefund(
  bookingId: number | string,
  refundReason: string
) {
  const token = await getToken();

  const response = await fetch(
    `${API_BASE_URL}/payments/refund/request/${bookingId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        refund_reason: refundReason,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Failed to request refund");
  }

  return data;
}

export async function getAdminRefundRequests() {
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/payments/refund/admin/requests`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Failed to fetch refund requests");
  }

  return data;
}

export async function updateRefundStatus(
  bookingId: number | string,
  refundStatus: "REFUND_APPROVED" | "REFUND_REJECTED" | "REFUNDED",
  adminNote: string
) {
  const token = await getToken();

  const response = await fetch(
    `${API_BASE_URL}/payments/refund/admin/${bookingId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        refund_status: refundStatus,
        refund_admin_note: adminNote,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Failed to update refund status");
  }

  return data;
}