# Hotel Management Software – API Data Contracts & DTO Specifications

This document defines the strict data shapes, payloads, and response contracts that both frontend and backend developers must adhere to when integrating with the centralized PostgreSQL database via Prisma ORM.

---

## 1. Authentication Contracts (`/api/v1/auth`)

### Admin Login Request (`LoginDto`)
```typescript
interface LoginRequest {
  email: string;     // Accepts username or email
  password: string;  // Minimum 8 characters
}
```

### Admin Login Response
```typescript
interface LoginResponse {
  accessToken: string;
  admin: {
    id: string;
    username: string;
    email: string | null;
  };
}
```

---

## 2. Guest Management Contracts (`/api/v1/guests`)

### Create Guest (`CreateGuestDto`)
```typescript
interface CreateGuestRequest {
  fullName: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string; // Defaults to "India"
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: "MALE" | "FEMALE" | "OTHER";
}
```

### Guest Record Response
```typescript
interface GuestResponse {
  id: string;
  guestCode: string; // e.g. "GST-00001"
  fullName: string;
  mobileNumber: string;
  alternateMobileNumber: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  dateOfBirth: string | null;
  gender: string | null;
  createdAt: string;
  updatedAt: string;
  documents?: GuestDocumentResponse[];
}
```

---

## 3. Room Management Contracts (`/api/v1/rooms`)

### Create / Update Room (`CreateRoomDto`)
```typescript
interface CreateRoomRequest {
  roomNumber: string;
  roomTypeId: string;
  description?: string;
  floor?: number;
  pricePerNight: number; // e.g. 2500.00
  roomStatus?: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
}
```

### Room Record Response
```typescript
interface RoomResponse {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  description: string | null;
  floor: number;
  pricePerNight: string; // Serialized Decimal string: "2500.00"
  roomStatus: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  isActive: boolean;
  roomType: {
    id: string;
    name: string;
    capacity: number;
  };
}
```

---

## 4. Booking & Stay Contracts (`/api/v1/bookings`)

### Create Booking (`CreateBookingDto`)
```typescript
interface CreateBookingRequest {
  primaryGuestId: string;
  roomId: string;
  checkInDate: string; // "YYYY-MM-DD"
  checkInTime?: string; // e.g. "12:00 PM"
  expectedCheckOutDate: string; // "YYYY-MM-DD"
  expectedCheckOutTime?: string; // e.g. "11:00 AM"
  numberOfNights: number;
  numberOfGuests: number;
  roomRatePerNight: number; // Snapshot of nightly rate
  advanceAmount?: number; // e.g. 1000.00
  notes?: string;
  coGuestIds?: string[]; // IDs of additional staying guests
}
```

---

## 5. Billing & Invoicing Contracts (`/api/v1/invoices`)

### Finalize Checkout Invoice (`FinalizeInvoiceDto`)
```typescript
interface FinalizeInvoiceRequest {
  bookingId: string;
  discountType?: "PERCENTAGE" | "FIXED";
  discountValue?: number;
  taxAmount?: number;
  invoiceDate: string; // "YYYY-MM-DD"
}
```

### Invoice Record Response
```typescript
interface InvoiceResponse {
  id: string;
  invoiceNumber: string; // "INV-2026-0001"
  bookingId: string;
  invoiceStatus: "DRAFT" | "FINALIZED" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  roomCharges: string; // "5000.00"
  additionalCharges: string; // "450.00"
  subtotal: string; // "5450.00"
  discountType: "PERCENTAGE" | "FIXED" | null;
  discountValue: string;
  discountAmount: string; // "545.00"
  taxPercentage: string; // "12.00"
  taxAmount: string; // "588.60"
  totalAmount: string; // "5493.60"
  totalPaid: string; // "2000.00"
  balanceAmount: string; // "3493.60"
  invoiceDate: string;
  finalizedAt: string | null;
}
```

---

## 6. Staff Management Contracts (`/api/v1/staff`)

### Create Staff (`CreateStaffDto`)
```typescript
interface CreateStaffRequest {
  employeeCode: string;
  fullName: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  email?: string;
  address?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  emergencyContact?: string;
  designation: string;
  department: string;
  joiningDate: string; // YYYY-MM-DD
  monthlySalary: number; // e.g. 18000.00
  bankAccountHolder?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  notes?: string;
}
```

---

## 7. Attendance Contracts (`/api/v1/attendance`)

### Log Daily Attendance (`LogAttendanceDto`)
```typescript
interface LogAttendanceRequest {
  staffId: string;
  attendanceDate: string; // "YYYY-MM-DD"
  attendanceStatus: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | "WEEKLY_OFF";
  checkInTime?: string; // "09:00 AM"
  checkOutTime?: string; // "06:00 PM"
  workingHours?: number; // 8.00
  overtimeHours?: number; // 1.50
  notes?: string;
}
```

---

## 8. Payroll Contracts (`/api/v1/payroll`)

### Generate Monthly Payroll Record
```typescript
interface GeneratePayrollRequest {
  staffId: string;
  payrollMonth: number; // 1 to 12
  payrollYear: number; // e.g. 2026
  configuredSalaryDays?: number; // Defaults to 30
  presentDays: number;
  absentDays?: number;
  halfDays?: number;
  paidLeaves?: number;
  unpaidLeaves?: number;
  overtimeHours?: number;
  overtimeAmount?: number;
  deductions?: number;
  advanceDeductions?: number;
}
```

### Salary Record Response
```typescript
interface SalaryRecordResponse {
  id: string;
  staffId: string;
  payrollMonth: number;
  payrollYear: number;
  monthlyBasicSalary: string;
  configuredSalaryDays: number;
  payableDays: string;
  presentDays: string;
  absentDays: string;
  halfDays: string;
  paidLeaves: string;
  unpaidLeaves: string;
  overtimeHours: string;
  overtimeAmount: string;
  grossSalary: string;
  deductions: string;
  advanceDeductions: string;
  netSalary: string;
  totalPaid: string;      // e.g. "10000.00"
  balanceAmount: string;  // e.g. "8000.00" (netSalary - totalPaid)
  payrollStatus: "DRAFT" | "FINALIZED" | "PAID" | "PARTIALLY_PAID";
  finalizedAt: string | null;
}
```

### Record Salary Payment
```typescript
interface RecordSalaryPaymentRequest {
  salaryRecordId: string;
  paymentAmount: number;
  paymentMethod: "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";
  paymentDate: string; // "YYYY-MM-DD"
  transactionReference?: string;
  notes?: string;
}
```

---

## 8.1. Staff Advance Ledger Contracts (`/api/v1/staff-advances`)

### Disburse Staff Advance (`CreateStaffAdvanceDto`)
```typescript
interface CreateStaffAdvanceRequest {
  staffId: string;
  amount: number; // e.g. 5000.00 (must be > 0)
  advanceDate: string; // "YYYY-MM-DD"
  reason?: string;
}
```

### Staff Advance Response
```typescript
interface StaffAdvanceResponse {
  id: string;
  staffId: string;
  amount: string; // "5000.00"
  recoveredAmount: string; // "2000.00"
  advanceDate: string; // "YYYY-MM-DD"
  status: "PENDING" | "PARTIALLY_REPAID" | "REPAID" | "WAIVED";
  reason: string | null;
  salaryRecordId: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## 9. Expense Contracts (`/api/v1/expenses`)

### Create Expense (`CreateExpenseDto`)
```typescript
interface CreateExpenseRequest {
  expenseCategoryId: string;
  description: string;
  amount: number;
  paymentMethod: "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";
  paymentDate: string; // "YYYY-MM-DD"
  transactionReference?: string;
  notes?: string;
}
```
