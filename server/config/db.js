const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected successfully via Prisma');
  } catch (error) {
    console.error('PostgreSQL connection failed:', error.message);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

module.exports = { connectDB, prisma };
