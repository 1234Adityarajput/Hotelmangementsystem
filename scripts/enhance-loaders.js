const fs = require('fs');
const path = require('path');

const pageLoaders = {
  'frontend/src/app/advances/page.tsx': {
    target: /<LoadingSpinner className="w-6 h-6 text-\[#C4A06A\]" \/>/g,
    replace: '<LoadingSpinner text="Loading Staff Advances & Recoveries..." subtext="Retrieving employee advance vouchers and balances..." />',
  },
  'frontend/src/app/attendance/page.tsx': {
    target: /<LoadingSpinner className="w-8 h-8 text-\[#C4A06A\] mb-2" \/>/g,
    replace: '<LoadingSpinner text="Loading Attendance Ledgers..." subtext="Retrieving employee muster roll and shift logs..." />',
  },
  'frontend/src/app/audit-logs/page.tsx': {
    target: /<LoadingSpinner \/>/g,
    replace: '<LoadingSpinner text="Loading System Audit Trail..." subtext="Retrieving security and mutation event records..." />',
  },
  'frontend/src/app/billing/page.tsx': {
    target: /<LoadingSpinner className="w-7 h-7 text-\[#C4A06A\]" \/>/g,
    replace: '<LoadingSpinner text="Computing Automatic Billings..." subtext="Aggregating room nights, consumed amenities, and payment folios..." />',
  },
  'frontend/src/app/bookings/page.tsx': {
    target: /<LoadingSpinner className="w-6 h-6 text-\[#C4A06A\]" \/>/g,
    replace: '<LoadingSpinner text="Loading Reservations & Bookings..." subtext="Retrieving upcoming reservations and advance allocations..." />',
  },
  'frontend/src/app/expenses/page.tsx': {
    target: /<LoadingSpinner className="w-7 h-7 text-\[#C4A06A\]" \/>/g,
    replace: '<LoadingSpinner text="Loading Hotel Operating Expenses..." subtext="Retrieving operational disbursements and categories..." />',
  },
  'frontend/src/app/guests/page.tsx': {
    target: /<LoadingSpinner className="w-7 h-7 text-\[#C4A06A\]" \/>/g,
    replace: '<LoadingSpinner text="Loading Guest Profiles & Identities..." subtext="Retrieving guest directory and stay histories..." />',
  },
  'frontend/src/app/invoices/page.tsx': {
    target: /<LoadingSpinner className="w-6 h-6 text-\[#C4A06A\]" \/>/g,
    replace: '<LoadingSpinner text="Loading Billing Invoices & Folios..." subtext="Retrieving tax invoices, GST breakdowns, and balances..." />',
  },
  'frontend/src/app/items/page.tsx': {
    target: /<LoadingSpinner className="w-7 h-7 text-\[#C4A06A\]" \/>/g,
    replace: '<LoadingSpinner text="Loading Hotel Items & Services Catalog..." subtext="Retrieving restaurant menus, room service, and amenities..." />',
  },
  'frontend/src/app/payments/page.tsx': {
    target: /<LoadingSpinner className="w-7 h-7 text-\[#C4A06A\]" \/>/g,
    replace: '<LoadingSpinner text="Loading Payment Collections Ledger..." subtext="Retrieving Cash, UPI, and Bank settlements..." />',
  },
  'frontend/src/app/payroll/page.tsx': {
    target: /<LoadingSpinner className="w-8 h-8 text-\[#C4A06A\] mb-2" \/>/g,
    replace: '<LoadingSpinner text="Computing Staff Payroll & Salaries..." subtext="Calculating earned attendance pay and net salary structures..." />',
  },
  'frontend/src/app/registers/page.tsx': {
    target: /<LoadingSpinner className="w-7 h-7 text-\[#C4A06A\]" \/>/g,
    replace: '<LoadingSpinner text="Compiling Statutory Digital Register..." subtext="Generating certified hotel digital records..." />',
  },
  'frontend/src/app/rooms/page.tsx': {
    target: /<LoadingSpinner className="w-7 h-7 text-\[#C4A06A\]" \/>/g,
    replace: '<LoadingSpinner text="Loading Room Inventory & Floors..." subtext="Retrieving room statuses, pricing tiers, and occupancy..." />',
  },
  'frontend/src/app/settings/page.tsx': {
    target: /<LoadingSpinner className="w-8 h-8 text-\[#B08A60\]" \/>/g,
    replace: '<LoadingSpinner text="Loading Hotel Operational Settings..." subtext="Retrieving property operational policies..." />',
  },
  'frontend/src/app/staff/page.tsx': {
    target: /<LoadingSpinner className="w-8 h-8 text-\[#C4A06A\] mb-2" \/>/g,
    replace: '<LoadingSpinner text="Loading Staff Directory & Personnel..." subtext="Retrieving employee roster, departments, and designations..." />',
  },
};

Object.entries(pageLoaders).forEach(([relPath, { target, replace }]) => {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf-8');
  if (target.test(content)) {
    content = content.replace(target, replace);
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✓ Enhanced loading state in ${relPath}`);
  }
});
