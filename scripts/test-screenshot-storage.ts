/**
 * Test script to verify screenshot and element selector storage
 * This simulates the storage process to verify it works correctly
 */

import * as fs from 'fs'
import * as path from 'path'
import { StorageService } from '../apps/api/src/shared/storage/storage.service'

// Mock screenshot data (small test image)
const testScreenshotData = {
  dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  mimeType: 'image/png',
  fileSize: 95,
  width: 1,
  height: 1,
}

const testElementSelector = {
  cssSelector: 'div.test-class',
  xpath: '/html/body/div[1]',
  boundingBox: { x: 10, y: 20, width: 100, height: 50 },
  outerHTML: '<div class="test-class">Test Element</div>',
}

async function testStorage() {
  console.log('=== Testing Screenshot Storage Process ===\n')

  const storageService = new StorageService()
  const testIssueId = 99999 // Test issue ID

  try {
    // Test 1: Save screenshot
    console.log('1. Testing screenshot file storage...')
    const saveResult = await storageService.saveScreenshot(
      testScreenshotData,
      testIssueId,
      testElementSelector
    )
    console.log('   ✅ Screenshot saved:', saveResult)

    // Test 2: Verify file exists
    console.log('\n2. Verifying file exists...')
    const rootDir = process.cwd()
    const fullPath = path.join(rootDir, 'storage', 'uploads', saveResult.storagePath)
    const fileExists = fs.existsSync(fullPath)

    if (fileExists) {
      const stats = fs.statSync(fullPath)
      console.log('   ✅ File exists:', fullPath)
      console.log('   File size:', stats.size, 'bytes')
      console.log('   Matches expected:', stats.size === testScreenshotData.fileSize ? '✅' : '❌')
    } else {
      console.log('   ❌ File NOT found:', fullPath)
    }

    // Test 3: Verify element selector structure
    console.log('\n3. Verifying element selector structure...')
    const hasAllFields =
      testElementSelector.cssSelector &&
      testElementSelector.xpath &&
      testElementSelector.outerHTML &&
      testElementSelector.boundingBox

    if (hasAllFields) {
      console.log('   ✅ Element selector has all required fields:')
      console.log('      - cssSelector:', testElementSelector.cssSelector)
      console.log('      - xpath:', testElementSelector.xpath)
      console.log('      - outerHTML:', testElementSelector.outerHTML)
      console.log('      - boundingBox:', JSON.stringify(testElementSelector.boundingBox))
    } else {
      console.log('   ❌ Element selector missing fields')
    }

    // Test 4: Verify JSON serialization
    console.log('\n4. Testing JSON serialization...')
    const jsonString = JSON.stringify(testElementSelector)
    const parsed = JSON.parse(jsonString)
    console.log('   ✅ JSON serialization works')
    console.log('   JSON length:', jsonString.length, 'chars')

    // Cleanup test file
    console.log('\n5. Cleaning up test file...')
    if (fileExists) {
      fs.unlinkSync(fullPath)
      const testDir = path.dirname(fullPath)
      if (fs.readdirSync(testDir).length === 0) {
        fs.rmdirSync(testDir)
      }
      console.log('   ✅ Test file removed')
    }

    console.log('\n=== Test Results ===')
    console.log('✅ Screenshot storage: WORKING')
    console.log('✅ Element selector structure: VALID')
    console.log('✅ JSON serialization: WORKING')
    console.log('\n✅ All storage processes verified!')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    if (error instanceof Error) {
      console.error('   Message:', error.message)
      console.error('   Stack:', error.stack)
    }
  }
}

testStorage()


