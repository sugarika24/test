import { apiPut, apiRequest } from "./api";
import { CreateBookingPayload } from "../types/booking";

export async function createBooking(
  payload: CreateBookingPayload,
  token: string
) {
  return apiRequest(
    "/bookings",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function getUserBookings(token: string) {
  return apiRequest("/bookings/user", { method: "GET" }, token);
}

export async function getHelperBookings(token: string) {
  return apiRequest("/bookings/helper", { method: "GET" }, token);
}

export async function getBookingById(id: number | string, token: string) {
  return apiRequest(`/bookings/${id}`, { method: "GET" }, token);
}

export async function acceptBooking(id: number | string, token: string) {
  return apiRequest(`/bookings/${id}/accept`, { method: "PUT" }, token);
}

export async function rejectBooking(
  id: number | string,
  token: string,
  rejection_reason?: string
) {
  return apiRequest(
    `/bookings/${id}/reject`,
    {
      method: "PUT",
      body: JSON.stringify({ rejection_reason }),
    },
    token
  );
}

export async function markOnTheWay(id: number | string, token: string) {
  return apiRequest(`/bookings/${id}/on-the-way`, { method: "PUT" }, token);
}

export async function startBooking(id: number | string, token: string) {
  return apiRequest(`/bookings/${id}/start`, { method: "PUT" }, token);
}

export async function completeBooking(
  id: number | string,
  token: string,
  final_amount?: number
) {
  return apiRequest(
    `/bookings/${id}/complete`,
    {
      method: "PUT",
      body: JSON.stringify({ final_amount }),
    },
    token
  );
}

export async function cancelBooking(
  id: number | string,
  token: string,
  cancellation_reason?: string
) {
  return apiRequest(
    `/bookings/${id}/cancel`,
    {
      method: "PUT",
      body: JSON.stringify({ cancellation_reason }),
    },
    token
  );
}

export async function rescheduleBooking(
  id: number | string,
  token: string,
  payload: { booking_date: string; start_time: string; end_time?: string }
) {
  return apiRequest(
    `/bookings/${id}/reschedule`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function updateHelperLiveLocation(
  id: number | string,
  latitude: number,
  longitude: number,
  token: string
) {
  return apiRequest(
    `/bookings/${id}/live-location`,
    {
      method: "POST",
      body: JSON.stringify({ latitude, longitude }),
    },
    token
  );
}

export async function getHelperLiveLocation(
  id: number | string,
  token: string
) {
  return apiRequest(`/bookings/${id}/live-location`, { method: "GET" }, token);
}

export async function payBooking(
  bookingId: string | number,
  payment_method: "COD" | "ONLINE",
  token: string
) {
  return apiRequest(
    `/bookings/${bookingId}/pay`,
    {
      method: "PUT",
      body: JSON.stringify({ payment_method }),
    },
    token
  );
}