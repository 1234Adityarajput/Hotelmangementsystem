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
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin@Hotel2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await login(username, password);
    setSubmitting(false);
  };

  const handleFillDemo = () => {
    setUsername("admin");
    setPassword("Admin@Hotel2026!");
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 font-sans">
      {/* =====================================================================
          LEFT HERO SECTION (Hotel Branding & Value Proposition Banner)
          ===================================================================== */}
      <div className="relative w-full lg:w-[58%] bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#022c22] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden">
        {/* Subtle decorative background patterns */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

        {/* Top Tag / Pill */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-800/60 text-emerald-100 border border-emerald-400/30 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide uppercase text-[11px]">Grand Horizon Platform</span>
          </div>
        </div>

        {/* Center Headline & Value Proposition */}
        <div className="relative z-10 my-10 lg:my-auto max-w-xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
            Smart Luxury Hospitality &amp; Hotel Operations SaaS
          </h1>
          <p className="mt-6 text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
            Real-time room inventory management, front desk check-in dispatch, live billing &amp;
            folios, staff payroll engine, and unified property management console designed for
            high-standard hotel ecosystems.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-emerald-200">
            <div className="flex items-center gap-1.5 bg-emerald-900/40 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Modular Monolith</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-900/40 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Neon Serverless PostgreSQL</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-900/40 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Argon2 Security Standard</span>
            </div>
          </div>
        </div>

        {/* Bottom 3-Column Stats Highlights */}
        <div className="relative z-10 pt-8 border-t border-emerald-600/30 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-white">120+ Rooms</div>
            <div className="text-xs text-emerald-200/80 mt-1">Active Across All Floors</div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-white">Instant Check-In</div>
            <div className="text-xs text-emerald-200/80 mt-1">Front Desk Key Dispatch</div>
          </div>
          <div>
            <div className="text-2xl lg:text-3xl font-extrabold text-white">Neon DB Live</div>
            <div className="text-xs text-emerald-200/80 mt-1">100% Encrypted &amp; Audited</div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          RIGHT FORM SECTION (White Floating Authentication Card)
          ===================================================================== */}
      <div className="w-full lg:w-[42%] flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-[#f8fafc]">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-100 p-8 sm:p-10">
          {/* Brand Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#064e3b] to-[#047857] flex items-center justify-center text-white shadow-lg shadow-emerald-700/25">
              <Hotel className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                GRAND HORIZON
              </span>
              <span className="text-[10px] font-bold text-emerald-700 tracking-widest uppercase mt-1">
                HOTEL MANAGEMENT OS
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome Administrator
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Sign in using your Username or Email with your Password or PIN
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Input 1: Login ID */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Login ID (Email or Mobile Number)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all font-medium"
                  placeholder="admin or admin@hotel.com"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter registered username or email address
              </p>
            </div>

            {/* Input 2: Password */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Password or Security PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all font-medium"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Default: <span className="font-mono text-slate-600">Admin@Hotel2026!</span>
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full bg-[#047857] hover:bg-[#065f46] text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-700/25 hover:shadow-emerald-700/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting || isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Dashboard Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Demo Fill Helper */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Single Admin Portal
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2"
              >
                Auto-fill credentials
              </button>
            </div>
          </form>

          {/* Footer Copyright */}
          <div className="mt-8 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Grand Horizon Hotel &amp; Resort © 2026 • Live Neon DB Secure Console
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
