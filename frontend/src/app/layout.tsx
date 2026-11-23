import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Grand Horizon - Luxury Hotel & Resort OS",
  description: "Modern Editorial Luxury Hotel Management Software System (Ivory & Espresso Theme)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[#F7F4EE] text-[#362A22]">
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
