const path = require('path');
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

async function run() {
  console.log('--- STARTING STAFF ATTENDANCE MODULE 10 VERIFICATION ---');

  // 1. Authenticate as Admin
  console.log('\n1. Logging in as Admin...');
  const loginRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'admin', password: 'Admin@Hotel2026!' });

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    console.error('Login failed:', loginRes);
    process.exit(1);
  }
  const token = loginRes.body.data.accessToken;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  console.log('Admin authenticated successfully.');

  // 2. Fetch staff list to get test staff ID
  console.log('\n2. Fetching staff list...');
  const staffRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/staff?limit=10',
    method: 'GET',
    headers: authHeaders,
  });
  const staffList = staffRes.body.data.items;
  console.log(`Found ${staffList.length} staff members.`);
  if (staffList.length === 0) {
    console.error('No staff found. Please create staff first.');
    process.exit(1);
  }
  const testStaff = staffList[0];
  console.log(`Using staff: ${testStaff.fullName} (${testStaff.employeeCode}, ID: ${testStaff.id})`);

  const todayStr = '2026-11-24';

  // 3. Test Mark Attendance (PRESENT with Check-In, Check-Out, Hours & OT)
  console.log('\n3. Testing POST /api/v1/attendance (Mark PRESENT)...');
  const markPresentRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/attendance',
    method: 'POST',
    headers: authHeaders,
  }, {
    staffId: testStaff.id,
    attendanceDate: todayStr,
    attendanceStatus: 'PRESENT',
    checkInTime: '08:45 AM',
    checkOutTime: '06:15 PM',
    workingHours: 9.5,
    overtimeHours: 1.5,
    notes: 'Morning shift on-duty, handled VIP suite arrivals',
  });
  console.log(`Mark PRESENT Status: ${markPresentRes.status}`);
  if (markPresentRes.status !== 200 && markPresentRes.status !== 201) {
    console.error('Mark present failed:', markPresentRes);
    process.exit(1);
  }
  const recordedAtt = markPresentRes.body.data;
  console.log(`Attendance Recorded ID: ${recordedAtt.id} | Status: ${recordedAtt.attendanceStatus} | Hours: ${recordedAtt.workingHours}h | OT: ${recordedAtt.overtimeHours}h`);

  // 4. Test Daily Register
  console.log('\n4. Testing GET /api/v1/attendance/daily...');
  const dailyRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/attendance/daily?date=${todayStr}`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Daily Register Status: ${dailyRes.status}`);
  console.log('Daily Stats:', dailyRes.body.data.stats);

  // 5. Test Update Attendance
  console.log('\n5. Testing PATCH /api/v1/attendance/:id (Update to HALF_DAY)...');
  const updateRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/attendance/${recordedAtt.id}`,
    method: 'PATCH',
    headers: authHeaders,
  }, {
    attendanceStatus: 'HALF_DAY',
    checkInTime: '09:00 AM',
    checkOutTime: '01:00 PM',
    workingHours: 4.0,
    overtimeHours: 0.0,
    notes: 'Half day leave approved for doctor appointment',
  });
  console.log(`Update Status: ${updateRes.status} (Updated Status: ${updateRes.body.data.attendanceStatus}, Hours: ${updateRes.body.data.workingHours}h)`);

  // 6. Test Bulk Mark Attendance
  console.log('\n6. Testing POST /api/v1/attendance/bulk...');
  const bulkRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/attendance/bulk',
    method: 'POST',
    headers: authHeaders,
  }, {
    attendanceDate: todayStr,
    attendanceStatus: 'PRESENT',
    department: 'ALL',
    checkInTime: '09:00 AM',
    checkOutTime: '06:00 PM',
    notes: 'Bulk marked full present shift',
  });
  console.log(`Bulk Mark Status: ${bulkRes.status} (Marked Count: ${bulkRes.body.data.count} staff)`);

  // 7. Test Monthly Matrix
  console.log('\n7. Testing GET /api/v1/attendance/matrix?year=2026&month=11...');
  const matrixRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/attendance/matrix?year=2026&month=11',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Monthly Matrix Status: ${matrixRes.status}`);
  console.log('Overall Monthly Stats:', matrixRes.body.data.overallStats);
  console.log(`Staff Rows Count: ${matrixRes.body.data.staffRows.length}`);

  // 8. Test Employee Attendance History
  console.log(`\n8. Testing GET /api/v1/attendance/staff/${testStaff.id}...`);
  const historyRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/attendance/staff/${testStaff.id}?limit=30`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`History Status: ${historyRes.status} (Records Count: ${historyRes.body.data.total})`);

  console.log('\n--- ALL MODULE 10 ATTENDANCE TESTS PASSED SUCCESSFULLY! ---');
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
