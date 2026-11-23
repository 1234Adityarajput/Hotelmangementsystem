"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Eye,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Trash2,
  X,
  Upload,
} from "lucide-react";
import { guestsService } from "@/services/guests.service";
import { Guest, GuestDocument } from "@/types";
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

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    alternateMobileNumber: "",
    email: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    dateOfBirth: "",
    gender: "MALE",
  });

  // Document upload state
  const [docType, setDocType] = useState("AADHAAR");
  const [docNumber, setDocNumber] = useState("");
  const [docRef, setDocRef] = useState("");

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const res = await guestsService.findAll({ search, page, limit: 10 });
      setGuests(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      toast.error("Failed to load guests from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [page, search]);

  const handleOpenAdd = () => {
    setFormData({
      fullName: "",
      mobileNumber: "",
      alternateMobileNumber: "",
      email: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      dateOfBirth: "",
      gender: "MALE",
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (guest: Guest) => {
    setSelectedGuest(guest);
    setFormData({
      fullName: guest.fullName || "",
      mobileNumber: guest.mobileNumber || "",
      alternateMobileNumber: guest.alternateMobileNumber || "",
      email: guest.email || "",
      address: guest.address || "",
      city: guest.city || "",
      state: guest.state || "",
      postalCode: guest.postalCode || "",
      country: guest.country || "India",
      dateOfBirth: guest.dateOfBirth ? guest.dateOfBirth.split("T")[0] : "",
      gender: guest.gender || "MALE",
    });
    setEditModalOpen(true);
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const g = await guestsService.findOne(id);
      setSelectedGuest(g);
      setDetailsModalOpen(true);
    } catch (err) {
      toast.error("Could not load full guest details");
    }
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.mobileNumber.trim()) {
      toast.error("Full Name and Mobile Number are required");
      return;
    }

    try {
      setSubmitting(true);
      await guestsService.create({
        ...formData,
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth : undefined,
      });
      toast.success("Guest registered successfully");
      setAddModalOpen(false);
      fetchGuests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error creating guest");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest) return;

    try {
      setSubmitting(true);
      await guestsService.update(selectedGuest.id, {
        ...formData,
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth : undefined,
      });
      toast.success("Guest updated successfully");
      setEditModalOpen(false);
      fetchGuests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error updating guest");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest) return;
    if (!docNumber.trim()) {
      toast.error("Document Number is required");
      return;
    }

    try {
      await guestsService.addDocument(selectedGuest.id, {
        documentType: docType,
        documentNumber: docNumber.trim(),
        documentFileReference: docRef.trim() || `docs/guest_${selectedGuest.guestCode}_${Date.now()}.pdf`,
      });
      toast.success("Identity document registered");
      setDocNumber("");
      setDocRef("");
      // Refresh current details
      const updated = await guestsService.findOne(selectedGuest.id);
      setSelectedGuest(updated);
    } catch (err: any) {
      toast.error("Error adding document");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!selectedGuest) return;
    try {
      await guestsService.deleteDocument(selectedGuest.id, docId);
      toast.success("Document removed");
      const updated = await guestsService.findOne(selectedGuest.id);
      setSelectedGuest(updated);
    } catch (err: any) {
      toast.error("Error deleting document");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E3D9CA]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#362A22]">
            Guest Directory
          </h2>
          <p className="text-xs text-[#79695B] mt-0.5">
            Manage customer profiles, contact information, identity documents, and stay histories.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="bg-[#362A22] hover:bg-[#43352B] text-white flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Guest</span>
        </Button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#948779] absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Search by name, mobile, or guest code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-white border-[#E3D9CA] text-xs shadow-sm"
          />
        </div>
        <div className="text-xs text-[#79695B]">
          Showing <span className="font-semibold text-[#5D493D]">{guests.length}</span> of{" "}
          <span className="font-semibold text-[#5D493D]">{total}</span> total guests
        </div>
      </div>

      {/* Guest Table */}
      <Card className="border-[#E3D9CA] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <LoadingSpinner className="w-6 h-6 text-[#B08A60]" />
            </div>
          ) : guests.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#79695B]">
              No guests found matching your query. Click &quot;Add New Guest&quot; to register one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F7F4EE] text-[#79695B] uppercase text-[11px] font-semibold border-b border-[#E3D9CA]">
                  <tr>
                    <th className="px-4 py-3">Guest Code</th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">City / Country</th>
                    <th className="px-4 py-3">ID Docs</th>
                    <th className="px-4 py-3">Stays</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3D8]">
                  {guests.map((g) => (
                    <tr key={g.id} className="hover:bg-[#F7F4EE]/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-[#B08A60]">
                        {g.guestCode}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#362A22]">
                        {g.fullName}
                      </td>
                      <td className="px-4 py-3 text-[#79695B]">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3 h-3 text-[#948779]" />
                          <span>{g.mobileNumber}</span>
                        </div>
                        {g.email && (
                          <div className="flex items-center gap-1.5 text-[#948779] text-[11px] mt-0.5">
                            <Mail className="w-3 h-3" />
                            <span>{g.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#79695B]">
                        {g.city ? `${g.city}, ` : ""}
                        {g.country || "India"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] bg-[#F7F4EE]">
                          {g.documents?.length || 0} Docs
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#5D493D]">{g.totalStays || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(g.id)}
                          className="h-7 px-2 text-[#79695B] hover:text-[#B08A60] hover:bg-[#F2EADF]"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(g)}
                          className="h-7 px-2 text-[#79695B] hover:text-[#B08A60] hover:bg-blue-50"
                          title="Edit Guest"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
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
            <div className="p-4 border-t border-[#EAE3D8] flex items-center justify-between text-xs">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-[#79695B]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Guest Dialog */}
      <Dialog open={addModalOpen || editModalOpen} onOpenChange={(open) => {
        if (!open) {
          setAddModalOpen(false);
          setEditModalOpen(false);
        }
      }}>
        <DialogContent className="max-w-xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#362A22]">
              {addModalOpen ? "Register New Guest" : "Update Guest Details"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Fill in customer profile information. All data is saved to live database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={addModalOpen ? handleCreateGuest : handleUpdateGuest} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#5D493D]">Full Name *</label>
                <Input
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#5D493D]">Mobile Number *</label>
                <Input
                  required
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#5D493D]">Alternate Mobile</label>
                <Input
                  value={formData.alternateMobileNumber}
                  onChange={(e) => setFormData({ ...formData, alternateMobileNumber: e.target.value })}
                  placeholder="+91..."
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#5D493D]">Email Address</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="guest@example.com"
                  className="h-8 text-xs"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="font-semibold text-[#5D493D]">Residential Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street / Apartment / Area"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#5D493D]">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Mumbai"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#5D493D]">State</label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Maharashtra"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#5D493D]">Postal Code</label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="400001"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#5D493D]">Country</label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="India"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#5D493D]">Date of Birth</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#5D493D]">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-[#EAE3D8]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddModalOpen(false);
                  setEditModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#362A22] hover:bg-[#43352B] text-white"
              >
                {submitting ? "Saving..." : addModalOpen ? "Register Guest" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Guest Details Sheet / Dialog */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-[#362A22]">
                  {selectedGuest?.fullName}
                </DialogTitle>
                <DialogDescription className="text-xs font-mono text-[#B08A60]">
                  {selectedGuest?.guestCode}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedGuest && (
            <div className="space-y-6 pt-2">
              {/* Profile Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-[#F7F4EE] rounded-xl text-xs">
                <div>
                  <span className="text-[#948779] block text-[10px] uppercase">Mobile</span>
                  <span className="font-mono font-medium text-[#362A22]">{selectedGuest.mobileNumber}</span>
                </div>
                <div>
                  <span className="text-[#948779] block text-[10px] uppercase">Email</span>
                  <span className="font-medium text-[#362A22]">{selectedGuest.email || "—"}</span>
                </div>
                <div>
                  <span className="text-[#948779] block text-[10px] uppercase">Gender</span>
                  <span className="font-medium text-[#362A22]">{selectedGuest.gender || "—"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#948779] block text-[10px] uppercase">Address</span>
                  <span className="text-[#362A22]">
                    {selectedGuest.address || ""} {selectedGuest.city ? `• ${selectedGuest.city}` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-[#948779] block text-[10px] uppercase">Total Stays</span>
                  <span className="font-bold text-[#362A22]">{selectedGuest.stayHistory?.length || 0}</span>
                </div>
              </div>

              {/* ID Documents Management */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#362A22] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#B08A60]" />
                  <span>Identity Documents</span>
                </h4>

                {/* Upload Form */}
                <form onSubmit={handleAddDocument} className="flex flex-wrap items-center gap-2 p-2.5 bg-[#F7F4EE] rounded-lg border border-[#E3D9CA]">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="h-7 text-xs border border-[#E3D9CA] rounded px-2 bg-white"
                  >
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                    <option value="VOTER_ID">Voter ID</option>
                  </select>
                  <Input
                    required
                    placeholder="Document Number (e.g. 1234-5678-9012)"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="h-7 text-xs flex-1 min-w-[180px]"
                  />
                  <Button type="submit" size="sm" className="h-7 text-xs bg-[#362A22] hover:bg-[#43352B] text-white">
                    <Plus className="w-3 h-3 mr-1" /> Add Doc
                  </Button>
                </form>

                {/* Document List */}
                <div className="space-y-1.5">
                  {selectedGuest.documents && selectedGuest.documents.length > 0 ? (
                    selectedGuest.documents.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-2 rounded-lg border border-[#E3D9CA] text-xs bg-white">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] bg-[#F7F4EE] font-semibold">
                            {d.documentType}
                          </Badge>
                          <span className="font-mono text-[#362A22]">{d.documentNumber}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(d.id)}
                          className="h-6 w-6 p-0 text-[#948779] hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-[#948779] italic py-1">No documents on file.</div>
                  )}
                </div>
              </div>

              {/* Stay History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#362A22] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#B08A60]" />
                  <span>Stay History</span>
                </h4>

                {selectedGuest.stayHistory && selectedGuest.stayHistory.length > 0 ? (
                  <div className="space-y-2">
                    {selectedGuest.stayHistory.map((s: any) => (
                      <div key={s.id} className="p-2.5 rounded-lg border border-[#E3D9CA] text-xs bg-white flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-[#362A22]">
                            Room {s.booking?.room?.roomNumber} ({s.booking?.room?.roomType?.name})
                          </span>
                          <span className="text-[11px] text-[#79695B] block">
                            {new Date(s.booking?.checkInDate).toLocaleDateString()} to{" "}
                            {new Date(s.booking?.expectedCheckOutDate).toLocaleDateString()}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {s.booking?.bookingStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-[#948779] italic py-1">No previous stays recorded.</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
