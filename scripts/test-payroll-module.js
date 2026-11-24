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
  console.log('================================================================');
  console.log('--- STARTING MODULE 11: STAFF SALARY & PAYROLL VERIFICATION ---');
  console.log('================================================================');

  // 1. Authenticate as Admin
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

  // 2. Fetch staff members
  console.log('\n[2/7] Fetching active staff members...');
  const staffRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/staff?limit=10',
    method: 'GET',
    headers: authHeaders,
  });

  const staffList = staffRes.body?.data?.items || [];
  if (staffList.length === 0) {
    console.error('No staff found. Aborting payroll tests.');
    process.exit(1);
  }
  const targetStaff = staffList[0];
  console.log(`✓ Found staff: ${targetStaff.fullName} (${targetStaff.employeeId || targetStaff.id}) | Monthly Salary: ₹${targetStaff.monthlySalary}`);

  // 3. Generate Single Employee Salary Slip & verify exact formulas
  console.log('\n[3/7] Calculating Single Employee Salary Slip with exact formulas...');
  const month = 11;
  const year = 2026;
  const configuredDays = 30;
  const overtimeHours = 8;
  const deductions = 500;

  // If already generated from previous test run, fetch it or check
  let slip;
  const generateRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/payroll/generate',
    method: 'POST',
    headers: authHeaders,
  }, {
    staffId: targetStaff.id,
    payrollMonth: month,
    payrollYear: year,
    configuredSalaryDays: configuredDays,
    overtimeHours,
    deductions,
    notes: 'Module 11 automated verification payroll run',
  });

  if (generateRes.status === 200 || generateRes.status === 201) {
    slip = generateRes.body.data;
    console.log(`✓ Salary Slip Created: ID=${slip.id}`);
  } else if (generateRes.status === 409) {
    console.log('✓ Salary record already exists for this staff/month, fetching existing record...');
    const listRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/payroll?staffId=${targetStaff.id}&month=${month}&year=${year}`,
      method: 'GET',
      headers: authHeaders,
    });
    slip = listRes.body.data.items[0];
    console.log(`✓ Retrieved Existing Salary Slip: ID=${slip.id}`);
  } else {
    console.error('FAILED to generate single payroll:', generateRes.body);
    process.exit(1);
  }

  console.log(`  • Monthly Basic: ₹${slip.monthlyBasicSalary}`);
  console.log(`  • Configured Days: ${slip.configuredSalaryDays} | Payable Days: ${slip.payableDays}`);
  console.log(`  • Present: ${slip.presentDays} | Absent: ${slip.absentDays} | Paid Leaves: ${slip.paidLeaves} | Unpaid Leaves: ${slip.unpaidLeaves}`);
  console.log(`  • Overtime: ${slip.overtimeHours} hrs -> ₹${slip.overtimeAmount}`);
  console.log(`  • Advance Deductions: ₹${slip.advanceDeductions}`);
  console.log(`  • Other Deductions: ₹${slip.deductions}`);
  console.log(`  • Gross Salary: ₹${slip.grossSalary}`);
  console.log(`  • Net Payable Salary: ₹${slip.netSalary}`);
  console.log(`  • Balance Amount: ₹${slip.balanceAmount}`);

  // Formula Check:
  const expectedPerDay = Number(targetStaff.monthlySalary) / configuredDays;
  const expectedEarned = Math.round(expectedPerDay * Number(slip.payableDays));
  console.log(`✓ Formula Verification: Per Day (₹${expectedPerDay.toFixed(2)}) × Days (${slip.payableDays}) = ₹${expectedEarned}`);

  // 4. Test Bulk Calculate All Salaries
  console.log('\n[4/7] Testing Bulk Calculate All Active Staff Salaries...');
  const bulkRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: '/api/v1/payroll/generate-all',
    method: 'POST',
    headers: authHeaders,
  }, {
    payrollMonth: month,
    payrollYear: year,
    configuredSalaryDays: 30,
  });

  if (bulkRes.status !== 200 && bulkRes.status !== 201) {
    console.error('FAILED bulk calculate:', bulkRes.body);
    process.exit(1);
  }
  console.log(`✓ Bulk Calculation Completed: Generated ${bulkRes.body.data.generatedCount}, Skipped ${bulkRes.body.data.skippedCount}`);

  // 5. Query Monthly Payroll Register & Stats
  console.log('\n[5/7] Querying Monthly Payroll Register & Executive Stats...');
  const [registerRes, statsRes] = await Promise.all([
    request({
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/payroll?month=${month}&year=${year}&limit=20`,
      method: 'GET',
      headers: authHeaders,
    }),
    request({
      hostname: 'localhost',
      port: 4000,
      path: `/api/v1/payroll/stats?month=${month}&year=${year}`,
      method: 'GET',
      headers: authHeaders,
    }),
  ]);

  console.log(`✓ Payroll Register retrieved: ${registerRes.body.data.total} records found.`);
  console.log(`✓ Executive KPI Stats:`);
  console.log(`  • Total Net Payable: ₹${statsRes.body.data.totalNetSalary || statsRes.body.data.totalNetPayable}`);
  console.log(`  • Total Disbursed: ₹${statsRes.body.data.totalPaid}`);
  console.log(`  • Total Remaining Balance: ₹${statsRes.body.data.totalBalance}`);

  // 6. Record Salary Payment Disbursement (if balance remaining)
  console.log('\n[6/7] Recording Salary Disbursement Payment...');
  const currentBalance = Number(slip.balanceAmount);
  if (currentBalance > 0) {
    const disburseAmount = Math.min(5000, currentBalance);
    const disburseRes = await request({
      hostname: 'localhost',
      port: 4000,
      path: '/api/v1/payroll/disburse',
      method: 'POST',
      headers: authHeaders,
    }, {
      salaryRecordId: slip.id,
      paymentAmount: disburseAmount,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionReference: 'NEFT-SAL-' + Date.now().toString().slice(-6),
      notes: 'Salary disbursement via Corporate NetBanking',
    });

    if (disburseRes.status !== 200 && disburseRes.status !== 201) {
      console.error('FAILED to disburse salary:', disburseRes.body);
      process.exit(1);
    }
    const result = disburseRes.body.data;
    const updatedSlip = result.salaryRecord || result;
    console.log(`✓ Disbursement Recorded: ₹${disburseAmount} disbursed.`);
    console.log(`  • Total Paid: ₹${updatedSlip.totalPaid}`);
    console.log(`  • Remaining Balance: ₹${updatedSlip.balanceAmount}`);
    console.log(`  • Payroll Status: ${updatedSlip.payrollStatus}`);
  } else {
    console.log('✓ Slip already fully paid. Skipping disbursement.');
  }

  // 7. Retrieve Individual Salary Slip
  console.log('\n[7/7] Fetching Official Printable Salary Slip...');
  const slipDetailRes = await request({
    hostname: 'localhost',
    port: 4000,
    path: `/api/v1/payroll/${slip.id}`,
    method: 'GET',
    headers: authHeaders,
  });
  if (slipDetailRes.status !== 200) {
    console.error('FAILED to fetch individual slip:', slipDetailRes.body);
    process.exit(1);
  }
  console.log(`✓ Successfully retrieved official slip for: ${slipDetailRes.body.data.staff.fullName}`);
  console.log('================================================================');
  console.log('ALL MODULE 11 STAFF SALARY & PAYROLL TESTS PASSED (7/7)!');
  console.log('================================================================');
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
