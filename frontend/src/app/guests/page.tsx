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
  ShieldCheck,
  UserPlus,
  Download,
  ExternalLink,
  FileCheck,
  CheckCircle2,
  UserCheck,
  Building,
  CreditCard,
} from "lucide-react";
import { guestsService } from "@/services/guests.service";
import { Guest, GuestDocument, AdditionalGuest } from "@/types";
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

const ID_PROOF_TYPES = [
  { value: "AADHAAR", label: "Aadhaar Card" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
  { value: "VOTER_ID", label: "Voter ID Card" },
  { value: "PAN_CARD", label: "PAN Card" },
  { value: "OTHER", label: "Government ID / Other" },
];

const RELATIONSHIPS = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Relative",
  "Friend",
  "Colleague",
  "Companion",
];

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterDocType, setFilterDocType] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [previewDocModalOpen, setPreviewDocModalOpen] = useState(false);
  const [previewDocData, setPreviewDocData] = useState<{
    type: string;
    number: string;
    reference: string;
    guestName: string;
  } | null>(null);

  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "documents" | "companions" | "history">("profile");

  // Form states (All 9 items)
  const [formData, setFormData] = useState({
    // 1. Full Name
    fullName: "",
    // 2. Mobile Numbers
    mobileNumber: "",
    alternateMobileNumber: "",
    // 3. Email Address
    email: "",
    // 4. Complete Address
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    // Demographics
    dateOfBirth: "",
    gender: "MALE",
    // 5. ID Proof Type
    idProofType: "AADHAAR",
    // 6. ID Proof Number
    idProofNumber: "",
    // 7. ID Proof Document Reference
    idProofDocument: "",
    // 8. Number of Guests
    numberOfGuests: 1,
    // 9. Additional Guest Information (Co-guests / Companions)
    additionalGuests: [] as AdditionalGuest[],
  });

  // Dedicated single-doc add state inside Dossier
  const [docType, setDocType] = useState("AADHAAR");
  const [docNumber, setDocNumber] = useState("");
  const [docRef, setDocRef] = useState("");

  // Dedicated single companion add state inside Dossier
  const [newCompanion, setNewCompanion] = useState<AdditionalGuest>({
    fullName: "",
    age: undefined,
    gender: "MALE",
    relationship: "Spouse",
    idProofType: "AADHAAR",
    idProofNumber: "",
    documentFileReference: "",
  });

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
      idProofType: "AADHAAR",
      idProofNumber: "",
      idProofDocument: "",
      numberOfGuests: 1,
      additionalGuests: [],
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
      idProofType: guest.idProofType || (guest.documents && guest.documents[0]?.documentType) || "AADHAAR",
      idProofNumber: guest.idProofNumber || (guest.documents && guest.documents[0]?.documentNumber) || "",
      idProofDocument: guest.idProofDocument || (guest.documents && guest.documents[0]?.documentFileReference) || "",
      numberOfGuests: guest.numberOfGuests || 1,
      additionalGuests: guest.additionalGuests || [],
    });
    setEditModalOpen(true);
  };

  const handleOpenDetails = async (id: string) => {
    try {
      const g = await guestsService.findOne(id);
      setSelectedGuest(g);
      setActiveTab("profile");
      setDetailsModalOpen(true);
    } catch (err) {
      toast.error("Could not load full guest details");
    }
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.mobileNumber.trim()) {
      toast.error("Guest Full Name and Mobile Number are required");
      return;
    }

    try {
      setSubmitting(true);
      await guestsService.create({
        ...formData,
        dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth : undefined,
        numberOfGuests: Number(formData.numberOfGuests) || 1,
      });
      toast.success("Guest registered with complete profile and identity records");
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
        numberOfGuests: Number(formData.numberOfGuests) || 1,
      });
      toast.success("Guest profile and companion details updated");
      setEditModalOpen(false);
      fetchGuests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error updating guest");
    } finally {
      setSubmitting(false);
    }
  };

  // Co-guest in-form helpers
  const handleAddCompanionToForm = () => {
    const nextParty = (formData.additionalGuests.length + 1) + 1;
    setFormData({
      ...formData,
      numberOfGuests: Math.max(formData.numberOfGuests, nextParty),
      additionalGuests: [
        ...formData.additionalGuests,
        {
          fullName: "",
          age: undefined,
          gender: "FEMALE",
          relationship: "Spouse",
          idProofType: "AADHAAR",
          idProofNumber: "",
          documentFileReference: "",
        },
      ],
    });
  };

  const handleRemoveCompanionFromForm = (index: number) => {
    const updated = formData.additionalGuests.filter((_, idx) => idx !== index);
    setFormData({
      ...formData,
      numberOfGuests: Math.max(1, updated.length + 1),
      additionalGuests: updated,
    });
  };

  const handleCompanionFieldChange = (index: number, field: keyof AdditionalGuest, value: any) => {
    const updated = [...formData.additionalGuests];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, additionalGuests: updated });
  };

  // Standalone Document Add inside Dossier
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
        documentFileReference: docRef.trim() || `docs/guests/${selectedGuest.guestCode}_${docType.toLowerCase()}_${Date.now()}.pdf`,
      });
      toast.success("Identity document registered successfully");
      setDocNumber("");
      setDocRef("");
      const updated = await guestsService.findOne(selectedGuest.id);
      setSelectedGuest(updated);
      fetchGuests();
    } catch (err: any) {
      toast.error("Error adding identity document");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!selectedGuest) return;
    try {
      await guestsService.deleteDocument(selectedGuest.id, docId);
      toast.success("Document removed");
      const updated = await guestsService.findOne(selectedGuest.id);
      setSelectedGuest(updated);
      fetchGuests();
    } catch (err: any) {
      toast.error("Error deleting document");
    }
  };

  // Standalone Companion Add inside Dossier
  const handleAddCoGuestStandalone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest) return;
    if (!newCompanion.fullName.trim()) {
      toast.error("Companion full name is required");
      return;
    }

    try {
      const updated = await guestsService.addCoGuest(selectedGuest.id, {
        ...newCompanion,
        age: newCompanion.age ? Number(newCompanion.age) : undefined,
      });
      toast.success("Companion guest added to registration");
      setNewCompanion({
        fullName: "",
        age: undefined,
        gender: "MALE",
        relationship: "Spouse",
        idProofType: "AADHAAR",
        idProofNumber: "",
        documentFileReference: "",
      });
      setSelectedGuest(updated);
      fetchGuests();
    } catch (err: any) {
      toast.error("Failed to add companion");
    }
  };

  const handleDeleteCoGuestStandalone = async (coGuestId: string) => {
    if (!selectedGuest) return;
    try {
      const updated = await guestsService.deleteCoGuest(selectedGuest.id, coGuestId);
      toast.success("Companion guest removed");
      setSelectedGuest(updated);
      fetchGuests();
    } catch (err: any) {
      toast.error("Failed to remove companion");
    }
  };

  const handleOpenDocPreview = (type: string, number: string, ref: string, guestName: string) => {
    setPreviewDocData({
      type,
      number,
      reference: ref,
      guestName,
    });
    setPreviewDocModalOpen(true);
  };

  // Filter guests by ID proof type if requested
  const filteredGuests = guests.filter((g) => {
    if (filterDocType === "ALL") return true;
    if (filterDocType === "WITH_DOCS") return (g.documents && g.documents.length > 0) || !!g.idProofType;
    if (filterDocType === "NO_DOCS") return (!g.documents || g.documents.length === 0) && !g.idProofType;
    return g.idProofType === filterDocType || g.documents?.some((d) => d.documentType === filterDocType);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Editorial Luxury Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#E8DDD8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-[#C4A06A] uppercase bg-[#F5F0EA] px-2.5 py-0.5 rounded-full">
              Hospitality Operations • Module 4
            </span>
            <span className="text-[11px] text-[#82747A]">• Complete Dossiers & Identity Proofs</span>
          </div>
          <h2 className="text-3xl font-serif font-bold tracking-tight text-[#59283A] mt-1">
            Guest Directory & Identity Verification
          </h2>
          <p className="text-xs text-[#82747A] mt-1 max-w-2xl">
            Maintain complete records of every guest: personal profiles, verified ID proof documents, party size, accompanying family members, and chronological stay histories.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleOpenAdd}
            className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-2 shadow-sm font-medium px-4 py-2"
          >
            <UserPlus className="w-4 h-4 text-[#C4A06A]" />
            <span>Register New Guest</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5F0EA] flex items-center justify-center text-[#59283A]">
              <Users className="w-5 h-5 text-[#C4A06A]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#8E7079] tracking-wider">Total Registered</p>
              <h3 className="text-xl font-serif font-bold text-[#59283A]">{total}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E7F1E9] flex items-center justify-center text-[#32765B]">
              <ShieldCheck className="w-5 h-5 text-[#32765B]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#8E7079] tracking-wider">Verified ID Records</p>
              <h3 className="text-xl font-serif font-bold text-[#32765B]">
                {guests.reduce((acc, g) => acc + (g.documents?.length || (g.idProofType ? 1 : 0)), 0)}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F6EDDC] flex items-center justify-center text-[#A97832]">
              <UserCheck className="w-5 h-5 text-[#A97832]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#8E7079] tracking-wider">Active Stays</p>
              <h3 className="text-xl font-serif font-bold text-[#A97832]">
                {guests.filter((g) => (g.totalStays || 0) > 0).length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E8DDD8] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9EFF3] flex items-center justify-center text-[#627D91]">
              <FileCheck className="w-5 h-5 text-[#627D91]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#8E7079] tracking-wider">Co-Guests / Companions</p>
              <h3 className="text-xl font-serif font-bold text-[#627D91]">
                {guests.reduce((acc, g) => acc + (g.additionalGuests?.length || 0), 0)}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search, Filter & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E8DDD8] shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#8E7079] absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Search by full name, mobile number, code, or city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-[#F5F0EA] border-[#E8DDD8] text-xs h-9 focus-visible:ring-[#C4A06A]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#82747A] whitespace-nowrap">Filter ID:</span>
          <select
            value={filterDocType}
            onChange={(e) => setFilterDocType(e.target.value)}
            className="h-9 text-xs border border-[#E8DDD8] rounded-lg px-2.5 bg-[#F5F0EA] text-[#59283A]"
          >
            <option value="ALL">All Guests</option>
            <option value="WITH_DOCS">Verified (With ID Proof)</option>
            <option value="NO_DOCS">Pending ID Proof</option>
            <option value="AADHAAR">Aadhaar Card</option>
            <option value="PASSPORT">Passport</option>
            <option value="DRIVING_LICENSE">Driving License</option>
            <option value="VOTER_ID">Voter ID</option>
            <option value="PAN_CARD">PAN Card</option>
          </select>
          <div className="text-xs text-[#82747A] pl-2 border-l border-[#E8DDD8]">
            Total: <span className="font-semibold text-[#59283A]">{filteredGuests.length}</span>
          </div>
        </div>
      </div>

      {/* Master Guest Table */}
      <Card className="border-[#E8DDD8] shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex flex-col justify-center items-center gap-3">
              <LoadingSpinner text="Loading Guest Profiles & Identities..." subtext="Retrieving guest directory and stay histories..." />
              <p className="text-xs text-[#82747A]">Querying Neon PostgreSQL guest records...</p>
            </div>
          ) : filteredGuests.length === 0 ? (
            <div className="p-16 text-center text-xs text-[#82747A] space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F5F0EA] text-[#C4A06A] flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <p className="font-medium text-[#59283A]">No guest records match your search or filter criteria.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAdd}
                className="border-[#C4A06A] text-[#59283A] hover:bg-[#F5F0EA]"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" /> Register New Guest
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[11px] font-semibold border-b border-[#E8DDD8]">
                  <tr>
                    <th className="px-4 py-3.5">Guest Code</th>
                    <th className="px-4 py-3.5">Guest Full Name</th>
                    <th className="px-4 py-3.5">Contact Details</th>
                    <th className="px-4 py-3.5">Complete Address</th>
                    <th className="px-4 py-3.5">ID Proof & Document</th>
                    <th className="px-4 py-3.5 text-center">Party Size</th>
                    <th className="px-4 py-3.5 text-center">Stays</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDD8]">
                  {filteredGuests.map((g) => {
                    const primaryDoc = g.documents?.[0];
                    const docTypeDisplay = g.idProofType || primaryDoc?.documentType;
                    const docNumberDisplay = g.idProofNumber || primaryDoc?.documentNumber;
                    const docRefDisplay = g.idProofDocument || primaryDoc?.documentFileReference;
                    const partyCount = g.numberOfGuests || (g.additionalGuests ? 1 + g.additionalGuests.length : 1);

                    return (
                      <tr key={g.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                        {/* Guest Code */}
                        <td className="px-4 py-3.5 font-mono font-medium text-[#C4A06A]">
                          <span className="bg-[#F5F0EA]/70 px-2 py-0.5 rounded text-[11px]">
                            {g.guestCode}
                          </span>
                        </td>

                        {/* Guest Full Name & Gender */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-[#59283A] text-sm">
                            {g.fullName}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#82747A]">
                            {g.gender && (
                              <span className="capitalize">{g.gender.toLowerCase()}</span>
                            )}
                            {g.dateOfBirth && (
                              <span>• DOB: {new Date(g.dateOfBirth).toLocaleDateString("en-IN")}</span>
                            )}
                          </div>
                        </td>

                        {/* Contact Information */}
                        <td className="px-4 py-3.5 text-[#82747A]">
                          <div className="flex items-center gap-1.5 font-mono text-[#59283A] font-medium">
                            <Phone className="w-3.5 h-3.5 text-[#C4A06A]" />
                            <span>{g.mobileNumber}</span>
                          </div>
                          {g.alternateMobileNumber && (
                            <div className="text-[11px] text-[#8E7079] font-mono pl-5">
                              Alt: {g.alternateMobileNumber}
                            </div>
                          )}
                          {g.email && (
                            <div className="flex items-center gap-1.5 text-[#82747A] text-[11px] mt-0.5">
                              <Mail className="w-3 h-3 text-[#8E7079]" />
                              <span>{g.email}</span>
                            </div>
                          )}
                        </td>

                        {/* Complete Address */}
                        <td className="px-4 py-3.5 text-[#82747A] max-w-[200px]">
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#C4A06A] shrink-0 mt-0.5" />
                            <div className="truncate">
                              {g.address ? (
                                <span className="text-[#59283A] font-medium block truncate">
                                  {g.address}
                                </span>
                              ) : null}
                              <span className="text-[11px] text-[#82747A]">
                                {[g.city, g.state, g.postalCode, g.country || "India"]
                                  .filter(Boolean)
                                  .join(", ") || "No address on file"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* ID Proof Type, Number & Document Attachment */}
                        <td className="px-4 py-3.5">
                          {docTypeDisplay && docNumberDisplay ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-[#E7F1E9] text-[#32765B] border-[#32765B]/30 font-semibold uppercase"
                                >
                                  {docTypeDisplay}
                                </Badge>
                                <span className="font-mono font-medium text-[#59283A] text-[11px]">
                                  {docNumberDisplay}
                                </span>
                              </div>
                              {docRefDisplay && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenDocPreview(
                                      docTypeDisplay,
                                      docNumberDisplay,
                                      docRefDisplay,
                                      g.fullName
                                    )
                                  }
                                  className="flex items-center gap-1 text-[11px] text-[#C4A06A] hover:underline"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>View Document Proof</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-[#F8E8E5] text-[#B54C44] border-[#B54C44]/30"
                            >
                              Missing ID Proof
                            </Badge>
                          )}
                        </td>

                        {/* Number of Guests & Companions */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F0EA] text-[#59283A]">
                              <Users className="w-3 h-3 text-[#C4A06A]" />
                              {partyCount} {partyCount === 1 ? "Guest" : "Guests"}
                            </span>
                            {g.additionalGuests && g.additionalGuests.length > 0 && (
                              <span className="text-[10px] text-[#82747A] mt-0.5">
                                +{g.additionalGuests.length} companion{g.additionalGuests.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Stays Count */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-bold text-[#59283A] bg-[#F5F0EA] px-2 py-0.5 rounded-md">
                            {g.totalStays || 0}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetails(g.id)}
                            className="h-7 px-2 text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA]"
                            title="View Complete Guest Dossier"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                            <span>Dossier</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(g)}
                            className="h-7 px-2 text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA]"
                            title="Edit Guest & Companions"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            <span>Edit</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[#E8DDD8] flex items-center justify-between text-xs bg-[#F5F0EA]/30">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-[#E8DDD8]"
              >
                Previous
              </Button>
              <span className="text-[#82747A]">
                Page <strong className="text-[#59283A]">{page}</strong> of{" "}
                <strong className="text-[#59283A]">{totalPages}</strong> ({total} total guests)
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="border-[#E8DDD8]"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* ADD / EDIT GUEST MODAL (WITH ALL 9 REQUIRED FIELDS)                       */}
      {/* ========================================================================= */}
      <Dialog
        open={addModalOpen || editModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddModalOpen(false);
            setEditModalOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto border-[#E8DDD8] shadow-2xl">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F5F0EA] text-[#C4A06A] px-2 py-0.5 rounded">
                {addModalOpen ? "New Guest Registration" : "Guest Profile Update"}
              </span>
            </div>
            <DialogTitle className="text-xl font-serif font-bold text-[#59283A] mt-1">
              {addModalOpen ? "Register Guest & Identity Details" : `Update ${formData.fullName || "Guest"}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Provide complete guest credentials, verified ID proof details, party count, and accompanying companions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={addModalOpen ? handleCreateGuest : handleUpdateGuest} className="space-y-6 pt-3">
            {/* 1. Primary Guest Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#59283A] uppercase tracking-wider flex items-center gap-2 border-b border-[#E8DDD8] pb-1.5">
                <Users className="w-3.5 h-3.5 text-[#C4A06A]" />
                <span>1. Guest Profile Information</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* 1. Full Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-[#59283A]">Guest Full Name *</label>
                  <Input
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Patel"
                    className="h-8 text-xs border-[#E8DDD8]"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">Date of Birth</label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="h-8 text-xs border-[#E8DDD8]"
                  />
                </div>

                {/* 2. Mobile Number */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">Mobile Number *</label>
                  <Input
                    required
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="h-8 text-xs font-mono border-[#E8DDD8]"
                  />
                </div>

                {/* Alternate Mobile */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">Alternate Mobile Number</label>
                  <Input
                    value={formData.alternateMobileNumber}
                    onChange={(e) => setFormData({ ...formData, alternateMobileNumber: e.target.value })}
                    placeholder="+91..."
                    className="h-8 text-xs font-mono border-[#E8DDD8]"
                  />
                </div>

                {/* 3. Email Address */}
                <div className="space-y-1 sm:col-span-3">
                  <label className="font-semibold text-[#59283A]">Email Address</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ramesh.patel@example.com"
                    className="h-8 text-xs border-[#E8DDD8]"
                  />
                </div>
              </div>
            </div>

            {/* 4. Complete Address */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#59283A] uppercase tracking-wider flex items-center gap-2 border-b border-[#E8DDD8] pb-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C4A06A]" />
                <span>4. Complete Address</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-3 space-y-1">
                  <label className="font-semibold text-[#59283A]">Street Address / House / Flat Number</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Flat 402, Royal Palms, MG Road"
                    className="h-8 text-xs border-[#E8DDD8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">City</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Mumbai / New Delhi"
                    className="h-8 text-xs border-[#E8DDD8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">State</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="h-8 text-xs border-[#E8DDD8]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">Postal Code / PIN Code</label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="400001"
                    className="h-8 text-xs font-mono border-[#E8DDD8]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-3">
                  <label className="font-semibold text-[#59283A]">Country</label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="India"
                    className="h-8 text-xs border-[#E8DDD8]"
                  />
                </div>
              </div>
            </div>

            {/* 5, 6, 7. ID Proof Type, Number & Document Attachment */}
            <div className="space-y-3 bg-[#F5F0EA] p-3.5 rounded-xl border border-[#E8DDD8]">
              <h4 className="text-xs font-bold text-[#59283A] uppercase tracking-wider flex items-center justify-between border-b border-[#E8DDD8] pb-1.5">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#32765B]" />
                  <span>5, 6, 7. Government ID Proof & Document Attachment</span>
                </span>
                <span className="text-[10px] text-[#32765B] font-semibold bg-[#E7F1E9] px-2 py-0.5 rounded">
                  Regulatory Compliance
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* 5. ID Proof Type */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#59283A]">ID Proof Type</label>
                  <select
                    value={formData.idProofType}
                    onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
                    className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white"
                  >
                    {ID_PROOF_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. ID Proof Number */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-[#59283A]">ID Proof Number / Document ID</label>
                  <Input
                    value={formData.idProofNumber}
                    onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
                    placeholder="e.g. 1234-5678-9012 or Z8192019"
                    className="h-8 text-xs font-mono border-[#E8DDD8] bg-white"
                  />
                </div>

                {/* 7. ID Proof Document Reference / File Picker */}
                <div className="space-y-1 sm:col-span-3">
                  <label className="font-semibold text-[#59283A] flex items-center justify-between">
                    <span>ID Proof Document Reference (Scan / PDF / Photo)</span>
                    <span className="text-[10px] text-[#8E7079]">Safe internal archive reference</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.idProofDocument}
                      onChange={(e) => setFormData({ ...formData, idProofDocument: e.target.value })}
                      placeholder="e.g. docs/guests/aadhaar_ramesh_scan.pdf"
                      className="h-8 text-xs border-[#E8DDD8] bg-white font-mono flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fakeRef = `docs/guests/id_${formData.idProofType.toLowerCase()}_${Date.now()}.pdf`;
                        setFormData({ ...formData, idProofDocument: fakeRef });
                        toast.success("Document attached to guest registration");
                      }}
                      className="h-8 text-xs border-[#C4A06A] text-[#59283A] hover:bg-[#F5F0EA] shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                      Attach Doc
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 8. Number of Guests & 9. Additional Guest Information (Companions) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8DDD8] pb-1.5">
                <h4 className="text-xs font-bold text-[#59283A] uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-[#C4A06A]" />
                  <span>8. Number of Guests & 9. Additional Guest Information</span>
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCompanionToForm}
                  className="h-7 text-xs border-[#C4A06A] text-[#59283A] hover:bg-[#F5F0EA]"
                >
                  <Plus className="w-3 h-3 mr-1 text-[#C4A06A]" />
                  Add Companion
                </Button>
              </div>

              {/* 8. Total Number of Guests */}
              <div className="flex items-center gap-4 bg-[#F5F0EA] p-3 rounded-lg border border-[#E8DDD8]">
                <div className="text-xs font-semibold text-[#59283A] flex-1">
                  Total Guests in Party (Primary Guest + Accompanying Guests):
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 border-[#E8DDD8] bg-white"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        numberOfGuests: Math.max(1, (formData.numberOfGuests || 1) - 1),
                      })
                    }
                  >
                    -
                  </Button>
                  <span className="font-bold text-sm text-[#59283A] w-8 text-center">
                    {formData.numberOfGuests || 1}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 border-[#E8DDD8] bg-white"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        numberOfGuests: (formData.numberOfGuests || 1) + 1,
                      })
                    }
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* 9. Additional Guest Information (List of companions) */}
              <div className="space-y-3">
                {formData.additionalGuests.length === 0 ? (
                  <div className="text-center py-4 bg-white border border-dashed border-[#E8DDD8] rounded-xl text-xs text-[#82747A]">
                    No additional companions added yet. Click &quot;Add Companion&quot; to register family members or co-travelers.
                  </div>
                ) : (
                  formData.additionalGuests.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-[#E8DDD8] space-y-2.5 relative shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#59283A] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#F5F0EA] text-[#59283A] flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          Companion Details
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCompanionFromForm(idx)}
                          className="h-6 px-2 text-[#8E7079] hover:text-[#B54C44] hover:bg-[#F8E8E5]"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-[#82747A]">Companion Full Name *</label>
                          <Input
                            required
                            value={comp.fullName}
                            onChange={(e) => handleCompanionFieldChange(idx, "fullName", e.target.value)}
                            placeholder="e.g. Suman Patel"
                            className="h-7 text-xs border-[#E8DDD8]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#82747A]">Relationship</label>
                          <select
                            value={comp.relationship || "Spouse"}
                            onChange={(e) => handleCompanionFieldChange(idx, "relationship", e.target.value)}
                            className="w-full h-7 text-xs border border-[#E8DDD8] rounded px-2 bg-white"
                          >
                            {RELATIONSHIPS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#82747A]">Age</label>
                          <Input
                            type="number"
                            min={1}
                            max={120}
                            value={comp.age || ""}
                            onChange={(e) =>
                              handleCompanionFieldChange(
                                idx,
                                "age",
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                            placeholder="Age"
                            className="h-7 text-xs border-[#E8DDD8]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#82747A]">Gender</label>
                          <select
                            value={comp.gender || "FEMALE"}
                            onChange={(e) => handleCompanionFieldChange(idx, "gender", e.target.value)}
                            className="w-full h-7 text-xs border border-[#E8DDD8] rounded px-2 bg-white"
                          >
                            <option value="FEMALE">Female</option>
                            <option value="MALE">Male</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-[#82747A]">ID Proof Type</label>
                          <select
                            value={comp.idProofType || "AADHAAR"}
                            onChange={(e) => handleCompanionFieldChange(idx, "idProofType", e.target.value)}
                            className="w-full h-7 text-xs border border-[#E8DDD8] rounded px-2 bg-white"
                          >
                            {ID_PROOF_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-[#82747A]">ID Proof Number</label>
                          <Input
                            value={comp.idProofNumber || ""}
                            onChange={(e) => handleCompanionFieldChange(idx, "idProofNumber", e.target.value)}
                            placeholder="Companion ID number"
                            className="h-7 text-xs font-mono border-[#E8DDD8]"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-[#E8DDD8]">
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
                className="bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner className="w-3.5 h-3.5 mr-1" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#C4A06A]" />
                    <span>{addModalOpen ? "Complete Guest Registration" : "Save All Changes"}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* GUEST DOSSIER / VIEW DETAILS DIALOG (EDITORIAL LUXURY)                     */}
      {/* ========================================================================= */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-3xl bg-white max-h-[88vh] overflow-y-auto border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#C4A06A] bg-[#F5F0EA] px-2.5 py-0.5 rounded">
                    {selectedGuest?.guestCode}
                  </span>
                  <span className="text-xs text-[#32765B] font-semibold bg-[#E7F1E9] px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#32765B]" />
                    Verified Guest Profile
                  </span>
                </div>
                <DialogTitle className="text-2xl font-serif font-bold text-[#59283A] mt-1.5">
                  {selectedGuest?.fullName}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#82747A]">
                  Member since {selectedGuest?.createdAt ? new Date(selectedGuest.createdAt).toLocaleDateString("en-IN") : "—"} • Complete Hospitality Dossier
                </DialogDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetailsModalOpen(false);
                    if (selectedGuest) handleOpenEdit(selectedGuest);
                  }}
                  className="border-[#C4A06A] text-[#59283A] hover:bg-[#F5F0EA] text-xs h-8"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                  Edit Dossier
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#E8DDD8] mt-4 -mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === "profile"
                    ? "border-[#C4A06A] text-[#59283A]"
                    : "border-transparent text-[#82747A] hover:text-[#59283A]"
                }`}
              >
                Profile & Address
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "documents"
                    ? "border-[#C4A06A] text-[#59283A]"
                    : "border-transparent text-[#82747A] hover:text-[#59283A]"
                }`}
              >
                <span>ID Proofs</span>
                <span className="w-4 h-4 rounded-full bg-[#F5F0EA] text-[10px] flex items-center justify-center text-[#59283A]">
                  {selectedGuest?.documents?.length || (selectedGuest?.idProofType ? 1 : 0)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("companions")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "companions"
                    ? "border-[#C4A06A] text-[#59283A]"
                    : "border-transparent text-[#82747A] hover:text-[#59283A]"
                }`}
              >
                <span>Party & Co-Guests</span>
                <span className="w-4 h-4 rounded-full bg-[#F5F0EA] text-[10px] flex items-center justify-center text-[#59283A]">
                  {selectedGuest?.additionalGuests?.length || 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "history"
                    ? "border-[#C4A06A] text-[#59283A]"
                    : "border-transparent text-[#82747A] hover:text-[#59283A]"
                }`}
              >
                <span>Stay History</span>
                <span className="w-4 h-4 rounded-full bg-[#F5F0EA] text-[10px] flex items-center justify-center text-[#59283A]">
                  {selectedGuest?.stayHistory?.length || 0}
                </span>
              </button>
            </div>
          </DialogHeader>

          {selectedGuest && (
            <div className="pt-4">
              {/* TAB 1: PROFILE & ADDRESS */}
              {activeTab === "profile" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8]">
                    <div>
                      <span className="text-[#8E7079] block text-[10px] uppercase font-bold tracking-wider">
                        Primary Mobile Number
                      </span>
                      <span className="font-mono font-semibold text-sm text-[#59283A]">
                        {selectedGuest.mobileNumber}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#8E7079] block text-[10px] uppercase font-bold tracking-wider">
                        Alternate Mobile
                      </span>
                      <span className="font-mono text-[#59283A]">
                        {selectedGuest.alternateMobileNumber || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#8E7079] block text-[10px] uppercase font-bold tracking-wider">
                        Email Address
                      </span>
                      <span className="text-[#59283A]">{selectedGuest.email || "—"}</span>
                    </div>

                    <div>
                      <span className="text-[#8E7079] block text-[10px] uppercase font-bold tracking-wider">
                        Date of Birth
                      </span>
                      <span className="text-[#59283A]">
                        {selectedGuest.dateOfBirth
                          ? new Date(selectedGuest.dateOfBirth).toLocaleDateString("en-IN")
                          : "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#8E7079] block text-[10px] uppercase font-bold tracking-wider">
                        Gender
                      </span>
                      <span className="capitalize text-[#59283A]">
                        {selectedGuest.gender ? selectedGuest.gender.toLowerCase() : "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#8E7079] block text-[10px] uppercase font-bold tracking-wider">
                        Party Capacity
                      </span>
                      <span className="font-bold text-[#59283A]">
                        {selectedGuest.numberOfGuests || 1} Person(s)
                      </span>
                    </div>
                  </div>

                  {/* Complete Address Card */}
                  <div className="p-4 bg-white rounded-xl border border-[#E8DDD8] space-y-2">
                    <h5 className="font-bold text-[#59283A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C4A06A]" />
                      <span>Complete Residential Address</span>
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div className="col-span-2">
                        <span className="text-[#8E7079] block text-[10px]">Street Address</span>
                        <span className="font-medium text-[#59283A]">
                          {selectedGuest.address || "Not provided"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#8E7079] block text-[10px]">City</span>
                        <span className="font-medium text-[#59283A]">{selectedGuest.city || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[#8E7079] block text-[10px]">State</span>
                        <span className="font-medium text-[#59283A]">{selectedGuest.state || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[#8E7079] block text-[10px]">Postal Code</span>
                        <span className="font-mono text-[#59283A]">{selectedGuest.postalCode || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[#8E7079] block text-[10px]">Country</span>
                        <span className="font-medium text-[#59283A]">{selectedGuest.country || "India"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ID PROOFS & ATTACHMENTS */}
              {activeTab === "documents" && (
                <div className="space-y-4 text-xs">
                  {/* Register New ID Proof for this guest */}
                  <div className="p-3.5 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] space-y-2.5">
                    <h5 className="font-bold text-[#59283A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-[#C4A06A]" />
                      <span>Upload / Record Additional Identity Document</span>
                    </h5>

                    <form onSubmit={handleAddDocument} className="flex flex-wrap items-center gap-2 pt-1">
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white"
                      >
                        {ID_PROOF_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>

                      <Input
                        required
                        placeholder="Document Number (e.g. 1234-5678-9012)"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        className="h-8 text-xs flex-1 min-w-[180px] bg-white font-mono border-[#E8DDD8]"
                      />

                      <Input
                        placeholder="Document File Reference (optional)"
                        value={docRef}
                        onChange={(e) => setDocRef(e.target.value)}
                        className="h-8 text-xs flex-1 min-w-[180px] bg-white font-mono border-[#E8DDD8]"
                      />

                      <Button
                        type="submit"
                        size="sm"
                        className="h-8 text-xs bg-[#59283A] hover:bg-[#472130] text-white"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                        Save Document
                      </Button>
                    </form>
                  </div>

                  {/* Registered Documents List */}
                  <div className="space-y-2">
                    {selectedGuest.documents && selectedGuest.documents.length > 0 ? (
                      selectedGuest.documents.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-[#E8DDD8] bg-white shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#F5F0EA] flex items-center justify-center text-[#C4A06A]">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-[#E7F1E9] text-[#32765B] border-[#32765B]/30 font-bold"
                                >
                                  {d.documentType}
                                </Badge>
                                <span className="font-mono font-semibold text-sm text-[#59283A]">
                                  {d.documentNumber}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-[#82747A]">
                                <span className="font-mono text-[#8E7079] truncate max-w-[240px]">
                                  Ref: {d.documentFileReference}
                                </span>
                                <span>• Uploaded: {new Date(d.uploadedAt).toLocaleDateString("en-IN")}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleOpenDocPreview(
                                  d.documentType,
                                  d.documentNumber,
                                  d.documentFileReference,
                                  selectedGuest.fullName
                                )
                              }
                              className="h-7 text-xs border-[#C4A06A] text-[#59283A] hover:bg-[#F5F0EA]"
                            >
                              <Eye className="w-3 h-3 mr-1 text-[#C4A06A]" />
                              Preview
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(d.id)}
                              className="h-7 w-7 p-0 text-[#8E7079] hover:text-[#B54C44] hover:bg-[#F8E8E5]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 border border-dashed border-[#E8DDD8] rounded-xl text-xs text-[#82747A]">
                        No identity documents currently recorded for this guest. Use the form above to attach an Aadhaar, Passport, or License.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PARTY & CO-GUESTS (COMPANIONS) */}
              {activeTab === "companions" && (
                <div className="space-y-4 text-xs">
                  {/* Quick Add Co-Guest Form */}
                  <div className="p-3.5 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] space-y-2.5">
                    <h5 className="font-bold text-[#59283A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-[#C4A06A]" />
                      <span>Register Accompanying Guest / Companion</span>
                    </h5>

                    <form onSubmit={handleAddCoGuestStandalone} className="space-y-2 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-2">
                          <Input
                            required
                            placeholder="Companion Full Name *"
                            value={newCompanion.fullName}
                            onChange={(e) =>
                              setNewCompanion({ ...newCompanion, fullName: e.target.value })
                            }
                            className="h-8 text-xs bg-white border-[#E8DDD8]"
                          />
                        </div>

                        <div>
                          <select
                            value={newCompanion.relationship || "Spouse"}
                            onChange={(e) =>
                              setNewCompanion({ ...newCompanion, relationship: e.target.value })
                            }
                            className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white"
                          >
                            {RELATIONSHIPS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Input
                            type="number"
                            min={1}
                            max={120}
                            placeholder="Age"
                            value={newCompanion.age || ""}
                            onChange={(e) =>
                              setNewCompanion({
                                ...newCompanion,
                                age: e.target.value ? Number(e.target.value) : undefined,
                              })
                            }
                            className="h-8 text-xs bg-white border-[#E8DDD8]"
                          />
                        </div>

                        <div>
                          <select
                            value={newCompanion.gender || "FEMALE"}
                            onChange={(e) =>
                              setNewCompanion({ ...newCompanion, gender: e.target.value })
                            }
                            className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white"
                          >
                            <option value="FEMALE">Female</option>
                            <option value="MALE">Male</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        <div>
                          <select
                            value={newCompanion.idProofType || "AADHAAR"}
                            onChange={(e) =>
                              setNewCompanion({ ...newCompanion, idProofType: e.target.value })
                            }
                            className="w-full h-8 text-xs border border-[#E8DDD8] rounded-md px-2 bg-white"
                          >
                            {ID_PROOF_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <Input
                            placeholder="ID Proof Number"
                            value={newCompanion.idProofNumber || ""}
                            onChange={(e) =>
                              setNewCompanion({ ...newCompanion, idProofNumber: e.target.value })
                            }
                            className="h-8 text-xs bg-white font-mono border-[#E8DDD8]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <Button
                          type="submit"
                          size="sm"
                          className="h-8 text-xs bg-[#59283A] hover:bg-[#472130] text-white"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1 text-[#C4A06A]" />
                          Add Companion to Dossier
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Companion Roster */}
                  <div className="space-y-2">
                    {selectedGuest.additionalGuests && selectedGuest.additionalGuests.length > 0 ? (
                      selectedGuest.additionalGuests.map((comp, idx) => (
                        <div
                          key={comp.id || idx}
                          className="flex items-center justify-between p-3 rounded-xl border border-[#E8DDD8] bg-white shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#F5F0EA] flex items-center justify-center text-[#59283A] font-bold text-xs">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-[#59283A]">
                                  {comp.fullName}
                                </span>
                                <Badge variant="outline" className="text-[10px] bg-[#F5F0EA] text-[#59283A]">
                                  {comp.relationship || "Companion"}
                                </Badge>
                                {comp.age && (
                                  <span className="text-[11px] text-[#82747A]">• {comp.age} yrs</span>
                                )}
                                {comp.gender && (
                                  <span className="text-[11px] text-[#82747A] capitalize">• {comp.gender.toLowerCase()}</span>
                                )}
                              </div>
                              {comp.idProofNumber && (
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#82747A]">
                                  <span className="font-medium text-[#59283A]">{comp.idProofType}:</span>
                                  <span className="font-mono">{comp.idProofNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {comp.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCoGuestStandalone(comp.id!)}
                              className="h-7 w-7 p-0 text-[#8E7079] hover:text-[#B54C44] hover:bg-[#F8E8E5]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 border border-dashed border-[#E8DDD8] rounded-xl text-xs text-[#82747A]">
                        No accompanying guests registered under this primary guest profile.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: STAY HISTORY */}
              {activeTab === "history" && (
                <div className="space-y-3 text-xs">
                  {selectedGuest.stayHistory && selectedGuest.stayHistory.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedGuest.stayHistory.map((s: any) => (
                        <div
                          key={s.id}
                          className="p-3 rounded-xl border border-[#E8DDD8] text-xs bg-white flex items-center justify-between shadow-sm"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#59283A]">
                                Room {s.booking?.room?.roomNumber}
                              </span>
                              <Badge variant="outline" className="text-[10px] bg-[#F5F0EA] text-[#59283A]">
                                {s.booking?.room?.roomType?.name}
                              </Badge>
                              <span className="font-mono text-[11px] text-[#C4A06A]">
                                #{s.booking?.bookingNumber}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#82747A] mt-1 flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-[#C4A06A]" />
                              <span>
                                {new Date(s.booking?.checkInDate).toLocaleDateString("en-IN")} to{" "}
                                {new Date(s.booking?.expectedCheckOutDate).toLocaleDateString("en-IN")}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              s.booking?.bookingStatus === "CHECKED_IN"
                                ? "bg-[#E7F1E9] text-[#32765B] border-[#32765B]/30"
                                : s.booking?.bookingStatus === "CHECKED_OUT"
                                ? "bg-[#F5F0EA] text-[#59283A]"
                                : "bg-[#F5F0EA] text-[#82747A]"
                            }`}
                          >
                            {s.booking?.bookingStatus}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-[#E8DDD8] rounded-xl text-xs text-[#82747A]">
                      <Calendar className="w-6 h-6 text-[#8E7079] mx-auto mb-1.5" />
                      <p>No previous hotel stays recorded for this guest profile.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* LUXURY ID DOCUMENT PREVIEW MODAL                                          */}
      {/* ========================================================================= */}
      <Dialog open={previewDocModalOpen} onOpenChange={setPreviewDocModalOpen}>
        <DialogContent className="max-w-lg bg-white border-[#E8DDD8] shadow-2xl p-6">
          <DialogHeader className="border-b border-[#E8DDD8] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#32765B]" />
              <span className="text-[10px] uppercase font-bold text-[#32765B] bg-[#E7F1E9] px-2 py-0.5 rounded">
                Verified Identity Proof
              </span>
            </div>
            <DialogTitle className="text-lg font-serif font-bold text-[#59283A] mt-1">
              {previewDocData?.type} • {previewDocData?.guestName}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Government-issued identity proof credentials on hotel security archive.
            </DialogDescription>
          </DialogHeader>

          {previewDocData && (
            <div className="space-y-4 pt-3">
              {/* Visual Simulated ID Card Container */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#59283A] to-[#7A4652] text-white shadow-lg relative overflow-hidden">
                {/* Holographic Watermark Simulation */}
                <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute right-4 top-4 text-[#C4A06A] font-serif font-bold tracking-widest text-[11px] uppercase">
                  Govt Document
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-14 rounded-lg bg-white/10 border border-white/20 flex flex-col items-center justify-center text-white/60">
                    <Users className="w-6 h-6" />
                    <span className="text-[8px] uppercase mt-1">Photo</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#C4A06A] font-bold block">
                      {previewDocData.type}
                    </span>
                    <h4 className="text-base font-bold text-white tracking-wide">
                      {previewDocData.guestName}
                    </h4>
                    <p className="font-mono text-sm tracking-wider text-amber-200 mt-1 font-bold">
                      {previewDocData.number}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-[10px] text-white/70 font-mono">
                  <span>REF: {previewDocData.reference}</span>
                  <span className="text-[#C4A06A] font-semibold">STATUS: VERIFIED</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewDocModalOpen(false)}
                  className="text-xs border-[#E8DDD8]"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    toast.success(`Exporting ${previewDocData.type} reference for ${previewDocData.guestName}`);
                  }}
                  className="text-xs bg-[#59283A] hover:bg-[#472130] text-white flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#C4A06A]" />
                  <span>Download Document</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
