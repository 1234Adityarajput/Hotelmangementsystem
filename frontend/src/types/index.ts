export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  port: number;
  timestamp: string;
  uptimeSeconds: number;
  database: {
    configured: boolean;
    provider: string;
    connected: boolean;
    message: string;
    latencyMs?: number;
  };
  system: {
    memoryUsageMb: number;
    nodeVersion: string;
    platform: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string | null;
}

export interface AuthLoginResponse {
  accessToken: string;
  admin: AdminUser;
}

export interface DashboardStats {
  rooms: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
    occupancyRate: number;
  };
  stays: {
    todayCheckIns: number;
    todayCheckOuts: number;
    activeBookings: number;
  };
  guests: {
    total: number;
  };
  revenue: {
    today: number;
    monthly: number;
    pendingBalance: number;
    currency: string;
  };
}

export interface RecentBookingItem {
  id: string;
  bookingNumber: string;
  guestName: string;
  guestCode: string;
  mobileNumber: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  expectedCheckOutDate: string;
  bookingStatus: 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  totalAmount: number;
  advanceAmount: number;
  createdAt: string;
}

export interface RecentActivityItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  changedAt: string;
}

export interface GuestDocument {
  id: string;
  guestId: string;
  documentType: string;
  documentNumber: string;
  documentFileReference: string;
  uploadedAt: string;
}

export interface Guest {
  id: string;
  guestCode: string;
  fullName: string;
  mobileNumber: string;
  alternateMobileNumber?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  createdAt: string;
  updatedAt: string;
  documents?: GuestDocument[];
  totalStays?: number;
  stayHistory?: any[];
}

export interface RoomType {
  id: string;
  name: string;
  description?: string | null;
  defaultPricePerNight: number;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { rooms: number };
}

export interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  description?: string | null;
  floor: number;
  pricePerNight: number;
  roomStatus: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roomType: RoomType;
  currentBooking?: any;
}

export interface BookingGuest {
  id: string;
  bookingId: string;
  guestId: string;
  isPrimaryGuest: boolean;
  guest: Guest;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  primaryGuestId: string;
  roomId: string;
  bookingStatus: 'RESERVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  checkInDate: string;
  checkInTime?: string | null;
  expectedCheckOutDate: string;
  expectedCheckOutTime?: string | null;
  actualCheckInAt?: string | null;
  actualCheckOutAt?: string | null;
  numberOfNights: number;
  numberOfGuests: number;
  roomRatePerNight: number;
  advanceAmount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  primaryGuest: Guest;
  room: Room;
  bookingGuests?: BookingGuest[];
  bookingItems?: any[];
  payments?: Payment[];
  invoices?: Invoice[];
}

export interface ItemCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  _count?: { items: number };
}

export interface Item {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  unitPrice: number;
  isActive: boolean;
  category?: ItemCategory;
}

export interface BookingItem {
  id: string;
  bookingId: string;
  itemId?: string | null;
  itemNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  purchaseDate: string;
  purchaseTime?: string | null;
  notes?: string | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  invoiceStatus: 'DRAFT' | 'FINALIZED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  roomCharges: number;
  additionalCharges: number;
  subtotal: number;
  discountType?: 'PERCENTAGE' | 'FIXED' | null;
  discountValue: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  totalAmount: number;
  totalPaid: number;
  balanceAmount: number;
  invoiceDate: string;
  finalizedAt?: string | null;
  createdAt: string;
  booking?: Booking;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  paymentReference: string;
  bookingId: string;
  invoiceId?: string | null;
  paymentType: 'ADVANCE' | 'PARTIAL' | 'FINAL' | 'REFUND';
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
  amount: number;
  transactionReference?: string | null;
  paymentDate: string;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  notes?: string | null;
  createdAt: string;
  booking?: Booking;
  invoice?: Invoice;
}
