const http = require('http');

function rawRequest(options, postData) {
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

// Request with auto-retry for Neon pooler wakeup
async function request(options, postData, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await rawRequest(options, postData);
      if (res.status === 500 && (JSON.stringify(res.body).includes('closed the connection') || JSON.stringify(res.body).includes("Can't reach database"))) {
        if (attempt < retries) {
          console.log(`    [Attempt ${attempt}] Neon database waking up... retrying in 1s`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
      }
      return res;
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }
}

const REQUIRED_CATEGORIES = [
  'Electricity Bills',
  'Water Bills',
  'Grocery Expenses',
  'Maintenance Expenses',
  'Staff-Related Expenses',
  'Other Operational Expenses'
];

async function run() {
  console.log('================================================================');
  console.log('--- STARTING MODULE 13: HOTEL EXPENSE MANAGEMENT TESTS ---');
  console.log('================================================================');

  // 1. Authenticate Admin
  console.log('\n[1/7] Authenticating Admin credentials...');
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

  // 2. Verify all 6 Required Categories exist
  console.log('\n[2/7] Verifying all 6 Required Expense Categories...');
  const catRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/expenses/categories',
    method: 'GET',
    headers: authHeaders,
  });

  const categories = catRes.body.data || [];
  const catMap = new Map();
  categories.forEach(c => catMap.set(c.name, c.id));

  for (const name of REQUIRED_CATEGORIES) {
    if (catMap.has(name)) {
      console.log(`  ✓ Found category: "${name}" (ID: ${catMap.get(name)})`);
    } else {
      console.error(`  ✗ Missing category: "${name}"`);
      process.exit(1);
    }
  }

  // 3. Record Expenses across categories
  console.log('\n[3/7] Recording operational expenses across categories...');
  const sampleExpenses = [
    {
      categoryName: 'Electricity Bills',
      description: 'State Electricity Board Monthly Meter Bill - Hotel Main Wing',
      amount: 14500.00,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionReference: 'NEFT-EB-992182',
      notes: 'Monthly tariff paid via corporate NetBanking',
    },
    {
      categoryName: 'Water Bills',
      description: 'Municipal Commercial Water Connection & Purification Charge',
      amount: 3200.00,
      paymentMethod: 'UPI',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionReference: 'UPI-WATER-48192',
      notes: 'Paid via Axis UPI QR',
    },
    {
      categoryName: 'Grocery Expenses',
      description: 'Weekly Fresh Vegetables, Dairy, and Kitchen Dry Groceries',
      amount: 8750.00,
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionReference: 'CASH-REC-1049',
      notes: 'Purchased from APMC wholesale mandi',
    },
    {
      categoryName: 'Maintenance Expenses',
      description: 'HVAC Air Conditioning Compressor Gas Refill & Filter Cleaning',
      amount: 4500.00,
      paymentMethod: 'UPI',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionReference: 'UPI-AC-38192',
      notes: 'Daikin authorized technician visit',
    },
    {
      categoryName: 'Staff-Related Expenses',
      description: 'Monthly Staff Mess Cafeteria Provisions & Kitchen Staff Meals',
      amount: 6000.00,
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionReference: 'CASH-MESS-29',
      notes: 'Staff welfare meal allocation',
    },
    {
      categoryName: 'Other Operational Expenses',
      description: 'Front Office Statutory Register Books & RFID Keycards Pack',
      amount: 2100.00,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionReference: 'IMPS-PRINT-991',
      notes: 'Stationery and registration supplies',
    },
  ];

  const createdExpenses = [];

  for (const item of sampleExpenses) {
    const payload = {
      expenseCategoryId: catMap.get(item.categoryName),
      description: item.description,
      amount: item.amount,
      paymentMethod: item.paymentMethod,
      paymentDate: item.paymentDate,
      transactionReference: item.transactionReference,
      notes: item.notes,
    };

    const res = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/expenses',
      method: 'POST',
      headers: authHeaders,
    }, payload);

    if (res.status === 201) {
      createdExpenses.push(res.body.data);
      console.log(`  ✓ Recorded: [${res.body.data.expenseReference}] ${item.categoryName} - ₹${item.amount}`);
    } else {
      console.error(`  ✗ FAILED to record expense:`, res.body);
    }
  }

  // 4. View single expense details
  console.log('\n[4/7] Testing View Single Expense Details...');
  const targetExp = createdExpenses[0];
  const viewRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/expenses/${targetExp.id}`,
    method: 'GET',
    headers: authHeaders,
  });

  if (viewRes.status === 200) {
    console.log(`  ✓ Fetched Expense Details: ${viewRes.body.data.expenseReference} | Category: ${viewRes.body.data.category.name} | Amount: ₹${viewRes.body.data.amount}`);
  } else {
    console.error('  ✗ FAILED to view expense details');
    process.exit(1);
  }

  // 5. Update expense details
  console.log('\n[5/7] Testing Update Expense Details...');
  const updateRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/expenses/${targetExp.id}`,
    method: 'PATCH',
    headers: authHeaders,
  }, {
    amount: 15200.00,
    notes: 'Updated: Monthly power bill including generator fuel surcharge',
  });

  if (updateRes.status === 200) {
    console.log(`  ✓ Updated Expense: New Amount ₹${updateRes.body.data.amount} | Notes: "${updateRes.body.data.notes}"`);
  } else {
    console.error('  ✗ FAILED to update expense');
    process.exit(1);
  }

  // 6. Query expenses with filters
  console.log('\n[6/7] Querying Expenses with Filters & KPI Stats...');
  const [listRes, statsRes] = await Promise.all([
    request({
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/expenses?limit=20`,
      method: 'GET',
      headers: authHeaders,
    }),
    request({
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/expenses/stats`,
      method: 'GET',
      headers: authHeaders,
    }),
  ]);

  console.log(`  ✓ Total Expenses in Ledger: ${listRes.body.data.total}`);
  console.log(`  ✓ Stats: Today ₹${statsRes.body.data.todayAmount} | Month ₹${statsRes.body.data.monthAmount} | Year ₹${statsRes.body.data.yearAmount}`);

  // 7. Test Delete Expense
  console.log('\n[7/7] Testing Delete Expense Record...');
  const toDelete = createdExpenses[createdExpenses.length - 1];
  const deleteRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/expenses/${toDelete.id}`,
    method: 'DELETE',
    headers: authHeaders,
  });

  if (deleteRes.status === 200) {
    console.log(`  ✓ Successfully deleted expense record: ${toDelete.expenseReference}`);
  } else {
    console.error('  ✗ FAILED to delete expense:', deleteRes.body);
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('ALL MODULE 13 HOTEL EXPENSE MANAGEMENT TESTS PASSED (100%)!');
  console.log('================================================================');
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
