# STAFF MANAGEMENT MODULE IMPLEMENTATION DOCUMENT

## 1. Overview
The Staff Management module provides centralized HR and employee records management within the Hotel Management System. It manages the full lifecycle of hotel personnel—from onboarding, department assignments, salary definition, bank account records, to termination or status transitions.

## 2. Architectural Design
- **Backend Architecture**: NestJS modular monolith (`StaffModule`, `StaffController`, `StaffService`).
- **Database Model**: `model Staff` in Prisma ORM, mapped to `staff` table in Neon PostgreSQL.
- **Frontend Architecture**: Next.js 15 (`app/staff/page.tsx`, `staffService`).
- **Authentication**: Single-Admin JWT architecture. All staff operations are performed strictly by the hotel administrator; no staff login or individual RBAC credentials are required.

## 3. Database Schema & Constraints
```prisma
model Staff {
  id                    String           @id @default(uuid())
  employeeCode          String           @unique @map("employee_code")
  fullName              String           @map("full_name")
  mobileNumber          String           @map("mobile_number")
  alternateMobileNumber String?          @map("alternate_mobile_number")
  email                 String?
  address               String?
  dateOfBirth           DateTime?        @map("date_of_birth") @db.Date
  emergencyContact      String?          @map("emergency_contact")
  designation           String
  department            String
  joiningDate           DateTime         @map("joining_date") @db.Date
  employmentStatus      EmploymentStatus @default(ACTIVE) @map("employment_status")
  monthlySalary         Decimal          @map("monthly_salary") @db.Decimal(12, 2)
  bankAccountHolder     String?          @map("bank_account_holder")
  bankAccountNumber     String?          @map("bank_account_number")
  bankIfscCode          String?          @map("bank_ifsc_code")
  notes                 String?
  createdAt             DateTime         @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt             DateTime         @updatedAt @map("updated_at") @db.Timestamptz(3)

  attendanceRecords Attendance[]
  salaryRecords     SalaryRecord[]
  advances          StaffAdvance[]

  @@index([employmentStatus])
  @@index([department])
  @@index([mobileNumber])
  @@map("staff")
}
```

## 4. API Endpoints
- `GET /api/v1/staff` — List staff with pagination, department filtering, employment status, search.
- `GET /api/v1/staff/:id` — Get detailed employee profile including salary history, advances, attendance.
- `POST /api/v1/staff` — Create new staff profile with unique `employeeCode`.
- `PATCH /api/v1/staff/:id` — Update staff profile, designation, salary, status.
- `DELETE /api/v1/staff/:id` — Soft-delete or archive staff record (blocked if financial/attendance history exists).

## 5. Audit Logging
Every staff creation, profile modification, or employment status change automatically inserts an immutable record into the `audit_logs` table containing the previous state and new state payloads.
