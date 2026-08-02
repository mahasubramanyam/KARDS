"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  api,
  clearTokens,
  isAuthenticated,
  setTokens,
  type ProfileOut,
  type RegisterPayload,
  type UserOut,
} from "./api";

interface AuthState {
  user: UserOut | null;
  profile: ProfileOut | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserOut>;
  register: (payload: RegisterPayload) => Promise<UserOut>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: UserOut["role"]) => boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  login: async () => {
    throw new Error("AuthProvider not mounted");
  },
  register: async () => {
    throw new Error("AuthProvider not mounted");
  },
  logout: async () => {},
  refreshProfile: async () => {},
  hasRole: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileOut | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated()) {
      setProfile(null);
      return;
    }
    try {
      const me = await api.users.me();
      setProfile(me);
    } catch {
      clearTokens();
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));
  }, [refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const pair = await api.auth.login(email, password);
    setTokens(pair);
    const me = await api.users.me();
    setProfile(me);
    return me.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    return api.auth.register(payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore network/refresh errors on logout */
    }
    clearTokens();
    setProfile(null);
  }, []);

  const hasRole = useCallback(
    (role: UserOut["role"]) => (profile?.user.role ?? "volunteer") === role,
    [profile]
  );

  const value = useMemo<AuthState>(
    () => ({
      user: profile?.user ?? null,
      profile,
      loading,
      login,
      register,
      logout,
      refreshProfile,
      hasRole,
    }),
    [profile, loading, login, register, logout, refreshProfile, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
