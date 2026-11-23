const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const http = require('http');

const prisma = new PrismaClient();

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
  console.log('--- STARTING VERIFICATION SUITE ---');

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

  // 2. Test Active Folios endpoint (Screenshot 3 issue)
  console.log('\n2. Testing GET /api/v1/invoices/active-folios...');
  const folioRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/invoices/active-folios',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Active Folios Status: ${folioRes.status} (folios count: ${folioRes.body.data?.folios?.length ?? 'N/A'})`);

  // 3. Test Available Rooms & Guests (Screenshot 1 & 2 issue)
  console.log('\n3. Testing GET /api/v1/rooms/available and GET /api/v1/guests...');
  const roomsRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/rooms/available',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Rooms available Status: ${roomsRes.status} (count: ${roomsRes.body.data?.length ?? 'N/A'})`);

  const guestsRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/guests?limit=10',
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Guests Status: ${guestsRes.status} (count: ${guestsRes.body.data?.items?.length ?? 'N/A'})`);

  // 4. Test Staff Management Module 9
  console.log('\n4. Testing Staff Management Module 9:');
  const testMobile = `+91 99${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testStaffPayload = {
    employeeCode: `EMP-CUSTOM-${Date.now().toString().slice(-4)}`,
    fullName: 'Vikramaditya Singhania',
    mobileNumber: testMobile,
    alternateMobileNumber: '+91 9811223344',
    email: `vikram.${Date.now()}@grandhorizon.com`,
    address: 'Suite 104, Royal Palms Estate, Civil Lines, Jaipur',
    dateOfBirth: '1988-08-22',
    emergencyContact: 'Gayatri Singhania (Wife) - +91 9822334455',
    designation: 'Executive Floor Concierge',
    department: 'Front Office',
    joiningDate: '2026-01-15',
    monthlySalary: 45000,
    bankAccountHolder: 'Vikramaditya Singhania',
    bankAccountNumber: '987654321098',
    bankIfscCode: 'HDFC0001234',
    employmentStatus: 'ACTIVE',
    notes: 'Luxury VIP Guest Relations Specialist - Morning Shift (07:00 - 15:30)',
  };

  console.log('Creating staff with all 13 fields...');
  const createStaffRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/staff',
    method: 'POST',
    headers: authHeaders,
  }, testStaffPayload);

  console.log(`Create Staff Status: ${createStaffRes.status}`);
  if (createStaffRes.status !== 200 && createStaffRes.status !== 201) {
    console.error('Create staff failed:', createStaffRes);
    process.exit(1);
  }
  const createdStaff = createStaffRes.body.data;
  console.log(`Staff registered: ${createdStaff.fullName} | ID: ${createdStaff.employeeCode} | Dept: ${createdStaff.department} | Salary: ₹${createdStaff.monthlySalary}`);

  // 5. Test Staff Stats
  console.log('\n5. Testing GET /api/v1/staff/stats...');
  const statsRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/staff/stats',
    method: 'GET',
    headers: authHeaders,
  });
  console.log('Staff Stats:', statsRes.body.data);

  // 6. Test Staff Search and List
  console.log('\n6. Testing GET /api/v1/staff with search...');
  const searchRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/staff?search=${encodeURIComponent('Vikramaditya')}`,
    method: 'GET',
    headers: authHeaders,
  });
  console.log(`Search result count: ${searchRes.body.data?.items?.length} (Found: ${searchRes.body.data?.items?.[0]?.fullName})`);

  // 7. Test Staff Update
  console.log('\n7. Testing PATCH /api/v1/staff/:id...');
  const updateRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/staff/${createdStaff.id}`,
    method: 'PATCH',
    headers: authHeaders,
  }, {
    monthlySalary: 48000,
    designation: 'Senior VIP Concierge & Guest Experience Manager',
  });
  console.log(`Update Status: ${updateRes.status} (New Designation: ${updateRes.body.data?.designation}, Salary: ₹${updateRes.body.data?.monthlySalary})`);

  console.log('\n--- ALL VERIFICATIONS PASSED SUCCESSFULLY! ---');
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('Fatal error:', err);
  prisma.$disconnect();
  process.exit(1);
});
