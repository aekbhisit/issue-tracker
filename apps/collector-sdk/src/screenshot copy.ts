/**
 * @module Screenshot Capture
 * @description Capture screenshots of DOM elements using html2canvas
 */

import html2canvas from 'html2canvas'
import type { ScreenshotData } from './types'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_DIMENSION = 4096 // 4096x4096 pixels
const DEFAULT_QUALITY = 0.85 // JPEG quality (0.8-0.9)
const DEFAULT_TIMEOUT = 30000 // 30 seconds

export interface CaptureOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  timeout?: number
}

/**
 * Calculate scale factor to fit within max dimensions
 */
function calculateScale(width: number, height: number, maxWidth: number, maxHeight: number): number {
  const scaleX = maxWidth / width
  const scaleY = maxHeight / height
  return Math.min(scaleX, scaleY, 1) // Don't upscale
}

/**
 * Convert data URL to file size in bytes
 */
function getDataUrlSize(dataUrl: string): number {
  // Approximate: base64 is ~4/3 of original size
  // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
  const base64Data = dataUrl.split(',')[1] || ''
  return Math.ceil((base64Data.length * 3) / 4)
}

/**
 * Create fallback screenshot showing element HTML/text when html2canvas fails
 */
function createFallbackScreenshot(element: HTMLElement, width: number, height: number): ScreenshotData {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(400, Math.min(width, 1200))
  canvas.height = Math.max(200, Math.min(height, 800))
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context')
  }
  
  // Light gray background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Border
  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, canvas.width, canvas.height)
  
  // Extract element text content (visible text only)
  let elementText = ''
  try {
    // Get visible text content
    elementText = element.innerText || element.textContent || ''
    // Limit length and clean up
    elementText = elementText.trim().substring(0, 2000)
    // Replace multiple spaces/newlines with single space
    elementText = elementText.replace(/\s+/g, ' ').trim()
  } catch (e) {
    elementText = 'Unable to extract element text'
  }
  
  // If no text, try to get HTML tag name and attributes
  if (!elementText || elementText.length === 0) {
    try {
      const tagName = element.tagName.toLowerCase()
      const attrs: string[] = []
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i]
        attrs.push(`${attr.name}="${attr.value.substring(0, 50)}"`)
      }
      elementText = `<${tagName}${attrs.length > 0 ? ' ' + attrs.slice(0, 3).join(' ') : ''}>`
    } catch (e) {
      elementText = 'Element content unavailable'
    }
  }
  
  // Text styling
  ctx.fillStyle = '#111827'
  ctx.font = '14px "Courier New", Courier, monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  
  // Word wrap and draw text
  const padding = 20
  const maxWidth = canvas.width - padding * 2
  const lineHeight = 20
  const words = elementText.split(' ')
  let y = padding + 20
  let line = ''
  
  for (let i = 0; i < words.length && y < canvas.height - padding; i++) {
    const testLine = line + (line ? ' ' : '') + words[i]
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, padding, y)
      line = words[i]
      y += lineHeight
    } else {
      line = testLine
    }
  }
  
  if (line && y < canvas.height - padding) {
    ctx.fillText(line, padding, y)
  }
  
  // Add header text
  ctx.fillStyle = '#6b7280'
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Element Content (Screenshot unavailable)', padding, padding)
  
  return {
    dataUrl: canvas.toDataURL('image/png'),
    mimeType: 'image/png',
    fileSize: getDataUrlSize(canvas.toDataURL('image/png')),
    width: canvas.width,
    height: canvas.height,
  }
}

/**
 * Compress image using canvas.toBlob()
 */
async function compressImage(
  canvas: HTMLCanvasElement,
  quality: number,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to compress image'))
          return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
          const dataUrl = reader.result as string
          resolve(dataUrl)
        }
        reader.onerror = () => reject(new Error('Failed to read compressed image'))
        reader.readAsDataURL(blob)
      },
      mimeType,
      quality
    )
  })
}

/**
 * Capture screenshot of a DOM element
 */
export async function captureScreenshot(
  element: HTMLElement,
  options: CaptureOptions = {}
): Promise<ScreenshotData> {
  const {
    maxWidth = MAX_DIMENSION,
    maxHeight = MAX_DIMENSION,
    quality = DEFAULT_QUALITY,
    timeout = DEFAULT_TIMEOUT,
  } = options

  // Get element dimensions
  const rect = element.getBoundingClientRect()
  const isRootElement = element === document.documentElement || element === document.body

  // For full-page captures (documentElement/body), use the visible viewport size
  // so the screenshot looks like what the user actually sees on screen,
  // instead of an extremely tall, unreadable full-document image.
  const baseWidth = isRootElement ? window.innerWidth : rect.width
  const baseHeight = isRootElement ? window.innerHeight : rect.height

  const elementWidth = Math.round(baseWidth)
  const elementHeight = Math.round(baseHeight)

  // Calculate scale if element is too large
  const scale = calculateScale(elementWidth, elementHeight, maxWidth, maxHeight)
  const targetWidth = Math.round(elementWidth * scale)
  const targetHeight = Math.round(elementHeight * scale)

  // Validate dimensions
  if (targetWidth === 0 || targetHeight === 0) {
    throw new Error('Element has zero dimensions')
  }

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Screenshot capture timed out after ${timeout}ms`))
    }, timeout)
  })

  // Capture screenshot with html2canvas
  const capturePromise = html2canvas(element, {
    useCORS: true,
    allowTaint: false,
    scale: scale,
    width: elementWidth,
    height: elementHeight,
    logging: false,
    backgroundColor: '#ffffff',
    // Normalize unsupported CSS color functions (like oklch) in the cloned DOM
    onclone: (clonedDoc: Document) => {
      try {
        const win = clonedDoc.defaultView || window
        const StyleRule = (win as any).CSSStyleRule || (window as any).CSSStyleRule
        const styleSheets = Array.from(clonedDoc.styleSheets) as CSSStyleSheet[]

        for (const sheet of styleSheets) {
          let rules: CSSRuleList
          try {
            rules = sheet.cssRules
          } catch {
            // Some stylesheets (e.g. cross-origin) may not be accessible
            continue
          }

          for (let i = 0; i < rules.length; i++) {
            const rule = rules[i]
            // Only touch regular style rules
            if (StyleRule && rule instanceof StyleRule && (rule as CSSStyleRule).style) {
              const style = (rule as CSSStyleRule).style
              for (let j = 0; j < style.length; j++) {
                const prop = style[j]
                const value = style.getPropertyValue(prop)
                if (value && value.includes('oklch(')) {
                  // Replace unsupported color with a safe fallback.
                  // We only change the color value, not layout-related properties.
                  style.setProperty(prop, '#111827', style.getPropertyPriority(prop))
                }
              }
            }
          }
        }
      } catch {
        // Best-effort normalization; ignore any errors here
      }
    },
    // Skip cross-origin iframes
    ignoreElements: (el) => {
      try {
        // Check if element is in cross-origin iframe
        if (el.ownerDocument !== document) {
          try {
            // Try to access iframe content (will throw if cross-origin)
            const iframe = el.ownerDocument.defaultView?.frameElement as HTMLIFrameElement | null
            if (iframe && iframe.contentDocument !== el.ownerDocument) {
              console.warn('Skipping cross-origin iframe content')
              return true
            }
          } catch (e) {
            console.warn('Skipping cross-origin iframe content:', e)
            return true
          }
        }
      } catch (e) {
        // Ignore errors when checking iframe
      }
      return false
    },
  })

  let canvas: HTMLCanvasElement
  try {
    // Race between capture and timeout
    canvas = await Promise.race([capturePromise, timeoutPromise])
  } catch (error: any) {
    const message = error?.message || String(error || '')

    // Handle timeout separately
    if (message.includes('timed out')) {
      throw new Error(`Screenshot capture timed out. The element may be too large or complex.`)
    }

    // html2canvas currently cannot parse some modern CSS color functions (e.g. "oklch")
    // Instead of failing, return a fallback image showing the element's text/HTML content
    if (message.includes('unsupported color function "oklch"')) {
      console.warn('Screenshot capture: falling back to element text due to unsupported color function "oklch"')
      return createFallbackScreenshot(
        element,
        targetWidth || elementWidth,
        targetHeight || elementHeight
      )
    }

    throw new Error(`Failed to capture screenshot: ${message || 'Unknown error'}`)
  }

  // Resize canvas if needed
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    const resizedCanvas = document.createElement('canvas')
    resizedCanvas.width = targetWidth
    resizedCanvas.height = targetHeight
    const ctx = resizedCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to create canvas context for resizing')
    }
    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight)
    canvas = resizedCanvas
  }

  // Compress image
  let dataUrl: string | undefined = undefined
  let fileSize: number | undefined = undefined
  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts) {
    const currentQuality = attempts === 0 ? quality : quality * (1 - attempts * 0.1)
    dataUrl = await compressImage(canvas, Math.max(0.1, currentQuality), 'image/jpeg')
    fileSize = getDataUrlSize(dataUrl)

    // If file size is acceptable, break
    if (fileSize <= MAX_FILE_SIZE) {
      break
    }

    attempts++
    if (attempts >= maxAttempts) {
      throw new Error(
        `Screenshot file size (${Math.round(fileSize / 1024)}KB) exceeds maximum allowed size (${MAX_FILE_SIZE / 1024}KB)`
      )
    }
  }

  // Final validation
  if (!dataUrl || !fileSize || fileSize > MAX_FILE_SIZE) {
    throw new Error(`Screenshot file size exceeds maximum allowed size (${MAX_FILE_SIZE / 1024}KB)`)
  }

  // Clean up canvas
  canvas.width = 0
  canvas.height = 0

  return {
    dataUrl: dataUrl!,
    mimeType: 'image/jpeg',
    fileSize: fileSize!,
    width: targetWidth,
    height: targetHeight,
  }
}

