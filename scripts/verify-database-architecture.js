// ============================================================================
// COMPREHENSIVE DATABASE ARCHITECTURE VERIFICATION SCRIPT (CommonJS)
// Validates Prisma DMMF, models, relationships, field types, constraints,
// financial decimals, migration SQL, exclusion constraints, and triggers.
// ============================================================================

const fs = require('fs');
const path = require('path');
const { Prisma } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));

console.log('====================================================================');
console.log('   HOTEL MANAGEMENT SOFTWARE – DATABASE ARCHITECTURE AUDIT');
console.log('====================================================================\n');

const dmmf = Prisma.dmmf;
const models = dmmf.datamodel.models;
const enums = dmmf.datamodel.enums;

console.log(`✔ Found ${models.length} Models in Prisma DMMF`);
console.log(`✔ Found ${enums.length} Enums in Prisma DMMF\n`);

let passedChecks = 0;
let totalChecks = 0;

function assertCheck(name, condition, detail = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${name} ${detail ? `(${detail})` : ''}`);
  } else {
    console.error(`  [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
  }
}

// 1. Verify Core Models Coverage (22 Models)
console.log('--- 1. Model Coverage Verification (22 Models) ---');
const requiredModels = [
  'Admin', 'Guest', 'GuestDocument', 'RoomType', 'Room',
  'Booking', 'BookingGuest', 'ItemCategory', 'Item', 'BookingItem',
  'Invoice', 'Payment', 'Staff', 'Attendance', 'StaffAdvance', 'SalaryRecord',
  'SalaryPayment', 'ExpenseCategory', 'Expense', 'HotelSetting', 'AuditLog',
  'SystemHealth'
];

for (const modelName of requiredModels) {
  const model = models.find(m => m.name === modelName);
  assertCheck(`Model ${modelName} exists`, !!model, model ? `table: ${model.dbName || modelName}` : 'Missing');
}

// 2. Verify Single Admin Architecture & Singleton Enforcements
console.log('\n--- 2. Single Admin & Singleton Architecture ---');
const adminModel = models.find(m => m.name === 'Admin');
if (adminModel) {
  assertCheck('Admin has username field', adminModel.fields.some(f => f.name === 'username' && f.isUnique));
  assertCheck('Admin has passwordHash field', adminModel.fields.some(f => f.name === 'passwordHash'));
  assertCheck('Admin has isActive field', adminModel.fields.some(f => f.name === 'isActive'));
  assertCheck('Admin does NOT have role/RBAC fields', !adminModel.fields.some(f => f.name.toLowerCase().includes('role')));
  assertCheck('Admin has isSingleton unique flag', adminModel.fields.some(f => f.name === 'isSingleton' && f.isUnique));
}

const hotelSettingModel = models.find(m => m.name === 'HotelSetting');
assertCheck('HotelSetting has isSingleton unique flag', !!hotelSettingModel?.fields.some(f => f.name === 'isSingleton' && f.isUnique));

const systemHealthModel = models.find(m => m.name === 'SystemHealth');
assertCheck('SystemHealth has isSingleton unique flag', !!systemHealthModel?.fields.some(f => f.name === 'isSingleton' && f.isUnique));

// 3. Verify Financial Decimal Precision (Zero Floats)
console.log('\n--- 3. Financial Monetary Fields (Decimal Type, Zero Floats) ---');
const monetaryChecks = [
  { model: 'RoomType', field: 'defaultPricePerNight' },
  { model: 'Room', field: 'pricePerNight' },
  { model: 'Booking', field: 'roomRatePerNight' },
  { model: 'Booking', field: 'advanceAmount' },
  { model: 'Item', field: 'unitPrice' },
  { model: 'BookingItem', field: 'unitPrice' },
  { model: 'BookingItem', field: 'totalAmount' },
  { model: 'Invoice', field: 'roomCharges' },
  { model: 'Invoice', field: 'subtotal' },
  { model: 'Invoice', field: 'taxPercentage' },
  { model: 'Invoice', field: 'taxAmount' },
  { model: 'Invoice', field: 'totalAmount' },
  { model: 'Invoice', field: 'totalPaid' },
  { model: 'Invoice', field: 'balanceAmount' },
  { model: 'Payment', field: 'amount' },
  { model: 'Staff', field: 'monthlySalary' },
  { model: 'StaffAdvance', field: 'amount' },
  { model: 'StaffAdvance', field: 'recoveredAmount' },
  { model: 'SalaryRecord', field: 'monthlyBasicSalary' },
  { model: 'SalaryRecord', field: 'grossSalary' },
  { model: 'SalaryRecord', field: 'advanceDeductions' },
  { model: 'SalaryRecord', field: 'netSalary' },
  { model: 'SalaryRecord', field: 'totalPaid' },
  { model: 'SalaryRecord', field: 'balanceAmount' },
  { model: 'SalaryPayment', field: 'paymentAmount' },
  { model: 'Expense', field: 'amount' },
];

for (const check of monetaryChecks) {
  const model = models.find(m => m.name === check.model);
  const field = model?.fields.find(f => f.name === check.field);
  const isDecimal = field?.type === 'Decimal';
  assertCheck(`${check.model}.${check.field} is Decimal`, isDecimal, `type: ${field?.type}`);
}

// 4. Verify Constraints, Indexes & Uniqueness Audit
console.log('\n--- 4. Constraints & Uniqueness Audit ---');
const guestModel = models.find(m => m.name === 'Guest');
assertCheck('Guest guestCode is unique', !!guestModel?.fields.find(f => f.name === 'guestCode')?.isUnique);

const roomModel = models.find(m => m.name === 'Room');
assertCheck('Room roomNumber is unique', !!roomModel?.fields.find(f => f.name === 'roomNumber')?.isUnique);

const bookingModel = models.find(m => m.name === 'Booking');
assertCheck('Booking bookingNumber is unique', !!bookingModel?.fields.find(f => f.name === 'bookingNumber')?.isUnique);
assertCheck('Booking bookingStatus defaults to RESERVED', bookingModel?.fields.find(f => f.name === 'bookingStatus')?.default === 'RESERVED');
assertCheck('Booking has actualCheckInAt and actualCheckOutAt timestamps', 
  bookingModel?.fields.some(f => f.name === 'actualCheckInAt') && 
  bookingModel?.fields.some(f => f.name === 'actualCheckOutAt')
);

const invoiceModel = models.find(m => m.name === 'Invoice');
assertCheck('Invoice invoiceNumber is unique', !!invoiceModel?.fields.find(f => f.name === 'invoiceNumber')?.isUnique);

const paymentModel = models.find(m => m.name === 'Payment');
assertCheck('Payment paymentReference is unique', !!paymentModel?.fields.find(f => f.name === 'paymentReference')?.isUnique);

const staffModel = models.find(m => m.name === 'Staff');
assertCheck('Staff employeeCode is unique', !!staffModel?.fields.find(f => f.name === 'employeeCode')?.isUnique);

const attendanceModel = models.find(m => m.name === 'Attendance');
const attendanceCompound = attendanceModel?.uniqueIndexes.some(ui => 
  ui.fields.includes('staffId') && ui.fields.includes('attendanceDate')
);
assertCheck('Attendance unique per (staffId, attendanceDate)', !!attendanceCompound);

const salaryRecordModel = models.find(m => m.name === 'SalaryRecord');
const salaryCompound = salaryRecordModel?.uniqueIndexes.some(ui => 
  ui.fields.includes('staffId') && ui.fields.includes('payrollMonth') && ui.fields.includes('payrollYear')
);
assertCheck('SalaryRecord unique per (staffId, payrollMonth, payrollYear)', !!salaryCompound);

const bookingGuestModel = models.find(m => m.name === 'BookingGuest');
const bookingGuestCompound = bookingGuestModel?.uniqueIndexes.some(ui => 
  ui.fields.includes('bookingId') && ui.fields.includes('guestId')
);
assertCheck('BookingGuest unique per (bookingId, guestId)', !!bookingGuestCompound);

// 5. Verify Historical Snapshot Fields
console.log('\n--- 5. Historical Record Preservation ---');
const bookingItemModel = models.find(m => m.name === 'BookingItem');
assertCheck('BookingItem has itemNameSnapshot', !!bookingItemModel?.fields.find(f => f.name === 'itemNameSnapshot'));
assertCheck('BookingItem has unitPrice snapshot', !!bookingItemModel?.fields.find(f => f.name === 'unitPrice'));
assertCheck('Booking has roomRatePerNight snapshot', !!bookingModel?.fields.find(f => f.name === 'roomRatePerNight'));
assertCheck('Invoice has taxPercentage snapshot', !!invoiceModel?.fields.find(f => f.name === 'taxPercentage'));
assertCheck('SalaryRecord has monthlyBasicSalary snapshot', !!salaryRecordModel?.fields.find(f => f.name === 'monthlyBasicSalary'));
assertCheck('SalaryRecord tracks advanceDeductions, totalPaid, balanceAmount', 
  !!salaryRecordModel?.fields.find(f => f.name === 'advanceDeductions') && 
  !!salaryRecordModel?.fields.find(f => f.name === 'totalPaid') && 
  !!salaryRecordModel?.fields.find(f => f.name === 'balanceAmount')
);

// 6. Inspect Migration SQL for PostgreSQL Constraints & Triggers
console.log('\n--- 6. PostgreSQL Advanced SQL Migration Verification ---');
const migrationSqlPath = path.join(__dirname, '../backend/prisma/migrations/20261123000000_init_complete_hotel_database/migration.sql');
const migrationSqlExists = fs.existsSync(migrationSqlPath);
assertCheck('Migration SQL file exists', migrationSqlExists, migrationSqlPath);

if (migrationSqlExists) {
  const sql = fs.readFileSync(migrationSqlPath, 'utf8');

  assertCheck('btree_gist extension enabled', sql.includes('CREATE EXTENSION IF NOT EXISTS btree_gist;'));
  assertCheck('Single-row admin CHECK constraint present', sql.includes('check_admins_single_row'));
  assertCheck('Single-row hotel_settings CHECK constraint present', sql.includes('check_hotel_settings_single_row'));
  assertCheck('Single-row system_health CHECK constraint present', sql.includes('check_system_health_single_row'));
  assertCheck('no_overlapping_active_bookings exclusion constraint present', sql.includes('no_overlapping_active_bookings'));
  
  // Maintenance & Status Protection
  assertCheck('Maintenance room allocation protection trigger with FOR SHARE lock present', 
    sql.includes('trg_check_room_maintenance') && sql.includes('FOR SHARE')
  );
  assertCheck('Room status transition protection trigger (prevent AVAILABLE and MAINTENANCE while occupied) present', 
    sql.includes('trg_protect_room_status_transitions') && sql.includes('protect_room_status_transitions')
  );
  
  // Room Status Synchronization
  assertCheck('Transaction-safe room status synchronization trigger present', sql.includes('trg_sync_room_status_from_booking'));
  assertCheck('Room status sync preserves MAINTENANCE', sql.includes('"room_status" != \'MAINTENANCE\''));
  assertCheck('Room status sync checks active checked-in stays before releasing', sql.includes('"booking_status" = \'CHECKED_IN\''));
  
  // Primary Guest Consistency
  assertCheck('Unique primary guest partial index present', sql.includes('unique_primary_guest_per_booking'));
  assertCheck('Primary guest synchronization trigger with recursion guard present', 
    sql.includes('trg_sync_primary_booking_guest') && sql.includes('pg_trigger_depth() > 2')
  );
  assertCheck('Primary guest protection trigger with cascade-safe bypass present', 
    sql.includes('trg_protect_primary_booking_guest') && sql.includes('pg_trigger_depth() > 1')
  );
  
  // Booking Integrity
  assertCheck('Booking CHECKED_IN timestamp consistency constraint present', sql.includes('check_checked_in_timestamp'));
  assertCheck('Valid check-in/check-out sequence constraint present', sql.includes('check_booking_dates'));
  
  // Financial Constraints & Critical Bug Fix
  assertCheck('Item unit_price non-negative check present (Bug Fix: unit_price not price)', 
    sql.includes('ALTER TABLE "items" ADD CONSTRAINT "check_item_price_positive" CHECK ("unit_price" >= 0);')
  );
  assertCheck('Positive room rates CHECK constraint present', sql.includes('check_room_price_positive'));
  assertCheck('Positive item price and quantity CHECK constraint present', sql.includes('check_item_amounts_positive'));
  assertCheck('Invoice balance and non-negative amount constraint present', sql.includes('balance_amount" >= 0') && sql.includes('total_paid" <= "total_amount"'));
  assertCheck('Invoice balance mathematical relationship constraint present (balance = total - paid)', 
    sql.includes('check_invoice_balance_relationship') && sql.includes('"balance_amount" = ("total_amount" - "total_paid")')
  );
  assertCheck('Valid invoice discount (0-100%, NULL-safe) CHECK constraint present', 
    sql.includes('"discount_type" IS NULL') && sql.includes('discount_value" <= 100') && sql.includes('discount_amount" >= 0')
  );
  assertCheck('Positive payment amount CHECK constraint present', sql.includes('check_payment_amount_positive'));
  assertCheck('Valid payroll period (month 1-12, year 2000-2100) CHECK constraint present', sql.includes('check_payroll_period_valid'));
  assertCheck('Salary record net salary and non-negative balance constraint present', sql.includes('balance_amount" >= 0') && sql.includes('total_paid" <= "net_salary"'));
  assertCheck('Salary balance mathematical relationship constraint present (balance = net - paid)', 
    sql.includes('check_salary_balance_relationship') && sql.includes('"balance_amount" = ("net_salary" - "total_paid")')
  );
  assertCheck('Salary days and deductions non-negative constraint present', 
    sql.includes('check_salary_days_and_deductions')
  );
  assertCheck('Staff advance recovery limit (recovered <= amount) CHECK constraint present', 
    sql.includes('"amount" > 0 AND "recovered_amount" >= 0 AND "recovered_amount" <= "amount"')
  );

  // Reproducible SQL Test Suite Check
  const testSqlPath = path.join(__dirname, '../scripts/test-database-integrity.sql');
  assertCheck('Reproducible PostgreSQL 16 SQL test suite exists', fs.existsSync(testSqlPath), testSqlPath);
}

// Summary
console.log('\n====================================================================');
console.log(`   AUDIT COMPLETE: ${passedChecks}/${totalChecks} Checks Passed (${Math.round((passedChecks / totalChecks) * 100)}%)`);
console.log('====================================================================\n');

if (passedChecks === totalChecks) {
  process.exit(0);
} else {
  process.exit(1);
}
