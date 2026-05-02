import { apiRequest } from "./api";

export async function initiateEsewaPayment(
  bookingId: string | number,
  token: string
) {
  return apiRequest(
    "/payments/esewa/initiate",
    {
      method: "POST",
      body: JSON.stringify({ bookingId }),
    },
    token
  );
}

export async function verifyEsewaPayment(
  bookingId: string | number,
  token: string
) {
  return apiRequest(
    "/payments/esewa/verify",
    {
      method: "POST",
      body: JSON.stringify({ bookingId }),
    },
    token
  );
}

export async function getBookingPaymentStatus(
  bookingId: string | number,
  token: string
) {
  return apiRequest(`/payments/status/${bookingId}`, { method: "GET" }, token);
}