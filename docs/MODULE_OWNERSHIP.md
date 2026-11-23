# Hotel Management Software – Module Ownership & Integration Guide

## 1. Developer Ownership Matrix

| Module Name | Database Models | Owner | Development Responsibility |
| :--- | :--- | :--- | :--- |
| **Database Architecture & Migrations** | Central PostgreSQL Schema | **Developer 1 (Database Owner)** | Schema design, migrations, security, and integrity rules. |
| **Admin Authentication** | `admins`, `audit_logs` | Developer 1 | Single Admin JWT auth, login, guards. |
| **Guest & Document Management** | `guests`, `guest_documents` | Developer 1 | Guest profiles, ID document uploads. |
| **Room Management & Pricing** | `room_types`, `rooms` | Developer 1 | Room inventory, tariff overrides, maintenance. |
| **Bookings & Check-in / Check-out**| `bookings`, `booking_guests` | Developer 1 | Stay lifecycle, double booking prevention. |
| **Hotel Items & In-Stay Orders** | `item_categories`, `items`, `booking_items` | Developer 1 | Catalog, room service orders. |
| **Billing, Invoices & Payments** | `invoices`, `payments` | Developer 1 | Financial checkout, GST billing, payment ledger. |
| **Hotel Global Settings** | `hotel_settings` | Developer 1 | Business parameters, tax defaults. |
| **Staff Management** | `staff` | **Developer 2 (Friend Developer)** | Employee CRUD, designations, salary master. |
| **Staff Attendance Register** | `attendance` | **Developer 2 (Friend Developer)** | Daily clock-in/out, status logging, monthly view. |
| **Salary, Payroll & Disbursements**| `salary_records`, `salary_payments`, `staff_advances` | **Developer 2 (Friend Developer)** | Monthly payroll generation, salary slips, advances, payments. |
| **Hotel Expense Management** | `expense_categories`, `expenses` | **Developer 2 (Friend Developer)** | Daily operating expenses, category breakdown. |
| **Digital Registers** | Query-driven on core tables | **Developer 2 (Friend Developer)** | Police / Tourism guest register, occupancy sheet. |
| **Reports & Cash Book Analytics** | Query-driven on core tables | **Developer 2 (Friend Developer)** | Daily cash book, P&L reports, revenue analytics. |

---

## 2. Core Directives for Developer 2 (Friend Developer)

1. **Single Centralized Database**:
   All modules share the exact same Neon PostgreSQL database. **Do not create a separate database, SQLite file, or secondary Prisma schema.**
2. **Read-Only Schema Authority**:
   All required tables, fields, constraints, relations, and enums have been pre-architected and tested by Developer 1. Do not alter `backend/prisma/schema.prisma` without Developer 1 review.
3. **TypeScript Prisma Client**:
   Prisma Client (`@prisma/client`) is already compiled with all types, models, and relation includes.
4. **Financial Arithmetic**:
   Always work with Prisma `Prisma.Decimal` or convert to Decimal-safe representations. Never cast to JavaScript floating numbers for math.
5. **No Duplicate Register Tables**:
   Registers and Cash Books are virtual aggregate queries on existing tables (`bookings`, `payments`, `expenses`, `attendance`).

---

## 3. Production Prisma Query Snippets for Developer 2 Modules

### A. Staff Management
```typescript
import { PrismaClient, EmploymentStatus } from '@prisma/client';
const prisma = new PrismaClient();

// 1. Create a new staff member
async function createStaff(data: {
  employeeCode: string;
  fullName: string;
  mobileNumber: string;
  designation: string;
  department: string;
  joiningDate: string; // "YYYY-MM-DD"
  monthlySalary: number;
}) {
  return prisma.staff.create({
    data: {
      employeeCode: data.employeeCode,
      fullName: data.fullName,
      mobileNumber: data.mobileNumber,
      designation: data.designation,
      department: data.department,
      joiningDate: new Date(data.joiningDate),
      monthlySalary: data.monthlySalary,
      employmentStatus: EmploymentStatus.ACTIVE,
    },
  });
}

// 2. List active staff by department
async function getStaffByDepartment(department: string) {
  return prisma.staff.findMany({
    where: {
      department,
      employmentStatus: EmploymentStatus.ACTIVE,
    },
    orderBy: { fullName: 'asc' },
  });
}
```

---

### B. Staff Daily Attendance
```typescript
import { AttendanceStatus } from '@prisma/client';

// 1. Mark or Update Daily Attendance (Idempotent via compound unique key)
async function recordDailyAttendance(data: {
  staffId: string;
  attendanceDate: string; // "YYYY-MM-DD"
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours?: number;
  overtimeHours?: number;
}) {
  const dateObj = new Date(data.attendanceDate);
  
  return prisma.attendance.upsert({
    where: {
      staffId_attendanceDate: {
        staffId: data.staffId,
        attendanceDate: dateObj,
      },
    },
    update: {
      attendanceStatus: data.status,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      workingHours: data.workingHours,
      overtimeHours: data.overtimeHours || 0.0,
    },
    create: {
      staffId: data.staffId,
      attendanceDate: dateObj,
      attendanceStatus: data.status,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      workingHours: data.workingHours,
      overtimeHours: data.overtimeHours || 0.0,
    },
  });
}

// 2. Fetch Monthly Attendance Register for a Staff Member
async function getMonthlyStaffAttendance(staffId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  return prisma.attendance.findMany({
    where: {
      staffId,
      attendanceDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { attendanceDate: 'asc' },
  });
}
```

---

### C. Staff Salary, Payroll & Advances
```typescript
import { PayrollStatus, PaymentMethod } from '@prisma/client';

// 1. Generate / Lock Monthly Salary Record
async function generateMonthlyPayroll(data: {
  staffId: string;
  month: number;
  year: number;
  presentDays: number;
  paidLeaves: number;
  halfDays: number;
  overtimeAmount: number;
  deductions: number;
  advanceDeductions: number;
}) {
  const staff = await prisma.staff.findUniqueOrThrow({
    where: { id: data.staffId },
  });

  const configuredDays = 30;
  const basicSalary = Number(staff.monthlySalary);
  const dailyWage = basicSalary / configuredDays;
  
  const payableDays = data.presentDays + data.paidLeaves + (data.halfDays * 0.5);
  const grossSalary = (dailyWage * payableDays) + data.overtimeAmount;
  const netSalary = grossSalary - data.deductions - data.advanceDeductions;

  return prisma.salaryRecord.upsert({
    where: {
      staffId_payrollMonth_payrollYear: {
        staffId: data.staffId,
        payrollMonth: data.month,
        payrollYear: data.year,
      },
    },
    update: {
      payableDays,
      presentDays: data.presentDays,
      paidLeaves: data.paidLeaves,
      halfDays: data.halfDays,
      overtimeAmount: data.overtimeAmount,
      grossSalary,
      deductions: data.deductions,
      advanceDeductions: data.advanceDeductions,
      netSalary,
    },
    create: {
      staffId: data.staffId,
      payrollMonth: data.month,
      payrollYear: data.year,
      monthlyBasicSalary: staff.monthlySalary, // Snapshot!
      configuredSalaryDays: configuredDays,
      payableDays,
      presentDays: data.presentDays,
      paidLeaves: data.paidLeaves,
      halfDays: data.halfDays,
      overtimeAmount: data.overtimeAmount,
      grossSalary,
      deductions: data.deductions,
      advanceDeductions: data.advanceDeductions,
      netSalary,
      payrollStatus: PayrollStatus.DRAFT,
    },
  });
}

// 2. Disburse Salary Payment
async function recordSalaryDisbursement(data: {
  salaryRecordId: string;
  paymentReference: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: string;
  transactionReference?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.salaryPayment.create({
      data: {
        salaryRecordId: data.salaryRecordId,
        paymentReference: data.paymentReference,
        paymentAmount: data.amount,
        paymentMethod: data.method,
        paymentDate: new Date(data.paymentDate),
        transactionReference: data.transactionReference,
      },
    });

    // Check if payroll is fully paid
    const totalPayments = await tx.salaryPayment.aggregate({
      where: { salaryRecordId: data.salaryRecordId },
      _sum: { paymentAmount: true },
    });

    const record = await tx.salaryRecord.findUniqueOrThrow({
      where: { id: data.salaryRecordId },
    });

    const totalPaid = Number(totalPayments._sum.paymentAmount || 0);
    const netSalary = Number(record.netSalary);
    const balanceAmount = Math.max(0, netSalary - totalPaid);

    const newStatus = totalPaid >= netSalary ? PayrollStatus.PAID : PayrollStatus.PARTIALLY_PAID;

    await tx.salaryRecord.update({
      where: { id: data.salaryRecordId },
      data: {
        totalPaid,
        balanceAmount,
        payrollStatus: newStatus,
      },
    });

    return payment;
  });
}

// 3. Disburse Staff Advance
async function issueStaffAdvance(data: {
  staffId: string;
  amount: number;
  advanceDate: string;
  reason?: string;
}) {
  return prisma.staffAdvance.create({
    data: {
      staffId: data.staffId,
      amount: data.amount,
      recoveredAmount: 0.00,
      advanceDate: new Date(data.advanceDate),
      status: 'PENDING',
      reason: data.reason,
    },
  });
}

// 4. Recover Staff Advance During Payroll Finalization
async function applyAdvanceDeduction(advanceId: string, deductionAmount: number, salaryRecordId: string) {
  const advance = await prisma.staffAdvance.findUniqueOrThrow({
    where: { id: advanceId },
  });

  const totalRecovered = Number(advance.recoveredAmount) + deductionAmount;
  const newStatus = totalRecovered >= Number(advance.amount) ? 'REPAID' : 'PARTIALLY_REPAID';

  return prisma.staffAdvance.update({
    where: { id: advanceId },
    data: {
      recoveredAmount: totalRecovered,
      status: newStatus,
      salaryRecordId,
    },
  });
}
```

---

### D. Hotel Expenses Management
```typescript
// 1. Log an Operational Expense
async function recordExpense(data: {
  reference: string;
  categoryId: string;
  description: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  transactionReference?: string;
}) {
  return prisma.expense.create({
    data: {
      expenseReference: data.reference,
      expenseCategoryId: data.categoryId,
      description: data.description,
      amount: data.amount,
      paymentMethod: data.method,
      paymentDate: new Date(data.date),
      transactionReference: data.transactionReference,
    },
  });
}

// 2. Category-wise Monthly Expense Summary
async function getMonthlyExpenseBreakdown(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return prisma.expense.groupBy({
    by: ['expenseCategoryId'],
    where: {
      paymentDate: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
    _count: { id: true },
  });
}
```

---

### E. Digital Registers & Daily Cash Book Queries
```typescript
// 1. Daily Guest Register (Police / Tourism Submission Format)
async function getDailyGuestRegister(targetDate: string) {
  const dateObj = new Date(targetDate);

  return prisma.booking.findMany({
    where: {
      checkInDate: dateObj,
    },
    include: {
      primaryGuest: {
        include: { documents: true },
      },
      bookingGuests: {
        include: { guest: { include: { documents: true } } },
      },
      room: {
        include: { roomType: true },
      },
    },
    orderBy: { checkInTime: 'asc' },
  });
}

// 2. Daily Cash Book Ledger (Inflows vs Outflows)
async function getDailyCashBook(dateString: string) {
  const accountingDate = new Date(dateString);

  // Cash Inflows (Guest payments made in CASH)
  const cashInflows = await prisma.payment.findMany({
    where: {
      paymentDate: accountingDate,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: 'COMPLETED',
    },
    select: {
      id: true,
      paymentReference: true,
      amount: true,
      paymentType: true,
      booking: {
        select: {
          bookingNumber: true,
          primaryGuest: { select: { fullName: true } },
          room: { select: { roomNumber: true } },
        },
      },
    },
  });

  // Cash Outflows 1: Operating Expenses in CASH
  const expenseOutflows = await prisma.expense.findMany({
    where: {
      paymentDate: accountingDate,
      paymentMethod: PaymentMethod.CASH,
    },
    include: { category: true },
  });

  // Cash Outflows 2: Salary disbursements in CASH
  const salaryOutflows = await prisma.salaryPayment.findMany({
    where: {
      paymentDate: accountingDate,
      paymentMethod: PaymentMethod.CASH,
    },
    include: {
      salaryRecord: {
        include: { staff: true },
      },
    },
  });

  const totalInflow = cashInflows.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpenseOutflow = expenseOutflows.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalSalaryOutflow = salaryOutflows.reduce((sum, s) => sum + Number(s.paymentAmount), 0);
  const totalOutflow = totalExpenseOutflow + totalSalaryOutflow;
  const netDayCash = totalInflow - totalOutflow;

  return {
    date: dateString,
    inflows: {
      records: cashInflows,
      total: totalInflow,
    },
    outflows: {
      expenses: expenseOutflows,
      salaries: salaryOutflows,
      total: totalOutflow,
    },
    netCashDifference: netDayCash,
  };
}
```
