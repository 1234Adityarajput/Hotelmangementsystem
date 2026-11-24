"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  UtensilsCrossed,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Tag,
  Coffee,
  ShoppingBag,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Clock,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Eye,
  DollarSign,
  TrendingUp,
  Receipt,
  Bed,
  Shirt,
  Car,
  Sparkles,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { itemsService } from "@/services/items.service";
import { bookingsService } from "@/services/bookings.service";
import { Item, ItemCategory, Booking, GuestItemRecord } from "@/types";
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

export default function ItemsPage() {
  const [activeTab, setActiveTab] = useState<"catalog" | "guest-records" | "categories">("catalog");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [loading, setLoading] = useState(true);

  // Catalog items & categories
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Guest Item Records
  const [guestRecords, setGuestRecords] = useState<GuestItemRecord[]>([]);
  const [guestRecordsTotal, setGuestRecordsTotal] = useState(0);
  const [guestRecordsRevenue, setGuestRecordsRevenue] = useState(0);
  const [guestSearch, setGuestSearch] = useState("");
  const [guestDateFilter, setGuestDateFilter] = useState("");

  // Active in-house stays for posting charges
  const [activeStays, setActiveStays] = useState<Booking[]>([]);

  // Item Modals
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    categoryId: "",
    unitPrice: 200,
    description: "",
  });

  // Quick Price Update Modal
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [itemToUpdatePrice, setItemToUpdatePrice] = useState<Item | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);

  // Category Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ItemCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  // Post Purchase to Guest Stay Modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    bookingId: "",
    itemId: "",
    itemName: "",
    unitPrice: 0,
    quantity: 1,
    notes: "",
  });

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [iRes, cRes, gRes, staysRes] = await Promise.all([
        itemsService.findAllItems(
          selectedCategory !== "ALL" ? selectedCategory : undefined,
          search || undefined
        ),
        itemsService.findAllCategories(),
        itemsService.findAllGuestItemRecords({
          search: guestSearch || undefined,
          date: guestDateFilter || undefined,
          limit: 100,
        }),
        bookingsService.getActiveStays(),
      ]);

      setItems(iRes || []);
      setCategories(cRes || []);
      setGuestRecords(gRes?.items || []);
      setGuestRecordsTotal(gRes?.total || 0);
      setGuestRecordsRevenue(gRes?.totalAmountSum || 0);
      setActiveStays(staysRes || []);
    } catch (err) {
      toast.error("Failed to load catalog items and guest records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, search, guestSearch, guestDateFilter]);

  // Open Add Item Modal
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemForm({
      name: "",
      categoryId: categories[0]?.id || "",
      unitPrice: 200,
      description: "",
    });
    setItemModalOpen(true);
  };

  // Open Edit Item Modal
  const handleOpenEditItem = (it: Item) => {
    setEditingItem(it);
    setItemForm({
      name: it.name,
      categoryId: it.categoryId,
      unitPrice: Number(it.unitPrice),
      description: it.description || "",
    });
    setItemModalOpen(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim() || !itemForm.categoryId) {
      toast.error("Item Name and Category are required");
      return;
    }

    try {
      setSubmitting(true);
      if (editingItem) {
        await itemsService.updateItem(editingItem.id, {
          name: itemForm.name.trim(),
          categoryId: itemForm.categoryId,
          unitPrice: Number(itemForm.unitPrice),
          description: itemForm.description.trim() || undefined,
        });
        toast.success(`Item "${itemForm.name}" updated successfully.`);
      } else {
        await itemsService.createItem({
          name: itemForm.name.trim(),
          categoryId: itemForm.categoryId,
          unitPrice: Number(itemForm.unitPrice),
          description: itemForm.description.trim() || undefined,
        });
        toast.success(`New item "${itemForm.name}" added to catalog.`);
      }
      setItemModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save catalog item");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Price Setter
  const handleOpenPriceModal = (it: Item) => {
    setItemToUpdatePrice(it);
    setNewPrice(Number(it.unitPrice));
    setPriceModalOpen(true);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToUpdatePrice) return;
    if (newPrice < 0) {
      toast.error("Price cannot be negative");
      return;
    }

    try {
      setSubmitting(true);
      await itemsService.updatePrice(itemToUpdatePrice.id, Number(newPrice));
      toast.success(`Price for "${itemToUpdatePrice.name}" updated to ₹${newPrice}.`);
      setPriceModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update price");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Item
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setSubmitting(true);
      const res = await itemsService.deleteItem(itemToDelete.id);
      toast.success(res.message || "Item removed from catalog.");
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete item");
    } finally {
      setSubmitting(false);
    }
  };

  // Category Actions
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", description: "" });
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: ItemCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      description: cat.description || "",
    });
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSubmitting(true);
      if (editingCategory) {
        await itemsService.updateCategory(editingCategory.id, categoryForm);
        toast.success(`Category "${categoryForm.name}" updated.`);
      } else {
        await itemsService.createCategory(categoryForm);
        toast.success(`Category "${categoryForm.name}" created.`);
      }
      setCategoryModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: ItemCategory) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      await itemsService.deleteCategory(cat.id);
      toast.success("Category deleted successfully.");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    }
  };

  // Post Purchase to Guest Stay
  const handleOpenOrderModal = (item?: Item) => {
    if (activeStays.length === 0) {
      toast.error("No active checked-in guests currently in hotel.");
      return;
    }

    const defaultItem = item || items[0];
    setOrderForm({
      bookingId: activeStays[0].id,
      itemId: defaultItem ? defaultItem.id : "",
      itemName: defaultItem ? defaultItem.name : "",
      unitPrice: defaultItem ? Number(defaultItem.unitPrice) : 250,
      quantity: 1,
      notes: "",
    });
    setOrderModalOpen(true);
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.bookingId) {
      toast.error("Please select an in-house guest stay");
      return;
    }
    if (!orderForm.itemName.trim()) {
      toast.error("Please enter an item or service name");
      return;
    }

    try {
      setSubmitting(true);
      await itemsService.addBookingItem({
        bookingId: orderForm.bookingId,
        itemId: orderForm.itemId || undefined,
        itemName: orderForm.itemName.trim(),
        unitPrice: Number(orderForm.unitPrice),
        quantity: Number(orderForm.quantity),
        notes: orderForm.notes.trim() || undefined,
      });

      toast.success(
        `Charged ${orderForm.quantity}x "${orderForm.itemName}" to guest stay. Final bill updated automatically!`
      );
      setOrderModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to post item charge");
    } finally {
      setSubmitting(false);
    }
  };

  // Void / Remove a Guest Purchase Record
  const handleVoidGuestRecord = async (record: GuestItemRecord) => {
    if (
      !confirm(
        `Are you sure you want to remove "${record.itemName}" (₹${record.totalAmount}) from Room ${record.roomNumber}? This will automatically adjust the guest's final bill.`
      )
    ) {
      return;
    }

    try {
      await itemsService.deleteBookingItem(record.id);
      toast.success("Guest purchase removed and billing folio automatically adjusted.");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove purchase record");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8DDD8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-[#F5F0EA] text-[#59283A] rounded-full border border-[#E8DDD8] tracking-wide uppercase">
              Module 8 • Operations
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#32765B] font-medium bg-[#E7F1E9] px-2 py-0.5 rounded-full border border-[#C5DFD0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#32765B] animate-pulse"></span>
              Live Stay Linking Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#59283A] mt-1.5 tracking-tight">
            Hotel Items & Services Management
          </h1>
          <p className="text-xs sm:text-sm text-[#82747A] mt-1 max-w-3xl">
            Maintain the hotel&apos;s complete catalog of items, dining menus, and guest services. Set prices, organize categories, and link all purchases directly to guest stays.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => handleOpenAddCategory()}
            className="border-[#E8DDD8] bg-white hover:bg-[#F5F0EA] text-[#59283A] text-xs h-9 px-3"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5 text-[#C4A06A]" />
            Manage Categories
          </Button>

          <Button
            onClick={() => handleOpenOrderModal()}
            className="bg-[#C4A06A] hover:bg-[#97734E] text-white text-xs h-9 px-3.5 shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
            Post Purchase to Guest
          </Button>

          <Button
            onClick={handleOpenAddItem}
            className="bg-[#59283A] hover:bg-[#472130] text-white text-xs h-9 px-3.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add New Item
          </Button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-[#E8DDD8] bg-white shadow-sm p-4">
          <div className="flex items-center justify-between text-xs text-[#82747A] mb-1">
            <span>Total Catalog Items</span>
            <UtensilsCrossed className="w-3.5 h-3.5 text-[#C4A06A]" />
          </div>
          <div className="text-xl font-bold font-serif text-[#59283A]">{items.length}</div>
          <p className="text-[10px] text-[#8E7079] mt-0.5">Active items & services</p>
        </Card>

        <Card className="border-[#E8DDD8] bg-white shadow-sm p-4">
          <div className="flex items-center justify-between text-xs text-[#82747A] mb-1">
            <span>Item Categories</span>
            <Layers className="w-3.5 h-3.5 text-[#C4A06A]" />
          </div>
          <div className="text-xl font-bold font-serif text-[#59283A]">{categories.length}</div>
          <p className="text-[10px] text-[#8E7079] mt-0.5">F&B, laundry, transport, etc.</p>
        </Card>

        <Card className="border-[#E8DDD8] bg-white shadow-sm p-4">
          <div className="flex items-center justify-between text-xs text-[#82747A] mb-1">
            <span>Guest Purchases Logged</span>
            <ShoppingBag className="w-3.5 h-3.5 text-[#32765B]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#59283A]">{guestRecordsTotal}</div>
          <p className="text-[10px] text-[#8E7079] mt-0.5">Stay purchase orders</p>
        </Card>

        <Card className="border-[#E8DDD8] bg-white shadow-sm p-4">
          <div className="flex items-center justify-between text-xs text-[#82747A] mb-1">
            <span>Purchases Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-[#32765B]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#32765B]">
            ₹{guestRecordsRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-[#8E7079] mt-0.5">Billed to guest stays</p>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#E8DDD8] gap-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "catalog"
              ? "border-[#59283A] text-[#59283A] font-semibold"
              : "border-transparent text-[#82747A] hover:text-[#59283A]"
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Items & Services Catalog ({items.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("guest-records")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "guest-records"
              ? "border-[#59283A] text-[#59283A] font-semibold"
              : "border-transparent text-[#82747A] hover:text-[#59283A]"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Guest Item Records ({guestRecordsTotal})</span>
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "categories"
              ? "border-[#59283A] text-[#59283A] font-semibold"
              : "border-transparent text-[#82747A] hover:text-[#59283A]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Manage Item Categories ({categories.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ITEMS & SERVICES CATALOG */}
      {/* ========================================================================= */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          {/* Category Filter Pills & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E8DDD8] shadow-sm">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === "ALL"
                    ? "bg-[#59283A] text-white font-semibold"
                    : "bg-[#F5F0EA] text-[#82747A] hover:bg-[#F5F0EA] border border-[#E8DDD8]"
                }`}
              >
                All Items ({items.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === c.id
                      ? "bg-[#59283A] text-white font-semibold"
                      : "bg-[#F5F0EA] text-[#82747A] hover:bg-[#F5F0EA] border border-[#E8DDD8]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-60">
                <Search className="w-3.5 h-3.5 text-[#8E7079] absolute left-2.5 top-2.5" />
                <Input
                  type="text"
                  placeholder="Search item name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs border-[#E8DDD8]"
                />
              </div>

              {/* View toggle */}
              <div className="flex items-center border border-[#E8DDD8] rounded-lg bg-white overflow-hidden p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded ${viewMode === "grid" ? "bg-[#59283A] text-white" : "text-[#82747A]"}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded ${viewMode === "table" ? "bg-[#59283A] text-white" : "text-[#82747A]"}`}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-16 flex justify-center items-center">
              <LoadingSpinner text="Loading Hotel Items & Services Catalog..." subtext="Retrieving restaurant menus, room service, and amenities..." />
            </div>
          ) : items.length === 0 ? (
            <Card className="border-[#E8DDD8] p-12 text-center text-xs text-[#82747A] bg-white">
              <UtensilsCrossed className="w-8 h-8 mx-auto text-[#C4A06A]/40 mb-2" />
              <p className="font-semibold text-[#59283A] text-sm">No Catalog Items Found</p>
              <p className="text-[#8E7079] mt-1">
                Click &quot;Add New Item&quot; to add food, beverages, laundry, or hotel services.
              </p>
            </Card>
          ) : viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((it) => (
                <Card
                  key={it.id}
                  className="border-[#E8DDD8] bg-white shadow-sm hover:border-[#C4A06A] transition-colors flex flex-col justify-between"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm text-[#59283A] block leading-tight">
                          {it.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] mt-1 bg-[#F5F0EA] border-[#E8DDD8] text-[#82747A]"
                        >
                          {it.category?.name || "Service"}
                        </Badge>
                      </div>

                      {/* Price Badge with quick edit */}
                      <button
                        onClick={() => handleOpenPriceModal(it)}
                        className="group flex items-center gap-1 text-sm font-bold text-[#59283A] font-mono hover:text-[#C4A06A] transition-colors"
                        title="Click to update price"
                      >
                        <span>₹{Number(it.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#C4A06A]" />
                      </button>
                    </div>

                    {it.description ? (
                      <p className="text-xs text-[#82747A] line-clamp-2 min-h-[32px]">
                        {it.description}
                      </p>
                    ) : (
                      <p className="text-xs text-[#8E7079] italic min-h-[32px]">
                        No description specified
                      </p>
                    )}

                    <div className="pt-3 border-t border-[#E8DDD8] flex items-center justify-between gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => handleOpenOrderModal(it)}
                        className="h-7 text-xs bg-[#F5F0EA] hover:bg-[#E8DDD8] text-[#59283A] border border-[#E8DDD8] flex-1 font-medium"
                      >
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        Charge to Room
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenPriceModal(it)}
                        className="h-7 px-2 text-[#C4A06A] hover:bg-[#F5F0EA] text-xs"
                        title="Set Price"
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditItem(it)}
                        className="h-7 px-2 text-[#82747A] hover:text-[#59283A] hover:bg-[#F5F0EA]"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setItemToDelete(it);
                          setDeleteModalOpen(true);
                        }}
                        className="h-7 px-2 text-[#B54C44] hover:bg-[#F8E8E5]"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Table View */
            <Card className="border-[#E8DDD8] bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[10px] font-semibold border-b border-[#E8DDD8]">
                    <tr>
                      <th className="px-4 py-3">Item Name</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 font-mono">Price</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DDD8]">
                    {items.map((it) => (
                      <tr key={it.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                        <td className="px-4 py-3 font-semibold text-[#59283A]">{it.name}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] border-[#E8DDD8] bg-[#F5F0EA] text-[#82747A]">
                            {it.category?.name || "Service"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[#82747A] max-w-xs truncate">
                          {it.description || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[#59283A]">
                          ₹{Number(it.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenOrderModal(it)}
                              className="h-7 text-[11px] border-[#E8DDD8] text-[#59283A] hover:bg-[#F5F0EA]"
                            >
                              <ShoppingBag className="w-3 h-3 mr-1" />
                              Charge
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenPriceModal(it)}
                              className="h-7 px-2 text-[#C4A06A]"
                              title="Set Price"
                            >
                              <Tag className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEditItem(it)}
                              className="h-7 px-2 text-[#82747A]"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setItemToDelete(it);
                                setDeleteModalOpen(true);
                              }}
                              className="h-7 px-2 text-[#B54C44]"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GUEST ITEM RECORDS (PURCHASES LINKED TO STAYS) */}
      {/* ========================================================================= */}
      {activeTab === "guest-records" && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white p-4 rounded-xl border border-[#E8DDD8] shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#59283A]">
                Guest Item & Service Purchase Records
              </h3>
              <p className="text-xs text-[#82747A] mt-0.5">
                Every purchase is linked to the guest&apos;s stay duration and automatically factored into their final billing folio.
              </p>
            </div>
            <Button
              onClick={() => handleOpenOrderModal()}
              className="bg-[#59283A] hover:bg-[#472130] text-white text-xs h-9 px-3.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Post New Guest Purchase
            </Button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E8DDD8] shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-[#8E7079] absolute left-2.5 top-2.5" />
                <Input
                  type="text"
                  placeholder="Search guest name, room # or item..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="pl-8 h-8 text-xs border-[#E8DDD8]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#82747A]">
                <Calendar className="w-3.5 h-3.5 text-[#C4A06A]" />
                <Input
                  type="date"
                  value={guestDateFilter}
                  onChange={(e) => setGuestDateFilter(e.target.value)}
                  className="h-8 text-xs w-36 border-[#E8DDD8]"
                />
                {guestDateFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGuestDateFilter("")}
                    className="h-8 text-[11px] px-2 text-[#B54C44]"
                  >
                    Clear Date
                  </Button>
                )}
              </div>
            </div>

            <div className="text-xs text-[#82747A]">
              Total Records: <span className="font-semibold text-[#59283A]">{guestRecords.length}</span> • Revenue:{" "}
              <span className="font-mono font-bold text-[#32765B]">
                ₹{guestRecordsRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Guest Records Table */}
          <Card className="border-[#E8DDD8] bg-white shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {guestRecords.length === 0 ? (
                <div className="p-12 text-center text-xs text-[#8E7079]">
                  No guest item records logged yet. Click &quot;Post New Guest Purchase&quot; to charge an item to a guest stay.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F5F0EA] text-[#82747A] uppercase text-[10px] font-semibold border-b border-[#E8DDD8]">
                      <tr>
                        <th className="px-4 py-3">Guest Name</th>
                        <th className="px-4 py-3">Room #</th>
                        <th className="px-4 py-3">Item or Service Name</th>
                        <th className="px-4 py-3 text-center">Quantity</th>
                        <th className="px-4 py-3 font-mono">Price (₹)</th>
                        <th className="px-4 py-3 font-mono">Total Amount (₹)</th>
                        <th className="px-4 py-3">Purchase Date</th>
                        <th className="px-4 py-3">Purchase Time</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DDD8]">
                      {guestRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-[#F5F0EA]/60 transition-colors">
                          <td className="px-4 py-3 font-semibold text-[#59283A]">
                            <div>{rec.guestName}</div>
                            {rec.guestMobile && (
                              <div className="text-[10px] text-[#8E7079] font-normal">
                                {rec.guestMobile}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#F5F0EA] text-[#59283A] border border-[#E8DDD8]">
                              Room {rec.roomNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-[#59283A]">
                            <div>{rec.itemName}</div>
                            {rec.notes && (
                              <div className="text-[10px] text-[#8E7079] italic">{rec.notes}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-semibold">
                            {rec.quantity}
                          </td>
                          <td className="px-4 py-3 font-mono text-[#82747A]">
                            ₹{rec.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-[#32765B]">
                            ₹{rec.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-[#82747A] font-mono text-[11px]">
                            {rec.purchaseDate}
                          </td>
                          <td className="px-4 py-3 text-[#82747A] font-mono text-[11px]">
                            {rec.purchaseTime || "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVoidGuestRecord(rec)}
                              className="h-7 px-2 text-[#B54C44] hover:bg-[#F8E8E5] text-xs"
                              title="Void / Remove Charge from Stay"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MANAGE ITEM CATEGORIES */}
      {/* ========================================================================= */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-[#E8DDD8] shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-[#59283A]">
                Hotel Item & Service Categories
              </h3>
              <p className="text-xs text-[#82747A] mt-0.5">
                Organize menu items, laundry, room service, extra beds, and hotel services into clean operational categories.
              </p>
            </div>
            <Button
              onClick={handleOpenAddCategory}
              className="bg-[#59283A] hover:bg-[#472130] text-white text-xs h-9 px-3.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Card key={cat.id} className="border-[#E8DDD8] bg-white shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-[#E8DDD8]">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-bold text-[#59283A] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#C4A06A]" />
                      <span>{cat.name}</span>
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] bg-[#F5F0EA] border-[#E8DDD8]">
                      {cat._count?.items ?? items.filter((i) => i.categoryId === cat.id).length} items
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-[#82747A] mt-1">
                    {cat.description || "Administrative category"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-3 flex items-center justify-between">
                  <span className="text-[11px] text-[#8E7079]">
                    Status: <span className="text-[#32765B] font-semibold">Active</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditCategory(cat)}
                      className="h-7 px-2 text-[#82747A] hover:text-[#59283A]"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(cat)}
                      className="h-7 px-2 text-[#B54C44] hover:bg-[#F8E8E5]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT CATALOG ITEM */}
      {/* ========================================================================= */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#59283A]">
              {editingItem ? "Update Item Details" : "Add New Item / Service"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Configure item name, category, pricing, and description for hotel offerings.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveItem} className="space-y-4 pt-2 text-xs">
            {/* Item Name */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Item Name *</label>
              <Input
                required
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="e.g. Continental Breakfast, 2-Piece Suit Dry Clean, Extra Bed"
                className="h-9 text-xs border-[#E8DDD8]"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Category *</label>
              <select
                required
                value={itemForm.categoryId}
                onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                className="w-full h-9 rounded-md border border-[#E8DDD8] bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#C4A06A]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Price (₹) *</label>
              <Input
                type="number"
                required
                min="0"
                step="0.01"
                value={itemForm.unitPrice}
                onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })}
                className="h-9 text-xs font-mono font-bold text-[#59283A] border-[#E8DDD8]"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-semibold text-[#82747A]">Description</label>
              <Input
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Portion size, preparation details, service turnaround..."
                className="h-9 text-xs border-[#E8DDD8]"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-[#E8DDD8]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setItemModalOpen(false)}
                className="border-[#E8DDD8] text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#59283A] hover:bg-[#472130] text-white text-xs h-9"
              >
                {submitting ? "Saving..." : editingItem ? "Update Item" : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: QUICK SET ITEM / SERVICE PRICE */}
      {/* ========================================================================= */}
      <Dialog open={priceModalOpen} onOpenChange={setPriceModalOpen}>
        <DialogContent className="max-w-sm bg-white border-[#E8DDD8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#59283A]">
              Set Item / Service Price
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Quickly update pricing for <span className="font-semibold text-[#C4A06A]">{itemToUpdatePrice?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePrice} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">New Tariff / Price (₹) *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="h-9 text-base font-mono font-bold text-[#32765B] border-[#E8DDD8]"
                required
                autoFocus
              />
              <span className="text-[10px] text-[#8E7079] block">
                Current Price: ₹{itemToUpdatePrice ? Number(itemToUpdatePrice.unitPrice).toFixed(2) : "0.00"}
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPriceModalOpen(false)}
                className="border-[#E8DDD8] text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#32765B] hover:bg-[#286049] text-white text-xs h-9"
              >
                {submitting ? "Updating..." : "Update Price"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: ADD / EDIT CATEGORY */}
      {/* ========================================================================= */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#59283A]">
              {editingCategory ? "Edit Category" : "New Item Category"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Administrative group for organizing hotel food, drinks, services, and inventory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Category Name *</label>
              <Input
                required
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g. Minibar, Room Service, Spa, Transport"
                className="h-9 text-xs border-[#E8DDD8]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#82747A]">Description</label>
              <Input
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Category operational scope..."
                className="h-9 text-xs border-[#E8DDD8]"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-[#E8DDD8]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryModalOpen(false)}
                className="border-[#E8DDD8] text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#59283A] hover:bg-[#472130] text-white text-xs h-9"
              >
                {submitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: POST PURCHASE TO GUEST STAY */}
      {/* ========================================================================= */}
      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className="max-w-md bg-white border-[#E8DDD8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#59283A]">
              Post Purchase to Guest Stay
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Charges will be immediately linked to the guest&apos;s room stay and reflected on their final checkout bill.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmOrder} className="space-y-4 pt-2 text-xs">
            {/* Select Stay */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Select In-House Room / Guest *</label>
              <select
                required
                value={orderForm.bookingId}
                onChange={(e) => setOrderForm({ ...orderForm, bookingId: e.target.value })}
                className="w-full h-9 rounded-md border border-[#E8DDD8] bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#C4A06A]"
              >
                {activeStays.map((s) => (
                  <option key={s.id} value={s.id}>
                    Room {s.room?.roomNumber} — {s.primaryGuest?.fullName} ({s.bookingNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Select from catalog */}
            <div className="space-y-1">
              <label className="font-semibold text-[#82747A]">Select Item from Catalog (Optional)</label>
              <select
                value={orderForm.itemId}
                onChange={(e) => {
                  const it = items.find((i) => i.id === e.target.value);
                  if (it) {
                    setOrderForm({
                      ...orderForm,
                      itemId: it.id,
                      itemName: it.name,
                      unitPrice: Number(it.unitPrice),
                    });
                  }
                }}
                className="w-full h-9 rounded-md border border-[#E8DDD8] bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#C4A06A]"
              >
                <option value="">-- Or enter custom service below --</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} (₹{Number(it.unitPrice).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            {/* Item Name */}
            <div className="space-y-1">
              <label className="font-semibold text-[#59283A]">Item or Service Name *</label>
              <Input
                required
                value={orderForm.itemName}
                onChange={(e) => setOrderForm({ ...orderForm, itemName: e.target.value })}
                placeholder="e.g. Club Sandwich & Coffee, Laundry Wash & Press"
                className="h-9 text-xs border-[#E8DDD8]"
              />
            </div>

            {/* Quantity and Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Quantity *</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: Number(e.target.value) })}
                  className="h-9 text-xs font-mono border-[#E8DDD8]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#59283A]">Price (₹) *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={orderForm.unitPrice}
                  onChange={(e) => setOrderForm({ ...orderForm, unitPrice: Number(e.target.value) })}
                  className="h-9 text-xs font-mono font-bold border-[#E8DDD8]"
                />
              </div>
            </div>

            {/* Total Amount Preview */}
            <div className="p-3 bg-[#F5F0EA] rounded-xl border border-[#E8DDD8] flex items-center justify-between text-xs">
              <span className="text-[#82747A] font-medium">Total Amount to Charge:</span>
              <span className="font-mono font-bold text-base text-[#32765B]">
                ₹{(Number(orderForm.quantity) * Number(orderForm.unitPrice)).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="font-semibold text-[#82747A]">Special Notes / Instructions</label>
              <Input
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                placeholder="e.g. In-room dining delivered at 4:15 PM"
                className="h-9 text-xs border-[#E8DDD8]"
              />
            </div>

            <DialogFooter className="pt-2 border-t border-[#E8DDD8]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOrderModalOpen(false)}
                className="border-[#E8DDD8] text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#59283A] hover:bg-[#472130] text-white text-xs h-9"
              >
                {submitting ? "Posting..." : "Charge to Guest Stay"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 5: DELETE ITEM CONFIRMATION */}
      {/* ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-sm bg-white border-[#E8DDD8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[#59283A]">
              Delete Catalog Item
            </DialogTitle>
            <DialogDescription className="text-xs text-[#82747A]">
              Are you sure you want to remove <span className="font-bold text-[#B54C44]">{itemToDelete?.name}</span>? If it has historical guest purchase records, it will be safely deactivated to preserve financial integrity.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              className="border-[#E8DDD8] text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={handleConfirmDelete}
              className="bg-[#B54C44] hover:bg-[#973E37] text-white text-xs h-9"
            >
              {submitting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
