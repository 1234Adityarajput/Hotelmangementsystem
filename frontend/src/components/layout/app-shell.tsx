"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // If on login page, render children directly without sidebar and header
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // If unauthenticated and not loading, redirect to login
  if (!isLoading && !user) {
    if (typeof window !== "undefined") {
      router.replace("/login");
    }
    return null;
  }

  return (
    <div className="app-shell-root flex h-screen w-screen overflow-hidden bg-[#F5F0EA] font-sans antialiased text-[#352630] print:h-auto print:w-full print:overflow-visible print:bg-white">
      <div className="print:hidden h-full flex flex-col flex-shrink-0">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#F5F0EA] print:overflow-visible print:bg-white print:h-auto print:w-full">
        <div className="print:hidden">
          <Header onOpenMobile={() => setMobileOpen(true)} />
        </div>
        <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F5F0EA] print:overflow-visible print:p-0 print:m-0 print:bg-white print:h-auto print:w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
