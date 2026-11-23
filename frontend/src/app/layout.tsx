import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Grand Horizon - Hotel Management System",
  description: "Modular Monolithic Hotel Management Software Architecture",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        <QueryProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
            <ToastProvider />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
