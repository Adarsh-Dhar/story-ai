import { PrismaClient } from '@/lib/generated/prisma'
import fs from 'fs'
import path from 'path'

// Check if SQLite database exists, if not create it
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
const dbExists = fs.existsSync(dbPath)

if (!dbExists) {
  console.log('SQLite database not found, creating empty file...')
  try {
    // Create an empty file for SQLite
    fs.writeFileSync(dbPath, '')
    console.log('SQLite database file created')
  } catch (error) {
    console.error('Error creating SQLite database file:', error)
  }
}

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Initialize database tables if they don't exist
prisma.$executeRaw`
  CREATE TABLE IF NOT EXISTS "Chat" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL
  );
`.catch(error => {
  console.error('Error creating Chat table:', error)
})

prisma.$executeRaw`
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
`.catch(error => {
  console.error('Error creating Message table:', error)
})