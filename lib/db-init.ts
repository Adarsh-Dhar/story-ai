import { PrismaClient } from '@/lib/generated/prisma';
import fs from 'fs';
import path from 'path';

// Check if SQLite database exists, if not create it
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const dbExists = fs.existsSync(dbPath);

// Initialize PrismaClient
const prisma = new PrismaClient();

export async function initDatabase() {
  if (!dbExists) {
    console.log('SQLite database not found, initializing...');
    
    try {
      // Create an empty file for SQLite
      fs.writeFileSync(dbPath, '');
      console.log('SQLite database file created');
      
      // Create tables using Prisma
      // This is a simplified approach - normally you would use prisma migrate
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Chat" (
          "id" TEXT PRIMARY KEY,
          "title" TEXT NOT NULL
        );
      `;
      
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Message" (
          "id" TEXT PRIMARY KEY,
          "question" TEXT NOT NULL,
          "answer" TEXT NOT NULL,
          "transactionId" TEXT,
          "beforeBalance" REAL,
          "afterBalance" REAL,
          "chatId" TEXT NOT NULL,
          FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE
        );
      `;
      
      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }
  
  return prisma;
}

export { prisma };
