// Test database storage
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStorage() {
  try {
    console.log('=== Testing Database Storage ===\n');
    
    // Get latest issues with screenshots
    const issues = await prisma.issue.findMany({
      include: {
        screenshots: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    console.log(`Found ${issues.length} recent issue(s)\n`);
    
    let totalScreenshots = 0;
    let withFiles = 0;
    let withSelectors = 0;
    
    for (const issue of issues) {
      console.log(`Issue #${issue.id}: ${issue.title}`);
      console.log(`  Screenshots: ${issue.screenshots.length}`);
      
      for (const screenshot of issue.screenshots) {
        totalScreenshots++;
        
        // Check file exists
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(process.cwd(), 'storage', 'uploads', screenshot.storagePath);
        const fileExists = fs.existsSync(filePath);
        
        if (fileExists) {
          withFiles++;
          const stats = fs.statSync(filePath);
          console.log(`    ✅ Screenshot #${screenshot.id}:`);
          console.log(`       File: ${screenshot.storagePath}`);
          console.log(`       Size: ${(stats.size / 1024).toFixed(2)} KB (DB: ${(screenshot.fileSize / 1024).toFixed(2)} KB)`);
        } else {
          console.log(`    ❌ Screenshot #${screenshot.id}: File NOT found`);
          console.log(`       Expected: ${filePath}`);
        }
        
        // Check element selector
        if (screenshot.elementSelector !== null) {
          withSelectors++;
          const selector = screenshot.elementSelector;
          console.log(`    ✅ Element Selector:`);
          console.log(`       CSS: ${selector.cssSelector?.substring(0, 60)}...`);
          console.log(`       HTML Length: ${selector.outerHTML?.length || 0} chars`);
        } else {
          console.log(`    ❌ Element Selector: NULL`);
        }
        console.log('');
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total screenshots: ${totalScreenshots}`);
    console.log(`With files: ${withFiles} (${totalScreenshots > 0 ? ((withFiles/totalScreenshots)*100).toFixed(1) : 0}%)`);
    console.log(`With selectors: ${withSelectors} (${totalScreenshots > 0 ? ((withSelectors/totalScreenshots)*100).toFixed(1) : 0}%)`);
    
    if (totalScreenshots === 0) {
      console.log('\n⚠️  No screenshots found. Submit a test issue to verify storage.');
    } else if (withFiles === totalScreenshots && withSelectors === totalScreenshots) {
      console.log('\n✅ All screenshots stored correctly!');
    } else {
      console.log('\n⚠️  Some issues detected - see details above');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testStorage();
