import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const testUser = await prisma.user.upsert({
    where: { email: 'admin@talentsync.ai' },
    update: {},
    create: {
      email: 'admin@talentsync.ai',
      name: 'System Admin',
      password: 'hashedpassword123', // You'll replace this with bcrypt later
    },
  });

  console.log('Seeded initial admin user:', testUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });