"use client";

import React, { useState } from "react";
import { Building2, Shield, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin@Hotel2026!");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await login(username, password);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Grand Horizon Hotel</h1>
          <p className="text-xs text-slate-400">Single Admin Authentication Portal</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 text-slate-100 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg font-semibold text-white">Sign In</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Enter your administrator credentials to access the hotel operating system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Username or Email</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <Input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 bg-slate-950/60 border-slate-800 text-white placeholder-slate-500 text-sm focus:border-indigo-500"
                    placeholder="admin or admin@hotel.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-slate-950/60 border-slate-800 text-white placeholder-slate-500 text-sm focus:border-indigo-500"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting || isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 text-sm shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Single-admin security active. All sessions verified with live JWT.</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
