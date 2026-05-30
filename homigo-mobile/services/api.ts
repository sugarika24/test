import { router } from "expo-router";
import { clearAuth, getToken } from "../utils/storage";

export const API_BASE_URL = "http://192.168.1.9:5000/api";
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
  timeoutMs: number = DEFAULT_REQUEST_TIMEOUT_MS
) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    let data: any = null;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text || "Server returned a non-JSON response");
    }

    if (!response.ok) {
      const error = new Error(
        data?.message || `HTTP Error ${response.status}: ${response.statusText}`
      ) as Error & { status?: number };
      error.status = response.status;

      if (response.status === 401) {
        await clearAuth();
        router.replace("/(auth)/login");
      }

      throw error;
    }

    return data;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }

    console.error("API Request Error:", error?.message || error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// GET
export async function apiGet(endpoint: string) {
  const token = await getToken();
  return apiRequest(endpoint, { method: "GET" }, token || undefined);
}

// POST
export async function apiPost(endpoint: string, body?: any) {
  const token = await getToken();

  return apiRequest(
    endpoint,
    {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
    token || undefined
  );
}

// PUT
export async function apiPut(endpoint: string, body?: any) {
  const token = await getToken();

  return apiRequest(
    endpoint,
    {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
    token || undefined
  );
}

// PATCH
export async function apiPatch(endpoint: string, body?: any) {
  const token = await getToken();

  return apiRequest(
    endpoint,
    {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
    token || undefined
  );
}

// DELETE
export async function apiDelete(endpoint: string) {
  const token = await getToken();
  return apiRequest(endpoint, { method: "DELETE" }, token || undefined);
}