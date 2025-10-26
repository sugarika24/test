import { apiRequest } from "./api";
import {
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
} from "../types/auth";

export async function loginUser(payload: LoginPayload) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendRegisterEmailOtp(payload: {
  email: string;
  full_name?: string;
}) {
  return apiRequest("/auth/send-register-email-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyRegisterEmailOtp(payload: {
  email: string;
  otp_code: string;
}) {
  return apiRequest("/auth/verify-register-email-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerUser(payload: RegisterPayload) {
  if (payload.role === "HELPER") {
    const formData = new FormData();

    formData.append("full_name", payload.full_name);
    formData.append("email", payload.email);
    formData.append("password", payload.password);
    formData.append("confirm_password", payload.confirm_password);
    formData.append("phone_number", payload.phone_number);
    formData.append("role", payload.role);
    formData.append("id_document_type", payload.id_document_type || "");
    formData.append("id_document_number", payload.id_document_number || "");

    if (payload.id_document) {
      formData.append("id_document", {
        uri: payload.id_document.uri,
        name: payload.id_document.name,
        type: payload.id_document.type,
      } as any);
    }

    return apiRequest("/auth/register", {
      method: "POST",
      body: formData,
    });
  }

  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      full_name: payload.full_name,
      email: payload.email,
      password: payload.password,
      confirm_password: payload.confirm_password,
      phone_number: payload.phone_number,
      role: payload.role,
    }),
  });
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: ResetPasswordPayload) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function changePassword(
  payload: ChangePasswordPayload,
  token: string
) {
  return apiRequest(
    "/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function logoutUser(token: string) {
  return apiRequest(
    "/auth/logout",
    {
      method: "POST",
    },
    token
  );
}