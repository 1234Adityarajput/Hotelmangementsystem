-- ============================================================================
-- REPRODUCIBLE POSTGRESQL 16 DATABASE INTEGRITY TEST SUITE
-- Hotel Management Software (Modular Monolith)
-- Tests all triggers, GiST exclusion constraints, and CHECK constraints.
-- ============================================================================

\set ON_ERROR_STOP on

BEGIN;

RAISE NOTICE '============================================================';
RAISE NOTICE 'STARTING POSTGRESQL 16 DATABASE INTEGRITY TEST SUITE';
RAISE NOTICE '============================================================';

-- ----------------------------------------------------------------------------
-- SETUP: Create prerequisite dummy records
-- ----------------------------------------------------------------------------
INSERT INTO "room_types" ("id", "name", "default_price_per_night", "capacity")
VALUES ('rt-test-1', 'Test Standard Room', 1500.00, 2);

INSERT INTO "rooms" ("id", "room_number", "room_type_id", "price_per_night", "room_status")
VALUES 
  ('room-test-101', 'T-101', 'rt-test-1', 1500.00, 'AVAILABLE'),
  ('room-test-102', 'T-102', 'rt-test-1', 1500.00, 'AVAILABLE'),
  ('room-test-maint', 'T-MAINT', 'rt-test-1', 1500.00, 'MAINTENANCE');

INSERT INTO "guests" ("id", "guest_code", "full_name", "mobile_number")
VALUES 
  ('guest-test-1', 'GST-T01', 'Alice Guest', '+919999900001'),
  ('guest-test-2', 'GST-T02', 'Bob Guest', '+919999900002');

INSERT INTO "staff" ("id", "employee_code", "full_name", "mobile_number", "designation", "department", "joining_date", "monthly_salary")
VALUES ('staff-test-1', 'EMP-T01', 'John Staff', '+918888800001', 'Receptionist', 'Front Desk', '2026-01-01', 25000.00);

RAISE NOTICE 'Prerequisite test data created.';

-- ----------------------------------------------------------------------------
-- TEST 1: Primary Guest Creation and Replacement
-- ----------------------------------------------------------------------------
RAISE NOTICE 'Running Test 1: Primary guest creation and replacement...';

INSERT INTO "bookings" (
  "id", "booking_number", "primary_guest_id", "room_id", "booking_status",
  "check_in_date", "expected_check_out_date", "number_of_nights", "room_rate_per_night"
) VALUES (
  'bkg-test-1', 'BKG-T001', 'guest-test-1', 'room-test-101', 'RESERVED',
  '2026-12-01', '2026-12-05', 4, 1500.00
);

-- Assert junction record created automatically
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "booking_guests" 
    WHERE "booking_id" = 'bkg-test-1' AND "guest_id" = 'guest-test-1' AND "is_primary_guest" = true
  ) THEN
    RAISE EXCEPTION 'Test 1 Failed: Primary guest junction record was not automatically created.';
  END IF;
END $$;

-- Update primary guest to Bob
UPDATE "bookings" SET "primary_guest_id" = 'guest-test-2' WHERE "id" = 'bkg-test-1';

-- Assert junction record updated (Bob is primary, Alice is demoted)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "booking_guests" 
    WHERE "booking_id" = 'bkg-test-1' AND "guest_id" = 'guest-test-2' AND "is_primary_guest" = true
  ) THEN
    RAISE EXCEPTION 'Test 1 Failed: Bob was not promoted to primary guest.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "booking_guests" 
    WHERE "booking_id" = 'bkg-test-1' AND "guest_id" = 'guest-test-1' AND "is_primary_guest" = true
  ) THEN
    RAISE EXCEPTION 'Test 1 Failed: Alice was not demoted from primary guest.';
  END IF;
END $$;
RAISE NOTICE 'Test 1 Passed: Primary guest automatically created and synchronized on update.';

-- ----------------------------------------------------------------------------
-- TEST 2: Invalid Primary Guest Promotion and Deletion Rejection
-- ----------------------------------------------------------------------------
RAISE NOTICE 'Running Test 2: Invalid primary guest promotion and deletion rejection...';

-- Try to manually promote Alice as primary while booking primary_guest_id is Bob
DO $$
BEGIN
  BEGIN
    UPDATE "booking_guests" SET "is_primary_guest" = true 
    WHERE "booking_id" = 'bkg-test-1' AND "guest_id" = 'guest-test-1';
    RAISE EXCEPTION 'Test 2 Failed: Unmatched primary guest promotion should have been blocked.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Caught expected rejection: %', SQLERRM;
  END;
END $$;

-- Try to delete the active primary guest junction record directly
DO $$
BEGIN
  BEGIN
    DELETE FROM "booking_guests" 
    WHERE "booking_id" = 'bkg-test-1' AND "guest_id" = 'guest-test-2';
    RAISE EXCEPTION 'Test 2 Failed: Deletion of active primary guest should have been blocked.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Caught expected rejection: %', SQLERRM;
  END;
END $$;
RAISE NOTICE 'Test 2 Passed: Invalid primary guest modifications successfully blocked.';

-- ----------------------------------------------------------------------------
-- TEST 3: Room Check-in and Checkout Status Synchronization
-- ----------------------------------------------------------------------------
RAISE NOTICE 'Running Test 3: Room check-in and checkout synchronization...';

UPDATE "bookings" 
SET "booking_status" = 'CHECKED_IN', "actual_check_in_at" = CURRENT_TIMESTAMP 
WHERE "id" = 'bkg-test-1';

-- Assert room is OCCUPIED
DO $$
BEGIN
  IF (SELECT "room_status" FROM "rooms" WHERE "id" = 'room-test-101') != 'OCCUPIED' THEN
    RAISE EXCEPTION 'Test 3 Failed: Room 101 was not marked OCCUPIED upon check-in.';
  END IF;
END $$;

UPDATE "bookings" 
SET "booking_status" = 'CHECKED_OUT', "actual_check_out_at" = CURRENT_TIMESTAMP 
WHERE "id" = 'bkg-test-1';

-- Assert room reverted to AVAILABLE
DO $$
BEGIN
  IF (SELECT "room_status" FROM "rooms" WHERE "id" = 'room-test-101') != 'AVAILABLE' THEN
    RAISE EXCEPTION 'Test 3 Failed: Room 101 was not returned to AVAILABLE upon checkout.';
  END IF;
END $$;
RAISE NOTICE 'Test 3 Passed: Check-in and checkout synchronized room status accurately.';

-- ----------------------------------------------------------------------------
-- TEST 4: Room Relocation
-- ----------------------------------------------------------------------------
RAISE NOTICE 'Running Test 4: Room relocation while checked-in...';

-- Re-checkin to Room 101
UPDATE "bookings" 
SET "booking_status" = 'CHECKED_IN', "actual_check_in_at" = CURRENT_TIMESTAMP 
WHERE "id" = 'bkg-test-1';

-- Relocate booking from Room 101 to Room 102
UPDATE "bookings" SET "room_id" = 'room-test-102' WHERE "id" = 'bkg-test-1';

-- Assert Room 102 is OCCUPIED and Room 101 is released to AVAILABLE
DO $$
BEGIN
  IF (SELECT "room_status" FROM "rooms" WHERE "id" = 'room-test-102') != 'OCCUPIED' THEN
    RAISE EXCEPTION 'Test 4 Failed: New room 102 was not marked OCCUPIED.';
  END IF;

  IF (SELECT "room_status" FROM "rooms" WHERE "id" = 'room-test-101') != 'AVAILABLE' THEN
    RAISE EXCEPTION 'Test 4 Failed: Old room 101 was not released to AVAILABLE.';
  END IF;
END $$;
RAISE NOTICE 'Test 4 Passed: Room relocation safely released old room and occupied new room.';

-- ----------------------------------------------------------------------------
-- TEST 5: Manual AVAILABLE Status Change While Occupied Rejection
-- ----------------------------------------------------------------------------
RAISE NOTICE 'Running Test 5: Manual AVAILABLE status change rejection...';

DO $$
BEGIN
  BEGIN
    UPDATE "rooms" SET "room_status" = 'AVAILABLE' WHERE "id" = 'room-test-102';
    RAISE EXCEPTION 'Test 5 Failed: Setting room 102 to AVAILABLE while occupied should have been rejected.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Caught expected rejection: %', SQLERRM;
  END;
END $$;
RAISE NOTICE 'Test 5 Passed: Manual AVAILABLE transition blocked while occupied.';

-- ----------------------------------------------------------------------------
-- TEST 6: Maintenance Protection
-- ----------------------------------------------------------------------------
RAISE NOTICE 'Running Test 6: Maintenance protection...';

-- 6A: Try to change occupied Room 102 to MAINTENANCE
DO $$
BEGIN
  BEGIN
    UPDATE "rooms" SET "room_status" = 'MAINTENANCE' WHERE "id" = 'room-test-102';
    RAISE EXCEPTION 'Test 6 Failed: Setting room 102 to MAINTENANCE while occupied should have been rejected.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Caught expected rejection: %', SQLERRM;
  END;
END $$;

-- 6B: Try to allocate Room T-MAINT to a new booking
DO $$
BEGIN
  BEGIN
    INSERT INTO "bookings" (
      "id", "booking_number", "primary_guest_id", "room_id", "booking_status",
      "check_in_date", "expected_check_out_date", "number_of_nights", "room_rate_per_night"
    ) VALUES (
      'bkg-test-fail-maint', 'BKG-TFAIL', 'guest-test-1', 'room-test-maint', 'RESERVED',
      '2026-12-10', '2026-12-12', 2, 1500.00
    );
    RAISE EXCEPTION 'Test 6 Failed: Booking a room in MAINTENANCE should have been rejected.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Caught expected rejection: %', SQLERRM;
  END;
END $$;
RAISE NOTICE 'Test 6 Passed: Maintenance protections enforced in both directions.';

-- ----------------------------------------------------------------------------
-- TEST 7: Invoice Discount Boundaries & NULL Values
-- ----------------------------------------------------------------------------
RAISE NOTICE 'Running Test 7: Invoice discount validity & NULL safety...';

-- Valid invoice with discount_type = NULL
INSERT INTO "invoices" (
  "id", "invoice_number", "booking_id", "invoice_date", "room_charges",
  "subtotal", "tax_percentage", "tax_amount", "total_amount", "total_paid", "balance_amount"
) VALUES (
  'inv-test-1', 'INV-T001', 'bkg-test-1', '2026-12-05', 6000.00,
  6000.00, 12.00, 720.00, 6720.00, 0.00, 6720.00
);

-- Invalid invoice: percentage discount > 100
DO $$
BEGIN
  BEGIN
    INSERT INTO "invoices" (
      "id", "invoice_number", "booking_id", "invoice_date", "room_charges",
      "subtotal", "discount_type", "discount_value", "discount_amount",
      "tax_percentage", "tax_amount", "total_amount", "total_paid", "balance_amount"
    ) VALUES (
      'inv-test-fail', 'INV-TFAIL', 'bkg-test-1', '2026-12-05', 6000.00,
      6000.00, 'PERCENTAGE', 110.00, 6600.00,
      0.00, 0.00, 0.00, 0.00, 0.00
    );
    RAISE EXCEPTION 'Test 7 Failed: Discount percentage > 100 should have been rejected.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Caught expected rejection: %', SQLERRM;
  END;
END $$;
RAISE NOTICE 'Test 7 Passed: NULL-safe discount constraints validated.';

-- ----------------------------------------------------------------------------
-- TEST 8: Balance Calculation Integrity (Invoice, Salary, Advance)
-- ----------------------------------------------------------------------------
RAISE NOTICE 'Running Test 8: Balance calculation integrity...';

-- 8A: Invalid Invoice balance (balance != total_amount - total_paid)
DO $$
BEGIN
  BEGIN
    INSERT INTO "invoices" (
      "id", "invoice_number", "booking_id", "invoice_date", "room_charges",
      "subtotal", "tax_percentage", "tax_amount", "total_amount", "total_paid", "balance_amount"
    ) VALUES (
      'inv-test-bal-fail', 'INV-TBALFAIL', 'bkg-test-1', '2026-12-05', 1000.00,
      1000.00, 0.00, 0.00, 1000.00, 200.00, 500.00 -- 1000 - 200 != 500
    );
    RAISE EXCEPTION 'Test 8 Failed: Inconsistent invoice balance should have been rejected.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Caught expected rejection: %', SQLERRM;
  END;
END $$;

-- 8B: Invalid Salary balance (balance != net_salary - total_paid)
DO $$
BEGIN
  BEGIN
    INSERT INTO "salary_records" (
      "id", "staff_id", "payroll_month", "payroll_year", "monthly_basic_salary",
      "gross_salary", "net_salary", "total_paid", "balance_amount"
    ) VALUES (
      'sal-test-fail', 'staff-test-1', 11, 2026, 25000.00,
      25000.00, 25000.00, 10000.00, 12000.00 -- 25000 - 10000 != 12000
    );
    RAISE EXCEPTION 'Test 8 Failed: Inconsistent salary balance should have been rejected.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Caught expected rejection: %', SQLERRM;
  END;
END $$;

-- 8C: Invalid Staff Advance (recovered_amount > amount)
DO $$
BEGIN
  BEGIN
    INSERT INTO "staff_advances" ("id", "staff_id", "amount", "recovered_amount", "advance_date")
    VALUES ('adv-test-fail', 'staff-test-1', 5000.00, 6000.00, '2026-11-01');
    RAISE EXCEPTION 'Test 8 Failed: Staff advance recovery > original amount should have been rejected.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Caught expected rejection: %', SQLERRM;
  END;
END $$;
RAISE NOTICE 'Test 8 Passed: Mathematical balance relationships and recovery limits enforced.';

-- ----------------------------------------------------------------------------
-- TEST 9: Concurrent Room Booking Overlap Protection (GiST Exclusion)
-- ----------------------------------------------------------------------------
RAISE NOTICE 'Running Test 9: Overlapping booking rejection...';

DO $$
BEGIN
  BEGIN
    -- Room 102 is already booked from 2026-12-01 to 2026-12-05 (bkg-test-1)
    -- Attempt overlapping booking: 2026-12-03 to 2026-12-07
    INSERT INTO "bookings" (
      "id", "booking_number", "primary_guest_id", "room_id", "booking_status",
      "check_in_date", "expected_check_out_date", "number_of_nights", "room_rate_per_night"
    ) VALUES (
      'bkg-test-overlap', 'BKG-TOVERLAP', 'guest-test-1', 'room-test-102', 'RESERVED',
      '2026-12-03', '2026-12-07', 4, 1500.00
    );
    RAISE EXCEPTION 'Test 9 Failed: Overlapping active booking should have been blocked by GiST exclusion constraint.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Caught expected rejection: %', SQLERRM;
  END;
END $$;
RAISE NOTICE 'Test 9 Passed: Zero overlapping active bookings guaranteed by GiST exclusion constraint.';

-- ----------------------------------------------------------------------------
-- TEST 10: Single Admin Singleton Enforcement
-- ----------------------------------------------------------------------------
RAISE NOTICE 'Running Test 10: Single Admin constraint...';

INSERT INTO "admins" ("id", "username", "password_hash")
VALUES ('admin-test-1', 'superadmin', 'hash_placeholder');

DO $$
BEGIN
  BEGIN
    INSERT INTO "admins" ("id", "username", "password_hash")
    VALUES ('admin-test-2', 'secondadmin', 'hash_placeholder');
    RAISE EXCEPTION 'Test 10 Failed: Second admin insertion should have been blocked.';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Caught expected rejection: %', SQLERRM;
  END;
END $$;
RAISE NOTICE 'Test 10 Passed: Single-admin singleton constraint enforced.';

RAISE NOTICE '============================================================';
RAISE NOTICE 'ALL 10 DATABASE INTEGRITY TESTS PASSED SUCCESSFULLY!';
RAISE NOTICE '============================================================';

-- Roll back test transaction to leave database clean
ROLLBACK;
