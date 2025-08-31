import { apiRequest, API_BASE_URL } from "./api";
import { UpdateHelperProfilePayload, UpdateProfilePayload } from "../types/profile";

export async function getMyProfile(token: string) {
  return apiRequest("/profile", { method: "GET" }, token);
}

export async function updateMyProfile(
  payload: UpdateProfilePayload,
  token: string
) {
  return apiRequest(
    "/profile",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function uploadMyProfilePhoto(
  file: { uri: string; name: string; type: string },
  token: string
) {
  const formData = new FormData();

  formData.append("profile_photo", {
  uri: file.uri,
  name: file.name,
  type: file.type,
} as any);

  return apiRequest(
    "/profile/photo",
    {
      method: "PUT",
      body: formData,
    },
    token
  );
}

export async function deactivateMyAccount(token: string) {
  return apiRequest(
    "/profile/deactivate",
    {
      method: "PUT",
    },
    token
  );
}

export async function deleteMyAccount(token: string) {
  return apiRequest(
    "/profile",
    {
      method: "DELETE",
    },
    token
  );
}

export async function getMyHelperProfile(token: string) {
  return apiRequest("/profile/helper", { method: "GET" }, token);
}

export async function updateMyHelperProfile(
  payload: UpdateHelperProfilePayload,
  token: string
) {
  return apiRequest(
    "/profile/helper",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token
  );
}

export function getFullImageUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  const base = API_BASE_URL.replace("/api", "");
  return `${base}${path}`;
}