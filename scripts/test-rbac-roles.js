/**
 * Comprehensive E2E Verification Suite for RBAC: Owner vs Manager Roles
 * Tests:
 * 1. Owner & Manager Auth token generation and role payload
 * 2. Owner 100% full access to all 18 modules (0 blocked)
 * 3. Manager 100% operational access to allowed modules (Dashboard, Guests, Rooms, Bookings, Stays, Billing, Items, Invoices, Staff, Attendance)
 * 4. Manager strict 403 Forbidden rejection on restricted modules (Payments, Advances, Payroll, Expenses, Reports, Registers, Audit Logs, Settings)
 * 5. Operational execution test: Manager can perform real operational mutations (create guest, query stays)
 */

const http = require('http');

const API_BASE = 'http://localhost:4000/api/v1';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(body);
        } catch (_) {
          json = body;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('  GRAND HORIZON RBAC VERIFICATION: OWNER vs MANAGER');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request(`${API_BASE}/health`);
    assert(health.status === 200, 'Backend is healthy and live');

    // 2. Owner Login
    console.log('\n--- 1. AUTHENTICATION & ROLE PAYLOADS ---');
    const ownerLogin = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: { email: 'admin', password: 'Admin@Hotel2026!' },
    });
    assert(ownerLogin.status === 200, 'Owner login successful with 200 OK');
    const ownerToken = ownerLogin.data?.data?.accessToken;
    const ownerData = ownerLogin.data?.data?.admin;
    assert(Boolean(ownerToken), 'Owner JWT token returned');
    assert(ownerData?.role === 'OWNER', `Owner role verified: "${ownerData?.role}"`);

    // 3. Manager Login
    const managerLogin = await request(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: { email: 'manager', password: 'Manager@Hotel2026!' },
    });
    assert(managerLogin.status === 200, 'Manager login successful with 200 OK');
    const managerToken = managerLogin.data?.data?.accessToken;
    const managerData = managerLogin.data?.data?.admin;
    assert(Boolean(managerToken), 'Manager JWT token returned');
    assert(managerData?.role === 'MANAGER', `Manager role verified: "${managerData?.role}"`);

    // Auth Status
    const authStatus = await request(`${API_BASE}/auth/status`);
    assert(authStatus.data?.data?.rbacEnabled === true, 'RBAC infrastructure reported enabled');

    // 4. Test Owner Full Access across all modules
    console.log('\n--- 2. OWNER ACCESS: ALL MODULES (EXPECT 200 OK) ---');
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

    const ownerEndpoints = [
      { name: 'Dashboard Stats', path: '/dashboard/stats' },
      { name: 'Guests Directory', path: '/guests' },
      { name: 'Rooms Inventory', path: '/rooms' },
      { name: 'Bookings List', path: '/bookings' },
      { name: 'Active Stays', path: '/stays/active' },
      { name: 'Folio Invoices', path: '/invoices' },
      { name: 'Catalog Items', path: '/items' },
      { name: 'Staff Directory', path: '/staff' },
      { name: 'Daily Attendance', path: '/attendance/daily' },
      { name: 'Payments Ledger', path: '/payments' },
      { name: 'Staff Advances', path: '/advances/stats' },
      { name: 'Payroll Engine', path: '/payroll/stats' },
      { name: 'Hotel Expenses', path: '/expenses/stats' },
      { name: 'Reports & Analytics', path: '/reports/report-types' },
      { name: 'Digital Registers', path: '/registers?type=rooms' },
      { name: 'Audit Logs Trail', path: '/audit-logs' },
      { name: 'Hotel Settings Profile', path: '/settings' },
    ];

    for (const ep of ownerEndpoints) {
      const res = await request(`${API_BASE}${ep.path}`, { headers: ownerHeaders });
      assert(res.status === 200, `Owner -> ${ep.name} (${ep.path}): HTTP ${res.status}`);
    }

    // 5. Test Manager Allowed Operational Endpoints
    console.log('\n--- 3. MANAGER ALLOWED ACCESS: OPERATIONS (EXPECT 200 OK) ---');
    const managerHeaders = { Authorization: `Bearer ${managerToken}` };

    const managerAllowedEndpoints = [
      { name: 'Dashboard Stats', path: '/dashboard/stats' },
      { name: 'Guests Directory', path: '/guests' },
      { name: 'Rooms Inventory', path: '/rooms' },
      { name: 'Bookings List', path: '/bookings' },
      { name: 'Active Stays', path: '/stays/active' },
      { name: 'Folio Invoices', path: '/invoices' },
      { name: 'Catalog Items', path: '/items' },
      { name: 'Staff Directory', path: '/staff' },
      { name: 'Daily Attendance', path: '/attendance/daily' },
    ];

    for (const ep of managerAllowedEndpoints) {
      const res = await request(`${API_BASE}${ep.path}`, { headers: managerHeaders });
      assert(res.status === 200, `Manager Allowed -> ${ep.name} (${ep.path}): HTTP ${res.status}`);
    }

    // 6. Test Manager Restricted Endpoints (MUST return 403 Forbidden)
    console.log('\n--- 4. MANAGER RESTRICTED ACCESS (MUST RETURN 403 FORBIDDEN) ---');
    const managerRestrictedEndpoints = [
      { name: 'Payments Module', path: '/payments' },
      { name: 'Payments Stats', path: '/payments/stats' },
      { name: 'Staff Advances', path: '/advances/stats' },
      { name: 'Staff Advances List', path: '/advances' },
      { name: 'Payroll Engine Stats', path: '/payroll/stats' },
      { name: 'Payroll List', path: '/payroll' },
      { name: 'Hotel Expenses Stats', path: '/expenses/stats' },
      { name: 'Hotel Expenses List', path: '/expenses' },
      { name: 'Reports & Analytics Types', path: '/reports/report-types' },
      { name: 'Reports Executive', path: '/reports/executive' },
      { name: 'Digital Registers Ledger', path: '/registers?registerType=ROOM' },
      { name: 'Audit Logs Trails', path: '/audit-logs' },
      { name: 'Hotel Settings Profile', path: '/settings' },
    ];

    for (const ep of managerRestrictedEndpoints) {
      const res = await request(`${API_BASE}${ep.path}`, { headers: managerHeaders });
      assert(res.status === 403, `Manager Restricted -> ${ep.name} (${ep.path}): HTTP ${res.status} Forbidden (BLOCKED)`);
    }

    // 7. Manager Real Operational Mutation Test
    console.log('\n--- 5. MANAGER REAL OPERATIONAL MUTATION TEST ---');
    const testGuestPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
    const guestRes = await request(`${API_BASE}/guests`, {
      method: 'POST',
      headers: managerHeaders,
      body: {
        fullName: 'Manager Registered VIP Guest',
        mobileNumber: testGuestPhone,
        email: `manager.guest.${Date.now()}@example.com`,
        idProofType: 'AADHAAR',
        idProofNumber: '9988-7766-5544',
        address: '101 Horizon Boulevard, Mumbai',
      },
    });
    assert(guestRes.status === 201, `Manager created new Guest profile: HTTP ${guestRes.status} Created`);

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`  RBAC TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
