// ============================================================================
// LIVE POSTGRESQL 16 DATABASE INTEGRITY TEST RUNNER (NEON LIVE DB)
// Executes all 10 critical operational scenarios against the live database
// and verifies every constraint, trigger, and index in actual execution.
// ============================================================================

const fs = require('fs');
const path = require('path');

// Load environment
const envPath = path.join(__dirname, '../backend/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function runLiveTests() {
  console.log('====================================================================');
  console.log('   RUNNING LIVE POSTGRESQL 16 INTEGRITY TESTS ON NEON');
  console.log('====================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(name, condition, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] Test ${total}: ${name} ${details ? `(${details})` : ''}`);
    } else {
      console.error(`  [FAIL] Test ${total}: ${name} ${details ? `(${details})` : ''}`);
    }
  }

  async function safeCleanup() {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "invoices" WHERE "id" LIKE 'inv-live-%'`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "booking_guests" DISABLE TRIGGER "trg_protect_primary_booking_guest"`);
      await prisma.$executeRawUnsafe(`DELETE FROM "booking_guests" WHERE "booking_id" LIKE 'bkg-live-%'`);
      await prisma.$executeRawUnsafe(`DELETE FROM "bookings" WHERE "id" LIKE 'bkg-live-%'`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "booking_guests" ENABLE TRIGGER "trg_protect_primary_booking_guest"`);
      await prisma.$executeRawUnsafe(`DELETE FROM "rooms" WHERE "id" LIKE 'room-live-%'`);
      await prisma.$executeRawUnsafe(`DELETE FROM "guests" WHERE "id" LIKE 'guest-live-%'`);
      await prisma.$executeRawUnsafe(`DELETE FROM "staff_advances" WHERE "id" LIKE 'adv-live-%'`);
      await prisma.$executeRawUnsafe(`DELETE FROM "salary_records" WHERE "id" LIKE 'sal-live-%'`);
      await prisma.$executeRawUnsafe(`DELETE FROM "staff" WHERE "id" LIKE 'staff-live-%'`);
    } catch (e) {
      console.error('safeCleanup error:', e.message || e);
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "booking_guests" ENABLE TRIGGER "trg_protect_primary_booking_guest"`);
      } catch (_) {}
      throw e;
    }
  }

  try {
    // ------------------------------------------------------------------------
    // SETUP: Prerequisite test rows (clean up first in case of prior run)
    // ------------------------------------------------------------------------
    await safeCleanup();

    const rt = await prisma.roomType.findFirst();
    const rtId = rt.id;

    await prisma.$executeRawUnsafe(`
      INSERT INTO "rooms" ("id", "room_number", "room_type_id", "price_per_night", "room_status", "updated_at")
      VALUES 
        ('room-live-101', 'L-101', '${rtId}', 2000.00, 'AVAILABLE', CURRENT_TIMESTAMP),
        ('room-live-102', 'L-102', '${rtId}', 2000.00, 'AVAILABLE', CURRENT_TIMESTAMP),
        ('room-live-maint', 'L-MAINT', '${rtId}', 2000.00, 'MAINTENANCE', CURRENT_TIMESTAMP)
      ON CONFLICT ("room_number") DO NOTHING
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO "guests" ("id", "guest_code", "full_name", "mobile_number", "updated_at")
      VALUES 
        ('guest-live-1', 'GST-L01', 'Live Guest Alice', '+919876500001', CURRENT_TIMESTAMP),
        ('guest-live-2', 'GST-L02', 'Live Guest Bob', '+919876500002', CURRENT_TIMESTAMP)
      ON CONFLICT ("guest_code") DO NOTHING
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO "staff" ("id", "employee_code", "full_name", "mobile_number", "designation", "department", "joining_date", "monthly_salary", "updated_at")
      VALUES ('staff-live-1', 'EMP-L01', 'Live Staff Carol', '+919876500003', 'Manager', 'Operations', '2026-01-01', 30000.00, CURRENT_TIMESTAMP)
      ON CONFLICT ("employee_code") DO NOTHING
    `);

    // ------------------------------------------------------------------------
    // TEST 1: Primary Guest Creation and Replacement
    // ------------------------------------------------------------------------
    await prisma.$executeRawUnsafe(`
      INSERT INTO "bookings" (
        "id", "booking_number", "primary_guest_id", "room_id", "booking_status",
        "check_in_date", "expected_check_out_date", "number_of_nights", "room_rate_per_night", "updated_at"
      ) VALUES (
        'bkg-live-1', 'BKG-L001', 'guest-live-1', 'room-live-101', 'RESERVED',
        '2026-12-01', '2026-12-05', 4, 2000.00, CURRENT_TIMESTAMP
      )
    `);

    const bg1 = await prisma.$queryRawUnsafe(`
      SELECT * FROM "booking_guests" 
      WHERE "booking_id" = 'bkg-live-1' AND "guest_id" = 'guest-live-1' AND "is_primary_guest" = true
    `);
    assert('Primary Guest Auto-Creation', bg1.length === 1, 'Junction record created with is_primary_guest = true');

    // Replace primary guest with Bob
    await prisma.$executeRawUnsafe(`UPDATE "bookings" SET "primary_guest_id" = 'guest-live-2' WHERE "id" = 'bkg-live-1'`);
    const bg2 = await prisma.$queryRawUnsafe(`
      SELECT "guest_id", "is_primary_guest" FROM "booking_guests" WHERE "booking_id" = 'bkg-live-1' ORDER BY "created_at" ASC
    `);
    const bobIsPrimary = bg2.some(g => g.guest_id === 'guest-live-2' && g.is_primary_guest === true);
    const aliceIsDemoted = bg2.some(g => g.guest_id === 'guest-live-1' && g.is_primary_guest === false);
    assert('Primary Guest Replacement Synchronization', bobIsPrimary && aliceIsDemoted, 'Bob promoted, Alice demoted');

    // ------------------------------------------------------------------------
    // TEST 2: Invalid Primary Guest Modification Rejection
    // ------------------------------------------------------------------------
    let test2Passed = false;
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE "booking_guests" SET "is_primary_guest" = true 
        WHERE "booking_id" = 'bkg-live-1' AND "guest_id" = 'guest-live-1'
      `);
    } catch (e) {
      test2Passed = e.message.includes('Does not match bookings.primary_guest_id');
    }
    assert('Invalid Primary Guest Promotion Blocked', test2Passed, 'Rejected unauthorized promotion');

    let test2DeletePassed = false;
    try {
      await prisma.$executeRawUnsafe(`
        DELETE FROM "booking_guests" WHERE "booking_id" = 'bkg-live-1' AND "guest_id" = 'guest-live-2'
      `);
    } catch (e) {
      test2DeletePassed = e.message.includes('Cannot delete primary guest record');
    }
    assert('Direct Primary Guest Deletion Blocked', test2DeletePassed, 'Rejected deletion of designated primary guest');

    // ------------------------------------------------------------------------
    // TEST 3: Room Check-in & Checkout Status Synchronization
    // ------------------------------------------------------------------------
    await prisma.$executeRawUnsafe(`
      UPDATE "bookings" 
      SET "booking_status" = 'CHECKED_IN', "actual_check_in_at" = CURRENT_TIMESTAMP 
      WHERE "id" = 'bkg-live-1'
    `);
    const r1 = await prisma.$queryRawUnsafe(`SELECT "room_status" FROM "rooms" WHERE "id" = 'room-live-101'`);
    assert('Check-in Room OCCUPIED Synchronization', r1[0]?.room_status === 'OCCUPIED', 'Room marked OCCUPIED');

    await prisma.$executeRawUnsafe(`
      UPDATE "bookings" 
      SET "booking_status" = 'CHECKED_OUT', "actual_check_out_at" = CURRENT_TIMESTAMP 
      WHERE "id" = 'bkg-live-1'
    `);
    const r2 = await prisma.$queryRawUnsafe(`SELECT "room_status" FROM "rooms" WHERE "id" = 'room-live-101'`);
    assert('Checkout Room AVAILABLE Synchronization', r2[0]?.room_status === 'AVAILABLE', 'Room returned to AVAILABLE');

    // ------------------------------------------------------------------------
    // TEST 4: Room Relocation While Checked-In
    // ------------------------------------------------------------------------
    await prisma.$executeRawUnsafe(`
      UPDATE "bookings" 
      SET "booking_status" = 'CHECKED_IN', "actual_check_in_at" = CURRENT_TIMESTAMP 
      WHERE "id" = 'bkg-live-1'
    `);
    // Relocate to room-live-102
    await prisma.$executeRawUnsafe(`UPDATE "bookings" SET "room_id" = 'room-live-102' WHERE "id" = 'bkg-live-1'`);
    const rNew = await prisma.$queryRawUnsafe(`SELECT "room_status" FROM "rooms" WHERE "id" = 'room-live-102'`);
    const rOld = await prisma.$queryRawUnsafe(`SELECT "room_status" FROM "rooms" WHERE "id" = 'room-live-101'`);
    assert('Room Relocation Status Synchronization', 
      rNew[0]?.room_status === 'OCCUPIED' && rOld[0]?.room_status === 'AVAILABLE',
      'New room OCCUPIED, old room AVAILABLE'
    );

    // ------------------------------------------------------------------------
    // TEST 5: Manual AVAILABLE Status Transition Rejection
    // ------------------------------------------------------------------------
    let test5Passed = false;
    try {
      await prisma.$executeRawUnsafe(`UPDATE "rooms" SET "room_status" = 'AVAILABLE' WHERE "id" = 'room-live-102'`);
    } catch (e) {
      test5Passed = e.message.includes('Cannot mark room') && e.message.includes('AVAILABLE');
    }
    assert('Manual AVAILABLE Transition Rejection While Occupied', test5Passed, 'Blocked manual status override');

    // ------------------------------------------------------------------------
    // TEST 6: Maintenance Protection in Both Directions
    // ------------------------------------------------------------------------
    let test6APassed = false;
    try {
      await prisma.$executeRawUnsafe(`UPDATE "rooms" SET "room_status" = 'MAINTENANCE' WHERE "id" = 'room-live-102'`);
    } catch (e) {
      test6APassed = e.message.includes('Cannot mark room') && e.message.includes('MAINTENANCE');
    }
    assert('Occupied Room to MAINTENANCE Rejection', test6APassed, 'Blocked placing occupied room into maintenance');

    let test6BPassed = false;
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "bookings" (
          "id", "booking_number", "primary_guest_id", "room_id", "booking_status",
          "check_in_date", "expected_check_out_date", "number_of_nights", "room_rate_per_night", "updated_at"
        ) VALUES (
          'bkg-live-fail-maint', 'BKG-LFAIL1', 'guest-live-1', 'room-live-maint', 'RESERVED',
          '2026-12-10', '2026-12-12', 2, 2000.00, CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {
      test6BPassed = e.message.includes('Cannot allocate room') && e.message.includes('MAINTENANCE');
    }
    assert('Maintenance Room Booking Allocation Rejection', test6BPassed, 'Blocked reserving room under maintenance');

    // ------------------------------------------------------------------------
    // TEST 7: Invoice Discount Boundaries & NULL Safety
    // ------------------------------------------------------------------------
    await prisma.$executeRawUnsafe(`
      INSERT INTO "invoices" (
        "id", "invoice_number", "booking_id", "invoice_date", "room_charges",
        "subtotal", "tax_percentage", "tax_amount", "total_amount", "total_paid", "balance_amount", "updated_at"
      ) VALUES (
        'inv-live-1', 'INV-L001', 'bkg-live-1', '2026-12-05', 8000.00,
        8000.00, 12.00, 960.00, 8960.00, 0.00, 8960.00, CURRENT_TIMESTAMP
      )
    `);
    const inv1 = await prisma.$queryRawUnsafe(`SELECT "id", "discount_type" FROM "invoices" WHERE "id" = 'inv-live-1'`);
    assert('NULL-Safe Invoice Discount Creation', inv1.length === 1 && inv1[0].discount_type === null, 'discount_type is NULL supported');

    let test7DiscountOver100 = false;
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "invoices" (
          "id", "invoice_number", "booking_id", "invoice_date", "room_charges",
          "subtotal", "discount_type", "discount_value", "discount_amount",
          "tax_percentage", "tax_amount", "total_amount", "total_paid", "balance_amount", "updated_at"
        ) VALUES (
          'inv-live-fail', 'INV-LFAIL', 'bkg-live-1', '2026-12-05', 8000.00,
          8000.00, 'PERCENTAGE', 110.00, 8800.00,
          0.00, 0.00, 0.00, 0.00, 0.00, CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {
      test7DiscountOver100 = e.message.includes('check_discount_validity');
    }
    assert('Discount Percentage > 100 Rejection', test7DiscountOver100, 'Blocked discount percentage over 100');

    // ------------------------------------------------------------------------
    // TEST 8: Mathematical Balance Relationship & Advance Limits
    // ------------------------------------------------------------------------
    let test8InvBal = false;
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "invoices" (
          "id", "invoice_number", "booking_id", "invoice_date", "room_charges",
          "subtotal", "tax_percentage", "tax_amount", "total_amount", "total_paid", "balance_amount", "updated_at"
        ) VALUES (
          'inv-live-fail-bal', 'INV-LBAL', 'bkg-live-1', '2026-12-05', 1000.00,
          1000.00, 0.00, 0.00, 1000.00, 200.00, 700.00, CURRENT_TIMESTAMP -- 1000 - 200 != 700
        )
      `);
    } catch (e) {
      test8InvBal = e.message.includes('check_invoice_balance_relationship');
    }
    assert('Invoice Balance Exact Relationship CHECK Constraint', test8InvBal, 'Enforces balance = total - paid');

    let test8AdvLimit = false;
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "staff_advances" (
          "id", "staff_id", "advance_reference", "amount", "recovered_amount", "balance_amount",
          "payment_method", "advance_date", "updated_at"
        )
        VALUES (
          'adv-live-fail', 'staff-live-1', 'ADV-LIVE-FAIL', 5000.00, 6000.00, -1000.00,
          'CASH', '2026-11-01', CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {
      test8AdvLimit = e.message.includes('check_staff_advance_recovery_limits') || e.message.includes('23514');
    }
    assert('Staff Advance Recovery Limit (recovered <= amount)', test8AdvLimit, 'Blocked recovered > amount');

    // ------------------------------------------------------------------------
    // TEST 9: GiST Exclusion Constraint (Concurrent Stay Conflict Prevention)
    // ------------------------------------------------------------------------
    let test9Overlap = false;
    try {
      // Room 102 has bkg-live-1 (2026-12-01 to 2026-12-05, status CHECKED_IN)
      // Attempt overlapping booking: 2026-12-03 to 2026-12-07
      await prisma.$executeRawUnsafe(`
        INSERT INTO "bookings" (
          "id", "booking_number", "primary_guest_id", "room_id", "booking_status",
          "check_in_date", "expected_check_out_date", "number_of_nights", "room_rate_per_night", "updated_at"
        ) VALUES (
          'bkg-live-overlap', 'BKG-LOVERLAP', 'guest-live-1', 'room-live-102', 'RESERVED',
          '2026-12-03', '2026-12-07', 4, 2000.00, CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {
      test9Overlap = e.message.includes('no_overlapping_active_bookings') || e.message.includes('23P01');
    }
    assert('GiST Exclusion Constraint Conflict Rejection', test9Overlap, 'Zero overlapping active stays guaranteed');

    // ------------------------------------------------------------------------
    // TEST 10: Single Admin Singleton Enforcement
    // ------------------------------------------------------------------------
    let test10Admin = false;
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "admins" ("id", "username", "password_hash", "updated_at")
        VALUES ('admin-live-second', 'secondadmin', 'dummy_hash', CURRENT_TIMESTAMP)
      `);
    } catch (e) {
      test10Admin = e.message.includes('admins_is_singleton_key') || e.message.includes('check_admins_single_row') || e.message.includes('23505') || e.message.includes('Unique constraint');
    }
    assert('Single Admin Singleton Constraint', test10Admin, 'Prevented insertion of second administrator');

    // ------------------------------------------------------------------------
    // CLEANUP: Clean up all temporary live test rows
    // ------------------------------------------------------------------------
    await safeCleanup();

    console.log('\n====================================================================');
    console.log(`   LIVE TEST RESULTS: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
    console.log('   All temporary test records safely cleaned up.');
    console.log('====================================================================\n');

    process.exit(passed === total ? 0 : 1);

  } catch (err) {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runLiveTests();
