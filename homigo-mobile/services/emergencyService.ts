import { apiRequest } from "./api";

export async function createEmergencyAlert(
  token: string,
  data: {
    booking_id: number;
    emergency_type: string;
    message?: string;
    latitude?: number;
    longitude?: number;
  }
) {
  return apiRequest("/emergency-alerts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function getAdminEmergencyAlerts(token: string) {
  return apiRequest("/emergency-alerts/admin", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateEmergencyAlertStatus(
  token: string,
  alertId: number,
  data: {
    status: "ACTIVE" | "ACKNOWLEDGED" | "ESCALATED" | "RESOLVED" | "FALSE_ALARM";
    admin_note?: string;
  }
) {
  return apiRequest(`/emergency-alerts/admin/${alertId}/status`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}