#!/usr/bin/env tsx
// Run with: npx tsx scripts/seed-admin.ts
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMINS = [
  {
    username: 'admin',
    password: 'admin123', // CHANGE IN PRODUCTION
    role: 'admin',
    name: 'Admin',
    email: 'admin@cwrite.hk',
    canExportData: true,
  },
  {
    username: 'nicole',
    password: 'nicole2024',
    role: 'teacher',
    name: 'Ms. Nicole',
    email: 'nicole@cwrite.hk',
    assignedClass: 'P3',
    canExportData: true,
  },
  {
    username: 'miss_wong',
    password: 'wong2024',
    role: 'teacher',
    name: 'Miss Wong',
    email: 'wong@cwrite.hk',
    assignedClass: 'P4',
    canExportData: false,
  },
]

async function main() {
  console.log('🔑 Seeding admin accounts...\n')

  for (const admin of ADMINS) {
    const passwordHash = await bcrypt.hash(admin.password, 12)

    const created = await prisma.admin.upsert({
      where: { username: admin.username },
      update: {
        passwordHash,
        role: admin.role,
        name: admin.name,
        email: admin.email,
        assignedClass: admin.assignedClass ?? null,
        canExportData: admin.canExportData,
      },
      create: {
        username: admin.username,
        passwordHash,
        role: admin.role,
        name: admin.name,
        email: admin.email,
        assignedClass: admin.assignedClass ?? null,
        canExportData: admin.canExportData,
      },
    })

    console.log(`  ✅ ${created.username} (${created.role})${created.assignedClass ? ` — Class: ${created.assignedClass}` : ''}`)
    console.log(`     → Password: ${admin.password}`)
    console.log()
  }

  console.log('Done. Log in to Admin at /admin/login')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
