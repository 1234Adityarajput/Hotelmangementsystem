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
} from "lucide-react";
import { itemsService } from "@/services/items.service";
import { bookingsService } from "@/services/bookings.service";
import { Item, ItemCategory, Booking } from "@/types";
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
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    categoryId: "",
    unitPrice: 150,
    description: "",
  });

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  // Room order modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [activeStays, setActiveStays] = useState<Booking[]>([]);
  const [orderForm, setOrderForm] = useState({
    bookingId: "",
    itemId: "",
    itemName: "",
    unitPrice: 0,
    quantity: 1,
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [iRes, cRes] = await Promise.all([
        itemsService.findAllItems(
          selectedCategory !== "ALL" ? selectedCategory : undefined,
          search || undefined,
        ),
        itemsService.findAllCategories(),
      ]);
      setItems(iRes);
      setCategories(cRes);
    } catch (err) {
      toast.error("Failed to load catalog items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, search]);

  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemForm({
      name: "",
      categoryId: categories[0]?.id || "",
      unitPrice: 150,
      description: "",
    });
    setItemModalOpen(true);
  };

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

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim() || !itemForm.categoryId) {
      toast.error("Name and Category are required");
      return;
    }

    try {
      setSubmitting(true);
      if (editingItem) {
        await itemsService.updateItem(editingItem.id, itemForm);
        toast.success("Item updated successfully");
      } else {
        await itemsService.createItem(itemForm);
        toast.success("Item added to catalog");
      }
      setItemModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      setSubmitting(true);
      await itemsService.createCategory(categoryForm);
      toast.success("Item category created");
      setCategoryModalOpen(false);
      setCategoryForm({ name: "", description: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenOrder = async (item: Item) => {
    try {
      const stays = await bookingsService.getActiveStays();
      setActiveStays(stays);
      if (stays.length === 0) {
        toast.error("No active checked-in guests to charge items to.");
        return;
      }
      setOrderForm({
        bookingId: stays[0].id,
        itemId: item.id,
        itemName: item.name,
        unitPrice: Number(item.unitPrice),
        quantity: 1,
        notes: "",
      });
      setOrderModalOpen(true);
    } catch (err) {
      toast.error("Could not load active stays");
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.bookingId) return;

    try {
      setSubmitting(true);
      await itemsService.addBookingItem(orderForm);
      toast.success(`Ordered ${orderForm.quantity}x ${orderForm.itemName} to room charge.`);
      setOrderModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to place room order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E3D9CA]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#362A22]">
            Hotel Items & Services Catalog
          </h2>
          <p className="text-xs text-[#79695B] mt-0.5">
            Manage food, beverage, laundry, room service menus, and post charges directly to active guest rooms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCategoryModalOpen(true)}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Category
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAddItem}
            className="bg-[#362A22] hover:bg-[#43352B] text-white text-xs shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" /> Add New Item
          </Button>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E3D9CA] shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white font-semibold"
                : "bg-[#F7F4EE] text-[#79695B] hover:bg-slate-100 border border-[#E3D9CA]"
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedCategory === c.id
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-[#F7F4EE] text-[#79695B] hover:bg-slate-100 border border-[#E3D9CA]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-[#948779] absolute left-2.5 top-2.5" />
          <Input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="p-12 flex justify-center items-center">
          <LoadingSpinner className="w-6 h-6 text-[#B08A60]" />
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#948779] bg-white rounded-xl border border-[#E3D9CA]">
          No items found in this category. Click &quot;Add New Item&quot; to populate the menu.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((it) => (
            <Card key={it.id} className="border-[#E3D9CA] shadow-sm hover:shadow transition-all flex flex-col justify-between">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-sm text-[#362A22] block">{it.name}</span>
                    <Badge variant="outline" className="text-[10px] mt-1 bg-[#F7F4EE]">
                      {it.category?.name || "Service"}
                    </Badge>
                  </div>
                  <span className="text-sm font-bold text-[#362A22] font-mono">
                    ₹{Number(it.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {it.description && (
                  <p className="text-xs text-[#79695B] line-clamp-2">{it.description}</p>
                )}

                <div className="pt-3 border-t border-[#EAE3D8] flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenOrder(it)}
                    className="h-7 text-xs bg-[#FAF6F0] text-[#362A22] hover:bg-[#FAF6F0] border-[#E3D9CA] flex-1"
                  >
                    <ShoppingBag className="w-3 h-3 mr-1" /> Order to Room
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditItem(it)}
                    className="h-7 w-7 p-0 text-[#79695B] hover:text-[#362A22]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#362A22]">
              {editingItem ? "Edit Catalog Item" : "Add New Item"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Set menu pricing and category for guest billing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveItem} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#5D493D]">Item Name *</label>
              <Input
                required
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="e.g. Masala Tea, Laundry Express, Mineral Water"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#5D493D]">Category *</label>
              <select
                required
                value={itemForm.categoryId}
                onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#5D493D]">Unit Price (₹) *</label>
              <Input
                type="number"
                required
                min="0"
                step="5"
                value={itemForm.unitPrice}
                onChange={(e) => setItemForm({ ...itemForm, unitPrice: Number(e.target.value) })}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#5D493D]">Description</label>
              <Input
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Portion size, details..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setItemModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-[#362A22] hover:bg-[#43352B] text-white">
                {submitting ? "Saving..." : editingItem ? "Save Changes" : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Category Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#362A22]">
              New Item Category
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Create an administrative category for catalog organization.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#5D493D]">Category Name *</label>
              <Input
                required
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g. Minibar, Room Dining, Dry Cleaning"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#5D493D]">Description</label>
              <Input
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Category notes..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-[#362A22] hover:bg-[#43352B] text-white">
                {submitting ? "Saving..." : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order to Room Modal */}
      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#362A22]">
              Post Item Charge to Room
            </DialogTitle>
            <DialogDescription className="text-xs text-[#79695B]">
              Adding <span className="font-semibold text-[#B08A60]">{orderForm.itemName}</span> to guest room invoice.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmOrder} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-[#5D493D]">Select In-House Room / Guest *</label>
              <select
                required
                value={orderForm.bookingId}
                onChange={(e) => setOrderForm({ ...orderForm, bookingId: e.target.value })}
                className="w-full h-8 text-xs border border-[#E3D9CA] rounded-md px-2 bg-white"
              >
                {activeStays.map((s) => (
                  <option key={s.id} value={s.id}>
                    Room {s.room?.roomNumber} — {s.primaryGuest?.fullName} ({s.bookingNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-[#5D493D]">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#5D493D]">Unit Price Snapshot (₹)</label>
                <Input
                  type="number"
                  disabled
                  value={orderForm.unitPrice}
                  className="h-8 text-xs font-mono bg-[#F7F4EE]"
                />
              </div>
            </div>

            <div className="p-3 bg-[#FAF6F0] border border-[#E3D9CA] rounded-xl flex items-center justify-between">
              <span className="font-medium text-indigo-900">Total Charge:</span>
              <span className="font-bold text-base text-indigo-900 font-mono">
                ₹{(orderForm.quantity * orderForm.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#5D493D]">Delivery Notes</label>
              <Input
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                placeholder="Delivered at 2:30 PM..."
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-[#EAE3D8]">
              <Button type="button" variant="outline" size="sm" onClick={() => setOrderModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-[#362A22] hover:bg-[#43352B] text-white">
                {submitting ? "Posting..." : "Charge to Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
