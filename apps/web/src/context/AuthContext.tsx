"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  apiGetCurrentUser,
  apiSignIn,
  apiSignUp,
  apiRefreshToken,
  apiSignOut,
  apiHandleOAuthCallback,
  apiVerifyEmail,
  apiResendVerification,
  apiForgotPassword,
  apiResetPassword,
  getStoredAuthToken,
  setStoredAuthToken,
} from "../lib/api";
import {
  AuthUser,
  SignInPayload,
  SignUpPayload,
  ResetPasswordPayload,
  OAuthCallbackPayload,
} from "../lib/types";

export type AuthModalTab = "SIGNIN" | "SIGNUP" | "FORGOT" | "VERIFY";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (payload: SignInPayload) => Promise<AuthUser>;
  signUp: (payload: SignUpPayload) => Promise<{
    user: AuthUser;
    verification_token: string;
    message: string;
  }>;
  signOut: () => void;
  handleOAuthLogin: (payload: OAuthCallbackPayload) => Promise<AuthUser>;
  verifyEmail: (token: string) => Promise<string>;
  resendVerification: (email: string) => Promise<string>;
  requestPasswordReset: (email: string) => Promise<{
    message: string;
    reset_token?: string;
  }>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<string>;
  isAuthModalOpen: boolean;
  authModalInitialTab: AuthModalTab;
  openAuthModal: (tab?: AuthModalTab) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<AuthModalTab>("SIGNIN");

  const openAuthModal = (tab: AuthModalTab = "SIGNIN") => {
    setAuthModalInitialTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Rehydrate session on mount with automatic refresh fallback
  useEffect(() => {
    async function rehydrateSession() {
      const storedToken = getStoredAuthToken();
      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await apiGetCurrentUser();
          if (res && res.user) {
            setUser(res.user);
          } else {
            // Attempt silent rotation via refresh token
            const refreshRes = await apiRefreshToken();
            if (refreshRes && refreshRes.user) {
              setToken(refreshRes.access_token);
              setUser(refreshRes.user);
            } else {
              setStoredAuthToken(null);
              setToken(null);
              setUser(null);
            }
          }
        } catch (err) {
          console.error("Session rehydration error:", err);
          const refreshRes = await apiRefreshToken();
          if (refreshRes && refreshRes.user) {
            setToken(refreshRes.access_token);
            setUser(refreshRes.user);
          } else {
            setStoredAuthToken(null);
            setToken(null);
            setUser(null);
          }
        }
      }
      setLoading(false);
    }
    rehydrateSession();
  }, []);

  // Proactive background silent refresh every 12 minutes
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const refreshRes = await apiRefreshToken();
        if (refreshRes) {
          setToken(refreshRes.access_token);
          if (refreshRes.user) setUser(refreshRes.user);
        }
      } catch (err) {
        console.warn("Background silent refresh encountered error:", err);
      }
    }, 12 * 60 * 1000); // 12 minutes

    return () => clearInterval(interval);
  }, [user]);

  const signIn = async (payload: SignInPayload): Promise<AuthUser> => {
    const res = await apiSignIn(payload);
    setToken(res.access_token);
    setUser(res.user);
    closeAuthModal();
    return res.user;
  };

  const handleOAuthLogin = async (payload: OAuthCallbackPayload): Promise<AuthUser> => {
    const res = await apiHandleOAuthCallback(payload);
    setToken(res.access_token);
    setUser(res.user);
    closeAuthModal();
    return res.user;
  };

  const signUp = async (payload: SignUpPayload) => {
    const res = await apiSignUp(payload);
    return {
      user: res.user,
      verification_token: res.verification_token,
      message: res.message,
    };
  };

  const signOut = () => {
    apiSignOut();
    setStoredAuthToken(null);
    setToken(null);
    setUser(null);
  };

  const verifyEmail = async (token: string): Promise<string> => {
    const res = await apiVerifyEmail(token);
    if (res.user && user && user.user_id === res.user.user_id) {
      setUser(res.user);
    }
    return res.message;
  };

  const resendVerification = async (email: string): Promise<string> => {
    const res = await apiResendVerification(email);
    return res.message;
  };

  const requestPasswordReset = async (email: string) => {
    const res = await apiForgotPassword(email);
    return {
      message: res.message,
      reset_token: res.reset_token,
    };
  };

  const resetPassword = async (payload: ResetPasswordPayload): Promise<string> => {
    const res = await apiResetPassword(payload);
    return res.message;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signUp,
        signOut,
        handleOAuthLogin,
        verifyEmail,
        resendVerification,
        requestPasswordReset,
        resetPassword,
        isAuthModalOpen,
        authModalInitialTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
