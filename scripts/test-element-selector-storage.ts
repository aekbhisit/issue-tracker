/**
 * Test script to verify element selector storage
 * Run with: npx tsx scripts/test-element-selector-storage.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testElementSelectorStorage() {
  console.log('=== Testing Element Selector Storage ===\n')

  try {
    // Check recent screenshots
    const recentScreenshots = await prisma.issueScreenshot.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        issue: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    console.log(`Found ${recentScreenshots.length} recent screenshots\n`)

    if (recentScreenshots.length === 0) {
      console.log('❌ No screenshots found in database')
      return
    }

    let hasElementSelector = 0
    let missingElementSelector = 0

    for (const screenshot of recentScreenshots) {
      const hasSelector = screenshot.elementSelector !== null
      
      if (hasSelector) {
        hasElementSelector++
        const selector = screenshot.elementSelector as any
        console.log(`✅ Screenshot #${screenshot.id} (Issue #${screenshot.issueId}: ${screenshot.issue.title})`)
        console.log(`   - CSS Selector: ${selector.cssSelector?.substring(0, 50)}...`)
        console.log(`   - XPath: ${selector.xpath?.substring(0, 50)}...`)
        console.log(`   - Outer HTML Length: ${selector.outerHTML?.length || 0} chars`)
        console.log(`   - Bounding Box: ${JSON.stringify(selector.boundingBox)}`)
        console.log('')
      } else {
        missingElementSelector++
        console.log(`❌ Screenshot #${screenshot.id} (Issue #${screenshot.issueId}: ${screenshot.issue.title})`)
        console.log(`   - Element selector: NULL`)
        console.log(`   - Storage path: ${screenshot.storagePath}`)
        console.log('')
      }
    }

    console.log('\n=== Summary ===')
    console.log(`Total screenshots: ${recentScreenshots.length}`)
    console.log(`With element selector: ${hasElementSelector}`)
    console.log(`Without element selector: ${missingElementSelector}`)
    console.log(`Percentage with selector: ${((hasElementSelector / recentScreenshots.length) * 100).toFixed(1)}%`)

    // Check specific issue if provided
    const issueId = process.argv[2]
    if (issueId) {
      const issueNum = parseInt(issueId, 10)
      console.log(`\n=== Checking Issue #${issueNum} ===`)
      
      const issueScreenshots = await prisma.issueScreenshot.findMany({
        where: { issueId: issueNum },
        include: {
          issue: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })

      if (issueScreenshots.length === 0) {
        console.log(`❌ No screenshots found for issue #${issueNum}`)
      } else {
        issueScreenshots.forEach((screenshot) => {
          console.log(`\nScreenshot #${screenshot.id}:`)
          console.log(`  Storage Path: ${screenshot.storagePath}`)
          console.log(`  Element Selector: ${screenshot.elementSelector ? 'EXISTS' : 'NULL'}`)
          
          if (screenshot.elementSelector) {
            const selector = screenshot.elementSelector as any
            console.log(`  CSS Selector: ${selector.cssSelector}`)
            console.log(`  XPath: ${selector.xpath}`)
            console.log(`  Outer HTML: ${selector.outerHTML?.substring(0, 200)}...`)
            console.log(`  Bounding Box: ${JSON.stringify(selector.boundingBox)}`)
          }
        })
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testElementSelectorStorage()


