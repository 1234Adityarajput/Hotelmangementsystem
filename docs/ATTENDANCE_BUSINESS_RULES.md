# STAFF ATTENDANCE BUSINESS RULES & ARCHITECTURE

## 1. Overview
The Attendance Management module tracks daily presence, shifts, working hours, and overtime for all hotel personnel. It serves as the primary operational input into the Monthly Payroll engine.

## 2. Business Rules & Constraints
1. **Unique Staff-Date Constraint**:
   PostgreSQL enforces `@@unique([staffId, attendanceDate])`. A staff member can have at most one attendance record per calendar date. Duplicate markings are rejected at both backend validation and database levels.
2. **Attendance Statuses**:
   - `PRESENT`: Full day shift completed.
   - `ABSENT`: Unexcused or unapproved absence (deducted from salary).
   - `HALF_DAY`: Partial shift worked (counted as 0.5 payable day).
   - `LEAVE`: Approved paid or unpaid leave.
   - `WEEKLY_OFF`: Statutory or rostered rest day (counted as payable day for monthly salaried staff).
3. **Working Hours & Overtime Calculation**:
   - Standard shift duration = 8.0 hours.
   - Any hours worked beyond standard shift duration are categorized as `overtimeHours`.
   - Overtime is calculated as `max(0, workingHours - 8.0)`.
   - Overtime is remunerated at 1.5x the hourly basic rate during payroll generation.

## 3. Database Schema
```prisma
model Attendance {
  id               String           @id @default(uuid())
  staffId          String           @map("staff_id")
  attendanceDate   DateTime         @map("attendance_date") @db.Date
  attendanceStatus AttendanceStatus @map("attendance_status")
  checkInTime      String?          @map("check_in_time")
  checkOutTime     String?          @map("check_out_time")
  workingHours     Decimal?         @map("working_hours") @db.Decimal(4, 2)
  overtimeHours    Decimal          @default(0.00) @map("overtime_hours") @db.Decimal(4, 2)
  notes            String?
  createdAt        DateTime         @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt        DateTime         @updatedAt @map("updated_at") @db.Timestamptz(3)

  staff Staff @relation(fields: [staffId], references: [id], onDelete: Restrict)

  @@unique([staffId, attendanceDate])
  @@index([attendanceDate])
  @@index([attendanceStatus])
  @@map("attendance")
}
```

## 4. REST API Contract
- `GET /api/v1/attendance` — Query attendance by date, staff ID, status, or date range.
- `GET /api/v1/attendance/daily-register` — Get comprehensive daily roster for all active employees for a given date.
- `POST /api/v1/attendance/mark` — Mark or update single attendance record.
- `POST /api/v1/attendance/bulk-mark` — Bulk attendance marking for whole hotel department.
