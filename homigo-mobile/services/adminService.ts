import { apiRequest } from "./api";

export async function getPendingHelpers(token: string) {
  return apiRequest("/admin/helpers/pending", { method: "GET" }, token);
}

export async function getAllHelpersForAdmin(token: string) {
  return apiRequest("/admin/helpers", { method: "GET" }, token);
}

export async function approveHelper(helperUserId: number | string, token: string) {
  return apiRequest(
    `/admin/helpers/${helperUserId}/approve`,
    { method: "PUT" },
    token
  );
}

export async function rejectHelper(
  helperUserId: number | string,
  token: string,
  rejection_reason?: string
) {
  return apiRequest(
    `/admin/helpers/${helperUserId}/reject`,
    {
      method: "PUT",
      body: JSON.stringify({ rejection_reason }),
    },
    token
  );
}

export async function suspendHelper(helperUserId: number | string, token: string) {
  return apiRequest(
    `/admin/helpers/${helperUserId}/suspend`,
    { method: "PUT" },
    token
  );
}

export async function releaseHelperPayment(
  bookingId: number | string,
  token: string
) {
  return apiRequest(
    `/admin/bookings/${bookingId}/release-payment`,
    { method: "PUT" },
    token
  );
}

export async function getCompletedBookingsForAdmin(
  token: string,
  payoutStatus?: "PENDING" | "RELEASED"
) {
  const query = payoutStatus ? `?payout_status=${payoutStatus}` : "";
  return apiRequest(`/admin/bookings/completed${query}`, { method: "GET" }, token);
}

export async function getAllUsersForAdmin(token: string) {
  return apiRequest("/admin/users", { method: "GET" }, token);
}