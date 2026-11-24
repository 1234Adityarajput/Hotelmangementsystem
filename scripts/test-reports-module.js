const http = require('http');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(data);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method: 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, text: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- STARTING MODULE 15: REPORTS & ANALYTICS VERIFICATION ---');

  // 1. Authenticate
  const loginRes = await post('http://localhost:4000/api/v1/auth/login', {
    email: 'admin',
    password: 'Admin@Hotel2026!',
  });
  if (loginRes.status !== 200 && loginRes.status !== 201) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }
  const token = loginRes.data.data.accessToken;
  console.log('✓ Admin authenticated successfully');

  // 2. Test Report Types Catalog
  const catalogRes = await get('http://localhost:4000/api/v1/reports/report-types', token);
  if (catalogRes.status !== 200) {
    throw new Error(`report-types failed with status ${catalogRes.status}`);
  }
  const { hotelReports, staffReports } = catalogRes.data.data;
  console.log(`✓ Report Types Catalog: ${hotelReports.length} Hotel Reports, ${staffReports.length} Staff Reports (Total: ${hotelReports.length + staffReports.length})`);
  if (hotelReports.length !== 13) throw new Error(`Expected 13 hotel reports, got ${hotelReports.length}`);
  if (staffReports.length !== 6) throw new Error(`Expected 6 staff reports, got ${staffReports.length}`);

  // 3. Test Executive Analytics Report
  const execRes = await get('http://localhost:4000/api/v1/reports/executive', token);
  if (execRes.status !== 200) throw new Error(`Executive report failed: ${execRes.status}`);
  const execData = execRes.data.data;
  console.log(`✓ Executive Report: Total Rooms: ${execData.operations.totalRooms}, Occupancy: ${execData.operations.occupancyRate}%, Collected Revenue: ₹${execData.financials.totalCollectedRevenue}, Cash Flow: ₹${execData.financials.netCashFlow}`);

  // 4. Test All 13 Hotel Reports
  console.log('\n--- TESTING ALL 13 HOTEL REPORTS ---');
  for (const hr of hotelReports) {
    const res = await get(`http://localhost:4000/api/v1/reports/${hr.id}`, token);
    if (res.status !== 200) throw new Error(`Report ${hr.id} failed with status ${res.status}`);
    const rep = res.data.data;
    const kpiCount = Object.keys(rep.kpis || {}).length;
    const colCount = rep.columns ? rep.columns.length : 0;
    const rowCount = rep.rows ? rep.rows.length : 0;
    console.log(`  ✓ [HOTEL] ${rep.reportTitle} (${hr.id}): ${kpiCount} KPIs, ${colCount} Cols, ${rowCount} Rows`);
  }

  // 5. Test All 6 Staff Reports
  console.log('\n--- TESTING ALL 6 STAFF REPORTS ---');
  for (const sr of staffReports) {
    const res = await get(`http://localhost:4000/api/v1/reports/${sr.id}`, token);
    if (res.status !== 200) throw new Error(`Report ${sr.id} failed with status ${res.status}`);
    const rep = res.data.data;
    const kpiCount = Object.keys(rep.kpis || {}).length;
    const colCount = rep.columns ? rep.columns.length : 0;
    const rowCount = rep.rows ? rep.rows.length : 0;
    console.log(`  ✓ [STAFF] ${rep.reportTitle} (${sr.id}): ${kpiCount} KPIs, ${colCount} Cols, ${rowCount} Rows`);
  }

  // 6. Test Frontend Route HTTP 200
  console.log('\n--- TESTING FRONTEND /reports ROUTE ---');
  const frontRes = await get('http://localhost:3000/reports');
  if (frontRes.status !== 200) throw new Error(`Frontend /reports returned status ${frontRes.status}`);
  console.log(`✓ Frontend /reports returned HTTP 200 OK (${frontRes.text.length} bytes HTML)`);

  console.log('\n============================================================');
  console.log('🎉 ALL 19 HOTEL & STAFF REPORTS & ANALYTICS PASSED 100%!');
  console.log('============================================================');
}

run().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
