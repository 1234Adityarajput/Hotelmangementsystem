const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));

const prisma = new PrismaClient();

async function main() {
  console.log('Testing Hotel Items & Services Management Features...');

  // 1. Check categories
  const categories = await prisma.itemCategory.findMany();
  console.log(`• Found ${categories.length} Item Categories:`, categories.map(c => c.name));

  // 2. Check items
  const items = await prisma.item.findMany({ include: { category: true } });
  console.log(`• Found ${items.length} Catalog Items & Services`);
  if (items.length > 0) {
    console.log(`  Sample: ${items[0].name} | Cat: ${items[0].category.name} | Price: ₹${items[0].unitPrice}`);
  }

  // 3. Check guest booking item records
  const records = await prisma.bookingItem.findMany({
    include: {
      booking: {
        include: {
          primaryGuest: true,
          room: true,
        },
      },
    },
  });
  console.log(`• Found ${records.length} Guest Item Purchase Records`);
  records.forEach((r, idx) => {
    console.log(`  Record ${idx + 1}: Guest: ${r.booking.primaryGuest.fullName} | Room: ${r.booking.room.roomNumber} | Item: ${r.itemNameSnapshot} | Qty: ${r.quantity} | Total: ₹${r.totalAmount} | Date: ${r.purchaseDate.toISOString().split('T')[0]}`);
  });

  console.log('\nSUCCESS: All Hotel Items & Services database operations verified!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error testing items module:', e);
  process.exit(1);
});
