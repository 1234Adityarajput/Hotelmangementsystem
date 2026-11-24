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

const REQUIRED_CATEGORIES = [
  { name: 'Electricity Bills', description: 'Monthly electricity board bills, diesel generator fuel, power backup' },
  { name: 'Water Bills', description: 'Municipal water supply, water tanker charges, sewage, water purification' },
  { name: 'Grocery Expenses', description: 'Fresh vegetables, dairy, cooking provisions, restaurant grocery inventory' },
  { name: 'Maintenance Expenses', description: 'AC servicing, plumbing, electrical repairs, carpentry, painting, room fixes' },
  { name: 'Staff-Related Expenses', description: 'Staff meals, tea, staff medical aid, staff uniforms, workforce welfare' },
  { name: 'Other Operational Expenses', description: 'Housekeeping chemicals, stationery, guest register books, admin petty cash' }
];

async function seed() {
  console.log('--- SEEDING EXACT REQUIRED EXPENSE CATEGORIES ---');

  // Login
  const loginRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'admin', password: 'Admin@Hotel2026!' });

  const token = loginRes.body.data.accessToken;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Fetch existing
  const catRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/expenses/categories',
    method: 'GET',
    headers: authHeaders,
  });

  const existingNames = new Set((catRes.body?.data || []).map(c => c.name.toLowerCase()));

  for (const cat of REQUIRED_CATEGORIES) {
    if (!existingNames.has(cat.name.toLowerCase())) {
      const createRes = await request({
        hostname: 'localhost',
        port: 4000,
        path: '/api/v1/expenses/categories',
        method: 'POST',
        headers: authHeaders,
      }, cat);
      console.log(`✓ Created category: "${cat.name}" (Status: ${createRes.status})`);
    } else {
      console.log(`• Category already exists: "${cat.name}"`);
    }
  }

  console.log('--- EXPENSE CATEGORIES SEEDED SUCCESSFULLY ---');
}

seed().catch(console.error);
