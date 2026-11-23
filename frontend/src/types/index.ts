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
    currentlyStayingGuests: number;
  };
  guests: {
    total: number;
    currentlyStaying: number;
    withDocuments: number;
  };
  revenue: {
    today: number;
    monthly: number;
    pendingBalance: number;
    currency: string;
  };
  expenses: {
    today: number;
    monthly: number;
    total: number;
  };
  staff: {
    total: number;
    todayAttendance: {
      present: number;
      absent: number;
      halfDay: number;
      leave: number;
      totalMarked: number;
      attendanceRate: number;
    };
  };
  payroll: {
    monthlyNetSalary: number;
    monthlyDisbursed: number;
    pendingBalance: number;
  };
}

export interface DashboardAnalytics {
  dailyRevenue: Array<{
    date: string;
    day: string;
    revenue: number;
    transactions: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    expenses: number;
    netProfit: number;
  }>;
  roomOccupancy: Array<{
    roomTypeId: string;
    roomTypeName: string;
    capacity: number;
    total: number;
    occupied: number;
    available: number;
    maintenance: number;
    occupancyRate: number;
  }>;
  guestStats: {
    totalGuests: number;
    currentlyStaying: number;
    withDocuments: number;
    newThisMonth: number;
  };
  incomeExpenseAnalysis: {
    revenue: number;
    expenses: number;
    payroll: number;
    totalOutflow: number;
    netCashFlow: number;
    operatingMargin: number;
  };
  staffAttendanceSummary: {
    activeStaff: number;
    present: number;
    absent: number;
    halfDay: number;
    leave: number;
    unmarked: number;
    presentPercentage: number;
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

export interface AdditionalGuest {
  id?: string;
  fullName: string;
  age?: number | null;
  gender?: string | null;
  relationship?: string | null;
  idProofType?: string | null;
  idProofNumber?: string | null;
  documentFileReference?: string | null;
  uploadedAt?: string;
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
  idProofType?: string | null;
  idProofNumber?: string | null;
  idProofDocument?: string | null;
  numberOfGuests?: number;
  additionalGuests?: AdditionalGuest[];
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
  bookings?: any[];
}

export interface CheckoutSummary {
  bookingId: string;
  bookingNumber: string;
  guestDetails: {
    id: string;
    fullName: string;
    mobileNumber: string;
    email?: string | null;
    address?: string | null;
    city?: string | null;
  };
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkInTime: string;
  expectedCheckOutDate: string;
  expectedCheckOutTime: string;
  numberOfNights: number;
  roomPricePerNight: number;
  advancePayment: number;

  actualCheckOutDate: string;
  actualCheckOutTime: string;
  totalNumberOfNights: number;
  roomCharges: number;
  additionalItemCharges: number;
  additionalItems: any[];
  serviceCharges: number;
  discount: number;
  taxPercentage: number;
  taxAmount: number;
  totalBillAmount: number;
  additionalPayments: number;
  totalPaid: number;
  remainingPayment: number;
  existingInvoice?: any;
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

export interface BillingComponentBreakdown {
  bookingId: string;
  bookingNumber: string;
  guestName: string;
  guestMobile: string;
  guestAddress: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  expectedCheckOutDate: string;
  actualCheckInAt: string | null;
  actualCheckOutAt: string | null;
  numberOfNights: number;
  roomRatePerNight: number;

  // Billing Components
  roomCharges: number;
  foodAndBeverageCharges: number;
  laundryCharges: number;
  roomServiceCharges: number;
  extraBedCharges: number;
  otherServicesCharges: number;
  additionalItemCharges: number;
  totalAdditionalCharges: number;
  subtotal: number;

  discountType: 'PERCENTAGE' | 'FIXED' | null;
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  taxPercentage: number;
  taxAmount: number;

  // Final Bill = Room Charges + Additional Charges + Taxes - Discount
  finalBill: number;

  // Payments Breakdown
  payments: {
    advancePayments: number;
    partialPayments: number;
    finalPayments: number;
    totalPaymentsReceived: number;
    paymentList: Array<{
      id: string;
      reference: string;
      type: 'ADVANCE' | 'PARTIAL' | 'FINAL' | 'REFUND';
      method: string;
      amount: number;
      date: string;
      status: string;
    }>;
  };

  // Remaining Balance = Final Bill - Total Payments Received
  remainingBalance: number;
  isFullySettled: boolean;

  itemizedCharges: Array<{
    id: string;
    name: string;
    category: string;
    billingComponent: string;
    unitPrice: number;
    quantity: number;
    totalAmount: number;
    date: string;
    time?: string | null;
    notes?: string | null;
  }>;

  existingInvoice?: any;

  calculationFormulas: {
    roomCharges: string;
    additionalCharges: string;
    finalBill: string;
    remainingBalance: string;
  };
}

export interface ActiveFoliosResponse {
  folios: BillingComponentBreakdown[];
  kpis: {
    totalActiveFolios: number;
    totalLiveRoomCharges: number;
    totalLiveAdditionalCharges: number;
    totalPaymentsReceived: number;
    totalRemainingBalance: number;
  };
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

// ============================================================================
// MODULE 10: STAFF MANAGEMENT TYPES
// ============================================================================
export interface Staff {
  id: string;
  employeeCode: string;
  fullName: string;
  mobileNumber: string;
  alternateMobileNumber?: string | null;
  email?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  emergencyContact?: string | null;
  designation: string;
  department: string;
  joiningDate: string;
  employmentStatus: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'RESIGNED';
  monthlySalary: number;
  bankAccountHolder?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    attendanceRecords: number;
    salaryRecords: number;
    advances: number;
  };
}

// ============================================================================
// MODULE 11: ATTENDANCE TYPES
// ============================================================================
export interface Attendance {
  id: string;
  staffId: string;
  attendanceDate: string;
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'WEEKLY_OFF';
  checkInTime?: string | null;
  checkOutTime?: string | null;
  workingHours?: number | null;
  overtimeHours: number;
  notes?: string | null;
  createdAt: string;
  staff?: Staff;
}

// ============================================================================
// MODULE 12: STAFF ADVANCE TYPES
// ============================================================================
export interface StaffAdvance {
  id: string;
  staffId: string;
  advanceReference: string;
  amount: number;
  advanceDate: string;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
  repaymentStatus: 'PENDING' | 'PARTIALLY_REPAID' | 'REPAID' | 'WAIVED';
  recoveredAmount: number;
  balanceAmount: number;
  salaryRecordId?: string | null;
  notes?: string | null;
  createdAt: string;
  staff?: Staff;
  salaryRecord?: SalaryRecord | null;
}

// ============================================================================
// MODULE 13: PAYROLL & SALARY TYPES
// ============================================================================
export interface SalaryPayment {
  id: string;
  salaryRecordId: string;
  paymentReference: string;
  paymentAmount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
  paymentDate: string;
  transactionReference?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface SalaryRecord {
  id: string;
  staffId: string;
  payrollMonth: number;
  payrollYear: number;
  monthlyBasicSalary: number;
  configuredSalaryDays: number;
  payableDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  overtimeHours: number;
  overtimeAmount: number;
  grossSalary: number;
  deductions: number;
  advanceDeductions: number;
  netSalary: number;
  totalPaid: number;
  balanceAmount: number;
  payrollStatus: 'DRAFT' | 'FINALIZED' | 'PAID' | 'CANCELLED';
  finalizedAt?: string | null;
  createdAt: string;
  staff?: Staff;
  salaryPayments?: SalaryPayment[];
  staffAdvances?: StaffAdvance[];
}

// ============================================================================
// MODULE 14: EXPENSE TYPES
// ============================================================================
export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { expenses: number };
}

export interface Expense {
  id: string;
  expenseReference: string;
  expenseCategoryId: string;
  description: string;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
  paymentDate: string;
  transactionReference?: string | null;
  notes?: string | null;
  createdAt: string;
  category?: ExpenseCategory;
}

// ============================================================================
// MODULE 18: HOTEL SETTINGS TYPES
// ============================================================================
export interface HotelSetting {
  id: string;
  isSingleton: boolean;
  hotelName: string;
  hotelAddress?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  logoFileReference?: string | null;
  currencyCode: string;
  timezone: string;
  defaultCheckInTime: string;
  defaultCheckOutTime: string;
  taxEnabled: boolean;
  defaultTaxPercentage: number;
  defaultSalaryDays: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MODULE 19: AUDIT LOG TYPES
// ============================================================================
export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'FINALIZE' | 'CANCEL' | 'CORRECTION';
  previousValues?: any;
  newValues?: any;
  changedAt: string;
  description?: string | null;
}

