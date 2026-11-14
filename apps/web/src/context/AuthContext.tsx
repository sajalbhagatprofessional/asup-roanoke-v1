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
  apiMfaSetup,
  apiMfaEnable,
  apiMfaDisable,
  apiMfaVerifyLogin,
  apiGetSessions,
  apiRevokeSession,
  apiRevokeOtherSessions,
  apiChangePassword,
  apiSendMagicLink,
  apiVerifyMagicLink,
  apiGetSecurityAuditLog,
  getStoredAuthToken,
  setStoredAuthToken,
} from "../lib/api";
import {
  AuthUser,
  SignInPayload,
  SignUpPayload,
  ResetPasswordPayload,
  OAuthCallbackPayload,
  MfaSetupResponse,
  UserSession,
  SecurityAuditEvent,
} from "../lib/types";

export type AuthModalTab = "SIGNIN" | "SIGNUP" | "FORGOT" | "VERIFY" | "MFA" | "MAGIC";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (payload: SignInPayload) => Promise<{ status: string; user?: AuthUser; mfa_required?: boolean }>;
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
  
  // Cisco Zero-Trust MFA & Identity Actions
  pendingMfaToken: string | null;
  verifyMfaLogin: (code: string) => Promise<AuthUser>;
  setupMfa: () => Promise<MfaSetupResponse>;
  enableMfa: (code: string) => Promise<string>;
  disableMfa: (password: string, code?: string) => Promise<string>;
  getActiveSessions: () => Promise<UserSession[]>;
  revokeSession: (sessionId: string) => Promise<void>;
  revokeOtherSessions: () => Promise<number>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<string>;
  sendMagicLink: (email: string) => Promise<string>;
  verifyMagicLink: (token: string) => Promise<AuthUser>;
  getSecurityAuditLog: () => Promise<SecurityAuditEvent[]>;

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
  const [pendingMfaToken, setPendingMfaToken] = useState<string | null>(null);

  const openAuthModal = (tab: AuthModalTab = "SIGNIN") => {
    setAuthModalInitialTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setPendingMfaToken(null);
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
              setToken(refreshRes.access_token || null);
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
            setToken(refreshRes.access_token || null);
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
          if (refreshRes.access_token) setToken(refreshRes.access_token);
          if (refreshRes.user) setUser(refreshRes.user);
        }
      } catch (err) {
        console.warn("Background silent refresh encountered error:", err);
      }
    }, 12 * 60 * 1000); // 12 minutes

    return () => clearInterval(interval);
  }, [user]);

  const signIn = async (payload: SignInPayload): Promise<{ status: string; user?: AuthUser; mfa_required?: boolean }> => {
    const res = await apiSignIn(payload);
    if (res.status === "mfa_required") {
      setPendingMfaToken(res.mfa_session_token || null);
      openAuthModal("MFA");
      return { status: "mfa_required", mfa_required: true, user: res.user };
    }
    if (res.access_token) {
      setToken(res.access_token);
    }
    setUser(res.user);
    closeAuthModal();
    return { status: "success", user: res.user };
  };

  const verifyMfaLogin = async (code: string): Promise<AuthUser> => {
    if (!pendingMfaToken) {
      throw new Error("No active MFA challenge session. Please sign in again.");
    }
    const res = await apiMfaVerifyLogin({
      mfa_session_token: pendingMfaToken,
      code,
    });
    if (res.access_token) {
      setToken(res.access_token);
    }
    setUser(res.user);
    closeAuthModal();
    return res.user;
  };

  const setupMfa = async (): Promise<MfaSetupResponse> => {
    return await apiMfaSetup();
  };

  const enableMfa = async (code: string): Promise<string> => {
    const res = await apiMfaEnable(code);
    if (res.user) {
      setUser(res.user);
    }
    return res.message;
  };

  const disableMfa = async (password: string, code?: string): Promise<string> => {
    const res = await apiMfaDisable(password, code);
    if (res.user) {
      setUser(res.user);
    }
    return res.message;
  };

  const getActiveSessions = async (): Promise<UserSession[]> => {
    const res = await apiGetSessions();
    return res.sessions || [];
  };

  const revokeSession = async (sessionId: string): Promise<void> => {
    await apiRevokeSession(sessionId);
  };

  const revokeOtherSessions = async (): Promise<number> => {
    const res = await apiRevokeOtherSessions();
    return res.revoked_count || 0;
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<string> => {
    const res = await apiChangePassword({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return res.message;
  };

  const sendMagicLink = async (email: string): Promise<string> => {
    const res = await apiSendMagicLink(email);
    return res.message;
  };

  const verifyMagicLink = async (token: string): Promise<AuthUser> => {
    const res = await apiVerifyMagicLink(token);
    if (res.access_token) {
      setToken(res.access_token);
    }
    setUser(res.user);
    closeAuthModal();
    return res.user;
  };

  const getSecurityAuditLog = async (): Promise<SecurityAuditEvent[]> => {
    const res = await apiGetSecurityAuditLog();
    return res.events || [];
  };

  const handleOAuthLogin = async (payload: OAuthCallbackPayload): Promise<AuthUser> => {
    const res = await apiHandleOAuthCallback(payload);
    if (res.access_token) {
      setToken(res.access_token);
    }
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
    setPendingMfaToken(null);
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
        pendingMfaToken,
        verifyMfaLogin,
        setupMfa,
        enableMfa,
        disableMfa,
        getActiveSessions,
        revokeSession,
        revokeOtherSessions,
        changePassword,
        sendMagicLink,
        verifyMagicLink,
        getSecurityAuditLog,
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
