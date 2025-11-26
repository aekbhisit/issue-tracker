/**
 * @module Selector Extraction
 * @description Extract CSS selectors, XPath, bounding box, and HTML from DOM elements
 */

import * as CssSelectorGeneratorLib from 'css-selector-generator'
import type { ElementSelector } from './types'

/**
 * Extract CSS selector for an element using css-selector-generator
 */
export function extractCSSSelector(element: HTMLElement): string {
  try {
    // Try to use css-selector-generator library
    // The library exports a default function that returns a generator object
    if (typeof CssSelectorGeneratorLib === 'function') {
      const generator = (CssSelectorGeneratorLib as any)({
        selectors: ['id', 'class', 'tag', 'nthchild'],
        combineBetweenSelectors: ' ',
        combineWithinSelector: '',
        includeTag: true,
      })
      if (generator && typeof generator.getSelector === 'function') {
        return generator.getSelector(element)
      }
    }
    // If library doesn't work as expected, use fallback
    return generateFallbackCSSSelector(element)
  } catch (error) {
    // Fallback to a simple selector if library fails
    console.warn('Failed to generate CSS selector:', error)
    return generateFallbackCSSSelector(element)
  }
}

/**
 * Fallback CSS selector generation
 */
function generateFallbackCSSSelector(element: HTMLElement): string {
  const parts: string[] = []
  let current: HTMLElement | null = element

  while (current && current !== document.body && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase()

    if (current.id) {
      selector += `#${current.id}`
      parts.unshift(selector)
      break // ID is unique, stop here
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .split(/\s+/)
        .filter((c) => c.length > 0)
        .slice(0, 3) // Limit to first 3 classes
      if (classes.length > 0) {
        selector += `.${classes.join('.')}`
      }
    }

    // Add nth-child if needed for uniqueness
    const parent: HTMLElement | null = current.parentElement
    if (parent) {
      const siblings = Array.from(parent.children)
      const index = siblings.indexOf(current)
      if (siblings.length > 1) {
        selector += `:nth-child(${index + 1})`
      }
    }

    parts.unshift(selector)
    current = parent
  }

  return parts.join(' > ') || element.tagName.toLowerCase()
}

/**
 * Extract XPath for an element
 */
export function extractXPath(element: HTMLElement): string {
  if (element.id) {
    return `//*[@id="${element.id}"]`
  }

  const parts: string[] = []
  let current: HTMLElement | null = element

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1
    let sibling = current.previousElementSibling

    while (sibling) {
      if (sibling.nodeName === current.nodeName) {
        index++
      }
      sibling = sibling.previousElementSibling
    }

    const tagName = current.nodeName.toLowerCase()
    const pathIndex = index > 1 ? `[${index}]` : ''
    parts.unshift(`${tagName}${pathIndex}`)

    current = current.parentElement
  }

  return parts.length ? `/${parts.join('/')}` : ''
}

/**
 * Extract bounding box coordinates for an element
 */
export function extractBoundingBox(element: HTMLElement): {
  x: number
  y: number
  width: number
  height: number
} {
  const rect = element.getBoundingClientRect()
  return {
    x: Math.round(rect.left + window.scrollX),
    y: Math.round(rect.top + window.scrollY),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  }
}

/**
 * Extract outerHTML of an element
 */
export function extractOuterHTML(element: HTMLElement): string {
  try {
    return element.outerHTML
  } catch (error) {
    console.warn('Failed to extract outerHTML:', error)
    // Fallback: reconstruct HTML manually
    return `<${element.tagName.toLowerCase()}${getAttributesString(element)}>${element.innerHTML}</${element.tagName.toLowerCase()}>`
  }
}

/**
 * Get attributes string for an element (fallback helper)
 */
function getAttributesString(element: HTMLElement): string {
  const attrs: string[] = []
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i]
    attrs.push(`${attr.name}="${attr.value.replace(/"/g, '&quot;')}"`)
  }
  return attrs.length ? ' ' + attrs.join(' ') : ''
}

/**
 * Extract complete element selector information
 */
export function extractElementSelector(element: HTMLElement): ElementSelector {
  const cssSelector = extractCSSSelector(element)
  const xpath = extractXPath(element)
  const boundingBox = extractBoundingBox(element)
  const outerHTML = extractOuterHTML(element)
  
  console.log('[SDK Selectors] Extracting element selector:', {
    tagName: element.tagName,
    id: element.id,
    className: element.className,
    cssSelectorLength: cssSelector?.length || 0,
    xpathLength: xpath?.length || 0,
    outerHTMLLength: outerHTML?.length || 0,
    outerHTMLPreview: outerHTML?.substring(0, 200) + (outerHTML?.length > 200 ? '...' : ''),
    boundingBox,
  })
  
  return {
    cssSelector,
    xpath,
    boundingBox,
    outerHTML,
  }
}

