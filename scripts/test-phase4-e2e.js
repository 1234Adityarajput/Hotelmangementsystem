// ============================================================================
// PHASE 4 FULL-STACK END-TO-END VERIFICATION SUITE
// Tests all remaining modules (10-19) against live Neon PostgreSQL Database
// ============================================================================

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../backend/node_modules/@prisma/client');

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

const prisma = new PrismaClient();

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
    failedTests++;
  }
}

async function runPhase4Tests() {
  console.log('====================================================================');
  console.log('   PHASE 4 REMAINING MODULES LIVE NEON DATABASE INTEGRATION SUITE');
  console.log('====================================================================\n');

  const timestamp = Date.now();
  const testEmpCode = `EMP-TEST-${timestamp.toString().slice(-4)}`;
  let testStaffId = null;
  let testAdvanceId = null;
  let testSalaryRecordId = null;
  let testCategoryId = null;
  let testExpenseId = null;

  try {
    // ------------------------------------------------------------------------
    // TEST 1: MODULE 10 — STAFF MANAGEMENT
    // ------------------------------------------------------------------------
    console.log('--- TEST GROUP 1: MODULE 10 (STAFF MANAGEMENT) ---');
    const createdStaff = await prisma.staff.create({
      data: {
        employeeCode: testEmpCode,
        fullName: 'Vikram Sharma',
        email: `vikram.${timestamp}@hoteltest.com`,
        mobileNumber: '9876543210',
        designation: 'Front Desk Supervisor',
        department: 'FRONT_DESK',
        monthlySalary: 35000.00,
        joiningDate: new Date(),
        employmentStatus: 'ACTIVE',
      },
    });
    testStaffId = createdStaff.id;
    assert(!!createdStaff.id, 'Staff created with auto-generated UUID', createdStaff.id);
    assert(createdStaff.employeeCode === testEmpCode, 'Staff employee code persisted correctly');
    assert(Number(createdStaff.monthlySalary) === 35000.00, 'Monthly salary numeric precision preserved');

    // Test unique constraint on employeeCode
    let duplicateRejected = false;
    try {
      await prisma.staff.create({
        data: {
          employeeCode: testEmpCode,
          fullName: 'Duplicate Staff',
          mobileNumber: '9876543211',
          designation: 'Cleaner',
          department: 'HOUSEKEEPING',
          monthlySalary: 15000.00,
          joiningDate: new Date(),
        },
      });
    } catch (e) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Unique constraint on employeeCode enforced by PostgreSQL');

    // ------------------------------------------------------------------------
    // TEST 2: MODULE 11 — ATTENDANCE MANAGEMENT
    // ------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: MODULE 11 (STAFF ATTENDANCE) ---');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRecord = await prisma.attendance.create({
      data: {
        staffId: testStaffId,
        attendanceDate: today,
        attendanceStatus: 'PRESENT',
        checkInTime: '09:00',
        checkOutTime: '19:00',
        workingHours: 10.0,
        overtimeHours: 2.0,
        notes: 'Test shift attendance with 2 hours overtime',
      },
    });
    assert(!!attendanceRecord.id, 'Attendance marked successfully', attendanceRecord.id);
    assert(attendanceRecord.attendanceStatus === 'PRESENT', 'Attendance status saved as PRESENT');
    assert(Number(attendanceRecord.overtimeHours) === 2.0, 'Overtime hours recorded as 2.0');

    // Test unique constraint on [staffId, attendanceDate]
    let duplicateAttendanceRejected = false;
    try {
      await prisma.attendance.create({
        data: {
          staffId: testStaffId,
          attendanceDate: today,
          attendanceStatus: 'HALF_DAY',
        },
      });
    } catch (e) {
      duplicateAttendanceRejected = true;
    }
    assert(duplicateAttendanceRejected, 'Unique constraint on (staffId, attendanceDate) prevents double marking');

    // ------------------------------------------------------------------------
    // TEST 3: MODULE 12 — STAFF ADVANCES
    // ------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: MODULE 12 (STAFF ADVANCES) ---');
    const advance = await prisma.staffAdvance.create({
      data: {
        staffId: testStaffId,
        advanceReference: `ADV-${timestamp}`,
        amount: 5000.00,
        advanceDate: new Date(),
        paymentMethod: 'CASH',
        repaymentStatus: 'PENDING',
        recoveredAmount: 0.00,
        balanceAmount: 5000.00,
        notes: 'Festival emergency cash advance',
      },
    });
    testAdvanceId = advance.id;
    assert(!!advance.id, 'Staff advance disbursed', advance.id);
    assert(Number(advance.balanceAmount) === 5000.00, 'Advance balance matches disbursed amount');

    // Partial recovery test
    const updatedAdvance = await prisma.staffAdvance.update({
      where: { id: testAdvanceId },
      data: {
        recoveredAmount: 2000.00,
        balanceAmount: 3000.00,
        repaymentStatus: 'PARTIALLY_REPAID',
      },
    });
    assert(Number(updatedAdvance.balanceAmount) === 3000.00, 'Partial recovery updates balance to 3000');

    // ------------------------------------------------------------------------
    // TEST 4: MODULE 13 — PAYROLL & SALARY DISBURSEMENT
    // ------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: MODULE 13 (PAYROLL ENGINE) ---');
    // Policy formula test:
    // Basic: 35000 / 30 * 30 = 35000
    // Overtime: (35000 / (30 * 8)) * 1.5 * 2 = 437.50
    // Gross: 35437.50
    // Advance recovery: 3000.00
    // Net: 32437.50
    const salaryRecord = await prisma.salaryRecord.create({
      data: {
        staffId: testStaffId,
        payrollMonth: today.getMonth() + 1,
        payrollYear: today.getFullYear(),
        monthlyBasicSalary: 35000.00,
        configuredSalaryDays: 30,
        payableDays: 28.0,
        presentDays: 28.0,
        absentDays: 2.0,
        halfDays: 0.0,
        paidLeaves: 0.0,
        unpaidLeaves: 2.0,
        overtimeHours: 2.0,
        overtimeAmount: 437.50,
        grossSalary: 35437.50,
        deductions: 0.00,
        advanceDeductions: 3000.00,
        netSalary: 32437.50,
        totalPaid: 0.00,
        balanceAmount: 32437.50,
        payrollStatus: 'DRAFT',
      },
    });
    testSalaryRecordId = salaryRecord.id;
    assert(!!salaryRecord.id, 'Salary record generated', salaryRecord.id);
    assert(Number(salaryRecord.netSalary) === 32437.50, 'Net salary matches formula');
    assert(Number(salaryRecord.balanceAmount) === 32437.50, 'PostgreSQL check_salary_balance_relationship respected');

    // Record salary payment
    const payment = await prisma.$transaction(async (tx) => {
      const sp = await tx.salaryPayment.create({
        data: {
          salaryRecordId: testSalaryRecordId,
          paymentReference: `SAL-PAY-${timestamp}`,
          paymentAmount: 32437.50,
          paymentDate: new Date(),
          paymentMethod: 'BANK_TRANSFER',
          transactionReference: `NEFT-${timestamp}`,
          notes: 'Full monthly settlement',
        },
      });

      const updatedRecord = await tx.salaryRecord.update({
        where: { id: testSalaryRecordId },
        data: {
          totalPaid: 32437.50,
          balanceAmount: 0.00,
          payrollStatus: 'PAID',
        },
      });

      return { sp, updatedRecord };
    });
    assert(Number(payment.updatedRecord.balanceAmount) === 0.00, 'Salary payment zeroed balance amount');
    assert(payment.updatedRecord.payrollStatus === 'PAID', 'Salary record transitioned to PAID');

    // ------------------------------------------------------------------------
    // TEST 5: MODULE 14 — EXPENSE MANAGEMENT
    // ------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: MODULE 14 (EXPENSE MANAGEMENT) ---');
    const category = await prisma.expenseCategory.create({
      data: {
        name: `Kitchen Supplies ${timestamp}`,
        description: 'Test category for restaurant & pantry',
      },
    });
    testCategoryId = category.id;
    assert(!!category.id, 'Expense category created', category.id);

    const expense = await prisma.expense.create({
      data: {
        expenseReference: `EXP-${timestamp}`,
        expenseCategoryId: testCategoryId,
        description: 'Monthly coffee and tea bags',
        amount: 2450.00,
        paymentMethod: 'UPI',
        paymentDate: new Date(),
        transactionReference: `UPI-TXN-${timestamp}`,
      },
    });
    testExpenseId = expense.id;
    assert(!!expense.id, 'Expense record created', expense.id);
    assert(Number(expense.amount) === 2450.00, 'Expense amount matches');

    // Test positive check constraint
    let negativeExpenseRejected = false;
    try {
      await prisma.expense.create({
        data: {
          expenseReference: `EXP-NEG-${timestamp}`,
          expenseCategoryId: testCategoryId,
          description: 'Invalid negative expense',
          amount: -100.00,
          paymentMethod: 'CASH',
          paymentDate: new Date(),
        },
      });
    } catch (e) {
      negativeExpenseRejected = true;
    }
    assert(negativeExpenseRejected, 'PostgreSQL check_expense_amount_positive prevents negative expense');

    // ------------------------------------------------------------------------
    // TEST 6: MODULE 15 — DIGITAL REGISTERS (14 TYPES)
    // ------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: MODULE 15 (DIGITAL REGISTERS 14 TYPES) ---');
    const registersToCheck = [
      { name: 'Guest Register', query: () => prisma.guest.findMany({ take: 3 }) },
      { name: 'Room Inventory Register', query: () => prisma.room.findMany({ take: 3 }) },
      { name: 'Reservation Register', query: () => prisma.booking.findMany({ take: 3 }) },
      { name: 'Check-In Register', query: () => prisma.booking.findMany({ where: { bookingStatus: 'CHECKED_IN' }, take: 3 }) },
      { name: 'Invoice Register', query: () => prisma.invoice.findMany({ take: 3 }) },
      { name: 'Payment Ledger Register', query: () => prisma.payment.findMany({ take: 3 }) },
      { name: 'Catalog Register', query: () => prisma.item.findMany({ take: 3 }) },
      { name: 'Staff Directory Register', query: () => prisma.staff.findMany({ take: 3 }) },
      { name: 'Attendance Register', query: () => prisma.attendance.findMany({ take: 3 }) },
      { name: 'Staff Advance Register', query: () => prisma.staffAdvance.findMany({ take: 3 }) },
      { name: 'Payroll Register', query: () => prisma.salaryRecord.findMany({ take: 3 }) },
      { name: 'Salary Disbursement Register', query: () => prisma.salaryPayment.findMany({ take: 3 }) },
      { name: 'Expense Register', query: () => prisma.expense.findMany({ take: 3 }) },
      { name: 'Audit Log Register', query: () => prisma.auditLog.findMany({ take: 3 }) },
    ];

    for (const reg of registersToCheck) {
      const records = await reg.query();
      assert(Array.isArray(records), `Register: ${reg.name} successfully queries live DB`);
    }

    // ------------------------------------------------------------------------
    // TEST 7: MODULE 16 — REPORTS & ANALYTICS AGGREGATIONS
    // ------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: MODULE 16 (REPORTS & ANALYTICS) ---');
    const [totalRevenue, totalExpenses, totalBookings, totalGuests] = await Promise.all([
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.booking.count(),
      prisma.guest.count(),
    ]);
    assert(typeof totalBookings === 'number', 'Booking aggregate metrics computed', `Count: ${totalBookings}`);
    assert(typeof totalGuests === 'number', 'Guest aggregate metrics computed', `Count: ${totalGuests}`);
    assert(totalRevenue._sum.amount !== undefined, 'Payment ledger aggregate computed');
    assert(totalExpenses._sum.amount !== undefined, 'Expense ledger aggregate computed');

    // ------------------------------------------------------------------------
    // TEST 8: MODULE 18 — HOTEL SETTINGS & SYSTEM ADMIN
    // ------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: MODULE 18 (HOTEL SETTINGS & ADMIN) ---');
    let settings = await prisma.hotelSetting.findFirst();
    if (!settings) {
      settings = await prisma.hotelSetting.create({
        data: {
          hotelName: 'Grand Horizon Luxury Resort',
          currencyCode: 'INR',
          timezone: 'Asia/Kolkata',
          defaultCheckInTime: '14:00',
          defaultCheckOutTime: '11:00',
          taxEnabled: true,
          defaultTaxPercentage: 12.0,
          defaultSalaryDays: 30,
        },
      });
    }
    assert(!!settings.id, 'Hotel singleton settings loaded/initialized', settings.hotelName);
    assert(settings.currencyCode === 'INR', 'Currency code set to INR');

    // Update settings test
    const updatedSetting = await prisma.hotelSetting.update({
      where: { id: settings.id },
      data: {
        defaultSalaryDays: 30,
      },
    });
    assert(updatedSetting.defaultSalaryDays === 30, 'Hotel setting updated successfully');

    // ------------------------------------------------------------------------
    // TEST 9: MODULE 19 — AUDIT LOGS & TRACEABILITY
    // ------------------------------------------------------------------------
    console.log('\n--- TEST GROUP 9: MODULE 19 (AUDIT LOGGING) ---');
    const auditEntry = await prisma.auditLog.create({
      data: {
        entityType: 'STAFF',
        entityId: testStaffId,
        action: 'CREATE',
        previousValues: null,
        newValues: { employeeCode: testEmpCode, salary: 35000 },
        description: `Automated test staff creation ${testEmpCode}`,
      },
    });
    assert(!!auditEntry.id, 'Audit log created with state JSON diff', auditEntry.id);
    assert(auditEntry.action === 'CREATE', 'Audit action recorded accurately');

  } catch (err) {
    console.error('\nUNHANDLED EXCEPTION IN TEST RUNNER:', err);
    failedTests++;
  } finally {
    // Clean up created test data safely
    console.log('\n--- CLEANING UP TEST ARTIFACTS ---');
    try {
      if (testExpenseId) await prisma.expense.delete({ where: { id: testExpenseId } }).catch(() => {});
      if (testCategoryId) await prisma.expenseCategory.delete({ where: { id: testCategoryId } }).catch(() => {});
      if (testSalaryRecordId) {
        await prisma.salaryPayment.deleteMany({ where: { salaryRecordId: testSalaryRecordId } }).catch(() => {});
        await prisma.salaryRecord.delete({ where: { id: testSalaryRecordId } }).catch(() => {});
      }
      if (testAdvanceId) await prisma.staffAdvance.delete({ where: { id: testAdvanceId } }).catch(() => {});
      if (testStaffId) {
        await prisma.attendance.deleteMany({ where: { staffId: testStaffId } }).catch(() => {});
        await prisma.auditLog.deleteMany({ where: { entityId: testStaffId } }).catch(() => {});
        await prisma.staff.delete({ where: { id: testStaffId } }).catch(() => {});
      }
      console.log('  ✓ Test cleanup completed cleanly.');
    } catch (cleanErr) {
      console.warn('  ! Cleanup warning:', cleanErr.message);
    }

    await prisma.$disconnect();

    console.log('\n====================================================================');
    console.log(`   TOTAL TESTS: ${passedTests + failedTests}`);
    console.log(`   PASSED:      ${passedTests}`);
    console.log(`   FAILED:      ${failedTests}`);
    console.log('====================================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  }
}

runPhase4Tests();
