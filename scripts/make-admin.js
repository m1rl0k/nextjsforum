const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    const email = 'admin@admin.com';
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      console.log('\nAvailable users:');
      const users = await prisma.user.findMany({
        select: { id: true, email: true, username: true, role: true }
      });
      console.table(users);
      process.exit(1);
    }

    // Update user to ADMIN role
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });

    console.log('✅ User updated successfully!');
    console.log('\nAdmin User Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID:       ${updatedUser.id}`);
    console.log(`Email:    ${updatedUser.email}`);
    console.log(`Username: ${updatedUser.username}`);
    console.log(`Role:     ${updatedUser.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎉 You can now login and access admin features!');

  } catch (error) {
    console.error('Error making user admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();

