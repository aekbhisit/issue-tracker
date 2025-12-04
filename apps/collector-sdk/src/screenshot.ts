/**
 * @module Screenshot Capture
 * @description Capture screenshots of DOM elements using html2canvas
 */

import html2canvas from 'html2canvas'
import type { ScreenshotData } from './types'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_DIMENSION = 4096 // 4096x4096 pixels
const DEFAULT_QUALITY = 0.85 // JPEG quality (0.8-0.9)
const DEFAULT_TIMEOUT = 20000 // 20 seconds (increased to ensure proper capture, still faster than original 30s)

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

  // CRITICAL: Validate element before capture
  if (!element || !element.isConnected) {
    throw new Error('Element is not connected to DOM')
  }
  
  // CRITICAL: Don't capture the widget itself
  if (element.id === 'issue-collector-widget' || element.closest('#issue-collector-widget')) {
    throw new Error('Cannot capture the widget element itself')
  }

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
  
  // Validate dimensions
  if (elementWidth <= 0 || elementHeight <= 0) {
    throw new Error(`Element has invalid dimensions: ${elementWidth}x${elementHeight}`)
  }

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
      reject(new Error(`Screenshot capture timed out after ${timeout}ms. The element may be too large or complex.`))
    }, timeout)
  })

  // QUALITY-FIRST: Use original scale for all elements to ensure proper screenshots
  // Only reduce scale if element exceeds MAX_DIMENSION (calculated by calculateScale)
  // This ensures html2canvas captures with proper colors and quality
  const optimizedScale = scale // Always use calculated scale - preserves quality and ensures proper capture

  // Capture screenshot with html2canvas
  console.log('[Screenshot] Initializing html2canvas with options:', {
    originalScale: scale,
    optimizedScale: optimizedScale,
    width: elementWidth,
    height: elementHeight,
    timeout,
  })
  
  // Validate html2canvas is available
  if (typeof html2canvas === 'undefined' || !html2canvas) {
    throw new Error('html2canvas is not available. Make sure it is properly imported.')
  }
  
  console.log('[Screenshot] html2canvas available:', typeof html2canvas, html2canvas)
  
  // Store original inline styles to restore later (for elements we modify)
  const originalStyles = new Map<HTMLElement, Map<string, string>>()
  
  // CRITICAL: Process the element and ALL its descendants to replace oklch in computed styles
  // html2canvas processes the entire subtree, so we must process all descendants too
  try {
    const replaceUnsupportedColors = (value: string): string => {
      if (!value || typeof value !== 'string') return value
      let result = value.replace(/oklch\([^)]+\)/gi, '#111827')
      result = result.replace(/lab\([^)]+\)/gi, '#111827')
      result = result.replace(/lch\([^)]+\)/gi, '#111827')
      return result
    }
    
    // Process the target element AND all its descendants
    // Also process parent elements that might affect the element's styling
    const elementsToProcess: HTMLElement[] = []
    
    // Add the target element
    elementsToProcess.push(element)
    
    // Add all descendants
    const descendants = element.querySelectorAll('*') as NodeListOf<HTMLElement>
    for (let i = 0; i < descendants.length; i++) {
      elementsToProcess.push(descendants[i])
    }
    
    // Add parent elements up to body (html2canvas reads inherited styles)
    let parent: HTMLElement | null = element.parentElement
    while (parent && parent !== document.body && parent !== document.documentElement) {
      elementsToProcess.push(parent)
      parent = parent.parentElement
    }
    
    let totalReplaced = 0
    
    for (let i = 0; i < elementsToProcess.length; i++) {
      const el = elementsToProcess[i]
      // Skip the widget itself
      if (el.id === 'issue-collector-widget' || el.closest('#issue-collector-widget')) {
        continue
      }
      
      try {
        const computedStyle = window.getComputedStyle(el)
        if (computedStyle) {
          // Store original inline styles before modifying
          if (!originalStyles.has(el)) {
            originalStyles.set(el, new Map())
          }
          const originalStyleMap = originalStyles.get(el)!
          
          // Check ALL computed properties (html2canvas reads all of them)
          const allProps = Array.from(computedStyle)
          
          for (const prop of allProps) {
            try {
              const value = computedStyle.getPropertyValue(prop)
              if (value && (value.includes('oklch(') || value.includes('lab(') || value.includes('lch('))) {
                // Store original value if not already stored
                if (!originalStyleMap.has(prop)) {
                  originalStyleMap.set(prop, el.style.getPropertyValue(prop))
                }
                
                const newValue = replaceUnsupportedColors(value)
                el.style.setProperty(prop, newValue, 'important')
                totalReplaced++
              }
            } catch (e) {
              continue
            }
          }
        }
      } catch (e) {
        continue
      }
    }
    
    if (totalReplaced > 0) {
      console.log('[Screenshot] Pre-processed element tree: replaced', totalReplaced, 'oklch instances in', elementsToProcess.length, 'elements')
    }
  } catch (e) {
    console.warn('[Screenshot] Error pre-processing element tree:', e)
  }
  
  const capturePromise = html2canvas(element, {
    useCORS: true,
    allowTaint: false,
    scale: optimizedScale, // Use calculated scale for quality
    width: elementWidth,
    height: elementHeight,
    logging: true, // Enable logging to debug issues
    backgroundColor: '#ffffff',
    // Ensure proper rendering
    removeContainer: false, // Keep container for proper rendering
    // CRITICAL: Normalize unsupported CSS color functions (like oklch) in the cloned DOM
    // html2canvas cannot parse oklch(), so we must replace it before capture
    onclone: (clonedDoc: Document) => {
      try {
        const win = clonedDoc.defaultView || window
        const StyleRule = (win as any).CSSStyleRule || (window as any).CSSStyleRule
        
        // Function to replace oklch() and other unsupported color functions with safe fallback
        const replaceUnsupportedColors = (value: string): string => {
          if (!value || typeof value !== 'string') return value
          // Replace oklch() with a safe fallback color (#111827 is dark gray)
          let result = value.replace(/oklch\([^)]+\)/gi, '#111827')
          // Also replace other modern color functions that html2canvas might not support
          result = result.replace(/lab\([^)]+\)/gi, '#111827')
          result = result.replace(/lch\([^)]+\)/gi, '#111827')
          return result
        }
        
        // Process ALL stylesheets (not just first 10) to catch all oklch instances
        const styleSheets = Array.from(clonedDoc.styleSheets) as CSSStyleSheet[]
        console.log('[Screenshot] Processing', styleSheets.length, 'stylesheets for oklch replacement')
        
        for (const sheet of styleSheets) {
          let rules: CSSRuleList
          try {
            rules = sheet.cssRules
            // Process ALL rules (not limited) to ensure we catch all oklch instances
            for (let i = 0; i < rules.length; i++) {
              const rule = rules[i]
              // Process style rules
              if (StyleRule && rule instanceof StyleRule && (rule as CSSStyleRule).style) {
                const style = (rule as CSSStyleRule).style
                // Check ALL style properties (not just color-related) since oklch can appear anywhere
                for (let j = 0; j < style.length; j++) {
                  const prop = style[j]
                  const value = style.getPropertyValue(prop)
                  if (value && (value.includes('oklch(') || value.includes('lab(') || value.includes('lch('))) {
                    const newValue = replaceUnsupportedColors(value)
                    style.setProperty(prop, newValue, style.getPropertyPriority(prop))
                  }
                }
              }
            }
          } catch (e) {
            // Some stylesheets (e.g. cross-origin) may not be accessible - skip them
            continue
          }
        }
        
        // Process ALL elements - both inline styles AND computed styles
        const body = clonedDoc.body || clonedDoc.documentElement
        if (body) {
          // Use querySelectorAll to get all elements
          const allElements = body.querySelectorAll('*') as NodeListOf<HTMLElement>
          console.log('[Screenshot] Processing', allElements.length, 'elements for oklch replacement')
          
          const win = clonedDoc.defaultView || window
          
          for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i]
            
            // 1. Process inline styles
            if (el.style && el.style.length > 0) {
              // Check ALL inline style properties
              for (let j = 0; j < el.style.length; j++) {
                const prop = el.style[j]
                const value = el.style.getPropertyValue(prop)
                if (value && (value.includes('oklch(') || value.includes('lab(') || value.includes('lch('))) {
                  const newValue = replaceUnsupportedColors(value)
                  el.style.setProperty(prop, newValue, el.style.getPropertyPriority(prop))
                }
              }
            }
            
            // 2. Process computed styles (html2canvas uses these)
            try {
              const computedStyle = win.getComputedStyle(el)
              if (computedStyle) {
                // Check all color-related computed properties
                const colorProps = [
                  'color', 'background-color', 'border-color', 'border-top-color',
                  'border-right-color', 'border-bottom-color', 'border-left-color',
                  'outline-color', 'text-decoration-color', 'column-rule-color',
                  'caret-color', 'fill', 'stroke'
                ]
                
                for (const prop of colorProps) {
                  try {
                    const value = computedStyle.getPropertyValue(prop)
                    if (value && (value.includes('oklch(') || value.includes('lab(') || value.includes('lch('))) {
                      // Replace in inline style to override computed style
                      const newValue = replaceUnsupportedColors(value)
                      el.style.setProperty(prop, newValue, 'important')
                    }
                  } catch (e) {
                    // Some properties might not be accessible, skip them
                    continue
                  }
                }
              }
            } catch (e) {
              // Some elements might not have accessible computed styles
              continue
            }
            
            // 3. Process CSS custom properties (CSS variables) that might contain oklch
            try {
              const computedStyle = win.getComputedStyle(el)
              if (computedStyle) {
                // Get all CSS custom properties
                const allProps = Array.from(computedStyle)
                for (const prop of allProps) {
                  if (prop.startsWith('--')) {
                    // This is a CSS variable
                    const value = computedStyle.getPropertyValue(prop)
                    if (value && (value.includes('oklch(') || value.includes('lab(') || value.includes('lch('))) {
                      // Replace the CSS variable value
                      const newValue = replaceUnsupportedColors(value)
                      el.style.setProperty(prop, newValue, 'important')
                    }
                  }
                }
              }
            } catch (e) {
              // CSS variables might not be accessible, skip
              continue
            }
          }
        }
        
        console.log('[Screenshot] onclone normalization completed (processed inline, computed, and CSS variables)')
      } catch (e) {
        // Best-effort normalization; log error but continue
        console.warn('[Screenshot] Error in onclone normalization:', e)
      }
    },
    // Skip cross-origin iframes and the widget itself
    ignoreElements: (el) => {
      try {
        // CRITICAL: Always ignore the widget element to prevent interference
        if (el.id === 'issue-collector-widget' || el.closest('#issue-collector-widget')) {
          return true
        }
        
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
        // Ignore errors when checking
      }
      return false
    },
  })

  let canvas: HTMLCanvasElement
  try {
    console.log('[Screenshot] Starting capture with timeout:', timeout, 'ms')
    console.log('[Screenshot] Element details:', {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      dimensions: { width: elementWidth, height: elementHeight },
      scale: optimizedScale,
    })
    // Race between capture and timeout
    canvas = await Promise.race([capturePromise, timeoutPromise])
    console.log('[Screenshot] Capture completed successfully, canvas size:', canvas.width, 'x', canvas.height)
  } catch (error: any) {
    // Enhanced error logging to handle various error types
    let errorDetails: any = {}
    try {
      errorDetails = {
        message: error?.message || 'No message',
        name: error?.name || 'Unknown',
        stack: error?.stack || 'No stack',
        toString: String(error || 'Unknown error'),
        type: typeof error,
        constructor: error?.constructor?.name || 'Unknown',
      }
      
      // Try to extract more properties
      if (error && typeof error === 'object') {
        try {
          errorDetails.keys = Object.keys(error)
          errorDetails.json = JSON.stringify(error, Object.getOwnPropertyNames(error))
        } catch (e) {
          errorDetails.jsonError = String(e)
        }
      }
    } catch (logError) {
      errorDetails.logError = String(logError)
      errorDetails.rawError = error
    }
    
    // Log full error details for debugging
    console.error('[Screenshot] Capture failed with error:', errorDetails)
    console.error('[Screenshot] Raw error object:', error)
    
    const message = errorDetails.message || errorDetails.toString || 'Unknown error'
    
    // Restore original styles on error
    try {
      for (const [el, styleMap] of originalStyles.entries()) {
        for (const [prop, originalValue] of styleMap.entries()) {
          if (originalValue) {
            el.style.setProperty(prop, originalValue)
          } else {
            el.style.removeProperty(prop)
          }
        }
        // Clear important overrides
        const allProps = Array.from(el.style)
        for (const prop of allProps) {
          if (el.style.getPropertyPriority(prop) === 'important' && styleMap.has(prop)) {
            const original = styleMap.get(prop)
            if (original) {
              el.style.setProperty(prop, original)
            } else {
              el.style.removeProperty(prop)
            }
          }
        }
      }
      originalStyles.clear()
      console.log('[Screenshot] Restored original styles (after error)')
    } catch (e) {
      console.warn('[Screenshot] Error restoring styles on error:', e)
    }
    
    // Handle timeout separately
    if (message.includes('timed out') || message.includes('timeout')) {
      console.warn('[Screenshot] Capture timed out after', timeout, 'ms. Element may be too large or complex.')
      console.warn('[Screenshot] Element dimensions:', elementWidth, 'x', elementHeight, 'scale:', optimizedScale)
      // Try one more time with a longer timeout for important elements
      if (timeout < 30000 && (elementWidth < 2000 && elementHeight < 2000)) {
        console.log('[Screenshot] Retrying with extended timeout for smaller element...')
        try {
          const extendedTimeout = 30000
          const extendedTimeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Screenshot capture timed out after ${extendedTimeout}ms`))
            }, extendedTimeout)
          })
          const retryPromise = html2canvas(element, {
            useCORS: true,
            allowTaint: false,
            scale: optimizedScale,
            width: elementWidth,
            height: elementHeight,
            logging: true,
            backgroundColor: '#ffffff',
            removeContainer: false,
            onclone: (clonedDoc: Document) => {
              // Use same onclone logic as above
              try {
                const win = clonedDoc.defaultView || window
                const StyleRule = (win as any).CSSStyleRule || (window as any).CSSStyleRule
                const replaceOklchColor = (value: string): string => {
                  if (!value || typeof value !== 'string') return value
                  return value.replace(/oklch\([^)]+\)/gi, '#111827')
                }
                const styleSheets = Array.from(clonedDoc.styleSheets).slice(0, 10) as CSSStyleSheet[]
                for (const sheet of styleSheets) {
                  let rules: CSSRuleList
                  try {
                    rules = sheet.cssRules
                    const maxRules = Math.min(rules.length, 1000)
                    for (let i = 0; i < maxRules; i++) {
                      const rule = rules[i]
                      if (StyleRule && rule instanceof StyleRule && (rule as CSSStyleRule).style) {
                        const style = (rule as CSSStyleRule).style
                        const colorProps = ['color', 'background-color', 'border-color', 'border-top-color',
                                          'border-right-color', 'border-bottom-color', 'border-left-color']
                        for (const prop of colorProps) {
                          const value = style.getPropertyValue(prop)
                          if (value && value.includes('oklch(')) {
                            const newValue = replaceOklchColor(value)
                            style.setProperty(prop, newValue, style.getPropertyPriority(prop))
                          }
                        }
                      }
                    }
                  } catch {
                    continue
                  }
                }
              } catch (e) {
                console.warn('[Screenshot] Error in onclone normalization (retry):', e)
              }
            },
            ignoreElements: (el) => {
              try {
                if (el.ownerDocument !== document) {
                  try {
                    const iframe = el.ownerDocument.defaultView?.frameElement as HTMLIFrameElement | null
                    if (iframe && iframe.contentDocument !== el.ownerDocument) {
                      return true
                    }
                  } catch (e) {
                    return true
                  }
                }
              } catch (e) {
              }
              return false
            },
          })
          canvas = await Promise.race([retryPromise, extendedTimeoutPromise])
          console.log('[Screenshot] Retry successful!')
        } catch (retryError) {
          console.error('[Screenshot] Retry also failed:', retryError)
          return createFallbackScreenshot(
            element,
            targetWidth || elementWidth,
            targetHeight || elementHeight
          )
        }
      } else {
      return createFallbackScreenshot(
        element,
        targetWidth || elementWidth,
        targetHeight || elementHeight
      )
      }
    }

    // Restore original styles before returning fallback
    try {
      for (const [el, styleMap] of originalStyles.entries()) {
        for (const [prop, originalValue] of styleMap.entries()) {
          if (originalValue) {
            el.style.setProperty(prop, originalValue)
          } else {
            el.style.removeProperty(prop)
          }
        }
        // Clear important overrides
        const allProps = Array.from(el.style)
        for (const prop of allProps) {
          if (el.style.getPropertyPriority(prop) === 'important' && styleMap.has(prop)) {
            const original = styleMap.get(prop)
            if (original) {
              el.style.setProperty(prop, original)
            } else {
              el.style.removeProperty(prop)
            }
          }
        }
      }
      originalStyles.clear()
    } catch (e) {
      console.warn('[Screenshot] Error restoring styles before fallback:', e)
    }
    
    // html2canvas currently cannot parse some modern CSS color functions (e.g. "oklch")
    // The onclone callback should have replaced these, but if it didn't catch all instances,
    // we fall back to a text snapshot
    if (message.includes('unsupported color function') || 
        message.includes('oklch') || 
        message.includes('Attempting to parse an unsupported color function')) {
      console.warn('[Screenshot] Unsupported color function (oklch/lab/lch) detected despite normalization.')
      console.warn('[Screenshot] This means some oklch colors were not caught. Falling back to element text snapshot.')
      return createFallbackScreenshot(
        element,
        targetWidth || elementWidth,
        targetHeight || elementHeight
      )
    }

    // For other errors, log as error but still try fallback
    // CRITICAL: Always return fallback instead of throwing to ensure loading overlay is hidden
    console.error('[Screenshot] Capture failed:', message)
    console.warn('[Screenshot] Attempting fallback screenshot with element text content...')
    try {
      return createFallbackScreenshot(
        element,
        targetWidth || elementWidth,
        targetHeight || elementHeight
      )
    } catch (fallbackError) {
      // Even if fallback fails, return a minimal screenshot to prevent throwing
      console.error('[Screenshot] Fallback screenshot creation failed:', fallbackError)
      return {
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
        fileSize: 100,
        width: 1,
        height: 1,
      }
    }
  }

  // Restore original styles after capture
  try {
    let restoredCount = 0
    for (const [el, styleMap] of originalStyles.entries()) {
      for (const [prop, originalValue] of styleMap.entries()) {
        if (originalValue) {
          el.style.setProperty(prop, originalValue)
        } else {
          el.style.removeProperty(prop)
        }
        restoredCount++
      }
      // Clear all important overrides we added
      const allProps = Array.from(el.style)
      for (const prop of allProps) {
        if (el.style.getPropertyPriority(prop) === 'important' && styleMap.has(prop)) {
          // This was one we modified, restore it
          const original = styleMap.get(prop)
          if (original) {
            el.style.setProperty(prop, original)
          } else {
            el.style.removeProperty(prop)
          }
        }
      }
    }
    originalStyles.clear()
    if (restoredCount > 0) {
      console.log('[Screenshot] Restored', restoredCount, 'original style properties')
    }
  } catch (e) {
    console.warn('[Screenshot] Error restoring original styles:', e)
  }
  
  console.log('[Screenshot] Canvas captured, dimensions:', canvas.width, 'x', canvas.height)
  
  // CRITICAL: Only resize DOWN if canvas is larger than target (never upscale - causes quality loss)
  // If canvas is smaller than target, keep it as-is to preserve quality
  let finalWidth = canvas.width
  let finalHeight = canvas.height
  
  if (canvas.width > targetWidth || canvas.height > targetHeight) {
    console.log('[Screenshot] Resizing canvas DOWN from', canvas.width, 'x', canvas.height, 'to', targetWidth, 'x', targetHeight)
    const resizedCanvas = document.createElement('canvas')
    resizedCanvas.width = targetWidth
    resizedCanvas.height = targetHeight
    const ctx = resizedCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to create canvas context for resizing')
    }
    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight)
    canvas = resizedCanvas
    finalWidth = targetWidth
    finalHeight = targetHeight
    console.log('[Screenshot] Canvas resized successfully')
  } else if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    // Canvas is smaller than target - don't upscale, use actual canvas dimensions
    console.log('[Screenshot] Canvas is smaller than target, keeping original size to preserve quality:', canvas.width, 'x', canvas.height)
    finalWidth = canvas.width
    finalHeight = canvas.height
  } else {
    // Canvas matches target exactly
    finalWidth = targetWidth
    finalHeight = targetHeight
  }

  // Compress image
  console.log('[Screenshot] Starting image compression...')
  let dataUrl: string | undefined = undefined
  let fileSize: number | undefined = undefined
  
  // Start with the requested quality for best image quality
  // Only reduce if file size is too large
  let currentQuality = quality // Use requested quality for best results
  const maxAttempts = 3 // Allow 3 attempts to balance quality and file size
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      // Reduce quality more aggressively on retry
      currentQuality = Math.max(0.3, currentQuality * 0.7)
    }
    
    console.log('[Screenshot] Compression attempt', attempt + 1, 'with quality', currentQuality.toFixed(2))
    dataUrl = await compressImage(canvas, currentQuality, 'image/jpeg')
    fileSize = getDataUrlSize(dataUrl)
    console.log('[Screenshot] Compressed size:', Math.round(fileSize / 1024), 'KB')

    // If file size is acceptable, break
    if (fileSize <= MAX_FILE_SIZE) {
      console.log('[Screenshot] File size acceptable, compression complete')
      break
    }

    if (attempt === maxAttempts - 1) {
      // Last attempt failed - use fallback or throw error
      console.warn('[Screenshot] File size still too large after', maxAttempts, 'attempts')
      // Don't throw - return the compressed image anyway (API will handle size validation)
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
    width: finalWidth,
    height: finalHeight,
  }
}

