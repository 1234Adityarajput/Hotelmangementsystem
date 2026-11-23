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
  LayoutGrid,
  List,
  MapPin,
  Clock,
  Printer,
  ShieldCheck,
  BadgeAlert,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
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
  "Kitchen & Culinary",
  "Maintenance & Engineering",
  "Security",
  "Administration",
  "Accounts & Finance",
  "Spa & Wellness",
];

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [stats, setStats] = useState<StaffStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // View Mode: Table vs Dossier Cards Grid
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");

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

  // 13 Field Form State
  const initialForm = {
    employeeCode: "", // 1. Employee ID (Custom or Auto-generate)
    fullName: "", // 2. Full Name
    mobileNumber: "", // 3. Mobile Number
    alternateMobileNumber: "", // Alternate Contact
    email: "", // 4. Email Address
    address: "", // 5. Personal Address
    dateOfBirth: "", // 6. Date of Birth
    emergencyContact: "", // 7. Emergency Contact
    designation: "", // 8. Designation
    department: "Front Office", // 9. Department
    joiningDate: new Date().toISOString().split("T")[0], // 10. Joining Date
    monthlySalary: 25000, // 11. Monthly Salary
    bankAccountHolder: "", // 12. Bank Details - Holder
    bankAccountNumber: "", // 12. Bank Details - Account No
    bankIfscCode: "", // 12. Bank Details - IFSC Code
    employmentStatus: "ACTIVE" as "ACTIVE" | "INACTIVE" | "TERMINATED" | "RESIGNED", // 13. Other Employment Details - Status
    notes: "", // 13. Other Employment Details - Shift / Remarks
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
          limit: viewMode === "grid" ? 12 : 15,
        }).catch((err) => {
          console.warn("Staff findAll error:", err);
          return { items: [], total: 0, page: 1, limit: 12, totalPages: 1 };
        }),
        staffService.getStats().catch(() => null),
      ]);
      setStaffList(listRes.items || []);
      setTotal(listRes.total || 0);
      setTotalPages(listRes.totalPages || 1);
      setStats(statsRes);
    } catch (err) {
      toast.error("Failed to load staff records from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [search, department, statusFilter, page, viewMode]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setAddModalOpen(true);
  };

  const handleOpenEdit = (staff: Staff) => {
    setSelectedStaff(staff);
    setFormData({
      employeeCode: staff.employeeCode || "",
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
      employmentStatus: staff.employmentStatus,
      notes: staff.notes || "",
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
        employeeCode: formData.employeeCode?.trim() || undefined,
        monthlySalary: Number(formData.monthlySalary),
      });
      toast.success(`Staff member ${formData.fullName} registered successfully!`);
      setAddModalOpen(false);
      fetchStaffData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to register staff member");
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
      toast.error(err.response?.data?.message || "Failed to update staff profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (staffId: string, newStatus: Staff["employmentStatus"]) => {
    try {
      await staffService.update(staffId, { employmentStatus: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchStaffData();
      if (selectedStaff && selectedStaff.id === staffId) {
        setSelectedStaff({ ...selectedStaff, employmentStatus: newStatus });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
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

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[#E3D9CA]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B08A60] bg-[#EEE7DA] px-2.5 py-0.5 rounded-full">
              Workforce Operations • Module 9
            </span>
            <span className="text-xs text-[#79695B]">• 13 Complete Profile Fields</span>
          </div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-[#362A22] mt-1">
            Staff & Workforce Management
          </h2>
          <p className="text-xs text-[#79695B] mt-0.5">
            Complete personal records, employment dossier, bank details, monthly salary benchmarks, and shift administration.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#EEE7DA] p-0.5 rounded-lg border border-[#E3D9CA]">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-[#362A22] shadow-sm font-semibold"
                  : "text-[#79695B] hover:text-[#362A22]"
              }`}
              title="Dossier Cards Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded text-xs flex items-center gap-1 font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-white text-[#362A22] shadow-sm font-semibold"
                  : "text-[#79695B] hover:text-[#362A22]"
              }`}
              title="Dense Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="bg-[#362A22] hover:bg-[#43352B] text-white flex items-center gap-1.5 shadow-sm text-xs h-9 px-3.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#B08A60]" />
            <span>Add New Employee</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E3D9CA] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#79695B] uppercase tracking-wider">
              Total Workforce
            </CardTitle>
            <Users className="w-4 h-4 text-[#B08A60]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-[#362A22]">{stats?.total || 0}</div>
            <p className="text-[11px] text-[#79695B] mt-1">Across all hotel operational wings</p>
          </CardContent>
        </Card>

        <Card className="border-[#E3D9CA] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#79695B] uppercase tracking-wider">
              Active On-Duty Staff
            </CardTitle>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-emerald-700">{stats?.active || 0}</div>
            <p className="text-[11px] text-[#79695B] mt-1">Eligible for shifts and biometric check-in</p>
          </CardContent>
        </Card>

        <Card className="border-[#E3D9CA] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#79695B] uppercase tracking-wider">
              Inactive & Terminated
            </CardTitle>
            <UserX className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-[#5D493D]">
              {(stats?.inactive || 0) + (stats?.terminated || 0) + (stats?.resigned || 0)}
            </div>
            <p className="text-[11px] text-[#79695B] mt-1">
              {stats?.inactive || 0} Inactive • {stats?.terminated || 0} Terminated • {stats?.resigned || 0} Resigned
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E3D9CA] shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#79695B] uppercase tracking-wider">
              Active Departments
            </CardTitle>
            <Building className="w-4 h-4 text-[#B08A60]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-serif text-[#362A22]">
              {stats?.departments?.length || 0}
            </div>
            <p className="text-[11px] text-[#79695B] mt-1">Covering Front Office, F&B, Housekeeping, etc.</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E3D9CA] shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#79695B] mr-1">Department:</span>
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-[#E3D9CA] rounded-lg px-2.5 py-1.5 bg-[#F7F4EE] text-[#362A22] focus:outline-none focus:ring-1 focus:ring-[#B08A60]"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "ALL" ? "All Departments" : dept}
              </option>
            ))}
          </select>

          <span className="text-xs font-semibold text-[#79695B] ml-2 mr-1">Status:</span>
          {["ALL", "ACTIVE", "INACTIVE", "TERMINATED", "RESIGNED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-[#362A22] text-white font-semibold"
                  : "bg-[#F7F4EE] text-[#79695B] hover:bg-[#EEE7DA] border border-[#E3D9CA]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#79695B] absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Search ID, name, mobile, role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-8 text-xs border-[#E3D9CA] bg-[#F7F4EE]/50 focus:bg-white"
          />
        </div>
      </div>

      {/* Staff View: Cards Grid or Dense Table */}
      {loading ? (
        <div className="p-16 flex flex-col justify-center items-center bg-white rounded-xl border border-[#E3D9CA]">
          <LoadingSpinner className="w-8 h-8 text-[#B08A60] mb-2" />
          <span className="text-xs text-[#79695B]">Loading staff profiles from database...</span>
        </div>
      ) : staffList.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-xl border border-[#E3D9CA] space-y-3">
          <Users className="w-10 h-10 text-[#B08A60] mx-auto opacity-40" />
          <p className="text-sm font-serif font-semibold text-[#362A22]">No employee records found</p>
          <p className="text-xs text-[#79695B] max-w-sm mx-auto">
            Try adjusting your search filters or click &quot;Add New Employee&quot; to register a staff member.
          </p>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="bg-[#362A22] hover:bg-[#43352B] text-white text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-[#B08A60]" />
            Register First Employee
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* DOSSIER CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((s) => {
            const initials = s.fullName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <Card
                key={s.id}
                className="border-[#E3D9CA] shadow-sm bg-white hover:border-[#B08A60] transition-all hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Card Header with Initials, Code & Status */}
                  <div className="p-4 border-b border-[#EAE3D8] bg-[#F7F4EE]/40 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#362A22] text-[#EEE7DA] flex items-center justify-center font-serif font-bold text-sm shadow-inner">
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-sm text-[#362A22] leading-tight">
                          {s.fullName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] font-semibold text-[#B08A60]">
                            {s.employeeCode}
                          </span>
                          <span className="text-[10px] text-[#79695B]">• {s.department}</span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold px-2 py-0.5 ${
                        s.employmentStatus === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : s.employmentStatus === "INACTIVE"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {s.employmentStatus}
                    </Badge>
                  </div>

                  {/* Card Body - Key Staff Details */}
                  <div className="p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[#F2EADF]">
                      <span className="text-[#79695B] flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#B08A60]" />
                        <span>Designation</span>
                      </span>
                      <span className="font-semibold text-[#362A22]">{s.designation}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-[#F2EADF]">
                      <span className="text-[#79695B] flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-[#B08A60]" />
                        <span>Monthly Salary</span>
                      </span>
                      <span className="font-mono font-bold text-[#362A22]">
                        ₹{Number(s.monthlySalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-[#F2EADF]">
                      <span className="text-[#79695B] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#B08A60]" />
                        <span>Contact</span>
                      </span>
                      <span className="font-mono text-[#362A22]">{s.mobileNumber}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-[#F2EADF]">
                      <span className="text-[#79695B] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#B08A60]" />
                        <span>Joining Date</span>
                      </span>
                      <span className="text-[#362A22]">
                        {new Date(s.joiningDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Bank Status Badge */}
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-[#79695B]">Bank Account:</span>
                      {s.bankAccountNumber ? (
                        <span className="text-emerald-700 flex items-center gap-1 font-mono font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Linked (***{s.bankAccountNumber.slice(-4)})</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          <span>Not Configured</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-[#F7F4EE] border-t border-[#EAE3D8] flex items-center justify-between gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDetails(s.id)}
                    className="h-7 px-2.5 text-xs text-[#362A22] hover:bg-[#EEE7DA] flex items-center gap-1 font-medium"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#B08A60]" />
                    <span>Dossier</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(s)}
                      className="h-7 w-7 p-0 text-[#79695B] hover:text-[#362A22] hover:bg-[#EEE7DA]"
                      title="Edit Staff Record"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDelete(s)}
                      className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      title="Delete / Archive Employee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* DENSE TABLE VIEW */
        <Card className="border-[#E3D9CA] shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F4EE] text-[#79695B] uppercase text-[11px] font-semibold border-b border-[#E3D9CA]">
                  <tr>
                    <th className="px-4 py-3">Emp ID</th>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Department & Role</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Monthly Salary</th>
                    <th className="px-4 py-3">Bank Details</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3D8]">
                  {staffList.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F7F4EE]/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#B08A60]">
                        {s.employeeCode}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#362A22]">
                        <div className="font-semibold">{s.fullName}</div>
                        <div className="text-[11px] text-[#79695B]">
                          Joined {new Date(s.joiningDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#362A22]">{s.designation}</div>
                        <div className="text-[11px] text-[#79695B]">{s.department}</div>
                      </td>
                      <td className="px-4 py-3 text-[#79695B]">
                        <div className="font-mono text-[#362A22]">{s.mobileNumber}</div>
                        {s.email && <div className="text-[11px] text-[#79695B] truncate max-w-[140px]">{s.email}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[#362A22]">
                        ₹{Number(s.monthlySalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-[11px]">
                        {s.bankAccountNumber ? (
                          <div className="font-mono text-emerald-700">
                            {s.bankIfscCode || "IFSC"} • ***{s.bankAccountNumber.slice(-4)}
                          </div>
                        ) : (
                          <span className="text-amber-600">Pending</span>
                        )}
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
                          className="h-7 px-2 text-[#79695B] hover:text-[#B08A60] hover:bg-[#F2EADF]"
                          title="View Full Staff Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(s)}
                          className="h-7 px-2 text-[#79695B] hover:text-[#362A22] hover:bg-[#EEE7DA]"
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
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-3.5 bg-white rounded-xl border border-[#E3D9CA] flex items-center justify-between text-xs text-[#79695B] shadow-sm">
          <span>
            Showing {(page - 1) * (viewMode === "grid" ? 12 : 15) + 1} -{" "}
            {Math.min(page * (viewMode === "grid" ? 12 : 15), total)} of {total} employees
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-7 px-2.5 text-xs border-[#E3D9CA]"
            >
              Previous
            </Button>
            <span className="px-2 font-mono font-medium text-[#362A22]">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 px-2.5 text-xs border-[#E3D9CA]"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13-FIELD ADD NEW EMPLOYEE MODAL                                           */}
      {/* ========================================================================= */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-[#E3D9CA] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3">
            <span className="text-[10px] uppercase font-bold text-[#362A22] bg-[#EEE7DA] px-2 py-0.5 rounded w-fit">
              Staff Management • Module 9
            </span>
            <DialogTitle className="text-xl font-serif font-bold text-[#362A22] mt-1">
              Add New Hotel Staff Member
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Record complete personal profile, department allocation, monthly salary, and banking information.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2 text-xs">
            {/* Section 1: Identification & Personal Info */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#362A22] uppercase tracking-wider block border-b border-[#F2EADF] pb-1">
                1. Identification & Personal Information
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">
                    Employee ID <span className="text-[10px] text-[#79695B] font-normal">(Optional)</span>
                  </label>
                  <Input
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    placeholder="Auto: EMP-YYYYMM-0001"
                    className="h-8 text-xs font-mono uppercase border-[#E3D9CA]"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="font-semibold text-[#362A22]">Full Name *</label>
                  <Input
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar Verma"
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Mobile Number *</label>
                  <Input
                    required
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    placeholder="+91 9876543210"
                    className="h-8 text-xs font-mono border-[#E3D9CA]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Alternate Contact</label>
                  <Input
                    value={formData.alternateMobileNumber}
                    onChange={(e) => setFormData({ ...formData, alternateMobileNumber: e.target.value })}
                    placeholder="+91 9876543211"
                    className="h-8 text-xs font-mono border-[#E3D9CA]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Email Address</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh@hotel.com"
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Date of Birth</label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="font-semibold text-[#362A22]">Personal Residential Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Flat / House No., Colony / Street, City, State, PIN"
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Department & Employment Details */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-[#362A22] uppercase tracking-wider block border-b border-[#F2EADF] pb-1">
                2. Department & Employment Designation
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Department *</label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
                  >
                    {DEPARTMENTS.filter((d) => d !== "ALL").map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Designation *</label>
                  <Input
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. Front Desk Executive / Head Chef"
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Joining Date *</label>
                  <Input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Monthly Salary (₹) *</label>
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.monthlySalary}
                    onChange={(e) => setFormData({ ...formData, monthlySalary: Number(e.target.value) })}
                    className="h-8 text-xs font-mono font-bold text-[#362A22] border-[#E3D9CA]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Employment Status</label>
                  <select
                    value={formData.employmentStatus}
                    onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                    className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
                  >
                    <option value="ACTIVE">ACTIVE (On Duty)</option>
                    <option value="INACTIVE">INACTIVE (On Leave)</option>
                    <option value="RESIGNED">RESIGNED</option>
                    <option value="TERMINATED">TERMINATED</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Shift / Internal Remarks</label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Morning Shift (07:00 - 15:30)"
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Bank Details */}
            <div className="p-3.5 bg-[#F7F4EE] rounded-xl space-y-3 border border-[#EAE3D8]">
              <span className="font-bold text-[#362A22] block text-xs">
                3. Bank Account & Salary Remuneration Details
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#79695B] font-medium">Bank Account Holder Name</label>
                  <Input
                    value={formData.bankAccountHolder}
                    onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                    placeholder="Name as per Passbook"
                    className="h-7 text-xs bg-white border-[#E3D9CA]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-[#79695B] font-medium">Bank Account Number</label>
                  <Input
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    placeholder="Account Number"
                    className="h-7 text-xs bg-white font-mono border-[#E3D9CA]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-[#79695B] font-medium">Bank IFSC Code</label>
                  <Input
                    value={formData.bankIfscCode}
                    onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. SBIN0001234"
                    className="h-7 text-xs bg-white font-mono uppercase border-[#E3D9CA]"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Emergency Contact */}
            <div className="space-y-1 pt-1">
              <label className="font-semibold text-[#362A22]">
                4. Emergency Contact Person & Phone *
              </label>
              <Input
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="e.g. Sunita Verma (Spouse) - +91 9123456789"
                className="h-8 text-xs border-[#E3D9CA]"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddModalOpen(false)}
                className="text-xs border-[#E3D9CA]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#362A22] hover:bg-[#43352B] text-white flex items-center gap-1.5 text-xs"
              >
                {submitting ? (
                  <LoadingSpinner className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 mr-1 text-[#B08A60]" />
                )}
                <span>Register Staff Member</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* EDIT STAFF MODAL                                                          */}
      {/* ========================================================================= */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-[#E3D9CA] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E3D9CA] pb-3">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-serif font-bold text-[#362A22]">
                  Edit Staff Profile
                </DialogTitle>
                <DialogDescription className="text-xs text-[#79695B] font-mono mt-0.5">
                  ID: {selectedStaff?.employeeCode} • {selectedStaff?.fullName}
                </DialogDescription>
              </div>
              <Badge variant="outline" className="text-xs font-mono text-[#B08A60] bg-[#EEE7DA]">
                {selectedStaff?.employeeCode}
              </Badge>
            </div>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 pt-2 text-xs">
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#362A22] uppercase tracking-wider block border-b border-[#F2EADF] pb-1">
                Personal Information
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Full Name *</label>
                  <Input
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Mobile Number *</label>
                  <Input
                    required
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    className="h-8 text-xs font-mono border-[#E3D9CA]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Alternate Mobile</label>
                  <Input
                    value={formData.alternateMobileNumber}
                    onChange={(e) => setFormData({ ...formData, alternateMobileNumber: e.target.value })}
                    className="h-8 text-xs font-mono border-[#E3D9CA]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Email Address</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Date of Birth</label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Emergency Contact</label>
                  <Input
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="font-semibold text-[#362A22]">Personal Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-[#362A22] uppercase tracking-wider block border-b border-[#F2EADF] pb-1">
                Employment Designation & Status
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
                  >
                    {DEPARTMENTS.filter((d) => d !== "ALL").map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Designation *</label>
                  <Input
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Joining Date</label>
                  <Input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Monthly Salary (₹) *</label>
                  <Input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.monthlySalary}
                    onChange={(e) => setFormData({ ...formData, monthlySalary: Number(e.target.value) })}
                    className="h-8 text-xs font-mono font-bold border-[#E3D9CA]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Employment Status</label>
                  <select
                    value={formData.employmentStatus}
                    onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as any })}
                    className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white text-[#362A22]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="RESIGNED">RESIGNED</option>
                    <option value="TERMINATED">TERMINATED</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#362A22]">Notes / Shift</label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="h-8 text-xs border-[#E3D9CA]"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-[#F7F4EE] rounded-xl space-y-3 border border-[#EAE3D8]">
              <span className="font-bold text-[#362A22] block text-xs">Bank Details</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-[#79695B]">Account Holder</label>
                  <Input
                    value={formData.bankAccountHolder}
                    onChange={(e) => setFormData({ ...formData, bankAccountHolder: e.target.value })}
                    className="h-7 text-xs bg-white border-[#E3D9CA]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-[#79695B]">Account Number</label>
                  <Input
                    value={formData.bankAccountNumber}
                    onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                    className="h-7 text-xs bg-white font-mono border-[#E3D9CA]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-[#79695B]">IFSC Code</label>
                  <Input
                    value={formData.bankIfscCode}
                    onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value.toUpperCase() })}
                    className="h-7 text-xs bg-white font-mono uppercase border-[#E3D9CA]"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(false)}
                className="text-xs border-[#E3D9CA]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#362A22] hover:bg-[#43352B] text-white text-xs"
              >
                {submitting ? "Saving..." : "Save Profile Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* VIEW FULL STAFF DOSSIER MODAL                                             */}
      {/* ========================================================================= */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl bg-white border-[#E3D9CA] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
          {selectedStaff && (
            <div className="space-y-5">
              {/* Dossier Header */}
              <div className="flex items-start justify-between border-b border-[#E3D9CA] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#362A22] text-[#EEE7DA] flex items-center justify-center font-serif font-bold text-base shadow-inner">
                    {selectedStaff.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-[#362A22]">
                      {selectedStaff.fullName}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs font-bold text-[#B08A60] bg-[#EEE7DA] px-2 py-0.5 rounded">
                        {selectedStaff.employeeCode}
                      </span>
                      <span className="text-xs text-[#79695B]">
                        {selectedStaff.designation} • {selectedStaff.department}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <Badge
                    variant="outline"
                    className={`text-xs font-semibold px-2.5 py-0.5 ${
                      selectedStaff.employmentStatus === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedStaff.employmentStatus === "INACTIVE"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {selectedStaff.employmentStatus}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintDossier}
                    className="h-7 text-xs border-[#E3D9CA] text-[#79695B] hover:text-[#362A22] flex items-center gap-1"
                  >
                    <Printer className="w-3 h-3 text-[#B08A60]" />
                    <span>Print Dossier</span>
                  </Button>
                </div>
              </div>

              {/* 13 Fields Detailed Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#F7F4EE] rounded-xl border border-[#EAE3D8] text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#79695B] block">Employee ID</span>
                  <span className="font-mono font-bold text-[#362A22]">{selectedStaff.employeeCode}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#79695B] block">Full Name</span>
                  <span className="font-semibold text-[#362A22]">{selectedStaff.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#79695B] block">Department</span>
                  <span className="font-semibold text-[#362A22]">{selectedStaff.department}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#79695B] block">Designation</span>
                  <span className="font-semibold text-[#362A22]">{selectedStaff.designation}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#79695B] block">Mobile Number</span>
                  <span className="font-mono text-[#362A22]">{selectedStaff.mobileNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#79695B] block">Alternate Contact</span>
                  <span className="font-mono text-[#362A22]">{selectedStaff.alternateMobileNumber || "None"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#79695B] block">Email Address</span>
                  <span className="text-[#362A22] truncate block">{selectedStaff.email || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#79695B] block">Date of Birth</span>
                  <span className="text-[#362A22]">
                    {selectedStaff.dateOfBirth
                      ? new Date(selectedStaff.dateOfBirth).toLocaleDateString()
                      : "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#79695B] block">Joining Date</span>
                  <span className="text-[#362A22]">
                    {new Date(selectedStaff.joiningDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-[10px] uppercase font-bold text-[#79695B] block">Personal Address</span>
                  <span className="text-[#362A22]">{selectedStaff.address || "No address on file"}</span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-[10px] uppercase font-bold text-[#79695B] block">Emergency Contact</span>
                  <span className="text-[#362A22] font-medium">
                    {selectedStaff.emergencyContact || "No emergency contact recorded"}
                  </span>
                </div>
              </div>

              {/* Remuneration & Banking Box */}
              <div className="p-3.5 bg-white rounded-xl border border-[#E3D9CA] space-y-2 text-xs shadow-sm">
                <span className="font-bold text-[#362A22] block uppercase tracking-wider text-[11px]">
                  Remuneration & Banking Details
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 bg-[#F7F4EE] rounded-lg">
                    <span className="text-[10px] uppercase text-[#79695B] block font-semibold">Monthly Basic Salary</span>
                    <span className="font-mono font-bold text-[#362A22] text-sm">
                      ₹{Number(selectedStaff.monthlySalary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#F7F4EE] rounded-lg">
                    <span className="text-[10px] uppercase text-[#79695B] block font-semibold">Account Holder</span>
                    <span className="font-medium text-[#362A22] truncate block">
                      {selectedStaff.bankAccountHolder || "Not set"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#F7F4EE] rounded-lg">
                    <span className="text-[10px] uppercase text-[#79695B] block font-semibold">Account Number</span>
                    <span className="font-mono text-[#362A22] block">
                      {selectedStaff.bankAccountNumber || "Not set"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-[#F7F4EE] rounded-lg">
                    <span className="text-[10px] uppercase text-[#79695B] block font-semibold">IFSC Code</span>
                    <span className="font-mono uppercase text-[#362A22] block">
                      {selectedStaff.bankIfscCode || "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked System Records KPI Summary */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-[#F7F4EE] rounded-xl border border-[#EAE3D8]">
                  <span className="text-xl font-bold font-serif text-[#362A22] block">
                    {selectedStaff._count?.attendanceRecords || 0}
                  </span>
                  <span className="text-[10px] text-[#79695B] uppercase font-semibold">Attendance Logged</span>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                  <span className="text-xl font-bold font-serif text-emerald-800 block">
                    {selectedStaff._count?.salaryRecords || 0}
                  </span>
                  <span className="text-[10px] text-emerald-700 uppercase font-semibold">Payroll Slips</span>
                </div>
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100">
                  <span className="text-xl font-bold font-serif text-amber-800 block">
                    {selectedStaff._count?.advances || 0}
                  </span>
                  <span className="text-[10px] text-amber-700 uppercase font-semibold">Salary Advances</span>
                </div>
              </div>

              {/* Shift Notes */}
              {selectedStaff.notes && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <span className="font-bold block mb-0.5">Shift & Employment Remarks:</span>
                  {selectedStaff.notes}
                </div>
              )}

              {/* Quick Status Action Bar */}
              <div className="p-3 bg-[#F7F4EE] rounded-xl border border-[#E3D9CA] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#362A22]">Quick Status Change:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["ACTIVE", "INACTIVE", "RESIGNED", "TERMINATED"] as const).map((st) => (
                    <Button
                      key={st}
                      variant="outline"
                      size="sm"
                      disabled={selectedStaff.employmentStatus === st}
                      onClick={() => handleQuickStatusChange(selectedStaff.id, st)}
                      className={`h-7 px-2 text-[11px] font-semibold border-[#E3D9CA] ${
                        selectedStaff.employmentStatus === st
                          ? "bg-[#362A22] text-white"
                          : "bg-white text-[#79695B] hover:bg-[#EEE7DA]"
                      }`}
                    >
                      {st}
                    </Button>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-[#EAE3D8] flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetailsModalOpen(false);
                    handleOpenEdit(selectedStaff);
                  }}
                  className="text-xs border-[#E3D9CA] flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#B08A60]" />
                  <span>Edit Profile</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setDetailsModalOpen(false)}
                  className="bg-[#362A22] hover:bg-[#43352B] text-white text-xs"
                >
                  Close Dossier
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DELETE / ARCHIVE CONFIRMATION MODAL                                       */}
      {/* ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E3D9CA] shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-serif font-bold text-[#362A22]">
              Confirm Staff Deletion / Archival
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B] mt-1">
              Are you sure you want to remove{" "}
              <strong className="text-[#362A22]">{selectedStaff?.fullName}</strong> ({selectedStaff?.employeeCode})?
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1 my-2">
            <span className="font-bold block">Referential Integrity Protection:</span>
            <p>
              If this staff member has linked attendance logs, salary records, or advance disbursements, they will be safely marked as{" "}
              <strong>TERMINATED</strong> to preserve financial accounting history.
            </p>
          </div>

          <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              className="text-xs border-[#E3D9CA]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={submitting}
              onClick={handleDelete}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              {submitting ? "Processing..." : "Confirm Delete / Terminate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
