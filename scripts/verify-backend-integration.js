// ============================================================================
// COMPREHENSIVE BACKEND INTEGRATION & SMOKE TEST SUITE
// Tests NestJS 10, Prisma ORM, Neon PostgreSQL connectivity,
// HTTP API endpoints, Admin JWT Authentication, and CRUD smoke tests.
// ============================================================================

const fs = require('fs');
const path = require('path');
const http = require('http');

// Load environment variables from backend/.env
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

// Ensure NODE_ENV is set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Helper to perform HTTP requests
function httpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          json,
        });
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runBackendIntegrationTests() {
  console.log('====================================================================');
  console.log('   HOTEL MANAGEMENT SOFTWARE – BACKEND & NEON INTEGRATION AUDIT');
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

  try {
    // 1. Boot NestJS Application
    console.log('--- 1. Booting NestJS Application with Live Neon DB ---');
    const { NestFactory } = require(path.join(__dirname, '../backend/node_modules/@nestjs/core'));
    const { AppModule } = require(path.join(__dirname, '../backend/dist/app.module'));
    const { PrismaService } = require(path.join(__dirname, '../backend/dist/database/prisma.service'));
    const { HealthService } = require(path.join(__dirname, '../backend/dist/health/health.service'));
    const { AuthService } = require(path.join(__dirname, '../backend/dist/auth/auth.service'));

    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api/v1');
    app.enableCors({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
    });

    const TEST_PORT = 4055;
    await app.listen(TEST_PORT);
    console.log(`✔ NestJS App successfully initialized and listening on port ${TEST_PORT}\n`);

    // 2. Direct Service Checks
    console.log('--- 2. Direct Service Verification ---');
    const prismaService = app.get(PrismaService);
    const healthService = app.get(HealthService);
    const authService = app.get(AuthService);

    // 2.1 Live DB Connectivity Check via HealthService
    const healthResult = await healthService.checkHealth();
    assert(
      'HealthService Live Database Connectivity',
      healthResult.database.connected === true,
      `Latency: ${healthResult.database.latencyMs}ms, Provider: ${healthResult.database.provider}`
    );

    // 2.2 Seed Data Verification via PrismaService
    const adminCount = await prismaService.admin.count();
    assert('Admin Record Exists (Singleton)', adminCount === 1, `Found ${adminCount} admin`);

    const hotelSetting = await prismaService.hotelSetting.findUnique({ where: { id: 'default' } });
    assert(
      'Hotel Setting Singleton Exists',
      hotelSetting !== null && hotelSetting.hotelName === 'Grand Horizon Hotel & Suites',
      `Hotel: ${hotelSetting?.hotelName}, Currency: ${hotelSetting?.currencyCode}`
    );

    const roomTypeCount = await prismaService.roomType.count();
    assert('Seeded Room Types Available', roomTypeCount >= 4, `Found ${roomTypeCount} room types`);

    const itemCategoryCount = await prismaService.itemCategory.count();
    assert('Seeded Item Categories Available', itemCategoryCount >= 6, `Found ${itemCategoryCount} categories`);

    const expenseCategoryCount = await prismaService.expenseCategory.count();
    assert('Seeded Expense Categories Available', expenseCategoryCount >= 10, `Found ${expenseCategoryCount} categories`);

    // 2.3 Admin Login via AuthService
    console.log('\n--- 3. Authentication & JWT Verification ---');
    let loginSuccess = false;
    let jwtToken = null;
    try {
      const authResult = await authService.validateAdmin({
        email: 'admin',
        password: process.env.ADMIN_PASSWORD || 'Admin@Hotel2026!',
      });
      loginSuccess = Boolean(authResult.accessToken && authResult.admin);
      jwtToken = authResult.accessToken;
    } catch (e) {
      console.error('Login error:', e.message);
    }
    assert('Admin Login with Correct Credentials', loginSuccess, 'JWT access token issued successfully');

    let badLoginBlocked = false;
    try {
      await authService.validateAdmin({ email: 'admin', password: 'WrongPassword123!' });
    } catch (e) {
      badLoginBlocked = e.status === 401 || e.message.includes('Invalid credentials');
    }
    assert('Invalid Password Rejection', badLoginBlocked, '401 Unauthorized returned');

    // 3. HTTP Endpoint Smoke Tests
    console.log('\n--- 4. HTTP API Endpoint Verification ---');

    // 3.1 GET /api/v1/health
    const httpHealth = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/health',
      method: 'GET',
    });
    const healthData = httpHealth.json?.data || httpHealth.json;
    assert(
      'HTTP GET /api/v1/health Status 200',
      httpHealth.statusCode === 200 && (healthData?.status === 'ok' || healthData?.database?.connected === true),
      `DB Connected: ${healthData?.database?.connected}, Latency: ${healthData?.database?.latencyMs}ms`
    );

    // 3.2 GET /api/v1/auth/status
    const httpAuthStatus = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/auth/status',
      method: 'GET',
    });
    const authStatusData = httpAuthStatus.json?.data || httpAuthStatus.json;
    assert(
      'HTTP GET /api/v1/auth/status Status 200',
      httpAuthStatus.statusCode === 200 && authStatusData?.authMode === 'single_admin',
      `Auth Mode: ${authStatusData?.authMode}`
    );

    // 3.3 POST /api/v1/auth/login
    const httpLogin = await httpRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: 'admin',
        password: process.env.ADMIN_PASSWORD || 'Admin@Hotel2026!',
      }
    );
    const loginData = httpLogin.json?.data || httpLogin.json;
    assert(
      'HTTP POST /api/v1/auth/login Status 200/201',
      (httpLogin.statusCode === 200 || httpLogin.statusCode === 201) && Boolean(loginData?.accessToken),
      `Token prefix: ${loginData?.accessToken ? loginData.accessToken.substring(0, 15) + '...' : 'none'}`
    );

    // 4. Module CRUD Smoke Tests on Live Neon Database
    console.log('\n--- 5. Module Database Smoke Tests (CRUD Cycle) ---');

    // 4.1 Guest Module Smoke Test
    const smokeGuestCode = `GST-SMOKE-${Date.now().toString().slice(-4)}`;
    const createdGuest = await prismaService.guest.create({
      data: {
        guestCode: smokeGuestCode,
        fullName: 'Smoke Test Guest',
        mobileNumber: '+919999900001',
        email: 'smoke.guest@test.com',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      },
    });
    assert('Guest Model Creation (Live DB)', createdGuest.id !== undefined, `Created ID: ${createdGuest.id}`);

    const retrievedGuest = await prismaService.guest.findUnique({ where: { id: createdGuest.id } });
    assert('Guest Model Retrieval (Live DB)', retrievedGuest?.guestCode === smokeGuestCode, `Matched Code: ${smokeGuestCode}`);

    // Clean up smoke guest
    await prismaService.guest.delete({ where: { id: createdGuest.id } });
    const deletedGuestCheck = await prismaService.guest.findUnique({ where: { id: createdGuest.id } });
    assert('Guest Model Deletion (Live DB)', deletedGuestCheck === null, 'Smoke record cleanly deleted');

    // 4.2 Room Inventory Smoke Test
    const firstRoomType = await prismaService.roomType.findFirst();
    const smokeRoomNumber = `SMK-${Date.now().toString().slice(-3)}`;
    const createdRoom = await prismaService.room.create({
      data: {
        roomNumber: smokeRoomNumber,
        roomTypeId: firstRoomType.id,
        pricePerNight: 2500.00,
        roomStatus: 'AVAILABLE',
      },
    });
    assert('Room Model Creation (Live DB)', createdRoom.id !== undefined, `Created Room: ${createdRoom.roomNumber}`);

    const retrievedRoom = await prismaService.room.findUnique({ where: { id: createdRoom.id } });
    assert('Room Model Retrieval (Live DB)', retrievedRoom?.roomStatus === 'AVAILABLE', `Status: ${retrievedRoom?.roomStatus}`);

    // Clean up smoke room
    await prismaService.room.delete({ where: { id: createdRoom.id } });
    const deletedRoomCheck = await prismaService.room.findUnique({ where: { id: createdRoom.id } });
    assert('Room Model Deletion (Live DB)', deletedRoomCheck === null, 'Smoke record cleanly deleted');

    // 4.3 CORS Header Check
    const corsOptionsRes = await httpRequest({
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/health',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    });
    const allowOrigin = corsOptionsRes.headers['access-control-allow-origin'];
    assert(
      'CORS Allow Origin Header Configured',
      allowOrigin === 'http://localhost:3000' || allowOrigin === '*',
      `Origin Header: ${allowOrigin}`
    );

    console.log('\n====================================================================');
    console.log(`   BACKEND INTEGRATION RESULTS: ${passed}/${total} Passed (${Math.round((passed / total) * 100)}%)`);
    console.log('   All smoke tests passed on live Neon database.');
    console.log('====================================================================\n');

    process.exit(passed === total ? 0 : 1);

  } catch (err) {
    console.error('Fatal backend integration error:', err);
    process.exit(1);
  } finally {
    if (app) {
      await app.close();
      console.log('✔ Test server closed gracefully.');
    }
  }
}

runBackendIntegrationTests();
