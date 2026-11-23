# HOTEL SETTINGS & SYSTEM ADMINISTRATION MODULE

## 1. Overview
The Hotel Settings module provides centralized configuration of hotel identity, tax calculation policies, check-in/out default timings, and salary calculation rules.

## 2. Singleton Architecture
PostgreSQL enforces a singleton row constraint (`is_singleton = true` with a unique constraint). The application maintains exactly one global configuration row across the life of the property.

## 3. Database Schema
```prisma
model HotelSetting {
  id                   String   @id @default(uuid())
  isSingleton          Boolean  @default(true) @unique @map("is_singleton")
  hotelName            String   @map("hotel_name")
  hotelAddress         String?  @map("hotel_address")
  mobileNumber         String?  @map("mobile_number")
  email                String?
  logoFileReference    String?  @map("logo_file_reference")
  currencyCode         String   @default("INR") @map("currency_code")
  timezone             String   @default("Asia/Kolkata")
  defaultCheckInTime   String   @default("14:00") @map("default_check_in_time")
  defaultCheckOutTime  String   @default("11:00") @map("default_check_out_time")
  taxEnabled           Boolean  @default(true) @map("tax_enabled")
  defaultTaxPercentage Decimal  @default(12.00) @map("default_tax_percentage") @db.Decimal(5, 2)
  defaultSalaryDays    Int      @default(30) @map("default_salary_days")
  createdAt            DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt            DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  @@map("hotel_settings")
}
```

## 4. API Endpoints
- `GET /api/v1/settings` — Get current property configuration and policy defaults.
- `PATCH /api/v1/settings` — Update hotel profile, tax percentage, check-in policy, salary basis.
- `GET /api/v1/health` — Live heartbeat verifying database latency, memory usage, uptime, and platform environment.
