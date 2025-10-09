import React, { createContext, useContext, useEffect, useState } from "react";
import { router } from "expo-router";
import { clearAuth, getStoredUser, getToken, saveAuth } from "../utils/storage";
import {
  loginUser,
  registerUser,
  forgotPassword as forgotPasswordService,
  resetPassword as resetPasswordService,
  logoutUser,
  sendRegisterEmailOtp as sendRegisterEmailOtpService,
  verifyRegisterEmailOtp as verifyRegisterEmailOtpService,
} from "../services/authService";
import { LoginPayload, RegisterPayload, User } from "../types/auth";

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isReady: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<any>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (payload: {
    email: string;
    otp_code: string;
    new_password: string;
    confirm_password: string;
  }) => Promise<any>;
  sendRegisterEmailOtp: (payload: {
    email: string;
    full_name?: string;
  }) => Promise<any>;
  verifyRegisterEmailOtp: (payload: {
    email: string;
    otp_code: string;
  }) => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getRouteByRole(role?: string) {
  if (role === "HELPER") return "/(helper)/helper-home";
  if (role === "ADMIN") return "/(admin)/dashboard";
  return "/(tabs)";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadAuth();
  }, []);

  async function loadAuth() {
    try {
      const storedToken = await getToken();
      const storedUser = await getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (error) {
      console.log("loadAuth error:", error);
    } finally {
      setIsReady(true);
    }
  }

  async function signIn(payload: LoginPayload) {
    setLoading(true);
    try {
      const data = await loginUser(payload);
      await saveAuth(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      router.replace(getRouteByRole(data.user.role) as any);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(payload: RegisterPayload) {
    setLoading(true);
    try {
      return await registerUser(payload);
    } finally {
      setLoading(false);
    }
  }

  async function sendRegisterEmailOtp(payload: {
    email: string;
    full_name?: string;
  }) {
    return sendRegisterEmailOtpService(payload);
  }

  async function verifyRegisterEmailOtp(payload: {
    email: string;
    otp_code: string;
  }) {
    return verifyRegisterEmailOtpService(payload);
  }

  async function signOut() {
    try {
      if (token) {
        await logoutUser(token);
      }
    } catch (error) {
      console.log("logout error:", error);
    } finally {
      await clearAuth();
      setUser(null);
      setToken(null);
      router.replace("/(auth)/login");
    }
  }

  async function forgotPassword(email: string) {
    return forgotPasswordService({ email });
  }

  async function resetPassword(payload: {
    email: string;
    otp_code: string;
    new_password: string;
    confirm_password: string;
  }) {
    return resetPasswordService(payload);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isReady,
        signIn,
        signUp,
        signOut,
        forgotPassword,
        resetPassword,
        sendRegisterEmailOtp,
        verifyRegisterEmailOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
