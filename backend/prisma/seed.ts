// ============================================================================
// SAFE & IDEMPOTENT DATABASE SEED SCRIPT – HOTEL MANAGEMENT SOFTWARE
// Architecture: Modular Monolith
// Database Owner: Developer 1
// ============================================================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('--- Starting Safe & Idempotent Database Seed ---');

  // 1. Seed or Verify Single Admin Account
  const existingAdmin = await prisma.admin.findFirst();
  if (!existingAdmin) {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hotel.com';
    let adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'FATAL SECURITY VIOLATION: ADMIN_PASSWORD environment variable must be explicitly defined in production. Plaintext fallback is forbidden.',
        );
      }
      adminPassword = 'Admin@Hotel2026!';
      console.warn(
        '⚠️ WARNING: ADMIN_PASSWORD not set in environment. Using fallback development password. Do NOT use in production.',
      );
    }

    console.log(`Creating initial single Admin account (${adminUsername})...`);
    const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

    await prisma.admin.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        isActive: true,
      },
    });
    console.log('✔ Initial Admin account created successfully.');
  } else {
    console.log(
      `✔ Admin account already exists (username: ${existingAdmin.username}). Preserving existing credentials.`,
    );
  }

  // 2. Default Hotel Settings (Singleton record with ID: "default")
  await prisma.hotelSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      hotelName: 'Grand Horizon Hotel & Suites',
      hotelAddress: '100 Beach Road, Civil Lines',
      mobileNumber: '+91 98765 43210',
      email: 'contact@grandhorizonhotel.com',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      defaultCheckInTime: '12:00 PM',
      defaultCheckOutTime: '11:00 AM',
      taxEnabled: true,
      defaultTaxPercentage: 12.00,
      defaultSalaryDays: 30,
    },
  });
  console.log('✔ Default Hotel Settings verified/upserted.');

  // 3. Default Room Types
  const defaultRoomTypes = [
    {
      name: 'Standard Non-AC Room',
      description: 'Comfortable budget room with queen bed, ceiling fan, attached bathroom, and Wi-Fi.',
      defaultPricePerNight: 1200.00,
      capacity: 2,
    },
    {
      name: 'Deluxe AC Room',
      description: 'Air-conditioned room with king bed, smart TV, hot water, work desk, and room service.',
      defaultPricePerNight: 2000.00,
      capacity: 2,
    },
    {
      name: 'Super Deluxe AC Room',
      description: 'Spacious room with balcony view, mini-fridge, tea/coffee maker, and premium linen.',
      defaultPricePerNight: 3200.00,
      capacity: 3,
    },
    {
      name: 'Executive Family Suite',
      description: 'Large two-room suite with living area, two bathrooms, sofa set, and luxury amenities.',
      defaultPricePerNight: 5500.00,
      capacity: 4,
    },
  ];

  for (const rt of defaultRoomTypes) {
    await prisma.roomType.upsert({
      where: { name: rt.name },
      update: {},
      create: {
        name: rt.name,
        description: rt.description,
        defaultPricePerNight: rt.defaultPricePerNight,
        capacity: rt.capacity,
        isActive: true,
      },
    });
  }
  console.log(`✔ Default Room Types verified (${defaultRoomTypes.length} types).`);

  // 4. Default Item & Service Categories
  const defaultItemCategories = [
    { name: 'Food & Dining', description: 'Restaurant dishes, breakfast, snacks, and dining hall orders' },
    { name: 'Beverages & Minibar', description: 'Bottled water, tea, coffee, soft drinks, and packaged juices' },
    { name: 'Laundry & Dry Cleaning', description: 'Washing, ironing, and express dry cleaning services' },
    { name: 'Extra Bed & Linen', description: 'Additional mattresses, pillows, blankets, and towels' },
    { name: 'Travel & Transport', description: 'Airport pickup, railway transfers, and local sightseeing cabs' },
    { name: 'Miscellaneous Services', description: 'Late check-out charge, room decoration, and ad-hoc services' },
  ];

  for (const cat of defaultItemCategories) {
    await prisma.itemCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: cat.description,
        isActive: true,
      },
    });
  }
  console.log(`✔ Default Item Categories verified (${defaultItemCategories.length} categories).`);

  // 5. Default Expense Categories
  const defaultExpenseCategories = [
    { name: 'Electricity & Power', description: 'Monthly electricity board bills, diesel generator fuel' },
    { name: 'Water & Utilities', description: 'Municipal water supply, water tanker purchases, sewage fees' },
    { name: 'Maintenance & Repairs', description: 'Plumbing, electrical repairs, carpentry, AC servicing, painter work' },
    { name: 'Housekeeping & Toiletries', description: 'Cleaning chemicals, soaps, shampoos, detergents, dusters' },
    { name: 'Food & Kitchen Provisions', description: 'Vegetables, milk, groceries, LPG commercial cylinders' },
    { name: 'Internet, Cable & Telecom', description: 'Broadband Wi-Fi connection, intercom maintenance, DTH/cable TV' },
    { name: 'Staff Welfare & Uniforms', description: 'Staff meals, tea, staff medical aid, staff uniforms' },
    { name: 'Stationery & Printing', description: 'Register books, billing stationery, keycards, guest bill paper' },
    { name: 'Marketing & Commissions', description: 'Local listings, signage boards, travel agent commissions' },
    { name: 'Miscellaneous Expenses', description: 'Unforeseen day-to-day administrative petty cash expenses' },
  ];

  for (const exp of defaultExpenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: exp.name },
      update: {},
      create: {
        name: exp.name,
        description: exp.description,
        isActive: true,
      },
    });
  }
  console.log(`✔ Default Expense Categories verified (${defaultExpenseCategories.length} categories).`);

  // 6. System Health Baseline Ping
  await prisma.systemHealth.upsert({
    where: { id: 'system' },
    update: { status: 'healthy', updatedAt: new Date() },
    create: { id: 'system', status: 'healthy' },
  });
  console.log('✔ System Health baseline verified.');

  console.log('--- Database Seed Finished Successfully (No Fake Transactions Seeded) ---');
}

main()
  .catch((e) => {
    console.error('Error during database seed execution:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
