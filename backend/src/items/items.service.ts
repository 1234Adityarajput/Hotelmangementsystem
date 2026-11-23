import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateItemCategoryDto } from './dto/create-category.dto';
import { UpdateItemCategoryDto } from './dto/update-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CreateBookingItemDto } from './dto/create-booking-item.dto';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // ITEM CATEGORIES
  // ==========================================================================
  async findAllCategories() {
    return this.prisma.itemCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async createCategory(dto: CreateItemCategoryDto) {
    const existing = await this.prisma.itemCategory.findUnique({ where: { name: dto.name.trim() } });
    if (existing) {
      throw new ConflictException(`Item category "${dto.name}" already exists`);
    }

    return this.prisma.itemCategory.create({
      data: {
        name: dto.name.trim(),
        description: dto.description,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateItemCategoryDto) {
    const existing = await this.prisma.itemCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Item category with ID ${id} not found`);
    }

    if (dto.name && dto.name.trim() !== existing.name) {
      const conflict = await this.prisma.itemCategory.findUnique({ where: { name: dto.name.trim() } });
      if (conflict) {
        throw new ConflictException(`Item category "${dto.name}" already exists`);
      }
    }

    return this.prisma.itemCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteCategory(id: string) {
    const itemCount = await this.prisma.item.count({ where: { categoryId: id } });
    if (itemCount > 0) {
      throw new ConflictException(`Cannot delete category with ${itemCount} associated items. Deactivate instead.`);
    }

    await this.prisma.itemCategory.delete({ where: { id } });
    return { success: true, message: 'Category deleted successfully' };
  }

  // ==========================================================================
  // ITEMS CATALOG
  // ==========================================================================
  async findAllItems(categoryId?: string, search?: string) {
    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    return this.prisma.item.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { category: true },
    });
  }

  async findOneItem(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  async createItem(dto: CreateItemDto) {
    const category = await this.prisma.itemCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
    }

    return this.prisma.item.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        description: dto.description,
        unitPrice: dto.unitPrice,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: { category: true },
    });
  }

  async updateItem(id: string, dto: UpdateItemDto) {
    const existing = await this.prisma.item.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return this.prisma.item.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.unitPrice !== undefined && { unitPrice: dto.unitPrice }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { category: true },
    });
  }

  async updatePrice(id: string, price: number) {
    const existing = await this.prisma.item.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return this.prisma.item.update({
      where: { id },
      data: { unitPrice: price },
      include: { category: true },
    });
  }

  async deleteItem(id: string) {
    const existing = await this.prisma.item.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    const orderCount = await this.prisma.bookingItem.count({ where: { itemId: id } });
    if (orderCount === 0) {
      await this.prisma.item.delete({ where: { id } });
      return { success: true, message: 'Item permanently deleted from catalog.' };
    } else {
      await this.prisma.item.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        success: true,
        message: `Item deactivated (preserved for ${orderCount} existing guest stay records).`,
      };
    }
  }

  // ==========================================================================
  // GUEST ITEM RECORDS (PURCHASES & ORDERS ACROSS HOTEL)
  // ==========================================================================
  async findAllGuestItemRecords(query?: {
    search?: string;
    bookingId?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.bookingId) {
      where.bookingId = query.bookingId;
    }
    if (query?.date) {
      where.purchaseDate = new Date(query.date);
    }
    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { itemNameSnapshot: { contains: term, mode: 'insensitive' } },
        { booking: { primaryGuest: { fullName: { contains: term, mode: 'insensitive' } } } },
        { booking: { primaryGuest: { mobileNumber: { contains: term } } } },
        { booking: { room: { roomNumber: { contains: term, mode: 'insensitive' } } } },
        { notes: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.bookingItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              primaryGuest: true,
              room: true,
            },
          },
          item: {
            include: { category: true },
          },
        },
      }),
      this.prisma.bookingItem.count({ where }),
    ]);

    const mapped = items.map((bi) => ({
      id: bi.id,
      bookingId: bi.bookingId,
      guestName: bi.booking?.primaryGuest?.fullName || 'Guest',
      guestMobile: bi.booking?.primaryGuest?.mobileNumber || '',
      roomNumber: bi.booking?.room?.roomNumber || 'N/A',
      bookingNumber: bi.booking?.bookingNumber || '',
      itemName: bi.itemNameSnapshot,
      categoryName: bi.item?.category?.name || 'Hotel Service',
      quantity: bi.quantity,
      price: Number(bi.unitPrice),
      totalAmount: Number(bi.totalAmount),
      purchaseDate: bi.purchaseDate ? new Date(bi.purchaseDate).toISOString().split('T')[0] : '',
      purchaseTime: bi.purchaseTime || '',
      notes: bi.notes || '',
      createdAt: bi.createdAt.toISOString(),
    }));

    const totalAmountSum = mapped.reduce((sum, item) => sum + item.totalAmount, 0);

    return {
      items: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalAmountSum: Math.round(totalAmountSum * 100) / 100,
    };
  }

  // ==========================================================================
  // BOOKING ITEMS (ROOM SERVICE & EXTRA ORDERS)
  // ==========================================================================
  async findBookingItems(bookingId: string) {
    return this.prisma.bookingItem.findMany({
      where: { bookingId },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async syncActiveInvoice(bookingId: string) {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          bookingId,
          invoiceStatus: { in: ['DRAFT', 'FINALIZED', 'PARTIALLY_PAID'] },
        },
      });
      if (!invoice) return;

      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { bookingItems: true },
      });
      if (!booking) return;

      const roomCharges = Math.round(Number(booking.roomRatePerNight) * booking.numberOfNights * 100) / 100;
      const additionalCharges = Math.round(
        booking.bookingItems.reduce((sum, item) => sum + Number(item.totalAmount), 0) * 100,
      ) / 100;
      const subtotal = Math.round((roomCharges + additionalCharges) * 100) / 100;

      let discountAmount = 0.0;
      const discountVal = Number(invoice.discountValue);
      if (invoice.discountType === 'PERCENTAGE') {
        discountAmount = Math.round(subtotal * (discountVal / 100) * 100) / 100;
      } else if (invoice.discountType === 'FIXED') {
        discountAmount = Math.min(discountVal, subtotal);
      }

      const taxableAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
      const taxPercentage = Number(invoice.taxPercentage);
      const taxAmount = Math.round(taxableAmount * (taxPercentage / 100) * 100) / 100;
      const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

      const totalPaid = Number(invoice.totalPaid);
      const balanceAmount = Math.round((totalAmount - totalPaid) * 100) / 100;

      let invoiceStatus = invoice.invoiceStatus;
      if (balanceAmount <= 0) {
        invoiceStatus = 'PAID';
      } else if (totalPaid > 0) {
        invoiceStatus = 'PARTIALLY_PAID';
      } else {
        invoiceStatus = 'FINALIZED';
      }

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          roomCharges,
          additionalCharges,
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          balanceAmount,
          invoiceStatus,
        },
      });
    } catch (e) {
      // non-fatal if invoice sync encounters an edge case
    }
  }

  async addBookingItem(dto: CreateBookingItemDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: dto.bookingId } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${dto.bookingId} not found`);
    }

    const totalAmount = Number(dto.unitPrice) * dto.quantity;
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const item = await this.prisma.bookingItem.create({
      data: {
        bookingId: dto.bookingId,
        itemId: dto.itemId,
        itemNameSnapshot: dto.itemName,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        totalAmount,
        purchaseDate: now,
        purchaseTime: timeString,
        notes: dto.notes,
      },
      include: { item: true },
    });

    await this.syncActiveInvoice(dto.bookingId);
    return item;
  }

  async deleteBookingItem(id: string) {
    const item = await this.prisma.bookingItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Booking item with ID ${id} not found`);
    }

    await this.prisma.bookingItem.delete({ where: { id } });
    await this.syncActiveInvoice(item.bookingId);
    return { success: true, message: 'Booking item removed successfully' };
  }
}
