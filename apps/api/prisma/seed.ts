import { AvailabilityStatus, PrismaClient, SeedlingSize } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@seednest.com' },
    update: {},
    create: {
      name: 'SeedNest Admin',
      email: 'admin@seednest.com',
      emailVerified: true,
      role: 'ADMIN',
      accounts: {
        create: {
          accountId: 'admin@seednest.com',
          providerId: 'credential',
          password: adminPassword,
        },
      },
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Manager user
  const managerPassword = await bcrypt.hash('Manager@123456', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@greennest.com' },
    update: {},
    create: {
      name: 'Jane Wambua',
      email: 'manager@greennest.com',
      emailVerified: true,
      role: 'MANAGER',
      accounts: {
        create: {
          accountId: 'manager@greennest.com',
          providerId: 'credential',
          password: managerPassword,
        },
      },
    },
  });
  console.log(`✅ Manager: ${manager.email}`);

  // Nursery
  const nursery = await prisma.nursery.upsert({
    where: { id: 'seed-nursery-001' },
    update: {},
    create: {
      id: 'seed-nursery-001',
      managerId: manager.id,
      name: 'Green Nest Nursery',
      description: 'Premium tree seedlings grown with care in Nairobi.',
      address: '123 Ngong Road, Nairobi, Kenya',
      latitude: -1.2921,
      longitude: 36.8219,
      operatingHours: 'Mon–Sat 7am–6pm',
      lowStockThreshold: 5,
      careReminderDays: 14,
      isActive: true,
    },
  });
  console.log(`✅ Nursery: ${nursery.name}`);

  // Categories
  const fruitCategory = await prisma.category.upsert({
    where: { id: 'seed-cat-fruit' },
    update: {},
    create: {
      id: 'seed-cat-fruit',
      nurseryId: nursery.id,
      name: 'Fruit Trees',
      description: 'Mango, avocado, citrus, and other fruit-bearing trees.',
    },
  });

  const shadeCategory = await prisma.category.upsert({
    where: { id: 'seed-cat-shade' },
    update: {},
    create: {
      id: 'seed-cat-shade',
      nurseryId: nursery.id,
      name: 'Shade Trees',
      description: 'Fast-growing indigenous trees for shade and landscaping.',
    },
  });
  console.log(`✅ Categories: ${fruitCategory.name}, ${shadeCategory.name}`);

  // Seedlings
  const seedlings: Array<{
    id: string;
    nurseryId: string;
    categoryId: string;
    name: string;
    description: string;
    size: SeedlingSize;
    price: number;
    quantity: number;
    availabilityStatus: AvailabilityStatus;
    photos: string[];
  }> = [
    {
      id: 'seed-sdl-001',
      nurseryId: nursery.id,
      categoryId: fruitCategory.id,
      name: 'Hass Avocado',
      description: 'High-yielding grafted Hass avocado seedling. Bears fruit in 2–3 years.',
      size: SeedlingSize.BIG_POT,
      price: 350,
      quantity: 80,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      photos: [],
    },
    {
      id: 'seed-sdl-002',
      nurseryId: nursery.id,
      categoryId: fruitCategory.id,
      name: 'Apple Mango',
      description: 'Grafted Apple mango seedling. Sweet, large fruit with minimal fibre.',
      size: SeedlingSize.SMALL_POT,
      price: 200,
      quantity: 120,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      photos: [],
    },
    {
      id: 'seed-sdl-003',
      nurseryId: nursery.id,
      categoryId: shadeCategory.id,
      name: 'Nandi Flame',
      description: 'Spectacular flowering shade tree. Brilliant orange-red blooms.',
      size: SeedlingSize.SMALL_POT,
      price: 150,
      quantity: 3,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      photos: [],
    },
    {
      id: 'seed-sdl-004',
      nurseryId: nursery.id,
      categoryId: shadeCategory.id,
      name: 'Mugumo (Wild Fig)',
      description: 'Sacred indigenous fig tree. Excellent for large gardens and wildlife.',
      size: SeedlingSize.BIG_POT,
      price: 500,
      quantity: 0,
      availabilityStatus: AvailabilityStatus.OUT_OF_STOCK,
      photos: [],
    },
  ];

  for (const data of seedlings) {
    await prisma.seedling.upsert({
      where: { id: data.id },
      update: {},
      create: data,
    });
  }
  console.log(`✅ Seedlings: ${seedlings.map((s) => s.name).join(', ')}`);

  console.log('🎉 Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
