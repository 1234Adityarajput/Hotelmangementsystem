"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Briefcase,
  Building,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
} from "lucide-react";
import { staffService, StaffStats } from "@/services/staff.service";
import { Staff } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const DEPARTMENTS = [
  "ALL",
  "Front Office",
  "Housekeeping",
  "Food & Beverage",
  "Maintenance",
  "Security",
  "Administration",
  "Accounts",
];

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = {
    fullName: "",
    mobileNumber: "",
    alternateMobileNumber: "",
    email: "",
    address: "",
    dateOfBirth: "",
    emergencyContact: "",
    designation: "",
    department: "Front Office",
    joiningDate: new Date().toISOString().split("T")[0],
    monthlySalary: 25000,
    bankAccountHolder: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    notes: "",
    employmentStatus: "ACTIVE" as "ACTIVE" | "INACTIVE" | "TERMINATED" | "RESIGNED",
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        staffService.findAll({
          search: search || undefined,
          department: department !== "ALL" ? department : undefined,
          employmentStatus: statusFilter !== "ALL" ? statusFilter : undefined,
          page,
          limit: 12,
        }),
        staffService.getStats(),
      ]);
      setStaffList(listRes.items);
      setTotal(listRes.total);
      setTotalPages(listRes.totalPages);
      setStats(statsRes);
    } catch (err) {
      toast.error("Failed to load staff records from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [search, department, statusFilter, page]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setAddModalOpen(true);
  };

  const handleOpenEdit = (staff: Staff) => {
    setSelectedStaff(staff);
    setFormData({
      fullName: staff.fullName,
      mobileNumber: staff.mobileNumber,
      alternateMobileNumber: staff.alternateMobileNumber || "",
      email: staff.email || "",
      address: staff.address || "",
      dateOfBirth: staff.dateOfBirth ? staff.dateOfBirth.split("T")[0] : "",
      emergencyContact: staff.emergencyContact || "",
      designation: staff.designation,
      department: staff.department,
      joiningDate: staff.joiningDate.split("T")[0],
      monthlySalary: Number(staff.monthlySalary),
      bankAccountHolder: staff.bankAccountHolder || "",
      bankAccountNumber: staff.bankAccountNumber || "",
      bankIfscCode: staff.bankIfscCode || "",
      notes: staff.notes || "",
      employmentStatus: staff.employmentStatus,
    });
    setEditModalOpen(true);
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const s = await staffService.findOne(id);
      setSelectedStaff(s);
      setDetailsModalOpen(true);
    } catch (err) {
      toast.error("Could not fetch staff profile details");
    }
  };

  const handleOpenDelete = (staff: Staff) => {
    setSelectedStaff(staff);
    setDeleteModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await staffService.create({
        ...formData,
        monthlySalary: Number(formData.monthlySalary),
      });
      toast.success(`Employee ${formData.fullName} registered successfully!`);
      setAddModalOpen(false);
      fetchStaffData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to register employee");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      setSubmitting(true);
      await staffService.update(selectedStaff.id, {
        ...formData,
        monthlySalary: Number(formData.monthlySalary),
      });
      toast.success(`Profile for ${formData.fullName} updated successfully!`);
      setEditModalOpen(false);
      fetchStaffData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update employee details");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;
    try {
      setSubmitting(true);
      const res = await staffService.delete(selectedStaff.id);
      toast.success(res.message);
      setDeleteModalOpen(false);
      fetchStaffData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete employee");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Staff & Employee Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage hotel workforce, employment profiles, designations, salary rates, and banking records.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Employee</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Total Workforce
            </CardTitle>
            <Users className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats?.total || 0}</div>
            <p className="text-[11px] text-slate-400 mt-1">Across all hotel departments</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Active Staff
            </CardTitle>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats?.active || 0}</div>
            <p className="text-[11px] text-slate-400 mt-1">Currently on active duty</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Inactive / Terminated
            </CardTitle>
            <UserX className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-700">
              {(stats?.inactive || 0) + (stats?.terminated || 0) + (stats?.resigned || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.terminated || 0} Terminated • {stats?.resigned || 0} Resigned
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Active Departments
            </CardTitle>
            <Building className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {stats?.departments?.length || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Operational divisions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1">Department:</span>
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "ALL" ? "All Departments" : dept}
              </option>
            ))}
          </select>

          <span className="text-xs font-semibold text-slate-500 ml-2 mr-1">Status:</span>
          {["ALL", "ACTIVE", "INACTIVE", "TERMINATED", "RESIGNED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <Input
            type="text"
            placeholder="Search code, name, mobile..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Staff Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <LoadingSpinner className="w-6 h-6 text-indigo-600" />
            </div>
          ) : staffList.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No employees found matching the criteria. Click &quot;Add New Employee&quot; to register staff.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Emp Code</th>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Department & Role</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Monthly Salary</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffList.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-indigo-600">
                        {s.employeeCode}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{s.fullName}</div>
                        <div className="text-[11px] text-slate-400">Joined {new Date(s.joiningDate).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{s.designation}</div>
                        <div className="text-[11px] text-slate-500">{s.department}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="font-mono">{s.mobileNumber}</div>
                        {s.email && <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{s.email}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        ₹{Number(s.monthlySalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            s.employmentStatus === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : s.employmentStatus === "INACTIVE"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {s.employmentStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(s.id)}
                          className="h-7 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                          title="View Profile Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(s)}
                          className="h-7 px-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDelete(s)}
                          className="h-7 px-2 text-rose-600 hover:bg-rose-50"
                          title="Archive / Delete Employee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing {staffList.length} of {total} employees</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-7 px-2.5 text-xs"
                >
                  Previous
                </Button>
                <span className="px-2 font-medium text-slate-700">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 px-2.5 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Register New Employee
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter employee personal, contact, salary, and banking details to add them to hotel workforce.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Full Name *</label>
                <Input
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mobile Number *</label>
                <Input
                  required
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  placeholder="+91 9876543210"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Alternate Contact</label>
                <Input
                  value={formData.alternateMobileNumber}
                  onChange={(e) => setFormData({ ...formData, alternateMobileNumber: e.target.value })}
                  placeholder="+91 9876543211"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Email Address</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ramesh@hotel.com"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Department *</label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-800"
                >
                  {DEPARTMENTS.filter((d) => d !== "ALL").map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Designation *</label>
                <Input
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Housekeeping Supervisor"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Joining Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Monthly Basic Salary (₹) *</label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={formData.monthlySalary}
                  onChange={(e) => setFormData({ ...formData, monthlySalary: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
              <span className="font-bold text-slate-800 block text-xs">Banking & Recovery Details</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">Account Holder Name</label>
                  <Input
                    value={formData.bankAccountHolder}
                    onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                    placeholder="Holder name"
                    className="h-7 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">Account Number</label>
                  <Input
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="Account number"
                    className="h-7 text-xs bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">IFSC Code</label>
                  <Input
                    value={formData.bankIfscCode}
                    onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value })}
                    placeholder="SBIN0001234"
                    className="h-7 text-xs bg-white font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Emergency Contact</label>
                <Input
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="Contact Name & Number"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Residential Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full residential address"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Internal Remarks / Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Police verification status, background check..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {submitting ? "Registering..." : "Register Employee"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Edit Employee Profile ({selectedStaff?.employeeCode})
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update personal information, salary rates, or employment status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 pt-2 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Full Name *</label>
                <Input
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Employment Status *</label>
                <select
                  value={formData.employmentStatus}
                  onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                  className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-800"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="TERMINATED">TERMINATED</option>
                  <option value="RESIGNED">RESIGNED</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Mobile Number *</label>
                <Input
                  required
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Department *</label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full h-8 text-xs border border-slate-200 rounded-md px-2 bg-white text-slate-800"
                >
                  {DEPARTMENTS.filter((d) => d !== "ALL").map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Designation *</label>
                <Input
                  required
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Monthly Salary (₹) *</label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={formData.monthlySalary}
                  onChange={(e) => setFormData({ ...formData, monthlySalary: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
              <span className="font-bold text-slate-800 block text-xs">Bank Details</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">Account Holder</label>
                  <Input
                    value={formData.bankAccountHolder}
                    onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                    className="h-7 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">Account Number</label>
                  <Input
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    className="h-7 text-xs bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">IFSC Code</label>
                  <Input
                    value={formData.bankIfscCode}
                    onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value })}
                    className="h-7 text-xs bg-white font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Notes & Remarks</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {submitting ? "Saving Changes..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Staff Profile Sheet */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-xl bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  {selectedStaff?.fullName}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-mono">
                  {selectedStaff?.employeeCode} • {selectedStaff?.designation}
                </DialogDescription>
              </div>
              {selectedStaff && (
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold ${
                    selectedStaff.employmentStatus === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {selectedStaff.employmentStatus}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {selectedStaff && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
                  <span className="font-semibold text-slate-900">{selectedStaff.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Monthly Salary</span>
                  <span className="font-semibold text-indigo-700 font-mono">
                    ₹{Number(selectedStaff.monthlySalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact Mobile</span>
                  <span className="font-mono text-slate-800">{selectedStaff.mobileNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Joining Date</span>
                  <span className="text-slate-800">{new Date(selectedStaff.joiningDate).toLocaleDateString()}</span>
                </div>
                {selectedStaff.email && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                    <span className="text-slate-800">{selectedStaff.email}</span>
                  </div>
                )}
                {selectedStaff.emergencyContact && (
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Emergency Contact</span>
                    <span className="text-slate-800">{selectedStaff.emergencyContact}</span>
                  </div>
                )}
              </div>

              {/* Bank Details */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 border border-slate-100">
                <span className="font-bold text-slate-800 block text-xs mb-1">Banking Information</span>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Account Holder:</span>
                    <span className="font-medium text-slate-900">{selectedStaff.bankAccountHolder || "Not configured"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Account Number:</span>
                    <span className="font-mono text-slate-900">{selectedStaff.bankAccountNumber || "Not configured"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">IFSC Code:</span>
                    <span className="font-mono text-slate-900 uppercase">{selectedStaff.bankIfscCode || "Not configured"}</span>
                  </div>
                </div>
              </div>

              {/* Records count summary */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100">
                  <span className="text-base font-bold text-indigo-700 block">
                    {selectedStaff._count?.attendanceRecords || 0}
                  </span>
                  <span className="text-[10px] text-indigo-600 uppercase font-semibold">Attendance Days</span>
                </div>
                <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
                  <span className="text-base font-bold text-emerald-700 block">
                    {selectedStaff._count?.salaryRecords || 0}
                  </span>
                  <span className="text-[10px] text-emerald-600 uppercase font-semibold">Payroll Slips</span>
                </div>
                <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-100">
                  <span className="text-base font-bold text-amber-700 block">
                    {selectedStaff._count?.advances || 0}
                  </span>
                  <span className="text-[10px] text-amber-600 uppercase font-semibold">Salary Advances</span>
                </div>
              </div>

              {selectedStaff.notes && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs">
                  <span className="font-semibold block mb-0.5">Notes:</span>
                  {selectedStaff.notes}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete / Archive Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Confirm Staff Deletion / Archival
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete or archive employee {selectedStaff?.fullName} ({selectedStaff?.employeeCode})?
              If attendance or payroll history exists, the employee will be safely marked as TERMINATED to preserve audit records.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" disabled={submitting} onClick={handleDelete}>
              {submitting ? "Processing..." : "Confirm Deletion / Archival"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
