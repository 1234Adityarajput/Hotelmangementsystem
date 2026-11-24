const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const bcrypt = require('../backend/node_modules/bcrypt');

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding Owner and Manager credentials into Neon PostgreSQL...');

  const ownerPasswordHash = await bcrypt.hash('Admin@Hotel2026!', 10);
  const managerPasswordHash = await bcrypt.hash('Manager@Hotel2026!', 10);

  // 1. Upsert Owner user
  const owner = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {
      role: 'OWNER',
      email: 'admin@hotel.com',
      passwordHash: ownerPasswordHash,
      isActive: true,
      isSingleton: null,
    },
    create: {
      username: 'admin',
      email: 'admin@hotel.com',
      passwordHash: ownerPasswordHash,
      role: 'OWNER',
      isActive: true,
      isSingleton: null,
    },
  });
  console.log(`✓ Owner account verified: username="${owner.username}", role="${owner.role}"`);

  // 2. Upsert Manager user
  const manager = await prisma.admin.upsert({
    where: { username: 'manager' },
    update: {
      role: 'MANAGER',
      email: 'manager@hotel.com',
      passwordHash: managerPasswordHash,
      isActive: true,
      isSingleton: null,
    },
    create: {
      username: 'manager',
      email: 'manager@hotel.com',
      passwordHash: managerPasswordHash,
      role: 'MANAGER',
      isActive: true,
      isSingleton: null,
    },
  });
  console.log(`✓ Manager account verified: username="${manager.username}", role="${manager.role}"`);

  const allUsers = await prisma.admin.findMany();
  console.log('Total System Users:', allUsers.map((u) => ({ username: u.username, email: u.email, role: u.role })));
}

seed()
  .catch((e) => {
    console.error('Failed to seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
