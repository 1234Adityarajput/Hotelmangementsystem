const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding luxury hotel catalog items and categories for Automatic Guest Billing...');

  // 1. Categories
  const categoryDefs = [
    { name: 'Food & Dining', description: 'Restaurant, room breakfast, lunch and gourmet dinners' },
    { name: 'Beverages & Minibar', description: 'Gourmet coffees, teas, bottled mineral waters and juices' },
    { name: 'Laundry & Dry Cleaning', description: 'In-house garment pressing, wash, fold and dry cleaning' },
    { name: 'Extra Bed & Linen', description: 'Extra rollaway beds, cribs, mattress and plush linen' },
    { name: 'Room Service & In-Room Dining', description: 'In-room service tray delivery and culinary orders' },
    { name: 'Travel & Transport', description: 'Airport transfers, chauffeured cabs and local transit' },
    { name: 'Other Hotel Services', description: 'Spa therapies, banquet facilities, and business center' },
    { name: 'Additional Items & Sundries', description: 'Sundries, extra amenities, toiletries and incidentals' },
  ];

  const categoryMap = {};

  for (const cat of categoryDefs) {
    const existing = await prisma.itemCategory.findUnique({ where: { name: cat.name } });
    if (!existing) {
      const created = await prisma.itemCategory.create({
        data: { name: cat.name, description: cat.description, isActive: true },
      });
      categoryMap[cat.name] = created.id;
      console.log(`+ Created category: ${cat.name}`);
    } else {
      categoryMap[cat.name] = existing.id;
    }
  }

  // 2. Items
  const itemDefs = [
    // Food & Dining
    { cat: 'Food & Dining', name: 'Continental Breakfast Buffet', price: 450, desc: 'Fresh fruits, bakery, eggs to order and juice' },
    { cat: 'Food & Dining', name: 'Club Sandwich & Crispy Fries', price: 320, desc: 'Triple-decker toasted sandwich with fries' },
    { cat: 'Food & Dining', name: 'Classic Margherita Pizza (10")', price: 480, desc: 'Wood-fired sourdough with fresh basil and mozzarella' },
    { cat: 'Food & Dining', name: 'Butter Chicken & Naan Platter', price: 550, desc: 'Mughlai gravy with two butter naans' },
    { cat: 'Food & Dining', name: "Chef's Dal Makhani & Jeera Rice", price: 420, desc: 'Slow-cooked black lentils with fragrant rice' },

    // Beverages & Minibar
    { cat: 'Beverages & Minibar', name: 'Espresso / Cappuccino Coffee', price: 180, desc: 'Freshly ground arabica beans' },
    { cat: 'Beverages & Minibar', name: 'Himalayan Mineral Water (1L)', price: 90, desc: 'Premium packaged natural spring water' },
    { cat: 'Beverages & Minibar', name: 'Fresh Seasonal Orange Juice', price: 220, desc: '100% pure cold-pressed citrus juice' },
    { cat: 'Beverages & Minibar', name: 'Premium Darjeeling Tea Pot', price: 160, desc: 'First flush single-estate loose leaves' },

    // Laundry & Dry Cleaning
    { cat: 'Laundry & Dry Cleaning', name: 'Executive Shirt Laundry & Press', price: 120, desc: 'Steam pressed and hung on wooden hanger' },
    { cat: 'Laundry & Dry Cleaning', name: 'Trouser Dry Cleaning', price: 180, desc: 'Gentle dry clean and crease pressing' },
    { cat: 'Laundry & Dry Cleaning', name: '2-Piece Formal Suit Dry Clean', price: 450, desc: 'Blazer and matching trousers dry cleaning' },
    { cat: 'Laundry & Dry Cleaning', name: 'Express Same-Day Laundry Service', price: 300, desc: 'Priority turnaround within 4 hours' },

    // Extra Bed & Linen
    { cat: 'Extra Bed & Linen', name: 'Extra Rollaway Bed with Premium Mattress', price: 800, desc: 'Full-size orthopaedic rollaway bed setup' },
    { cat: 'Extra Bed & Linen', name: 'Extra Plush Pillow & Duvet Set', price: 200, desc: 'Microfiber hypoallergenic pillow and comforter' },
    { cat: 'Extra Bed & Linen', name: 'Baby Crib / Cot Setup', price: 350, desc: 'Safe padded crib with sanitized linen' },

    // Room Service
    { cat: 'Room Service & In-Room Dining', name: 'Room Service Late Night Delivery Charge', price: 150, desc: 'Dedicated room tray delivery fee' },
    { cat: 'Room Service & In-Room Dining', name: 'Luxury In-Room Dining Table Setup', price: 250, desc: 'Fine dining setup with silver cutlery & candle' },

    // Travel & Transport / Other Services
    { cat: 'Travel & Transport', name: 'Airport Pick-up / Drop Sedan', price: 1500, desc: 'Air-conditioned sedan airport transit' },
    { cat: 'Travel & Transport', name: 'Chauffeured City Cab (4 Hours)', price: 2200, desc: 'Local sightseeing with verified driver' },
    { cat: 'Other Hotel Services', name: 'Spa & Herbal Aromatherapy (60 Mins)', price: 2800, desc: 'Full body relaxing essential oil massage' },

    // Additional Items & Sundries
    { cat: 'Additional Items & Sundries', name: 'Late Check-out Fee (per hour)', price: 500, desc: 'Extended stay authorization past 11:00 AM' },
    { cat: 'Additional Items & Sundries', name: 'Sundries & Luxury Toiletries Kit', price: 250, desc: 'Organic shampoo, moisturizer and dental kit' },
  ];

  for (const it of itemDefs) {
    const categoryId = categoryMap[it.cat] || Object.values(categoryMap)[0];
    const existing = await prisma.item.findFirst({
      where: { name: it.name, categoryId },
    });
    if (!existing) {
      await prisma.item.create({
        data: {
          categoryId,
          name: it.name,
          unitPrice: it.price,
          description: it.desc,
          isActive: true,
        },
      });
      console.log(`+ Created item: ${it.name} (₹${it.price})`);
    }
  }

  console.log('Seeding completed successfully!');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error seeding billing items:', e);
  process.exit(1);
});
