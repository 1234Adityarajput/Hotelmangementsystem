"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Settings,
  Building,
  Clock,
  Percent,
  Server,
  ShieldCheck,
  Database,
  Save,
  RefreshCw,
  HardDrive,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import { settingsService, SystemHealthData } from "@/services/settings.service";
import { HotelSetting } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function SettingsPage() {
  const [settings, setSettings] = useState<HotelSetting | null>(null);
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);

  const handleDownloadBackup = async () => {
    try {
      setDownloadingBackup(true);
      const data = await settingsService.downloadBackup();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.setAttribute("href", url);
      link.setAttribute("download", `grand-horizon-db-backup-${timestamp}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Full database snapshot backup generated and downloaded successfully!");
    } catch (err) {
      toast.error("Failed to generate database backup");
    } finally {
      setDownloadingBackup(false);
    }
  };

  const [form, setForm] = useState({
    hotelName: "",
    hotelAddress: "",
    mobileNumber: "",
    email: "",
    currencyCode: "INR",
    timezone: "Asia/Kolkata",
    defaultCheckInTime: "12:00 PM",
    defaultCheckOutTime: "11:00 AM",
    taxEnabled: true,
    defaultTaxPercentage: 12.00,
    defaultSalaryDays: 30,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, hRes] = await Promise.all([
        settingsService.getSettings(),
        settingsService.getHealth(),
      ]);
      setSettings(sRes);
      setHealth(hRes);
      setForm({
        hotelName: sRes.hotelName,
        hotelAddress: sRes.hotelAddress || "",
        mobileNumber: sRes.mobileNumber || "",
        email: sRes.email || "",
        currencyCode: sRes.currencyCode || "INR",
        timezone: sRes.timezone || "Asia/Kolkata",
        defaultCheckInTime: sRes.defaultCheckInTime || "12:00 PM",
        defaultCheckOutTime: sRes.defaultCheckOutTime || "11:00 AM",
        taxEnabled: sRes.taxEnabled,
        defaultTaxPercentage: Number(sRes.defaultTaxPercentage),
        defaultSalaryDays: sRes.defaultSalaryDays || 30,
      });
    } catch (err) {
      toast.error("Failed to load settings or system health");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await settingsService.updateSettings({
        ...form,
        defaultTaxPercentage: Number(form.defaultTaxPercentage),
        defaultSalaryDays: Number(form.defaultSalaryDays),
      });
      setSettings(updated);
      toast.success("Hotel settings and configuration saved successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E3D9CA]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#362A22]">
            Hotel Settings & System Administration
          </h2>
          <p className="text-xs text-[#79695B] mt-0.5">
            Configure hotel profile, default check-in/out hours, tax percentages, and inspect database infrastructure health.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Health</span>
        </Button>
      </div>

      {loading ? (
        <div className="p-16 flex justify-center items-center">
          <LoadingSpinner text="Loading Hotel Operational Settings..." subtext="Retrieving property operational policies..." />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Hotel Identity Profile */}
          <Card className="border-[#E3D9CA] shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-[#EAE3D8]">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#B08A60]" />
                <CardTitle className="text-sm font-bold text-[#362A22]">
                  Hotel Business Profile
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-[#79695B]">
                Official property identity displayed on guest invoices, printable vouchers, and reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-[#5D493D]">Hotel Name *</label>
                  <Input
                    required
                    value={form.hotelName}
                    onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
                    className="h-8 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#5D493D]">Official Contact Mobile</label>
                  <Input
                    value={form.mobileNumber}
                    onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#5D493D]">Official Contact Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#5D493D]">Operating Currency</label>
                  <Input
                    disabled
                    value={form.currencyCode}
                    className="h-8 text-xs font-mono bg-[#F7F4EE] text-[#79695B]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#5D493D]">Property Physical Address</label>
                <Input
                  value={form.hotelAddress}
                  onChange={(e) => setForm({ ...form, hotelAddress: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Operational Policy & Timings */}
          <Card className="border-[#E3D9CA] shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-[#EAE3D8]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#B08A60]" />
                <CardTitle className="text-sm font-bold text-[#362A22]">
                  Front Desk Policy & Defaults
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-[#79695B]">
                Standard check-in/out timings and HR payroll configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-[#5D493D]">Standard Check-In Time</label>
                  <Input
                    value={form.defaultCheckInTime}
                    onChange={(e) => setForm({ ...form, defaultCheckInTime: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#5D493D]">Standard Check-Out Time</label>
                  <Input
                    value={form.defaultCheckOutTime}
                    onChange={(e) => setForm({ ...form, defaultCheckOutTime: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#5D493D]">Standard Salary Days (Per Month)</label>
                  <Input
                    type="number"
                    min="20"
                    max="31"
                    value={form.defaultSalaryDays}
                    onChange={(e) => setForm({ ...form, defaultSalaryDays: Number(e.target.value) })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Taxation & Invoicing Configuration */}
          <Card className="border-[#E3D9CA] shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-[#EAE3D8]">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#B08A60]" />
                <CardTitle className="text-sm font-bold text-[#362A22]">
                  Taxation & Billing Parameters
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-[#79695B]">
                Configure GST/VAT percentage applied on finalized room tariffs and POS items.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-[#F7F4EE] rounded-lg border border-[#EAE3D8]">
                  <input
                    type="checkbox"
                    id="taxEnabled"
                    checked={form.taxEnabled}
                    onChange={(e) => setForm({ ...form, taxEnabled: e.target.checked })}
                    className="w-4 h-4 text-[#B08A60] rounded border-slate-300 focus:ring-[#B08A60]"
                  />
                  <label htmlFor="taxEnabled" className="font-semibold text-[#362A22] cursor-pointer">
                    Enable GST / Service Tax Calculation on Invoices
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#5D493D]">Default Tax Percentage (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    disabled={!form.taxEnabled}
                    value={form.defaultTaxPercentage}
                    onChange={(e) => setForm({ ...form, defaultTaxPercentage: Number(e.target.value) })}
                    className="h-8 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#362A22] hover:bg-[#43352B] text-white flex items-center gap-1.5 shadow-sm text-xs px-5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Hotel Settings"}</span>
            </Button>
          </div>

          {/* Live Infrastructure & Backup Guidance Section */}
          <Card className="border-emerald-200 shadow-sm bg-emerald-50/30">
            <CardHeader className="pb-3 border-b border-emerald-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-sm font-bold text-[#362A22]">
                    Live Neon PostgreSQL Infrastructure Health
                  </CardTitle>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  {health?.database.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-[#948779] uppercase font-semibold block">Database Provider</span>
                  <span className="font-bold text-[#362A22] text-sm">{health?.database.provider}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-[#948779] uppercase font-semibold block">Database Latency</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">{health?.database.latencyMs} ms</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-[#948779] uppercase font-semibold block">Server Uptime</span>
                  <span className="font-mono font-bold text-[#362A22] text-sm">{health?.server.uptimeSeconds}s</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-[#E3D9CA] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#362A22]">
                  <HardDrive className="w-4 h-4 text-[#B08A60]" />
                  <span>Neon Serverless Backup & Recovery Protocol</span>
                </div>
                <p className="text-[#79695B] leading-relaxed text-[11px]">
                  Your database is hosted on <strong>Neon Serverless PostgreSQL</strong> on AWS. Data is protected by continuous Write-Ahead Log (WAL) streaming and instant branch copy-on-write snapshots.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="flex items-center gap-1.5 text-[#7A4652]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Point-in-Time Recovery (PITR) up to minute precision</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#7A4652]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Zero-impact instantaneous database branching</span>
                  </div>
                </div>
              </div>

              {/* On-Demand Full Database Backup Trigger */}
              <div className="p-4 bg-gradient-to-r from-[#FAF5F7] to-[#F5F0EA] rounded-xl border border-[#C4A06A]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[#59283A] text-[#C4A06A]">
                      <Database className="w-4 h-4" />
                    </span>
                    <span className="font-bold text-[#59283A] text-sm">
                      On-Demand Full Database Backup (JSON Snapshot)
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-white border-[#C4A06A]/50 text-[#C4A06A] font-bold">
                      1-Click Export
                    </Badge>
                  </div>
                  <p className="text-[#82747A] text-[11px] leading-relaxed max-w-xl">
                    Export a complete digital snapshot of all rooms, guests, bookings, stays, items, invoices, payments, staff, payroll, expenses, and audit registers into a single portable backup file.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={downloadingBackup}
                  className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-2 text-xs h-9 px-4 shadow-sm flex-shrink-0"
                >
                  <Download className={`w-3.5 h-3.5 ${downloadingBackup ? "animate-bounce" : "text-[#C4A06A]"}`} />
                  <span>{downloadingBackup ? "Exporting Snapshot..." : "Download DB Backup"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
