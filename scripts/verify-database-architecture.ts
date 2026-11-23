// ============================================================================
// COMPREHENSIVE DATABASE ARCHITECTURE VERIFICATION SCRIPT
// Validates Prisma DMMF, models, relationships, field types, constraints, and financial decimals.
// ============================================================================

import { Prisma } from '../backend/node_modules/@prisma/client';

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

function assertCheck(name: string, condition: boolean, detail: string = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${name} ${detail ? `(${detail})` : ''}`);
  } else {
    console.error(`  [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
  }
}

// 1. Verify Core Models Existence
console.log('--- 1. Model Coverage Verification ---');
const requiredModels = [
  'Admin', 'Guest', 'GuestDocument', 'RoomType', 'Room',
  'Booking', 'BookingGuest', 'ItemCategory', 'Item', 'BookingItem',
  'Invoice', 'Payment', 'Staff', 'Attendance', 'SalaryRecord',
  'SalaryPayment', 'ExpenseCategory', 'Expense', 'HotelSetting', 'AuditLog',
  'SystemHealth'
];

for (const modelName of requiredModels) {
  const model = models.find(m => m.name === modelName);
  assertCheck(`Model ${modelName} exists`, !!model, model ? `table: ${model.dbName || modelName}` : 'Missing');
}

// 2. Verify Single Admin Architecture
console.log('\n--- 2. Single Admin Model Verification ---');
const adminModel = models.find(m => m.name === 'Admin');
if (adminModel) {
  assertCheck('Admin has username field', adminModel.fields.some(f => f.name === 'username' && f.isUnique));
  assertCheck('Admin has passwordHash field', adminModel.fields.some(f => f.name === 'passwordHash'));
  assertCheck('Admin has isActive field', adminModel.fields.some(f => f.name === 'isActive'));
  assertCheck('Admin does NOT have role/RBAC fields', !adminModel.fields.some(f => f.name.toLowerCase().includes('role')));
}

// 3. Verify Financial Decimal Precision (No Floats)
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
  { model: 'Invoice', field: 'taxAmount' },
  { model: 'Invoice', field: 'totalAmount' },
  { model: 'Invoice', field: 'totalPaid' },
  { model: 'Invoice', field: 'balanceAmount' },
  { model: 'Payment', field: 'amount' },
  { model: 'Staff', field: 'monthlySalary' },
  { model: 'SalaryRecord', field: 'monthlyBasicSalary' },
  { model: 'SalaryRecord', field: 'grossSalary' },
  { model: 'SalaryRecord', field: 'netSalary' },
  { model: 'SalaryPayment', field: 'paymentAmount' },
  { model: 'Expense', field: 'amount' },
];

for (const check of monetaryChecks) {
  const model = models.find(m => m.name === check.model);
  const field = model?.fields.find(f => f.name === check.field);
  const isDecimal = field?.type === 'Decimal';
  assertCheck(`${check.model}.${check.field} is Decimal`, isDecimal, `type: ${field?.type}`);
}

// 4. Verify Critical Unique & Composite Constraints
console.log('\n--- 4. Constraints & Uniqueness Audit ---');
const guestModel = models.find(m => m.name === 'Guest');
assertCheck('Guest guestCode is unique', !!guestModel?.fields.find(f => f.name === 'guestCode')?.isUnique);

const roomModel = models.find(m => m.name === 'Room');
assertCheck('Room roomNumber is unique', !!roomModel?.fields.find(f => f.name === 'roomNumber')?.isUnique);

const bookingModel = models.find(m => m.name === 'Booking');
assertCheck('Booking bookingNumber is unique', !!bookingModel?.fields.find(f => f.name === 'bookingNumber')?.isUnique);

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
assertCheck('SalaryRecord has monthlyBasicSalary snapshot', !!salaryRecordModel?.fields.find(f => f.name === 'monthlyBasicSalary'));

// Summary
console.log('\n====================================================================');
console.log(`   AUDIT COMPLETE: ${passedChecks}/${totalChecks} Checks Passed (${Math.round((passedChecks / totalChecks) * 100)}%)`);
console.log('====================================================================\n');

if (passedChecks === totalChecks) {
  process.exit(0);
} else {
  process.exit(1);
}
