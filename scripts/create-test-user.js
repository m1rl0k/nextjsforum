const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create a test admin user
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
      displayName: 'Administrator',
      bio: 'Forum Administrator'
    }
  });

  console.log('✅ Test admin user created!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Email: admin@example.com');
  console.log('  Password: Admin123!');
  console.log('');
  console.log('Go to: http://localhost:3000/login');
}

main()
  .catch((e) => {
    console.error('Error creating test user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

