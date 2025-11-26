/**
 * @module Widget Initialization
 * @description Widget container and lifecycle management
 */

import { createButton } from './button'
import { createPanel, type PanelCallbacks } from './panel'
import type { SDKConfig, ScreenshotMetadata, LogData } from './types'
import { startInspectMode } from './inspect'
import { captureScreenshot } from './screenshot'
import { extractElementSelector } from './selectors'
import { LoggingManager } from './logging/manager'
import { collectFormData } from './metadata'

export class IssueCollectorWidget {
  private container: HTMLElement | null = null
  private shadowRoot: ShadowRoot | null = null
  private button: HTMLElement | null = null
  private panel: HTMLElement | null = null
  private config: SDKConfig
  private isPanelOpen = false
  private isInspectModeActive = false
  private stopInspectMode: (() => void) | null = null
  private loggingManager: LoggingManager
  private loadingOverlay: HTMLElement | null = null

  constructor(config: SDKConfig) {
    this.config = config
    this.loggingManager = new LoggingManager()
  }

  /**
   * Initialize the widget
   */
  init(): void {
    console.log('Issue Collector Widget: init() called')
    
    // Check if widget already exists in DOM
    const existingWidget = document.getElementById('issue-collector-widget')
    if (existingWidget) {
      console.warn('Issue Collector Widget: Widget already exists, skipping initialization')
      return
    }

    if (this.container) {
      console.warn('Issue Collector Widget: Already initialized')
      return // Already initialized
    }

    // Start logging
    this.loggingManager.start()

    // Create container
    this.container = document.createElement('div')
    this.container.id = 'issue-collector-widget'
    this.container.setAttribute('style', 'position: fixed; pointer-events: none; z-index: 2147483646;')
    
    // Create shadow root
    this.shadowRoot = this.container.attachShadow({ mode: 'open' })
    console.log('Issue Collector Widget: Shadow root created')
    
    // Create button
    this.button = createButton(this.shadowRoot, () => {
      this.togglePanel()
    })
    console.log('Issue Collector Widget: Button created', this.button)
    
    // Append to body
    if (document.body) {
      document.body.appendChild(this.container)
      console.log('Issue Collector Widget: Container appended to body')
    } else {
      console.error('Issue Collector Widget: document.body is not available')
      // Wait for body to be available
      const checkBody = setInterval(() => {
        if (document.body) {
          clearInterval(checkBody)
          document.body.appendChild(this.container!)
          console.log('Issue Collector Widget: Container appended to body (delayed)')
        }
      }, 100)
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkBody)
        if (!this.container?.parentNode) {
          console.error('Issue Collector Widget: Failed to append container - body not available')
        }
      }, 5000)
    }
  }

  /**
   * Toggle panel open/close
   */
  private togglePanel(): void {
    if (!this.shadowRoot) {
      return
    }

    if (this.isPanelOpen) {
      this.closePanel()
    } else {
      this.openPanel()
    }
  }

  /**
   * Open the panel
   */
  private openPanel(): void {
    if (this.isPanelOpen || !this.shadowRoot) {
      return
    }

    this.isPanelOpen = true
    
    // When panel is open, allow interactions inside the widget container
    if (this.container) {
      this.container.style.pointerEvents = 'auto'
    }
    
    const callbacks: PanelCallbacks = {
      onClose: () => {
        this.closePanel()
      },
      onMinimize: () => {
        // Panel is minimized (for inspect mode)
      },
      onReopen: () => {
        // Panel is reopened (after inspect mode)
      },
      onSubmit: async (payload) => {
        // Handled by panel component
      },
      onStartInspect: () => {
        this.startInspectMode()
      },
      onCaptureFullScreen: () => {
        this.captureFullScreen()
      },
      getLogs: () => {
        return this.getLogs()
      },
    }
    
    this.panel = createPanel(
      this.shadowRoot,
      this.config.projectKey,
      this.config.apiUrl || this.getDefaultApiUrl(),
      callbacks
    )
    
    // Append panel to shadow root
    this.shadowRoot.appendChild(this.panel)
    
    // Update button state
    if (this.button) {
      this.button.classList.add('active')
    }
  }
  
  /**
   * Start inspect mode
   */
  private startInspectMode(): void {
    if (this.isInspectModeActive || !this.panel) {
      return
    }

    this.isInspectModeActive = true
    
    // Minimize panel before starting inspect mode
    if ((this.panel as any).minimize) {
      ;(this.panel as any).minimize()
    }
    
    const panelRef = this.panel
    
    this.stopInspectMode = startInspectMode(
      (element: HTMLElement) => {
        // CRITICAL: Show loading overlay IMMEDIATELY when element is clicked
        // This appears before panel animation, giving instant feedback
        this.showLoadingOverlay()
        
        // CRITICAL: Do all synchronous UI updates FIRST before any async work
        // This ensures the panel opens immediately without waiting for screenshot
        
        // Extract selector synchronously (fast operation)
        const selector = extractElementSelector(element)
        
        console.log('[SDK] Element selected, showing loading overlay and opening panel:', {
          tagName: element.tagName,
          cssSelector: selector.cssSelector?.substring(0, 50),
        })
        
        // Collect form data synchronously
        const formData = collectFormData(element)
        if (formData && (panelRef as any).formData) {
          ;(panelRef as any).formData = formData
        }
        
        // IMMEDIATELY show panel and form (synchronous operations)
        // 1. Reopen panel first
        if ((panelRef as any).reopen) {
          ;(panelRef as any).reopen()
        }
        
        // 2. Switch to Submit tab
        if ((panelRef as any).switchTab) {
          ;(panelRef as any).switchTab('submit')
        }
        
        // 3. Show loading state with selector info
        if ((panelRef as any).showLoadingScreenshot) {
          ;(panelRef as any).showLoadingScreenshot(selector)
        }
        
        console.log('[SDK] Panel opened, starting async screenshot capture...')
        
        // NOW start async screenshot capture (non-blocking)
        // Use setTimeout to ensure UI updates are rendered first
        setTimeout(async () => {
          try {
            console.log('[SDK] Starting screenshot capture for element:', {
              tagName: element.tagName,
              id: element.id,
              className: element.className,
            })
            
            const screenshot = await captureScreenshot(element)
            console.log('[SDK] Screenshot captured successfully:', {
              width: screenshot.width,
              height: screenshot.height,
              fileSize: screenshot.fileSize,
              mimeType: screenshot.mimeType,
              dataUrlLength: screenshot.dataUrl?.length || 0,
            })
            
            const screenshotMetadata: ScreenshotMetadata = {
              screenshot,
              selector,
            }
            
            console.log('[SDK] Screenshot metadata created, updating panel:', {
              hasScreenshot: !!screenshotMetadata.screenshot,
              hasSelector: !!screenshotMetadata.selector,
            })
            
            // Update panel with complete screenshot metadata (replaces loading state)
            if ((panelRef as any).updateScreenshot) {
              ;(panelRef as any).updateScreenshot(screenshotMetadata)
            } else {
              console.warn('[SDK] Panel updateScreenshot method not available')
            }
            
            // Hide loading overlay now that screenshot is ready
            this.hideLoadingOverlay()
            
            this.isInspectModeActive = false
            this.stopInspectMode = null
          } catch (error) {
            console.error('[SDK] Failed to capture screenshot:', error)
            
            // Even if screenshot capture fails, store the selector data
            console.warn('[SDK] Screenshot capture failed, but element selector was extracted:', selector)
            
            // Hide loading overlay even on error
            this.hideLoadingOverlay()
            
            // Show error message in the panel instead of alert
            if ((panelRef as any).showScreenshotError) {
              ;(panelRef as any).showScreenshotError(selector, error instanceof Error ? error.message : 'Unknown error')
            } else {
              // Fallback to alert if method doesn't exist
              alert(`Failed to capture screenshot: ${error instanceof Error ? error.message : 'Unknown error'}\n\nElement selector information has been captured and will be included if you submit the issue.`)
            }
            
            this.isInspectModeActive = false
            this.stopInspectMode = null
          }
        }, 0) // Use setTimeout with 0ms to ensure UI updates render first
      },
      () => {
        // Hide loading overlay if visible
        this.hideLoadingOverlay()
        
        // Inspect mode cancelled - reopen panel
        if ((panelRef as any).reopen) {
          ;(panelRef as any).reopen()
        }
        
        this.isInspectModeActive = false
        this.stopInspectMode = null
      }
    )
  }

  /**
   * Capture full screen screenshot
   */
  private async captureFullScreen(): Promise<void> {
    if (!this.panel) {
      return
    }

    const panelRef = this.panel

    // Remember current button display so we can restore it
    let previousButtonDisplay: string | undefined

    try {
      // Minimize panel (and keep floating button) while capturing
      if ((panelRef as any).minimize) {
        ;(panelRef as any).minimize()
      }

      // Temporarily hide the floating button so it isn't captured
      if (this.button) {
        this.button.style.display = 'none'
      }

      // Capture the entire viewport
      const elementToCapture = document.documentElement || document.body
      const screenshot = await captureScreenshot(elementToCapture as HTMLElement)
      const selector = extractElementSelector(elementToCapture as HTMLElement)
      
      const screenshotMetadata: ScreenshotMetadata = {
        screenshot,
        selector,
      }
      
      // Update panel with screenshot preview and make sure we're on Submit tab
      if ((panelRef as any).updateScreenshot) {
        ;(panelRef as any).updateScreenshot(screenshotMetadata)
      }
      if ((panelRef as any).switchTab) {
        ;(panelRef as any).switchTab('submit')
      }
      if ((panelRef as any).reopen) {
        ;(panelRef as any).reopen()
      }
    } catch (error) {
      console.error('Failed to capture full screen screenshot:', error)
      alert(`Failed to capture screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`)
      // Attempt to reopen panel even on error
      if ((this.panel as any)?.reopen) {
        ;(this.panel as any).reopen()
      }
    } finally {
      // Restore button visibility
      if (this.button) {
        this.button.style.display = previousButtonDisplay ?? ''
      }
    }
  }

  /**
   * Close the panel
   */
  private closePanel(): void {
    if (!this.isPanelOpen || !this.panel || !this.shadowRoot) {
      return
    }

    // Stop inspect mode if active
    if (this.isInspectModeActive && this.stopInspectMode) {
      this.stopInspectMode()
      this.isInspectModeActive = false
      this.stopInspectMode = null
    }

    // Check if panel is still a child before removing
    if (this.panel.parentNode === this.shadowRoot) {
      this.shadowRoot.removeChild(this.panel)
    }
    
    this.panel = null
    this.isPanelOpen = false
    
    // When panel is closed, only the floating button should be clickable
    if (this.container) {
      this.container.style.pointerEvents = 'auto'
    }

    // Update button state
    if (this.button) {
      this.button.classList.remove('active')
    }
  }

  /**
   * Get default API URL
   */
  private getDefaultApiUrl(): string {
    // Try to detect API URL from current page
    const origin = window.location.origin
    
    // If running on localhost, use default API port
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'http://localhost:4501'
    }
    
    // Otherwise, use same origin
    return origin
  }

  /**
   * Get captured logs
   */
  getLogs(): LogData | undefined {
    return this.loggingManager.getLogs()
  }

  /**
   * Show loading overlay immediately when element is clicked
   */
  private showLoadingOverlay(): void {
    // Remove existing overlay if present
    this.hideLoadingOverlay()
    
    console.log('[SDK] Creating loading overlay...')
    
    const overlay = document.createElement('div')
    overlay.id = 'issue-collector-loading-overlay'
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background-color: rgba(0, 0, 0, 0.4) !important;
      backdrop-filter: blur(3px) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      pointer-events: auto !important;
      opacity: 1 !important;
      visibility: visible !important;
    `
    
    overlay.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 32px 40px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 320px;
        text-align: center;
      ">
        <div style="
          width: 56px;
          height: 56px;
          border: 5px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        "></div>
        <div style="
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        ">Capturing Screenshot</div>
        <div style="
          font-size: 14px;
          color: #6b7280;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        ">Processing element and capturing image...</div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        </style>
      </div>
    `
    
    // Force append to body immediately
    if (document.body) {
      document.body.appendChild(overlay)
      this.loadingOverlay = overlay
      console.log('[SDK] Loading overlay appended to body, element:', overlay)
      console.log('[SDK] Loading overlay visible:', overlay.offsetParent !== null)
      console.log('[SDK] Loading overlay computed style:', window.getComputedStyle(overlay).display)
      
      // Force a reflow to ensure it's rendered
      void overlay.offsetHeight
    } else {
      console.error('[SDK] Cannot show loading overlay - document.body is null')
    }
  }
  
  /**
   * Hide loading overlay
   */
  private hideLoadingOverlay(): void {
    const existingOverlay = document.getElementById('issue-collector-loading-overlay')
    if (existingOverlay) {
      console.log('[SDK] Hiding loading overlay')
      // Add fade out animation
      existingOverlay.style.transition = 'opacity 0.2s ease-out'
      existingOverlay.style.opacity = '0'
      
      setTimeout(() => {
        if (existingOverlay.parentNode) {
          existingOverlay.parentNode.removeChild(existingOverlay)
        }
        console.log('[SDK] Loading overlay removed from DOM')
      }, 200)
    }
    this.loadingOverlay = null
  }

  /**
   * Destroy the widget
   */
  destroy(): void {
    // Hide loading overlay if visible
    this.hideLoadingOverlay()
    
    // Stop inspect mode if active
    if (this.isInspectModeActive && this.stopInspectMode) {
      this.stopInspectMode()
      this.isInspectModeActive = false
      this.stopInspectMode = null
    }

    // Stop logging
    this.loggingManager.stop()

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    this.container = null
    this.shadowRoot = null
    this.button = null
    this.panel = null
    this.isPanelOpen = false
  }
}

