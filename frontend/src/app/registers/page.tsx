"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  Users,
  BedDouble,
  CalendarCheck,
  Receipt,
  CreditCard,
  Briefcase,
  Clock,
  ArrowRight,
} from "lucide-react";
import { registersService } from "@/services/registers.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

const REGISTERS = [
  { id: "guests", label: "1. Guest Register", group: "Front Desk" },
  { id: "rooms", label: "2. Room Inventory Register", group: "Front Desk" },
  { id: "bookings", label: "3. Booking Register", group: "Stays" },
  { id: "arrivals", label: "4. Daily Arrival Register", group: "Stays" },
  { id: "inhouse", label: "5. In-House Guest Register", group: "Stays" },
  { id: "departures", label: "6. Daily Departure Register", group: "Stays" },
  { id: "items", label: "7. Services & Items Catalog", group: "Services" },
  { id: "invoices", label: "8. Billing & Invoice Register", group: "Financial" },
  { id: "payments", label: "9. Payment Inflow Register", group: "Financial" },
  { id: "staff", label: "10. Employee & Staff Register", group: "Staff" },
  { id: "attendance", label: "11. Daily Attendance Register", group: "Staff" },
  { id: "advances", label: "12. Staff Advance Ledger", group: "Staff" },
  { id: "salaries", label: "13. Monthly Salary Register", group: "Staff" },
  { id: "expenses", label: "14. Hotel Expense Register", group: "Financial" },
];

export default function DigitalRegistersPage() {
  const [activeRegister, setActiveRegister] = useState("bookings");
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchRegisterData = async () => {
    try {
      setLoading(true);
      const res = await registersService.getRegister({
        type: activeRegister,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 25,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      toast.error(`Failed to load ${activeRegister} register data`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisterData();
  }, [activeRegister, search, startDate, endDate, page]);

  const handleExportCSV = () => {
    if (items.length === 0) {
      toast.error("No records available to export");
      return;
    }

    try {
      // Flatten first record to get header keys
      const sample = items[0];
      const headers = Object.keys(sample).filter((k) => typeof sample[k] !== "object");
      const rows = items.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '""';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(","),
      );

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `hotel_register_${activeRegister}_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Register exported as CSV / Excel successfully!");
    } catch (err) {
      toast.error("Failed to generate CSV export");
    }
  };

  const currentMeta = REGISTERS.find((r) => r.id === activeRegister);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Digital Hotel Registers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official immutable read-only statutory registers. Search, filter, export to CSV/Excel, and print audit records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs flex items-center gap-1.5 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 border-emerald-300"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export to Excel/CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs flex items-center gap-1.5 bg-white text-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Register</span>
          </Button>
        </div>
      </div>

      {/* Register Selector Grid */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Select Statutory Register:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {REGISTERS.map((reg) => (
            <button
              key={reg.id}
              onClick={() => {
                setActiveRegister(reg.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRegister === reg.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {reg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500">Date Range:</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="h-8 text-xs w-36"
            placeholder="From"
          />
          <span className="text-xs text-slate-400">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="h-8 text-xs w-36"
            placeholder="To"
          />
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="h-8 text-xs text-rose-600"
            >
              Clear Dates
            </Button>
          )}
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <Input
            type="text"
            placeholder="Search register records..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Active Register Content */}
      <Card className="border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        <CardHeader className="bg-slate-50/60 border-b border-slate-200 py-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                {currentMeta?.label}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Total {total} entries recorded in database
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] bg-white border-slate-300">
              {currentMeta?.group} Register
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <LoadingSpinner className="w-6 h-6 text-indigo-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No entries found in {currentMeta?.label} matching your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                {/* Dynamically render headers based on active register */}
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    {activeRegister === "guests" && (
                      <>
                        <th className="px-4 py-3">Guest Code</th>
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">City / Country</th>
                        <th className="px-4 py-3">Stays</th>
                        <th className="px-4 py-3">Registered At</th>
                      </>
                    )}
                    {activeRegister === "rooms" && (
                      <>
                        <th className="px-4 py-3">Room #</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Floor</th>
                        <th className="px-4 py-3">Tariff / Night</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}
                    {activeRegister === "bookings" && (
                      <>
                        <th className="px-4 py-3">Booking #</th>
                        <th className="px-4 py-3">Guest Name</th>
                        <th className="px-4 py-3">Room</th>
                        <th className="px-4 py-3">Dates</th>
                        <th className="px-4 py-3">Nights</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}
                    {(activeRegister === "arrivals" || activeRegister === "inhouse" || activeRegister === "departures") && (
                      <>
                        <th className="px-4 py-3">Booking #</th>
                        <th className="px-4 py-3">Primary Guest</th>
                        <th className="px-4 py-3">Allocated Room</th>
                        <th className="px-4 py-3">Check-In</th>
                        <th className="px-4 py-3">Check-Out</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}
                    {activeRegister === "items" && (
                      <>
                        <th className="px-4 py-3">Item Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Unit Tariff</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}
                    {activeRegister === "invoices" && (
                      <>
                        <th className="px-4 py-3">Invoice #</th>
                        <th className="px-4 py-3">Booking #</th>
                        <th className="px-4 py-3">Guest</th>
                        <th className="px-4 py-3">Subtotal</th>
                        <th className="px-4 py-3">Total Amount</th>
                        <th className="px-4 py-3">Paid</th>
                        <th className="px-4 py-3">Balance</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}
                    {activeRegister === "payments" && (
                      <>
                        <th className="px-4 py-3">Payment Ref</th>
                        <th className="px-4 py-3">Booking #</th>
                        <th className="px-4 py-3">Channel</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}
                    {activeRegister === "staff" && (
                      <>
                        <th className="px-4 py-3">Emp Code</th>
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-4 py-3">Designation</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Monthly Wage</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}
                    {activeRegister === "attendance" && (
                      <>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Hours</th>
                        <th className="px-4 py-3">Overtime</th>
                      </>
                    )}
                    {activeRegister === "advances" && (
                      <>
                        <th className="px-4 py-3">Advance Ref</th>
                        <th className="px-4 py-3">Staff Name</th>
                        <th className="px-4 py-3">Disbursed</th>
                        <th className="px-4 py-3">Recovered</th>
                        <th className="px-4 py-3">Balance Due</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}
                    {activeRegister === "salaries" && (
                      <>
                        <th className="px-4 py-3">Period</th>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Payable Days</th>
                        <th className="px-4 py-3">Gross</th>
                        <th className="px-4 py-3">Net Salary</th>
                        <th className="px-4 py-3">Balance Due</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}
                    {activeRegister === "expenses" && (
                      <>
                        <th className="px-4 py-3">Expense Ref</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Channel</th>
                        <th className="px-4 py-3">Amount</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row: any) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      {activeRegister === "guests" && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium text-indigo-600">{row.guestCode}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{row.fullName}</td>
                          <td className="px-4 py-3 text-slate-600 font-mono">{row.mobileNumber}</td>
                          <td className="px-4 py-3 text-slate-600">{row.city || row.country || "-"}</td>
                          <td className="px-4 py-3 font-semibold">{row._count?.stayHistory || 0} Stays</td>
                          <td className="px-4 py-3 text-slate-400">{new Date(row.createdAt).toLocaleDateString()}</td>
                        </>
                      )}
                      {activeRegister === "rooms" && (
                        <>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">Room {row.roomNumber}</td>
                          <td className="px-4 py-3 text-slate-600">{row.roomType?.name}</td>
                          <td className="px-4 py-3">Floor {row.floor}</td>
                          <td className="px-4 py-3 font-mono font-semibold">₹{Number(row.pricePerNight)}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-semibold">{row.roomStatus}</Badge>
                          </td>
                        </>
                      )}
                      {activeRegister === "bookings" && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium text-indigo-600">{row.bookingNumber}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{row.primaryGuest?.fullName}</td>
                          <td className="px-4 py-3">Room {row.room?.roomNumber}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(row.checkInDate).toLocaleDateString()} → {new Date(row.expectedCheckOutDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-semibold">{row.numberOfNights} Nights</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-semibold">{row.bookingStatus}</Badge>
                          </td>
                        </>
                      )}
                      {(activeRegister === "arrivals" || activeRegister === "inhouse" || activeRegister === "departures") && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium text-indigo-600">{row.bookingNumber}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{row.primaryGuest?.fullName}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">Room {row.room?.roomNumber}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(row.checkInDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(row.expectedCheckOutDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-semibold">{row.bookingStatus}</Badge>
                          </td>
                        </>
                      )}
                      {activeRegister === "items" && (
                        <>
                          <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                          <td className="px-4 py-3 text-slate-600">{row.category?.name}</td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700">₹{Number(row.unitPrice)}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 text-emerald-700">Active</Badge>
                          </td>
                        </>
                      )}
                      {activeRegister === "invoices" && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium text-indigo-600">{row.invoiceNumber}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{row.booking?.bookingNumber}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{row.booking?.primaryGuest?.fullName}</td>
                          <td className="px-4 py-3 font-mono">₹{Number(row.subtotal).toFixed(2)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">₹{Number(row.totalAmount).toFixed(2)}</td>
                          <td className="px-4 py-3 font-mono text-emerald-600 font-semibold">₹{Number(row.totalPaid).toFixed(2)}</td>
                          <td className="px-4 py-3 font-mono text-amber-600 font-bold">₹{Number(row.balanceAmount).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-semibold">{row.invoiceStatus}</Badge>
                          </td>
                        </>
                      )}
                      {activeRegister === "payments" && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium text-indigo-600">{row.paymentReference}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">{row.booking?.bookingNumber}</td>
                          <td className="px-4 py-3 text-slate-700 font-medium">{row.paymentMethod}</td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-700">₹{Number(row.amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(row.paymentDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 text-emerald-700">{row.paymentStatus}</Badge>
                          </td>
                        </>
                      )}
                      {activeRegister === "staff" && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium text-indigo-600">{row.employeeCode}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{row.fullName}</td>
                          <td className="px-4 py-3 text-slate-700">{row.designation}</td>
                          <td className="px-4 py-3 text-slate-500">{row.department}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">₹{Number(row.monthlySalary).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-semibold">{row.employmentStatus}</Badge>
                          </td>
                        </>
                      )}
                      {activeRegister === "attendance" && (
                        <>
                          <td className="px-4 py-3 font-mono text-slate-600">{new Date(row.attendanceDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{row.staff?.fullName} ({row.staff?.employeeCode})</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-semibold">{row.attendanceStatus}</Badge>
                          </td>
                          <td className="px-4 py-3 font-mono">{Number(row.workingHours || 0)}h</td>
                          <td className="px-4 py-3 font-mono text-amber-600">{Number(row.overtimeHours || 0)}h</td>
                        </>
                      )}
                      {activeRegister === "advances" && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium text-indigo-600">{row.advanceReference}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{row.staff?.fullName}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-900">₹{Number(row.amount).toFixed(2)}</td>
                          <td className="px-4 py-3 font-mono text-emerald-600">₹{Number(row.recoveredAmount).toFixed(2)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-600">₹{Number(row.balanceAmount).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-semibold">{row.repaymentStatus}</Badge>
                          </td>
                        </>
                      )}
                      {activeRegister === "salaries" && (
                        <>
                          <td className="px-4 py-3 font-mono font-semibold text-indigo-600">{row.payrollMonth}/{row.payrollYear}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{row.staff?.fullName}</td>
                          <td className="px-4 py-3 font-mono">{Number(row.payableDays)} Days</td>
                          <td className="px-4 py-3 font-mono">₹{Number(row.grossSalary).toFixed(2)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-indigo-700">₹{Number(row.netSalary).toFixed(2)}</td>
                          <td className="px-4 py-3 font-mono font-bold text-amber-600">₹{Number(row.balanceAmount).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-semibold">{row.payrollStatus}</Badge>
                          </td>
                        </>
                      )}
                      {activeRegister === "expenses" && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium text-indigo-600">{row.expenseReference}</td>
                          <td className="px-4 py-3 text-slate-600">{new Date(row.paymentDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-slate-700">{row.category?.name}</td>
                          <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-xs">{row.description}</td>
                          <td className="px-4 py-3 text-slate-600">{row.paymentMethod}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">₹{Number(row.amount).toFixed(2)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing page {page} of {totalPages} ({total} total entries)</span>
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
    </div>
  );
}
