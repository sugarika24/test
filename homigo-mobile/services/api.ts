import { getToken } from "../utils/storage";

export const API_BASE_URL = "http://192.168.16.194:5000/api";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string
) {   
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only JSON if not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Add token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  let data: any;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    const text = await response.text();
    throw new Error(text || "Server returned a non-JSON response");
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

//  GET
export async function apiGet(endpoint: string) {
  const token = await getToken();
  return apiRequest(endpoint, { method: "GET" }, token || undefined);
}

//  POST
export async function apiPost(endpoint: string, body?: any) {
  const token = await getToken();

  return apiRequest(
    endpoint,
    {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    },
    token || undefined
  );
}

//  PUT
export async function apiPut(endpoint: string, body?: any) {
  const token = await getToken();

  return apiRequest(
    endpoint,
    {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    },
    token || undefined
  );
}

//Patch
export async function apiPatch(endpoint: string, data: any = {}) {
  return await apiRequest(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

//  DELETE
export async function apiDelete(endpoint: string) {
  const token = await getToken();
  return apiRequest(endpoint, { method: "DELETE" }, token || undefined);
}