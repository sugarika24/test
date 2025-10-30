export type UserRole = "USER" | "HELPER" | "ADMIN";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  phone_number?: string | null;
  profile_photo_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  ok: boolean;
  message: string;
  token: string;
  user: User;
}

export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export interface SendRegisterEmailOtpPayload {
  email: string;
  full_name?: string;
}

export interface VerifyRegisterEmailOtpPayload {
  email: string;
  otp_code: string;
}

// export interface SendRegisterOtpPayload {
//   phone_number: string;
// }

// export interface VerifyRegisterOtpPayload {
//   phone_number: string;
//   otp_code: string;
// }

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone_number: string;
  role: "USER" | "HELPER";
  id_document_type?: "CITIZENSHIP" | "NATIONAL_ID" | "PASSPORT" | "DRIVING_LICENSE";
  id_document_number?: string;
  id_document?: UploadFile;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp_code: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}