"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  FileText,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { auditLogsService } from "@/services/audit-logs.service";
import { AuditLog } from "@/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditLogsService.findAll({
        page,
        limit: 15,
        entityType: entityType || undefined,
        action: action || undefined,
        search: search || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate + "T23:59:59").toISOString() : undefined,
      });
      setLogs(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load audit logs from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, entityType, action]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const resetFilters = () => {
    setEntityType("");
    setAction("");
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const getActionBadge = (act: string) => {
    switch (act.toUpperCase()) {
      case "CREATE":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">CREATE</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">UPDATE</Badge>;
      case "DELETE":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300">DELETE</Badge>;
      case "CHECK_IN":
        return <Badge className="bg-teal-100 text-teal-800 border-teal-300">CHECK-IN</Badge>;
      case "CHECK_OUT":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">CHECK-OUT</Badge>;
      case "FINALIZE":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">FINALIZE</Badge>;
      case "CANCEL":
        return <Badge className="bg-red-100 text-red-800 border-red-300">CANCEL</Badge>;
      case "CORRECTION":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">CORRECTION</Badge>;
      default:
        return <Badge variant="outline">{act}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-[#E8DDD8] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#59283A] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#C4A06A]" />
            Audit Logs & System Activity
          </h1>
          <p className="text-sm text-[#82747A] mt-1">
            Immutable tracking of state mutations, user transactions, and security audit events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#8E7079]" />
              <Input
                placeholder="Search entity ID or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div>
              <select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 rounded-md border border-[#E8DDD8] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A06A]"
              >
                <option value="">All Entity Types</option>
                <option value="GUEST">GUEST</option>
                <option value="ROOM">ROOM</option>
                <option value="BOOKING">BOOKING</option>
                <option value="STAY">STAY</option>
                <option value="INVOICE">INVOICE</option>
                <option value="PAYMENT">PAYMENT</option>
                <option value="STAFF">STAFF</option>
                <option value="ATTENDANCE">ATTENDANCE</option>
                <option value="STAFF_ADVANCE">STAFF_ADVANCE</option>
                <option value="SALARY_RECORD">SALARY_RECORD</option>
                <option value="EXPENSE">EXPENSE</option>
                <option value="SETTING">SETTING</option>
              </select>
            </div>
            <div>
              <select
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 rounded-md border border-[#E8DDD8] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A06A]"
              >
                <option value="">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="FINALIZE">FINALIZE</option>
                <option value="CANCEL">CANCEL</option>
                <option value="CORRECTION">CORRECTION</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
                className="text-xs"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
                className="text-xs"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1">
                Filter
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Audit Trail ({total})</CardTitle>
            <CardDescription className="text-xs">
              Chronological log of system actions performed in Hotel Management System.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center items-center">
              <LoadingSpinner text="Loading System Audit Trail..." subtext="Retrieving security and mutation event records..." />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-[#82747A] text-sm">
              No audit logs found matching the filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F0EA] text-[#82747A] font-medium text-xs border-y border-[#E8DDD8]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity Type</th>
                    <th className="py-3 px-4">Entity ID</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDD8]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F5F0EA] transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-[#82747A]">
                        {log.changedAt
                          ? format(new Date(log.changedAt), "dd MMM yyyy, hh:mm:ss a")
                          : "—"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-[#59283A]">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                          {log.entityType}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-[#82747A] font-mono">
                        {log.entityId ? log.entityId.slice(0, 10) + "..." : "—"}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#82747A] max-w-xs truncate">
                        {log.description || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4 text-[#82747A]" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-[#E8DDD8] flex items-center justify-between text-xs text-[#82747A]">
            <span>
              Page {page} of {totalPages} ({total} total records)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 px-2"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-2"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-[#E8DDD8] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-[#59283A] text-lg flex items-center gap-2">
                  {getActionBadge(selectedLog.action)}
                  <span>{selectedLog.entityType} Audit Record</span>
                </h3>
                <p className="text-xs text-[#82747A] mt-1">ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#8E7079] hover:text-[#82747A] font-bold text-xl px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
              <div className="grid grid-cols-2 gap-4 bg-[#F5F0EA] p-3 rounded-lg text-xs">
                <div>
                  <span className="text-[#8E7079]">Timestamp:</span>
                  <p className="font-medium text-[#59283A]">
                    {selectedLog.changedAt
                      ? format(new Date(selectedLog.changedAt), "dd MMMM yyyy, hh:mm:ss a")
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[#8E7079]">Target Entity ID:</span>
                  <p className="font-medium font-mono text-[#59283A] break-all">
                    {selectedLog.entityId || "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[#8E7079]">Description / Note:</span>
                  <p className="font-medium text-[#59283A]">
                    {selectedLog.description || "System audit event"}
                  </p>
                </div>
              </div>

              {/* State Changes Diff */}
              <div className="space-y-2">
                <h4 className="font-semibold text-[#59283A] text-xs uppercase tracking-wider">
                  State Mutation Payloads
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-medium text-[#82747A] block mb-1">Previous State</span>
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-md text-xs font-mono overflow-x-auto max-h-60">
                      {selectedLog.previousValues
                        ? JSON.stringify(selectedLog.previousValues, null, 2)
                        : "null (Created or Initial State)"}
                    </pre>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[#82747A] block mb-1">New State</span>
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-md text-xs font-mono overflow-x-auto max-h-60">
                      {selectedLog.newValues
                        ? JSON.stringify(selectedLog.newValues, null, 2)
                        : "null (Deleted or Finalized)"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E8DDD8] flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
