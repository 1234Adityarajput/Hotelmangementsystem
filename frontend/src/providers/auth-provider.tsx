"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { AdminUser } from "@/types";

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check initial stored token
    const storedToken = authService.getStoredToken();
    const storedUser = authService.getStoredUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setIsLoading(false);
    } else {
      // Attempt auto-login with default admin if local development
      autoLoginDefault();
    }
  }, []);

  const autoLoginDefault = async () => {
    try {
      const res = await authService.login("admin", "Admin@Hotel2026!");
      setToken(res.accessToken);
      setUser(res.admin);
    } catch (_) {
      // Not able to auto-login, user can login via /login
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await authService.login(username, password);
      setToken(res.accessToken);
      setUser(res.admin);
      toast.success(`Welcome back, ${res.admin.username}!`);
      router.push("/");
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid credentials";
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    toast.info("Logged out successfully");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
