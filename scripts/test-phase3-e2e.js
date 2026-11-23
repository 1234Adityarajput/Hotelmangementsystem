// ============================================================================
// PHASE 3 FULL-STACK END-TO-END VERIFICATION SUITE
// Tests all 8 core modules against NestJS backend and live Neon PostgreSQL DB
// ============================================================================

const fs = require('fs');
const path = require('path');
const http = require('http');

// Load environment from backend/.env
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

process.env.NODE_ENV = 'development';

function apiCall(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json?.data || json,
          raw: json,
        });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runEndToEndTests() {
  console.log('====================================================================');
  console.log('   PHASE 3 CORE MODULES LIVE DATABASE INTEGRATION SUITE');
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

  let app = null;
  const PORT = 4056;

  try {
    // 1. Boot NestJS App
    const { NestFactory } = require(path.join(__dirname, '../backend/node_modules/@nestjs/core'));
    const { AppModule } = require(path.join(__dirname, '../backend/dist/app.module'));
    const { PrismaService } = require(path.join(__dirname, '../backend/dist/database/prisma.service'));

    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api/v1');
    await app.listen(PORT);
    console.log(`✔ NestJS backend active on port ${PORT}\n`);

    const prisma = app.get(PrismaService);

    // ========================================================================
    // 1. AUTHENTICATION & JWT
    // ========================================================================
    console.log('--- 1. Authentication & JWT ---');
    const loginRes = await apiCall(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin', password: process.env.ADMIN_PASSWORD || 'Admin@Hotel2026!' }
    );

    const token = loginRes.data?.accessToken;
    assert('Admin JWT Login', loginRes.status === 200 || loginRes.status === 201, `Token prefix: ${token?.slice(0, 10)}...`);

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // ========================================================================
    // 2. DASHBOARD METRICS (Real live data)
    // ========================================================================
    console.log('\n--- 2. Dashboard Aggregations (Live DB) ---');
    const statsRes = await apiCall({
      hostname: 'localhost',
      port: PORT,
      path: '/api/v1/dashboard/stats',
      method: 'GET',
      headers: authHeaders,
    });
    assert(
      'Live Operational Stats Query',
      statsRes.status === 200 && statsRes.data?.rooms?.total !== undefined,
      `Rooms: ${statsRes.data?.rooms?.total}, Occupancy: ${statsRes.data?.rooms?.occupancyRate}%`
    );

    const occupancyRes = await apiCall({
      hostname: 'localhost',
      port: PORT,
      path: '/api/v1/dashboard/occupancy-stats',
      method: 'GET',
      headers: authHeaders,
    });
    assert(
      'Room Type Occupancy Breakdown',
      occupancyRes.status === 200 && Array.isArray(occupancyRes.data) && occupancyRes.data.length >= 4,
      `Categories: ${occupancyRes.data?.length}`
    );

    // ========================================================================
    // 3. GUEST MANAGEMENT CRUD & DOCUMENTS
    // ========================================================================
    console.log('\n--- 3. Guest Management ---');
    const guestCodeSuffix = Date.now().toString().slice(-4);
    const createGuestRes = await apiCall(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/v1/guests',
        method: 'POST',
        headers: authHeaders,
      },
      {
        fullName: `Integration Guest ${guestCodeSuffix}`,
        mobileNumber: `+9198765${guestCodeSuffix}`,
        email: `guest${guestCodeSuffix}@test.com`,
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
      }
    );
    const guestId = createGuestRes.data?.id;
    assert('Create Guest Record', createGuestRes.status === 201 && Boolean(guestId), `Guest Code: ${createGuestRes.data?.guestCode}`);

    // Add Document
    const addDocRes = await apiCall(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/v1/guests/${guestId}/documents`,
        method: 'POST',
        headers: authHeaders,
      },
      {
        documentType: 'AADHAAR',
        documentNumber: `4444-5555-${guestCodeSuffix}`,
        documentFileReference: `docs/guest_${guestId}.pdf`,
      }
    );
    assert('Register Guest Identity Document', addDocRes.status === 201, `Doc ID: ${addDocRes.data?.id}`);

    // ========================================================================
    // 4. ROOM INVENTORY & AVAILABILITY
    // ========================================================================
    console.log('\n--- 4. Room Management ---');
    const roomType = await prisma.roomType.findFirst();
    const roomNum = `T-${Date.now().toString().slice(-3)}`;
    const roomNum2 = `T2-${Date.now().toString().slice(-3)}`;

    const createRoomRes = await apiCall(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/v1/rooms',
        method: 'POST',
        headers: authHeaders,
      },
      {
        roomNumber: roomNum,
        roomTypeId: roomType.id,
        floor: 2,
        pricePerNight: 3000.00,
        roomStatus: 'AVAILABLE',
      }
    );
    const roomId = createRoomRes.data?.id;
    assert('Create Room in Inventory', createRoomRes.status === 201 && Boolean(roomId), `Room: ${roomNum}`);

    // Create 2nd room for relocation test
    const createRoom2Res = await apiCall(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/v1/rooms',
        method: 'POST',
        headers: authHeaders,
      },
      {
        roomNumber: roomNum2,
        roomTypeId: roomType.id,
        floor: 2,
        pricePerNight: 3500.00,
        roomStatus: 'AVAILABLE',
      }
    );
    const room2Id = createRoom2Res.data?.id;

    // Available rooms query
    const availRes = await apiCall({
      hostname: 'localhost',
      port: PORT,
      path: `/api/v1/rooms/available?checkIn=2026-12-10&checkOut=2026-12-14`,
      method: 'GET',
      headers: authHeaders,
    });
    const foundRoom = availRes.data?.some((r) => r.id === roomId);
    assert('Room Availability Filtering', availRes.status === 200 && foundRoom, `Room ${roomNum} is available`);

    // ========================================================================
    // 5. BOOKING & GiST EXCLUSION OVERLAP TEST
    // ========================================================================
    console.log('\n--- 5. Booking Creation & Overlap Protection ---');
    const createBkgRes = await apiCall(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/v1/bookings',
        method: 'POST',
        headers: authHeaders,
      },
      {
        primaryGuestId: guestId,
        roomId: roomId,
        checkInDate: '2026-12-10',
        expectedCheckOutDate: '2026-12-14',
        numberOfNights: 4,
        numberOfGuests: 2,
        roomRatePerNight: 3000.00,
        advanceAmount: 1000.00,
        advancePaymentMethod: 'UPI',
        notes: 'Integration E2E reservation test',
      }
    );
    const bookingId = createBkgRes.data?.id;
    assert('Create Reservation with Advance Payment', createBkgRes.status === 201 && Boolean(bookingId), `Booking #: ${createBkgRes.data?.bookingNumber}`);

    // Verify Primary Guest auto-junction record
    const bkgGuests = await prisma.bookingGuest.findMany({ where: { bookingId } });
    assert(
      'Primary Guest Junction Auto-Creation',
      bkgGuests.length === 1 && bkgGuests[0].isPrimaryGuest === true,
      `Guest ID matches: ${bkgGuests[0]?.guestId === guestId}`
    );

    // Overlapping reservation conflict rejection (GiST exclusion)
    const overlapRes = await apiCall(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/v1/bookings',
        method: 'POST',
        headers: authHeaders,
      },
      {
        primaryGuestId: guestId,
        roomId: roomId,
        checkInDate: '2026-12-12',
        expectedCheckOutDate: '2026-12-16',
        numberOfNights: 4,
      }
    );
    assert(
      'Overlapping Stay Rejection (GiST)',
      overlapRes.status === 409,
      `Blocked conflict with 409 Conflict: ${overlapRes.data?.message?.slice(0, 30)}...`
    );

    // ========================================================================
    // 6. CHECK-IN, CHECKOUT & RELOCATION
    // ========================================================================
    console.log('\n--- 6. Check-In & Room Relocation Operations ---');
    // Check-in
    const checkInRes = await apiCall({
      hostname: 'localhost',
      port: PORT,
      path: `/api/v1/stays/${bookingId}/check-in`,
      method: 'POST',
      headers: authHeaders,
    });
    assert('Process Check-In Action', checkInRes.status === 200 || checkInRes.status === 201, 'Status set to CHECKED_IN');

    // Verify room status synchronized to OCCUPIED
    const roomCheck1 = await prisma.room.findUnique({ where: { id: roomId } });
    assert('Room Auto-Synchronized to OCCUPIED', roomCheck1?.roomStatus === 'OCCUPIED', `Room ${roomNum}: OCCUPIED`);

    // Relocate to Room 2
    const relocateRes = await apiCall(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/v1/stays/${bookingId}/relocate`,
        method: 'POST',
        headers: authHeaders,
      },
      {
        newRoomId: room2Id,
        reason: 'Upgrade to superior room',
      }
    );
    assert('Room Relocation Action', relocateRes.status === 200 || relocateRes.status === 201, `Relocated to Room ${roomNum2}`);

    const oldRoomCheck = await prisma.room.findUnique({ where: { id: roomId } });
    const newRoomCheck = await prisma.room.findUnique({ where: { id: room2Id } });
    assert(
      'Relocation Status Sync (Old Available, New Occupied)',
      oldRoomCheck?.roomStatus === 'AVAILABLE' && newRoomCheck?.roomStatus === 'OCCUPIED',
      `Old: ${oldRoomCheck?.roomStatus}, New: ${newRoomCheck?.roomStatus}`
    );

    // ========================================================================
    // 7. ITEMS & ROOM SERVICE CHARGE
    // ========================================================================
    console.log('\n--- 7. Hotel Items & Room Service Charge ---');
    const itemRes = await apiCall(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/v1/booking-items',
        method: 'POST',
        headers: authHeaders,
      },
      {
        bookingId: bookingId,
        itemName: 'Continental Breakfast & Coffee',
        quantity: 2,
        unitPrice: 400.00,
        notes: 'Room service delivery to room 2',
      }
    );
    assert('Add Booking Item / Room Service Charge', itemRes.status === 201, `Item charge ₹800.00 recorded`);

    // ========================================================================
    // 8. BILLING & INVOICE GENERATION
    // ========================================================================
    console.log('\n--- 8. Invoicing & Billing Calculation ---');
    const invoiceRes = await apiCall(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/v1/invoices/generate',
        method: 'POST',
        headers: authHeaders,
      },
      {
        bookingId: bookingId,
        discountType: 'PERCENTAGE',
        discountValue: 10.00,
        taxPercentage: 12.00,
      }
    );
    const invoiceId = invoiceRes.data?.id;
    assert('Generate & Finalize Invoice', invoiceRes.status === 201 && Boolean(invoiceId), `Invoice #: ${invoiceRes.data?.invoiceNumber}`);

    // Verify mathematical relationship: balance = total - paid
    const invData = invoiceRes.data;
    const mathConsistent =
      Math.abs(Number(invData.balanceAmount) - (Number(invData.totalAmount) - Number(invData.totalPaid))) < 0.01;
    assert(
      'Invoice Mathematical Relationship (balance = total - paid)',
      mathConsistent,
      `Total: ₹${invData.totalAmount}, Paid: ₹${invData.totalPaid}, Balance: ₹${invData.balanceAmount}`
    );

    // ========================================================================
    // 9. PAYMENT SETTLEMENT
    // ========================================================================
    console.log('\n--- 9. Payment Settlement ---');
    const balanceDue = Number(invData.balanceAmount);
    const settleRes = await apiCall(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/v1/payments',
        method: 'POST',
        headers: authHeaders,
      },
      {
        bookingId: bookingId,
        invoiceId: invoiceId,
        paymentType: 'FINAL',
        paymentMethod: 'UPI',
        amount: balanceDue,
        transactionReference: `UPI-SETTLE-${Date.now().toString().slice(-6)}`,
        notes: 'Final settlement at checkout desk',
      }
    );
    assert('Settle Outstanding Balance via Payment API', settleRes.status === 201, `Payment Ref: ${settleRes.data?.paymentReference}`);

    const finalizedInvoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    assert(
      'Invoice Status Auto-Transition to PAID',
      finalizedInvoice?.invoiceStatus === 'PAID' && Number(finalizedInvoice.balanceAmount) === 0,
      `Invoice Status: ${finalizedInvoice?.invoiceStatus}, Balance: ₹${finalizedInvoice?.balanceAmount}`
    );

    // Perform Check-out
    const checkOutRes = await apiCall({
      hostname: 'localhost',
      port: PORT,
      path: `/api/v1/stays/${bookingId}/check-out`,
      method: 'POST',
      headers: authHeaders,
    });
    assert('Process Check-Out Action', checkOutRes.status === 200 || checkOutRes.status === 201, 'Status set to CHECKED_OUT');

    const room2Final = await prisma.room.findUnique({ where: { id: room2Id } });
    assert('Room Restored to AVAILABLE on Checkout', room2Final?.roomStatus === 'AVAILABLE', `Room ${roomNum2}: AVAILABLE`);

    // ========================================================================
    // TEARDOWN: Clean up temporary test data
    // ========================================================================
    console.log('\n--- 10. Clean Teardown of Test Records ---');
    await prisma.$executeRawUnsafe(`DELETE FROM "payments" WHERE "booking_id" = '${bookingId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM "invoices" WHERE "id" = '${invoiceId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM "booking_items" WHERE "booking_id" = '${bookingId}'`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "booking_guests" DISABLE TRIGGER "trg_protect_primary_booking_guest"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "booking_guests" WHERE "booking_id" = '${bookingId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM "bookings" WHERE "id" = '${bookingId}'`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "booking_guests" ENABLE TRIGGER "trg_protect_primary_booking_guest"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "guest_documents" WHERE "guest_id" = '${guestId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM "guests" WHERE "id" = '${guestId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM "rooms" WHERE "id" IN ('${roomId}', '${room2Id}')`);
    console.log('✔ All temporary integration test rows cleanly removed from Neon DB.\n');

    console.log('====================================================================');
    console.log(`   INTEGRATION SUITE RESULTS: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
    console.log('====================================================================\n');

    process.exit(passed === total ? 0 : 1);

  } catch (err) {
    console.error('Fatal E2E test runner error:', err);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
      console.log('✔ Test server closed gracefully.');
    }
  }
}

runEndToEndTests();
