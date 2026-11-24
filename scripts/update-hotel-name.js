const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.hotelSetting.upsert({
    where: { id: 'default' },
    update: {
      hotelName: 'Hotel Radha Palace',
      email: 'info@hotelradhapalace.com',
    },
    create: {
      id: 'default',
      hotelName: 'Hotel Radha Palace',
      email: 'info@hotelradhapalace.com',
      hotelAddress: 'Hotel Radha Palace, Main Road',
      mobileNumber: '+91 9876543210',
      currencyCode: 'INR',
      timezone: 'Asia/Kolkata',
      defaultCheckInTime: '12:00 PM',
      defaultCheckOutTime: '11:00 AM',
      taxEnabled: true,
      defaultTaxPercentage: 12.0,
      defaultSalaryDays: 30,
    },
  });
  console.log('Successfully updated Hotel Name in Neon Database:', result.hotelName);
}

main().catch(console.error).finally(() => prisma.$disconnect());
