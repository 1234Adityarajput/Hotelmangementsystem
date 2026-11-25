"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { AdminUser, UserRole } from "@/types";

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  role: UserRole;
  isOwner: boolean;
  isManager: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  role: "OWNER",
  isOwner: true,
  isManager: false,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
});

const RESTRICTED_MANAGER_PATHS = [
  "/payments",
  "/advances",
  "/payroll",
  "/expenses",
  "/reports",
  "/registers",
  "/audit-logs",
  "/settings",
  "/setup",
];

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
      setToken(null);
      setUser(null);
      setIsLoading(false);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        router.replace("/login");
      }
    }
  }, [router]);

  // Role-based route guard: block Manager from accessing restricted pages
  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role === "MANAGER") {
      const isRestricted = RESTRICTED_MANAGER_PATHS.some((path) =>
        pathname.startsWith(path)
      );
      if (isRestricted) {
        toast.error("Restricted Access: Manager account does not have permission for this module.");
        router.replace("/");
      }
    }
  }, [pathname, user, isLoading, router]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await authService.login(username, password);
      setToken(res.accessToken);
      setUser(res.admin);
      const roleLabel = res.admin.role === "MANAGER" ? "Hotel Manager" : "Hotel Owner";
      toast.success(`Welcome, ${res.admin.username} (${roleLabel})!`);
      setIsLoading(false);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      } else {
        router.push("/");
      }
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

  const role: UserRole = user?.role || "OWNER";
  const isOwner = role === "OWNER";
  const isManager = role === "MANAGER";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isOwner,
        isManager,
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
