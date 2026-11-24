"use client";

import React, { useState } from "react";
import {
  Hotel,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin@Hotel2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"OWNER" | "MANAGER">("OWNER");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await login(username, password);
    setSubmitting(false);
  };

  const handleSelectRole = (role: "OWNER" | "MANAGER") => {
    setSelectedRole(role);
    if (role === "OWNER") {
      setUsername("admin");
      setPassword("Admin@Hotel2026!");
    } else {
      setUsername("manager");
      setPassword("Manager@Hotel2026!");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F5F0EA] font-sans">
      {/* =====================================================================
          LEFT HERO SECTION (Ivory & Espresso Modern Editorial Luxury)
          ===================================================================== */}
      <div className="relative w-full lg:w-[58%] bg-gradient-to-br from-[#1E1611] via-[#381926] to-[#59283A] text-[#F5F0EA] flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden">
        {/* Subtle decorative gold/amber radial glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C4A06A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#59283A]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#F5F0EA08_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />

        {/* Top Tag / Pill */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#59283A]/80 text-[#F5F0EA] border border-[#C4A06A]/40 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#C4A06A] animate-pulse" />
            <span className="tracking-widest uppercase text-[10px] text-[#C4A06A] font-bold">
              Grand Horizon Platform
            </span>
          </div>
        </div>

        {/* Center Headline & Editorial Introduction */}
        <div className="relative z-10 my-10 lg:my-auto max-w-xl">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-white">
            Smart Luxury Hospitality &amp; Hotel Operations SaaS
          </h1>
          <p className="mt-6 text-sm sm:text-base text-[#E8DDD8] leading-relaxed font-normal">
            Real-time room inventory management, front desk check-in dispatch, live billing &amp;
            folios, staff payroll engine, and unified property management console designed for
            high-standard hotel operations.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-[#F5F0EA]">
            <div className="flex items-center gap-1.5 bg-[#381926]/80 px-3.5 py-1.5 rounded-xl border border-[#C4A06A]/25">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C4A06A]" />
              <span className="font-medium">Modular Monolith</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#381926]/80 px-3.5 py-1.5 rounded-xl border border-[#C4A06A]/25">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C4A06A]" />
              <span className="font-medium">Neon PostgreSQL Live</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#381926]/80 px-3.5 py-1.5 rounded-xl border border-[#C4A06A]/25">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C4A06A]" />
              <span className="font-medium">Ivory &amp; Espresso Luxury Design</span>
            </div>
          </div>
        </div>

        {/* Bottom 3-Column Highlights */}
        <div className="relative z-10 pt-8 border-t border-[#472130] grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="font-serif text-2xl lg:text-3xl font-bold text-white">120+ Rooms</div>
            <div className="text-xs text-[#8E7079] mt-1">Active Across All Floors</div>
          </div>
          <div>
            <div className="font-serif text-2xl lg:text-3xl font-bold text-white">Instant Check-In</div>
            <div className="text-xs text-[#8E7079] mt-1">Front Desk Key Dispatch</div>
          </div>
          <div>
            <div className="font-serif text-2xl lg:text-3xl font-bold text-white">Neon DB Live</div>
            <div className="text-xs text-[#8E7079] mt-1">100% Encrypted &amp; Audited</div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          RIGHT FORM SECTION (Warm Ivory Surface with Floating Card)
          ===================================================================== */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-[#F5F0EA]">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-[#59283A]/5 border border-[#E8DDD8] p-8 sm:p-10">
          {/* Brand Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#59283A] flex items-center justify-center text-white shadow-md shadow-[#59283A]/20">
              <Hotel className="w-6 h-6 text-[#C4A06A]" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold text-[#59283A] tracking-tight leading-none">
                GRAND HORIZON
              </span>
              <span className="text-[10px] font-bold text-[#C4A06A] tracking-widest uppercase mt-1">
                HOTEL MANAGEMENT OS
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mt-8">
            <h2 className="font-serif text-2xl font-bold text-[#59283A] tracking-tight">
              Hospitality Portal Login
            </h2>
            <p className="text-xs text-[#82747A] mt-1.5 leading-relaxed">
              Select your hotel role or enter credentials to access your console
            </p>
          </div>

          {/* Quick Role Selection Tabs */}
          <div className="mt-5 grid grid-cols-2 gap-2 p-1.5 bg-[#F5F0EA] rounded-2xl border border-[#E8DDD8]">
            <button
              type="button"
              onClick={() => handleSelectRole("OWNER")}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all text-xs font-semibold ${
                selectedRole === "OWNER"
                  ? "bg-[#59283A] text-white shadow-md"
                  : "text-[#59283A] hover:bg-white/60"
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <span>👑 Hotel Owner</span>
              </span>
              <span className={`text-[10px] mt-0.5 ${selectedRole === "OWNER" ? "text-[#C4A06A]" : "text-[#82747A]"}`}>
                Full 18 Modules Access
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole("MANAGER")}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all text-xs font-semibold ${
                selectedRole === "MANAGER"
                  ? "bg-[#59283A] text-white shadow-md"
                  : "text-[#59283A] hover:bg-white/60"
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <span>👔 Hotel Manager</span>
              </span>
              <span className={`text-[10px] mt-0.5 ${selectedRole === "MANAGER" ? "text-[#C4A06A]" : "text-[#82747A]"}`}>
                Front Office Operations
              </span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Input 1: Login ID */}
            <div>
              <label className="text-[11px] font-bold text-[#59283A] uppercase tracking-wider block mb-1.5">
                Login ID (Email or Mobile Number)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8E7079] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8DDD8] bg-white text-sm text-[#59283A] placeholder:text-[#8E7079] focus:outline-none focus:ring-2 focus:ring-[#C4A06A] focus:border-transparent transition-all font-medium"
                  placeholder="admin or admin@hotel.com"
                />
              </div>
              <p className="text-[11px] text-[#82747A] mt-1">
                Enter registered username or email address
              </p>
            </div>

            {/* Input 2: Password */}
            <div>
              <label className="text-[11px] font-bold text-[#59283A] uppercase tracking-wider block mb-1.5">
                Password or Security PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8E7079] absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-[#E8DDD8] bg-white text-sm text-[#59283A] placeholder:text-[#8E7079] focus:outline-none focus:ring-2 focus:ring-[#C4A06A] focus:border-transparent transition-all font-medium"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#82747A] hover:text-[#59283A] transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#82747A] mt-1">
                Default: <span className="font-mono text-[#59283A] font-semibold">Admin@Hotel2026!</span>
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full bg-[#59283A] hover:bg-[#472130] text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-[#59283A]/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting || isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#C4A06A]" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Dashboard Console</span>
                    <ArrowRight className="w-4 h-4 text-[#C4A06A]" />
                  </>
                )}
              </button>
            </div>

            {/* Role Credential Summary Box */}
            <div className="p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-[#59283A]">
                <span>Active Role: {selectedRole === "OWNER" ? "👑 Hotel Owner" : "👔 Hotel Manager"}</span>
                <span className="text-[10px] bg-[#E7F1E9] text-[#32765B] px-2 py-0.5 rounded-full font-bold">
                  {selectedRole === "OWNER" ? "Unrestricted" : "Operations"}
                </span>
              </div>
              <p className="text-[11px] text-[#82747A] leading-relaxed">
                {selectedRole === "OWNER"
                  ? "Login: admin / Admin@Hotel2026! — Full access to all 18 modules (Financials, Payments, Payroll, Reports, Settings)."
                  : "Login: manager / Manager@Hotel2026! — Front desk access (Guests, Rooms, Bookings, Stays, Billing, Items, Invoices, Staff & Attendance). Financials, Payments, Payroll, and Reports are protected."}
              </p>
            </div>
          </form>

          {/* Footer Copyright */}
          <div className="mt-8 pt-5 border-t border-[#E8DDD8] text-center">
            <p className="text-[11px] text-[#82747A]">
              Grand Horizon Hotel &amp; Resort © 2026 • Live Neon DB Secure Console
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
