import { PrismaClient } from '@prisma/client'

const DEFAULT_LANGUAGES = [
  {
    code: 'th',
    name: 'ไทย',
    sequence: 1,
    isDefault: true,
  },
  {
    code: 'en',
    name: 'English',
    sequence: 2,
    isDefault: false,
  },
]

export async function seedSettings(prisma: PrismaClient) {
  console.log('🌱 Seeding settings...')

  // Check if Setting model exists in Prisma client
  if (!prisma.setting) {
    throw new Error('Setting model not found in Prisma client. Please run: pnpm db:generate')
  }

  const setting = await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      rightClick: false,
      grayscale: false,
    },
  })

  for (const language of DEFAULT_LANGUAGES) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: {
        name: language.name,
        sequence: language.sequence,
        isDefault: language.isDefault,
        status: true,
        settingId: setting.id,
      },
      create: {
        code: language.code,
        name: language.name,
        sequence: language.sequence,
        isDefault: language.isDefault,
        status: true,
        settingId: setting.id,
      },
    })
  }

  console.log('✅ Settings & languages seeded')
}


