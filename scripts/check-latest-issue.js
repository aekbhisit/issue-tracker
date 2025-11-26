const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const latest = await prisma.issue.findFirst({
    include: { screenshots: true },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log('Latest Issue:', latest.id, latest.title);
  console.log('Screenshots:', latest.screenshots.length);
  
  if (latest.screenshots.length === 0) {
    console.log('\n❌ Screenshots not stored');
    console.log('\nPlease check your API server console logs for:');
    console.log('  [API Service] Checking for screenshot in data');
    console.log('  [API Service] Processing screenshot OR');
    console.log('  [API Service] ⚠️  No screenshot provided');
    console.log('  [API Service] ❌ FAILED to save screenshot');
  }
  
  await prisma.$disconnect();
})();
