"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // If on login page, render children directly without sidebar and header
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // If still checking authentication or user is not logged in, show royal loading screen
  // (Prevents any flash of dashboard or protected content to unauthenticated users)
  if (isLoading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F5F0EA]">
        <LoadingSpinner
          size="lg"
          text="Hotel Radha Palace"
          subtext="Verifying authorized session..."
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F0EA] font-sans antialiased text-[#352630]">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#F5F0EA]">
        <Header onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F5F0EA]">
          {children}
        </main>
      </div>
    </div>
  );
}
