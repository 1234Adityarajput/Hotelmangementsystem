-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'FINALIZED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ADVANCE', 'PARTIAL', 'FINAL', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED', 'RESIGNED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'WEEKLY_OFF');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'FINALIZED', 'PAID', 'PARTIALLY_PAID');

-- CreateEnum
CREATE TYPE "AdvanceStatus" AS ENUM ('PENDING', 'PARTIALLY_REPAID', 'REPAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'FINALIZE', 'CANCEL', 'CORRECTION');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_singleton" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "guest_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "mobile_number" TEXT NOT NULL,
    "alternate_mobile_number" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "date_of_birth" DATE,
    "gender" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_documents" (
    "id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "document_file_reference" TEXT NOT NULL,
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "guest_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "default_price_per_night" DECIMAL(12,2) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "room_number" TEXT NOT NULL,
    "room_type_id" TEXT NOT NULL,
    "description" TEXT,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "price_per_night" DECIMAL(12,2) NOT NULL,
    "room_status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "booking_number" TEXT NOT NULL,
    "primary_guest_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "booking_status" "BookingStatus" NOT NULL DEFAULT 'RESERVED',
    "check_in_date" DATE NOT NULL,
    "check_in_time" TEXT,
    "expected_check_out_date" DATE NOT NULL,
    "expected_check_out_time" TEXT,
    "actual_check_in_at" TIMESTAMPTZ(3),
    "actual_check_out_at" TIMESTAMPTZ(3),
    "number_of_nights" INTEGER NOT NULL,
    "number_of_guests" INTEGER NOT NULL DEFAULT 1,
    "room_rate_per_night" DECIMAL(12,2) NOT NULL,
    "advance_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_guests" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "is_primary_guest" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "item_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_items" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "item_id" TEXT,
    "item_name_snapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "purchase_date" DATE NOT NULL,
    "purchase_time" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "invoice_status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "room_charges" DECIMAL(12,2) NOT NULL,
    "additional_charges" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_type" "DiscountType",
    "discount_value" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "tax_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "total_paid" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "balance_amount" DECIMAL(12,2) NOT NULL,
    "invoice_date" DATE NOT NULL,
    "finalized_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "payment_reference" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "payment_type" "PaymentType" NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "transaction_reference" TEXT,
    "payment_date" DATE NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "employee_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "mobile_number" TEXT NOT NULL,
    "alternate_mobile_number" TEXT,
    "email" TEXT,
    "address" TEXT,
    "date_of_birth" DATE,
    "emergency_contact" TEXT,
    "designation" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "joining_date" DATE NOT NULL,
    "employment_status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "monthly_salary" DECIMAL(12,2) NOT NULL,
    "bank_account_holder" TEXT,
    "bank_account_number" TEXT,
    "bank_ifsc_code" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "attendance_date" DATE NOT NULL,
    "attendance_status" "AttendanceStatus" NOT NULL,
    "check_in_time" TEXT,
    "check_out_time" TEXT,
    "working_hours" DECIMAL(4,2),
    "overtime_hours" DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_advances" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "advance_reference" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "advance_date" DATE NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "repayment_status" "AdvanceStatus" NOT NULL DEFAULT 'PENDING',
    "recovered_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "balance_amount" DECIMAL(12,2) NOT NULL,
    "salary_record_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "staff_advances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_records" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "payroll_month" INTEGER NOT NULL,
    "payroll_year" INTEGER NOT NULL,
    "monthly_basic_salary" DECIMAL(12,2) NOT NULL,
    "configured_salary_days" INTEGER NOT NULL DEFAULT 30,
    "payable_days" DECIMAL(5,2) NOT NULL,
    "present_days" DECIMAL(5,2) NOT NULL,
    "absent_days" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "half_days" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "paid_leaves" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "unpaid_leaves" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "overtime_hours" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "overtime_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "gross_salary" DECIMAL(12,2) NOT NULL,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "advance_deductions" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "net_salary" DECIMAL(12,2) NOT NULL,
    "total_paid" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "balance_amount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "payroll_status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "finalized_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "salary_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_payments" (
    "id" TEXT NOT NULL,
    "salary_record_id" TEXT NOT NULL,
    "payment_reference" TEXT NOT NULL,
    "payment_amount" DECIMAL(12,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_date" DATE NOT NULL,
    "transaction_reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "salary_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "expense_reference" TEXT NOT NULL,
    "expense_category_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_date" DATE NOT NULL,
    "transaction_reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "is_singleton" BOOLEAN NOT NULL DEFAULT true,
    "hotel_name" TEXT NOT NULL DEFAULT 'Grand Horizon Hotel',
    "hotel_address" TEXT,
    "mobile_number" TEXT,
    "email" TEXT,
    "logo_file_reference" TEXT,
    "currency_code" TEXT NOT NULL DEFAULT 'INR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "default_check_in_time" TEXT NOT NULL DEFAULT '12:00 PM',
    "default_check_out_time" TEXT NOT NULL DEFAULT '11:00 AM',
    "tax_enabled" BOOLEAN NOT NULL DEFAULT true,
    "default_tax_percentage" DECIMAL(5,2) NOT NULL DEFAULT 12.00,
    "default_salary_days" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "hotel_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "previous_values" JSONB,
    "new_values" JSONB,
    "changed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_health" (
    "id" TEXT NOT NULL DEFAULT 'system',
    "is_singleton" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "system_health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_is_singleton_key" ON "admins"("is_singleton");

-- CreateIndex
CREATE UNIQUE INDEX "guests_guest_code_key" ON "guests"("guest_code");

-- CreateIndex
CREATE INDEX "guests_mobile_number_idx" ON "guests"("mobile_number");

-- CreateIndex
CREATE INDEX "guests_full_name_idx" ON "guests"("full_name");

-- CreateIndex
CREATE INDEX "guests_email_idx" ON "guests"("email");

-- CreateIndex
CREATE INDEX "guest_documents_guest_id_idx" ON "guest_documents"("guest_id");

-- CreateIndex
CREATE INDEX "guest_documents_document_type_document_number_idx" ON "guest_documents"("document_type", "document_number");

-- CreateIndex
CREATE UNIQUE INDEX "room_types_name_key" ON "room_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_room_number_key" ON "rooms"("room_number");

-- CreateIndex
CREATE INDEX "rooms_room_status_idx" ON "rooms"("room_status");

-- CreateIndex
CREATE INDEX "rooms_room_type_id_idx" ON "rooms"("room_type_id");

-- CreateIndex
CREATE INDEX "rooms_floor_idx" ON "rooms"("floor");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_number_key" ON "bookings"("booking_number");

-- CreateIndex
CREATE INDEX "bookings_primary_guest_id_idx" ON "bookings"("primary_guest_id");

-- CreateIndex
CREATE INDEX "bookings_room_id_idx" ON "bookings"("room_id");

-- CreateIndex
CREATE INDEX "bookings_booking_status_idx" ON "bookings"("booking_status");

-- CreateIndex
CREATE INDEX "bookings_check_in_date_expected_check_out_date_idx" ON "bookings"("check_in_date", "expected_check_out_date");

-- CreateIndex
CREATE INDEX "bookings_room_id_booking_status_check_in_date_expected_chec_idx" ON "bookings"("room_id", "booking_status", "check_in_date", "expected_check_out_date");

-- CreateIndex
CREATE INDEX "booking_guests_guest_id_idx" ON "booking_guests"("guest_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_guests_booking_id_guest_id_key" ON "booking_guests"("booking_id", "guest_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_categories_name_key" ON "item_categories"("name");

-- CreateIndex
CREATE INDEX "items_category_id_idx" ON "items"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "items_category_id_name_key" ON "items"("category_id", "name");

-- CreateIndex
CREATE INDEX "booking_items_booking_id_idx" ON "booking_items"("booking_id");

-- CreateIndex
CREATE INDEX "booking_items_item_id_idx" ON "booking_items"("item_id");

-- CreateIndex
CREATE INDEX "booking_items_purchase_date_idx" ON "booking_items"("purchase_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_booking_id_idx" ON "invoices"("booking_id");

-- CreateIndex
CREATE INDEX "invoices_invoice_status_idx" ON "invoices"("invoice_status");

-- CreateIndex
CREATE INDEX "invoices_invoice_date_idx" ON "invoices"("invoice_date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_reference_key" ON "payments"("payment_reference");

-- CreateIndex
CREATE INDEX "payments_booking_id_idx" ON "payments"("booking_id");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE INDEX "payments_payment_method_idx" ON "payments"("payment_method");

-- CreateIndex
CREATE INDEX "payments_payment_status_idx" ON "payments"("payment_status");

-- CreateIndex
CREATE UNIQUE INDEX "staff_employee_code_key" ON "staff"("employee_code");

-- CreateIndex
CREATE INDEX "staff_employment_status_idx" ON "staff"("employment_status");

-- CreateIndex
CREATE INDEX "staff_department_idx" ON "staff"("department");

-- CreateIndex
CREATE INDEX "staff_mobile_number_idx" ON "staff"("mobile_number");

-- CreateIndex
CREATE INDEX "attendance_attendance_date_idx" ON "attendance"("attendance_date");

-- CreateIndex
CREATE INDEX "attendance_attendance_status_idx" ON "attendance"("attendance_status");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_staff_id_attendance_date_key" ON "attendance"("staff_id", "attendance_date");

-- CreateIndex
CREATE UNIQUE INDEX "staff_advances_advance_reference_key" ON "staff_advances"("advance_reference");

-- CreateIndex
CREATE INDEX "staff_advances_staff_id_idx" ON "staff_advances"("staff_id");

-- CreateIndex
CREATE INDEX "staff_advances_advance_date_idx" ON "staff_advances"("advance_date");

-- CreateIndex
CREATE INDEX "staff_advances_repayment_status_idx" ON "staff_advances"("repayment_status");

-- CreateIndex
CREATE INDEX "salary_records_payroll_year_payroll_month_idx" ON "salary_records"("payroll_year", "payroll_month");

-- CreateIndex
CREATE INDEX "salary_records_payroll_status_idx" ON "salary_records"("payroll_status");

-- CreateIndex
CREATE UNIQUE INDEX "salary_records_staff_id_payroll_month_payroll_year_key" ON "salary_records"("staff_id", "payroll_month", "payroll_year");

-- CreateIndex
CREATE UNIQUE INDEX "salary_payments_payment_reference_key" ON "salary_payments"("payment_reference");

-- CreateIndex
CREATE INDEX "salary_payments_salary_record_id_idx" ON "salary_payments"("salary_record_id");

-- CreateIndex
CREATE INDEX "salary_payments_payment_date_idx" ON "salary_payments"("payment_date");

-- CreateIndex
CREATE INDEX "salary_payments_payment_method_idx" ON "salary_payments"("payment_method");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_name_key" ON "expense_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_expense_reference_key" ON "expenses"("expense_reference");

-- CreateIndex
CREATE INDEX "expenses_expense_category_id_idx" ON "expenses"("expense_category_id");

-- CreateIndex
CREATE INDEX "expenses_payment_date_idx" ON "expenses"("payment_date");

-- CreateIndex
CREATE INDEX "expenses_payment_method_idx" ON "expenses"("payment_method");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_settings_is_singleton_key" ON "hotel_settings"("is_singleton");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_changed_at_idx" ON "audit_logs"("changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_health_is_singleton_key" ON "system_health"("is_singleton");

-- AddForeignKey
ALTER TABLE "guest_documents" ADD CONSTRAINT "guest_documents_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_primary_guest_id_fkey" FOREIGN KEY ("primary_guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_guests" ADD CONSTRAINT "booking_guests_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_guests" ADD CONSTRAINT "booking_guests_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "item_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_advances" ADD CONSTRAINT "staff_advances_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_advances" ADD CONSTRAINT "staff_advances_salary_record_id_fkey" FOREIGN KEY ("salary_record_id") REFERENCES "salary_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_records" ADD CONSTRAINT "salary_records_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_payments" ADD CONSTRAINT "salary_payments_salary_record_id_fkey" FOREIGN KEY ("salary_record_id") REFERENCES "salary_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_expense_category_id_fkey" FOREIGN KEY ("expense_category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- ============================================================================
-- ADVANCED POSTGRESQL CONSTRAINTS & BUSINESS INTEGRITY ENFORCEMENTS
-- ============================================================================

-- 1. Enable btree_gist extension for PostgreSQL Exclusion Constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Single-Row Enforcements for Singleton Tables
ALTER TABLE "admins" ADD CONSTRAINT "check_admins_single_row" CHECK ("is_singleton" = true);
ALTER TABLE "hotel_settings" ADD CONSTRAINT "check_hotel_settings_single_row" CHECK ("is_singleton" = true);
ALTER TABLE "system_health" ADD CONSTRAINT "check_system_health_single_row" CHECK ("is_singleton" = true);

-- 3. PostgreSQL GiST Exclusion Constraint: Guarantee zero overlapping active stays
-- Enforced on: room_id equality AND daterange overlap
-- Filtered on active booking statuses ('RESERVED', 'CHECKED_IN')
ALTER TABLE "bookings" ADD CONSTRAINT "no_overlapping_active_bookings"
EXCLUDE USING gist (
  "room_id" WITH =,
  daterange("check_in_date", "expected_check_out_date", '[)') WITH &&
)
WHERE ("booking_status" IN ('RESERVED', 'CHECKED_IN'));

-- 4. Maintenance Room Protection (Bi-directional with Row-Level Share Locks)
-- 4A. Prevent allocating a room in MAINTENANCE to RESERVED or CHECKED_IN bookings
CREATE OR REPLACE FUNCTION check_room_not_in_maintenance()
RETURNS TRIGGER AS $$
DECLARE
  v_status "RoomStatus";
BEGIN
  -- Acquire shared row lock on room to prevent concurrent maintenance status updates
  SELECT "room_status" INTO v_status
  FROM "rooms" 
  WHERE "id" = NEW."room_id"
  FOR SHARE;

  IF v_status = 'MAINTENANCE' THEN
    RAISE EXCEPTION 'Cannot allocate room %: Room is currently marked under MAINTENANCE.', NEW."room_id";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_room_maintenance
BEFORE INSERT OR UPDATE OF "room_id", "booking_status" ON "bookings"
FOR EACH ROW
WHEN (NEW."booking_status" IN ('RESERVED', 'CHECKED_IN'))
EXECUTE FUNCTION check_room_not_in_maintenance();

-- 4B. Protect room status transitions:
-- - A room with an active CHECKED_IN booking cannot be marked AVAILABLE
-- - A room with an active CHECKED_IN booking cannot be marked MAINTENANCE
CREATE OR REPLACE FUNCTION protect_room_status_transitions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."room_status" = 'AVAILABLE' AND OLD."room_status" != 'AVAILABLE' THEN
    IF EXISTS (
      SELECT 1 FROM "bookings"
      WHERE "room_id" = NEW."id" AND "booking_status" = 'CHECKED_IN'
    ) THEN
      RAISE EXCEPTION 'Cannot mark room % as AVAILABLE: Room currently has an active CHECKED_IN guest stay. Guest must be checked out first.', NEW."id";
    END IF;
  END IF;

  IF NEW."room_status" = 'MAINTENANCE' AND OLD."room_status" != 'MAINTENANCE' THEN
    IF EXISTS (
      SELECT 1 FROM "bookings"
      WHERE "room_id" = NEW."id" AND "booking_status" = 'CHECKED_IN'
    ) THEN
      RAISE EXCEPTION 'Cannot mark room % as MAINTENANCE: Room currently has an active CHECKED_IN guest stay. Guests must be checked out or relocated first.', NEW."id";
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_room_status_transitions
BEFORE UPDATE OF "room_status" ON "rooms"
FOR EACH ROW
EXECUTE FUNCTION protect_room_status_transitions();

-- 5. Transaction-Safe Room Status Synchronization Trigger
CREATE OR REPLACE FUNCTION sync_room_status_from_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT: When a booking is created directly as CHECKED_IN
  IF (TG_OP = 'INSERT') THEN
    IF NEW."booking_status" = 'CHECKED_IN' THEN
      UPDATE "rooms"
      SET "room_status" = 'OCCUPIED', "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = NEW."room_id" AND "room_status" != 'OCCUPIED';
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- Case A: Guest switched rooms while remaining CHECKED_IN
    IF (OLD."booking_status" = 'CHECKED_IN' AND NEW."booking_status" = 'CHECKED_IN' AND OLD."room_id" != NEW."room_id") THEN
      -- Mark new room OCCUPIED
      UPDATE "rooms"
      SET "room_status" = 'OCCUPIED', "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = NEW."room_id" AND "room_status" != 'OCCUPIED';

      -- Release old room if not under maintenance and no other active checked-in booking occupies it
      IF NOT EXISTS (
        SELECT 1 FROM "bookings"
        WHERE "room_id" = OLD."room_id" AND "booking_status" = 'CHECKED_IN' AND "id" != NEW."id"
      ) THEN
        UPDATE "rooms"
        SET "room_status" = 'AVAILABLE', "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = OLD."room_id" AND "room_status" != 'MAINTENANCE';
      END IF;

    -- Case B: Newly checked in
    ELSIF (OLD."booking_status" != 'CHECKED_IN' AND NEW."booking_status" = 'CHECKED_IN') THEN
      UPDATE "rooms"
      SET "room_status" = 'OCCUPIED', "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = NEW."room_id" AND "room_status" != 'OCCUPIED';

    -- Case C: Transitioned from CHECKED_IN to CHECKED_OUT or CANCELLED
    ELSIF (OLD."booking_status" = 'CHECKED_IN' AND NEW."booking_status" IN ('CHECKED_OUT', 'CANCELLED')) THEN
      -- Only mark AVAILABLE if no other active checked-in booking occupies it and not under maintenance
      IF NOT EXISTS (
        SELECT 1 FROM "bookings"
        WHERE "room_id" = NEW."room_id" AND "booking_status" = 'CHECKED_IN' AND "id" != NEW."id"
      ) THEN
        UPDATE "rooms"
        SET "room_status" = 'AVAILABLE', "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = NEW."room_id" AND "room_status" != 'MAINTENANCE';
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_room_status_from_booking
AFTER INSERT OR UPDATE OF "booking_status", "room_id" ON "bookings"
FOR EACH ROW
EXECUTE FUNCTION sync_room_status_from_booking();

-- 6. Primary Guest Consistency Architecture
-- 6A. Ensure only one primary guest exists per booking
CREATE UNIQUE INDEX "unique_primary_guest_per_booking" 
ON "booking_guests"("booking_id") 
WHERE ("is_primary_guest" = true);

-- 6B. Automatically synchronize primary guest junction record on booking creation or update
CREATE OR REPLACE FUNCTION sync_primary_booking_guest()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent recursive trigger invocation
  IF pg_trigger_depth() > 2 THEN
    RETURN NEW;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO "booking_guests" ("id", "booking_id", "guest_id", "is_primary_guest", "created_at")
    VALUES (gen_random_uuid()::text, NEW."id", NEW."primary_guest_id", true, CURRENT_TIMESTAMP)
    ON CONFLICT ("booking_id", "guest_id") 
    DO UPDATE SET "is_primary_guest" = true;
    RETURN NEW;
  END IF;

  IF (TG_OP = 'UPDATE') THEN
    IF (OLD."primary_guest_id" != NEW."primary_guest_id") THEN
      -- Demote old primary guest
      UPDATE "booking_guests"
      SET "is_primary_guest" = false
      WHERE "booking_id" = NEW."id" AND "guest_id" = OLD."primary_guest_id";

      -- Promote or insert new primary guest
      IF EXISTS (
        SELECT 1 FROM "booking_guests" WHERE "booking_id" = NEW."id" AND "guest_id" = NEW."primary_guest_id"
      ) THEN
        UPDATE "booking_guests"
        SET "is_primary_guest" = true
        WHERE "booking_id" = NEW."id" AND "guest_id" = NEW."primary_guest_id";
      ELSE
        INSERT INTO "booking_guests" ("id", "booking_id", "guest_id", "is_primary_guest", "created_at")
        VALUES (gen_random_uuid()::text, NEW."id", NEW."primary_guest_id", true, CURRENT_TIMESTAMP);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_primary_booking_guest
AFTER INSERT OR UPDATE OF "primary_guest_id" ON "bookings"
FOR EACH ROW
EXECUTE FUNCTION sync_primary_booking_guest();

-- 6C. Protect primary guest junction record from invalid promotions, demotions, and deletions
CREATE OR REPLACE FUNCTION protect_primary_booking_guest()
RETURNS TRIGGER AS $$
DECLARE
  v_booking_primary_guest TEXT;
BEGIN
  -- If invoked from parent trigger cascade (depth > 1) or bypass session flag, allow execution
  IF pg_trigger_depth() > 1 OR current_setting('hotel.allow_guest_delete', true) = 'on' THEN
    IF (TG_OP = 'DELETE') THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Prevent manual deletion of the designated primary guest
  IF (TG_OP = 'DELETE') THEN
    SELECT "primary_guest_id" INTO v_booking_primary_guest
    FROM "bookings" WHERE "id" = OLD."booking_id";

    IF v_booking_primary_guest IS NOT NULL AND v_booking_primary_guest = OLD."guest_id" THEN
      RAISE EXCEPTION 'Cannot delete primary guest record (guest %) for booking %: This guest is currently designated as primaryGuestId on the booking. Update bookings.primary_guest_id first.', OLD."guest_id", OLD."booking_id";
    END IF;
    RETURN OLD;
  END IF;

  -- Prevent manual insertion of an unmatched primary guest
  IF (TG_OP = 'INSERT') THEN
    IF NEW."is_primary_guest" = true THEN
      SELECT "primary_guest_id" INTO v_booking_primary_guest
      FROM "bookings" WHERE "id" = NEW."booking_id";

      IF v_booking_primary_guest IS NOT NULL AND v_booking_primary_guest != NEW."guest_id" THEN
        RAISE EXCEPTION 'Cannot set guest % as primary for booking %: Does not match bookings.primary_guest_id (%). Update bookings.primary_guest_id first.', NEW."guest_id", NEW."booking_id", v_booking_primary_guest;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Prevent manual update promoting an unmatched guest or demoting the active primary guest
  IF (TG_OP = 'UPDATE') THEN
    SELECT "primary_guest_id" INTO v_booking_primary_guest
    FROM "bookings" WHERE "id" = NEW."booking_id";

    -- Block demotion of active primary guest
    IF OLD."is_primary_guest" = true AND NEW."is_primary_guest" = false THEN
      IF v_booking_primary_guest IS NOT NULL AND v_booking_primary_guest = OLD."guest_id" THEN
        RAISE EXCEPTION 'Cannot demote primary guest % for booking %: This guest is designated as primaryGuestId on the booking. Update bookings.primary_guest_id first.', OLD."guest_id", OLD."booking_id";
      END IF;
    END IF;

    -- Block promotion of another guest without updating booking
    IF NEW."is_primary_guest" = true THEN
      IF v_booking_primary_guest IS NOT NULL AND v_booking_primary_guest != NEW."guest_id" THEN
        RAISE EXCEPTION 'Cannot promote guest % to primary for booking %: Does not match bookings.primary_guest_id (%). Update bookings.primary_guest_id first.', NEW."guest_id", NEW."booking_id", v_booking_primary_guest;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_primary_booking_guest
BEFORE INSERT OR UPDATE OR DELETE ON "booking_guests"
FOR EACH ROW
EXECUTE FUNCTION protect_primary_booking_guest();

-- 7. Check-in Timestamp Consistency Check
ALTER TABLE "bookings" ADD CONSTRAINT "check_checked_in_timestamp"
CHECK ("booking_status" != 'CHECKED_IN' OR "actual_check_in_at" IS NOT NULL);

-- 8. Valid Check-in / Expected Check-out Sequence
ALTER TABLE "bookings" ADD CONSTRAINT "check_booking_dates"
CHECK ("expected_check_out_date" >= "check_in_date");

-- 9. Financial Non-Negative & Integrity CHECK Constraints
ALTER TABLE "rooms" ADD CONSTRAINT "check_room_price_positive" CHECK ("price_per_night" >= 0);
ALTER TABLE "room_types" ADD CONSTRAINT "check_room_type_price_positive" CHECK ("default_price_per_night" >= 0);
ALTER TABLE "bookings" ADD CONSTRAINT "check_room_rate_positive" CHECK ("room_rate_per_night" >= 0 AND "number_of_nights" >= 0 AND "number_of_guests" > 0 AND "advance_amount" >= 0);

-- Critical Fix: Column is unit_price, not price
ALTER TABLE "items" ADD CONSTRAINT "check_item_price_positive" CHECK ("unit_price" >= 0);

ALTER TABLE "booking_items" ADD CONSTRAINT "check_item_amounts_positive" CHECK ("unit_price" >= 0 AND "total_amount" >= 0 AND "quantity" > 0);

-- Invoice Financial and Balance Integrity Checks
ALTER TABLE "invoices" ADD CONSTRAINT "check_invoice_amounts_positive" 
CHECK (
  "room_charges" >= 0 AND 
  "additional_charges" >= 0 AND 
  "subtotal" >= 0 AND 
  "tax_percentage" >= 0 AND 
  "tax_amount" >= 0 AND 
  "total_amount" >= 0 AND 
  "total_paid" >= 0 AND 
  "balance_amount" >= 0 AND 
  "total_paid" <= "total_amount"
);

-- Exact Invoice Balance Relationship Validation
ALTER TABLE "invoices" ADD CONSTRAINT "check_invoice_balance_relationship"
CHECK ("balance_amount" = ("total_amount" - "total_paid"));

-- NULL-Safe Discount Validity:
-- Validates that discount_value and discount_amount are non-negative,
-- and when discount_type is PERCENTAGE, discount_value cannot exceed 100.
-- Handles discount_type IS NULL cleanly.
ALTER TABLE "invoices" ADD CONSTRAINT "check_discount_validity" 
CHECK (
  "discount_value" >= 0 AND 
  "discount_amount" >= 0 AND 
  (
    "discount_type" IS NULL OR 
    ("discount_type" = 'FIXED') OR 
    ("discount_type" = 'PERCENTAGE' AND "discount_value" <= 100)
  )
);

ALTER TABLE "payments" ADD CONSTRAINT "check_payment_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "staff" ADD CONSTRAINT "check_monthly_salary_positive" CHECK ("monthly_salary" >= 0);
ALTER TABLE "attendance" ADD CONSTRAINT "check_attendance_hours_positive" CHECK ("working_hours" >= 0 AND "overtime_hours" >= 0);

ALTER TABLE "salary_records" ADD CONSTRAINT "check_salary_amounts_positive" 
CHECK (
  "monthly_basic_salary" >= 0 AND 
  "gross_salary" >= 0 AND 
  "net_salary" >= 0 AND 
  "advance_deductions" >= 0 AND 
  "total_paid" >= 0 AND 
  "balance_amount" >= 0 AND 
  "total_paid" <= "net_salary"
);

-- Exact Salary Balance Relationship Validation
ALTER TABLE "salary_records" ADD CONSTRAINT "check_salary_balance_relationship"
CHECK ("balance_amount" = ("net_salary" - "total_paid"));

-- Salary Days and Deductions Non-Negative Validation
ALTER TABLE "salary_records" ADD CONSTRAINT "check_salary_days_and_deductions"
CHECK (
  "payable_days" >= 0 AND 
  "present_days" >= 0 AND 
  "absent_days" >= 0 AND 
  "half_days" >= 0 AND 
  "paid_leaves" >= 0 AND 
  "deductions" >= 0
);

ALTER TABLE "salary_records" ADD CONSTRAINT "check_payroll_period_valid" 
CHECK ("payroll_month" >= 1 AND "payroll_month" <= 12 AND "payroll_year" >= 2000 AND "payroll_year" <= 2100);

ALTER TABLE "salary_payments" ADD CONSTRAINT "check_salary_payment_positive" CHECK ("payment_amount" > 0);

-- Staff Advance Limits: recovered_amount cannot exceed original amount
ALTER TABLE "staff_advances" ADD CONSTRAINT "check_staff_advance_recovery_limits" 
CHECK ("amount" > 0 AND "recovered_amount" >= 0 AND "recovered_amount" <= "amount");

ALTER TABLE "expenses" ADD CONSTRAINT "check_expense_amount_positive" CHECK ("amount" > 0);

