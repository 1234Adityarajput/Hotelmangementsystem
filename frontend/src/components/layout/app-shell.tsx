"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F4EE] font-sans antialiased text-[#362A22]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[#F7F4EE]">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
