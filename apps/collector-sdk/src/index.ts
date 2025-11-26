/**
 * @module Issue Collector SDK
 * @description Main entry point for the Issue Collector SDK
 */

import { IssueCollectorWidget } from './widget'
import type { SDKConfig } from './types'

// Global interface for window.issueCollectorUser
declare global {
  interface Window {
    issueCollectorUser?: {
      id?: string
      email?: string
      name?: string
    }
    IssueCollector?: {
      init: (config: SDKConfig) => IssueCollectorWidget
      destroy: () => void
    }
  }
}

let widgetInstance: IssueCollectorWidget | null = null

/**
 * Initialize the SDK
 */
function init(config: SDKConfig): IssueCollectorWidget {
  if (widgetInstance) {
    widgetInstance.destroy()
  }

  widgetInstance = new IssueCollectorWidget(config)
  widgetInstance.init()
  
  return widgetInstance
}

/**
 * Destroy the SDK instance
 */
function destroy(): void {
  if (widgetInstance) {
    widgetInstance.destroy()
    widgetInstance = null
  }
}

/**
 * Auto-initialize from script tag attributes
 */
function autoInit(): void {
  console.log('Issue Collector SDK: Auto-init called')
  
  // Check if already initialized to prevent duplicates
  if (widgetInstance) {
    console.warn('Issue Collector SDK: Already initialized, skipping auto-init')
    return
  }

  // Check if widget already exists in DOM
  if (document.getElementById('issue-collector-widget')) {
    console.warn('Issue Collector SDK: Widget already exists in DOM, skipping auto-init')
    return
  }

  // Find the script tag that loaded this SDK
  // Try multiple strategies to find the script tag
  const scripts = document.getElementsByTagName('script')
  let currentScript: HTMLScriptElement | null = null
  
  // Strategy 1: Find script with collector in src
  for (let i = scripts.length - 1; i >= 0; i--) {
    const script = scripts[i]
    if (script.src && (script.src.includes('collector') || script.src.includes('collector.min.js'))) {
      currentScript = script
      break
    }
  }
  
  // Strategy 2: If not found, check all scripts for data-project-key attribute
  if (!currentScript) {
    for (let i = scripts.length - 1; i >= 0; i--) {
      const script = scripts[i]
      if (script.getAttribute('data-project-key')) {
        currentScript = script
        break
      }
    }
  }
  
  if (!currentScript) {
    console.warn('Issue Collector SDK: Could not find script tag. Available scripts:', Array.from(scripts).map(s => s.src || 'inline'))
    return
  }
  
  console.log('Issue Collector SDK: Found script tag', { 
    src: currentScript.src, 
    hasProjectKey: !!currentScript.getAttribute('data-project-key'),
    hasApiUrl: !!currentScript.getAttribute('data-api-url')
  })
  
  // Read configuration from script tag attributes
  const projectKey = currentScript.getAttribute('data-project-key')
  const apiUrl = currentScript.getAttribute('data-api-url') || undefined
  
  console.log('Issue Collector SDK: Config', { projectKey, apiUrl })
  
  if (!projectKey) {
    console.error('Issue Collector SDK: data-project-key attribute is required. Script attributes:', {
      src: currentScript.src,
      attributes: Array.from(currentScript.attributes).map(attr => ({ name: attr.name, value: attr.value }))
    })
    return
  }
  
  // Initialize widget
  console.log('Issue Collector SDK: Initializing widget...')
  try {
    init({
      projectKey,
      apiUrl,
    })
    console.log('Issue Collector SDK: Widget initialized successfully')
  } catch (error) {
    console.error('Issue Collector SDK: Failed to initialize widget', error)
  }
}

// Export for UMD
if (typeof window !== 'undefined') {
  (window as any).IssueCollector = {
    init,
    destroy,
  }
}

// Auto-initialize when DOM is ready
// Use a small delay to ensure script tag is fully in DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(autoInit, 100)
  })
} else {
  setTimeout(autoInit, 100)
}

export { init, destroy, IssueCollectorWidget }
export type { SDKConfig, Metadata, IssuePayload, Severity, UserInfo } from './types'

