/**
 * Verification script to check if screenshots and element selectors are stored properly
 * Run with: npx tsx scripts/verify-screenshot-storage.ts [issue_id]
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function verifyScreenshotStorage(issueId?: number) {
  console.log('=== Verifying Screenshot and Element Selector Storage ===\n')

  try {
    // Get recent issues or specific issue
    const where = issueId ? { id: issueId } : {}
    const issues = await prisma.issue.findMany({
      where,
      include: {
        screenshots: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: issueId ? 1 : 10,
    })

    if (issues.length === 0) {
      console.log(`❌ No issues found${issueId ? ` with ID ${issueId}` : ''}`)
      return
    }

    console.log(`Found ${issues.length} issue(s)\n`)

    for (const issue of issues) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`Issue #${issue.id}: ${issue.title}`)
      console.log(`Created: ${issue.createdAt}`)
      console.log(`${'='.repeat(60)}\n`)

      if (issue.screenshots.length === 0) {
        console.log('  ⚠️  No screenshots found for this issue\n')
        continue
      }

      for (const screenshot of issue.screenshots) {
        console.log(`  Screenshot #${screenshot.id}:`)
        console.log(`    Storage Path: ${screenshot.storagePath}`)
        console.log(`    Storage Type: ${screenshot.storageType}`)
        console.log(`    MIME Type: ${screenshot.mimeType || 'N/A'}`)
        console.log(`    Dimensions: ${screenshot.width || 'N/A'}x${screenshot.height || 'N/A'}`)
        console.log(`    File Size: ${screenshot.fileSize ? `${(screenshot.fileSize / 1024).toFixed(2)} KB` : 'N/A'}`)
        console.log(`    Created: ${screenshot.createdAt}`)

        // Check if file exists
        const rootDir = process.cwd()
        const fullPath = path.join(rootDir, 'storage', 'uploads', screenshot.storagePath)
        const fileExists = fs.existsSync(fullPath)
        
        if (fileExists) {
          const stats = fs.statSync(fullPath)
          console.log(`    ✅ File exists: ${fullPath}`)
          console.log(`    File size on disk: ${(stats.size / 1024).toFixed(2)} KB`)
          
          // Verify file size matches database
          if (screenshot.fileSize && Math.abs(stats.size - screenshot.fileSize) > 100) {
            console.log(`    ⚠️  WARNING: File size mismatch! DB: ${screenshot.fileSize}, Disk: ${stats.size}`)
          } else {
            console.log(`    ✅ File size matches database`)
          }
        } else {
          console.log(`    ❌ File NOT found: ${fullPath}`)
        }

        // Check element selector
        console.log(`\n    Element Selector:`)
        if (screenshot.elementSelector === null) {
          console.log(`      ❌ NULL - Element selector not stored`)
        } else {
          const selector = screenshot.elementSelector as any
          console.log(`      ✅ Element selector exists`)
          console.log(`      CSS Selector: ${selector.cssSelector ? selector.cssSelector.substring(0, 80) + '...' : 'MISSING'}`)
          console.log(`      XPath: ${selector.xpath ? selector.xpath.substring(0, 80) + '...' : 'MISSING'}`)
          console.log(`      Outer HTML Length: ${selector.outerHTML ? selector.outerHTML.length : 0} chars`)
          console.log(`      Bounding Box: ${selector.boundingBox ? JSON.stringify(selector.boundingBox) : 'MISSING'}`)
          
          // Verify all required fields
          const hasAllFields = 
            selector.cssSelector && 
            selector.xpath && 
            selector.outerHTML && 
            selector.boundingBox
          
          if (hasAllFields) {
            console.log(`      ✅ All required fields present`)
          } else {
            console.log(`      ⚠️  Missing fields:`)
            if (!selector.cssSelector) console.log(`        - cssSelector`)
            if (!selector.xpath) console.log(`        - xpath`)
            if (!selector.outerHTML) console.log(`        - outerHTML`)
            if (!selector.boundingBox) console.log(`        - boundingBox`)
          }
        }

        console.log('')
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('SUMMARY')
    console.log('='.repeat(60))
    
    const allScreenshots = issues.flatMap(i => i.screenshots)
    const withFiles = allScreenshots.filter(s => {
      const fullPath = path.join(process.cwd(), 'storage', 'uploads', s.storagePath)
      return fs.existsSync(fullPath)
    })
    const withSelectors = allScreenshots.filter(s => s.elementSelector !== null)
    
    console.log(`Total screenshots: ${allScreenshots.length}`)
    console.log(`With files on disk: ${withFiles.length} (${((withFiles.length / allScreenshots.length) * 100).toFixed(1)}%)`)
    console.log(`With element selectors: ${withSelectors.length} (${((withSelectors.length / allScreenshots.length) * 100).toFixed(1)}%)`)
    
    if (withFiles.length === allScreenshots.length && withSelectors.length === allScreenshots.length) {
      console.log('\n✅ All screenshots stored correctly!')
    } else {
      console.log('\n⚠️  Some issues detected - see details above')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

const issueId = process.argv[2] ? parseInt(process.argv[2], 10) : undefined
verifyScreenshotStorage(issueId)


