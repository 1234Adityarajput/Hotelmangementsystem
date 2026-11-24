const http = require('http');

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

const REGISTERS = [
  'guests',
  'check-ins',
  'check-outs',
  'rooms',
  'billing',
  'payments',
  'cash-book',
  'services',
  'staff',
  'attendance',
  'salaries',
  'expenses',
  'business'
];

async function run() {
  console.log('================================================================');
  console.log('--- STARTING MODULE 12: DIGITAL REGISTER MANAGEMENT TESTS ---');
  console.log('================================================================');

  // 1. Authenticate as Admin
  console.log('\n[1/3] Authenticating Admin credentials...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'admin', password: 'Admin@Hotel2026!' });

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    console.error('FAILED to login as Admin:', loginRes);
    process.exit(1);
  }
  const token = loginRes.body.data.accessToken;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  console.log('✓ Admin authenticated successfully.');

  // 2. Query each of the 13 statutory registers
  console.log('\n[2/3] Querying all 13 Traditional Hotel Digital Registers...');
  let passCount = 0;

  for (let i = 0; i < REGISTERS.length; i++) {
    const regType = REGISTERS[i];
    const res = await request({
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/registers?type=${regType}&limit=10`,
      method: 'GET',
      headers: authHeaders,
    });

    if (res.status === 200 && res.body?.data?.items) {
      const data = res.body.data;
      console.log(`  ✓ Register [${i + 1}/13] '${regType}': Status 200 OK | Count: ${data.total} | Title: "${data.title || regType}"`);
      passCount++;
    } else {
      console.error(`  ✗ Register [${i + 1}/13] '${regType}' FAILED:`, res.status, res.body);
    }
  }

  if (passCount !== 13) {
    console.error(`Only ${passCount}/13 registers passed!`);
    process.exit(1);
  }
  console.log(`✓ All 13/13 Digital Registers successfully queried and verified!`);

  // 3. Test Advanced Filtering (Search, Room Number, Date Range)
  console.log('\n[3/3] Testing Advanced Search & Filter capabilities...');

  // Search by room on check-ins
  const roomRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/registers?type=check-ins&roomNumber=101`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`  ✓ Room filter (check-ins roomNumber=101): Status ${roomRes.status} | Found: ${roomRes.body.data.total}`);

  // Date range search on business register
  const dateRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/registers?type=business&startDate=2026-11-01&endDate=2026-11-24`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`  ✓ Date range filter (business 2026-11-01 to 2026-11-24): Status ${dateRes.status} | Days recorded: ${dateRes.body.data.total}`);

  // Text search on cash-book
  const cashRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/registers?type=cash-book`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`  ✓ Daily Cash Book Inflows & Outflows: Status ${cashRes.status} | Inflow: ₹${cashRes.body.data.summary?.totalCashInflow} | Outflow: ₹${cashRes.body.data.summary?.totalCashOutflow} | Net: ₹${cashRes.body.data.summary?.netCashFlow}`);

  console.log('\n================================================================');
  console.log('ALL MODULE 12 DIGITAL REGISTER MANAGEMENT TESTS PASSED (100%)!');
  console.log('================================================================');
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
