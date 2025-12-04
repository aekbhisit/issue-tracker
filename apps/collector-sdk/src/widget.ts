/**
 * @module Widget Initialization
 * @description Widget container and lifecycle management
 */

import { createButton } from './button'
import { createPanel, type PanelCallbacks } from './panel'
import type { SDKConfig, ScreenshotMetadata, LogData, ScreenshotData } from './types'
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
        // CRITICAL: Loading overlay is already shown by inspect.ts
        // Don't hide and recreate it - just ensure it's visible
        // The inspect.ts showLoadingOverlayImmediate() already created it
        const existingOverlay = document.getElementById('issue-collector-loading-overlay')
        if (existingOverlay) {
          // Overlay already exists from inspect.ts, just ensure it's visible
          existingOverlay.style.display = 'flex'
          existingOverlay.style.visibility = 'visible'
          existingOverlay.style.opacity = '1'
          this.loadingOverlay = existingOverlay
          console.log('[SDK] Using existing loading overlay from inspect mode')
        } else {
          // Fallback: create new overlay if it doesn't exist
          this.showLoadingOverlay()
        }
        
        // CRITICAL: Do all synchronous UI updates FIRST before any async work
        // This ensures the panel opens immediately without waiting for screenshot
        
        // Extract selector synchronously (fast operation)
        // Wrap in try-catch to prevent errors from breaking the flow
        let selector
        try {
          selector = extractElementSelector(element)
        } catch (selectorError) {
          console.error('[SDK] Failed to extract element selector:', selectorError)
          // Create minimal selector as fallback
          selector = {
            cssSelector: element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''),
            xpath: element.id ? `//*[@id="${element.id}"]` : '',
            boundingBox: {
              x: Math.round(element.getBoundingClientRect().left + window.scrollX),
              y: Math.round(element.getBoundingClientRect().top + window.scrollY),
              width: Math.round(element.getBoundingClientRect().width),
              height: Math.round(element.getBoundingClientRect().height),
            },
            outerHTML: element.outerHTML || `<${element.tagName.toLowerCase()}>`,
          }
        }
        
        console.log('[SDK] Element selected, showing loading overlay and opening panel:', {
          tagName: element.tagName,
          cssSelector: selector.cssSelector?.substring(0, 50),
        })
        
        // Collect form data synchronously (wrap in try-catch)
        let formData
        try {
          formData = collectFormData(element)
          if (formData && (panelRef as any).formData) {
            ;(panelRef as any).formData = formData
          }
        } catch (formDataError) {
          console.warn('[SDK] Failed to collect form data:', formDataError)
          // Continue without form data
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
        // Capture immediately to ensure element is still in DOM and visible
        const widgetInstance = this
        const captureAsync = async () => {
          try {
            // Verify element is still in DOM before capturing
            if (!element.isConnected) {
              throw new Error('Element is no longer in DOM')
            }
            
            // Get element position BEFORE capture to ensure we're capturing the right element
            const elementRect = element.getBoundingClientRect()
            console.log('[SDK] Starting screenshot capture for element:', {
              tagName: element.tagName,
              id: element.id,
              className: element.className,
              isConnected: element.isConnected,
              position: {
                left: elementRect.left,
                top: elementRect.top,
                width: elementRect.width,
                height: elementRect.height,
              },
              scroll: {
                scrollX: window.scrollX,
                scrollY: window.scrollY,
              },
            })
            
            // OPTIMIZATION: Minimal delay (10ms) - just enough for DOM to stabilize after inspect mode cleanup
            // Using requestAnimationFrame is faster than setTimeout for visual updates
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
            
            // Verify element position hasn't changed significantly
            const newRect = element.getBoundingClientRect()
            if (Math.abs(newRect.left - elementRect.left) > 5 || 
                Math.abs(newRect.top - elementRect.top) > 5) {
              console.warn('[SDK] Element position changed during delay:', {
                old: { left: elementRect.left, top: elementRect.top },
                new: { left: newRect.left, top: newRect.top },
              })
            }
            
            // CRITICAL: Temporarily hide widget during capture to prevent interference
            // html2canvas may have issues with fixed positioned elements overlaying the target
            const widgetElement = document.getElementById('issue-collector-widget')
            const widgetOriginalDisplay = widgetElement ? window.getComputedStyle(widgetElement).display : null
            const widgetOriginalVisibility = widgetElement ? window.getComputedStyle(widgetElement).visibility : null
            const widgetOriginalPointerEvents = widgetElement ? window.getComputedStyle(widgetElement).pointerEvents : null
            const widgetOriginalZIndex = widgetElement ? window.getComputedStyle(widgetElement).zIndex : null
            
            // Hide widget temporarily if it's not the element being captured
            if (widgetElement && !widgetElement.contains(element) && element !== widgetElement) {
              console.log('[SDK] Temporarily hiding widget during screenshot capture')
              widgetElement.style.display = 'none'
            }
            
            // Add progress logging
            console.log('[SDK] Calling captureScreenshot...')
            console.log('[SDK] Element to capture:', {
              tagName: element.tagName,
              id: element.id,
              isWidget: element === widgetElement || widgetElement?.contains(element),
              widgetHidden: widgetElement && widgetElement.style.display === 'none',
            })
            // CRITICAL: captureScreenshot should never throw - it always returns a fallback
            // But wrap in try-catch just in case to ensure loading overlay is always hidden
            let screenshot: ScreenshotData
            try {
              screenshot = await captureScreenshot(element)
              console.log('[SDK] captureScreenshot returned successfully')
            } catch (captureError: any) {
              // Restore widget visibility on error
              if (widgetElement && !widgetElement.contains(element) && element !== widgetElement) {
                console.log('[SDK] Restoring widget visibility after capture error')
                if (widgetOriginalDisplay !== null) {
                  widgetElement.style.display = widgetOriginalDisplay
                } else {
                  widgetElement.style.display = ''
                }
                if (widgetOriginalVisibility !== null) {
                  widgetElement.style.visibility = widgetOriginalVisibility
                }
                if (widgetOriginalPointerEvents !== null) {
                  widgetElement.style.pointerEvents = widgetOriginalPointerEvents
                }
                if (widgetOriginalZIndex !== null) {
                  widgetElement.style.zIndex = widgetOriginalZIndex
                }
              }
              
              // This should never happen since captureScreenshot always returns a fallback
              // But if it does, create a minimal fallback screenshot
              console.error('[SDK] captureScreenshot threw error (unexpected):', captureError)
              // Create a minimal fallback screenshot
              const rect = element.getBoundingClientRect()
              const canvas = document.createElement('canvas')
              canvas.width = Math.max(400, Math.min(rect.width, 1200))
              canvas.height = Math.max(200, Math.min(rect.height, 800))
              const ctx = canvas.getContext('2d')
              if (ctx) {
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.fillStyle = '#111827'
                ctx.font = '14px sans-serif'
                ctx.fillText('Screenshot unavailable', 20, 50)
              }
              screenshot = {
                dataUrl: canvas.toDataURL('image/png'),
                mimeType: 'image/png',
                fileSize: 100,
                width: canvas.width,
                height: canvas.height,
              }
              console.log('[SDK] Using minimal fallback screenshot after unexpected error')
            }
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
            
            // Restore widget visibility after capture
            if (widgetElement && !widgetElement.contains(element) && element !== widgetElement) {
              console.log('[SDK] Restoring widget visibility after screenshot capture')
              if (widgetOriginalDisplay !== null) {
                widgetElement.style.display = widgetOriginalDisplay
              } else {
                widgetElement.style.display = ''
              }
              if (widgetOriginalVisibility !== null) {
                widgetElement.style.visibility = widgetOriginalVisibility
              }
              if (widgetOriginalPointerEvents !== null) {
                widgetElement.style.pointerEvents = widgetOriginalPointerEvents
              }
              if (widgetOriginalZIndex !== null) {
                widgetElement.style.zIndex = widgetOriginalZIndex
              }
            }
            
            // Update panel with complete screenshot metadata (replaces loading state)
            if ((panelRef as any).updateScreenshot) {
              ;(panelRef as any).updateScreenshot(screenshotMetadata)
            } else {
              console.warn('[SDK] Panel updateScreenshot method not available')
            }
            
            // CRITICAL: Hide loading overlay AFTER panel update
            // Hide loading overlay immediately after screenshot is ready
            console.log('[SDK] Screenshot ready, hiding loading overlay immediately...')
            widgetInstance.hideLoadingOverlay()
            console.log('[SDK] Loading overlay hide called')
            
            // Only stop inspect mode after screenshot is complete
            widgetInstance.isInspectModeActive = false
            if (widgetInstance.stopInspectMode) {
              widgetInstance.stopInspectMode()
              widgetInstance.stopInspectMode = null
            }
          } catch (error) {
            console.error('[SDK] Failed to capture screenshot:', error)
            
            // Restore widget visibility even on error
            if (widgetElement && !widgetElement.contains(element) && element !== widgetElement) {
              console.log('[SDK] Restoring widget visibility after screenshot error')
              if (widgetOriginalDisplay !== null) {
                widgetElement.style.display = widgetOriginalDisplay
              } else {
                widgetElement.style.display = ''
              }
              if (widgetOriginalVisibility !== null) {
                widgetElement.style.visibility = widgetOriginalVisibility
              }
              if (widgetOriginalPointerEvents !== null) {
                widgetElement.style.pointerEvents = widgetOriginalPointerEvents
              }
              if (widgetOriginalZIndex !== null) {
                widgetElement.style.zIndex = widgetOriginalZIndex
              }
            }
            
            // Even if screenshot capture fails, store the selector data (without screenshot)
            // This allows users to submit issues with selector info even if screenshot fails
            const screenshotMetadataWithoutImage: ScreenshotMetadata = {
              screenshot: undefined as any, // No screenshot, but we have selector
              selector,
            }
            
            console.warn('[SDK] Screenshot capture failed, but element selector was extracted:', selector)
            
            // Update panel with selector data even without screenshot
            if ((panelRef as any).updateScreenshot) {
              try {
                ;(panelRef as any).updateScreenshot(screenshotMetadataWithoutImage)
              } catch (updateError) {
                console.error('[SDK] Failed to update panel with selector data:', updateError)
              }
            }
            
            // Hide loading overlay even on error
            console.log('[SDK] Screenshot capture failed, hiding loading overlay immediately...')
            widgetInstance.hideLoadingOverlay()
            console.log('[SDK] Loading overlay hide called (error case)')
            
            // Show error message in the panel instead of alert
            if ((panelRef as any).showScreenshotError) {
              try {
                ;(panelRef as any).showScreenshotError(selector, error instanceof Error ? error.message : 'Unknown error')
              } catch (showError) {
                console.error('[SDK] Failed to show screenshot error:', showError)
              }
            }
            
            // Stop inspect mode even if screenshot failed
            widgetInstance.isInspectModeActive = false
            if (widgetInstance.stopInspectMode) {
              widgetInstance.stopInspectMode()
              widgetInstance.stopInspectMode = null
            }
          }
        }
        captureAsync().catch((err) => {
          console.error('[SDK] Unhandled error in screenshot capture:', err)
          
          // Ensure loading overlay is hidden even on unhandled errors (immediately)
          console.log('[SDK] Unhandled error, hiding loading overlay immediately...')
          widgetInstance.hideLoadingOverlay()
          console.log('[SDK] Loading overlay hide called (unhandled error)')
          
          // Ensure inspect mode is stopped
          widgetInstance.isInspectModeActive = false
          if (widgetInstance.stopInspectMode) {
            widgetInstance.stopInspectMode()
            widgetInstance.stopInspectMode = null
          }
          
          // Show error in panel
          if ((panelRef as any).showScreenshotError) {
            try {
              ;(panelRef as any).showScreenshotError(
                selector,
                err instanceof Error ? err.message : 'Screenshot capture failed unexpectedly'
              )
            } catch (showError) {
              console.error('[SDK] Failed to show screenshot error:', showError)
            }
          }
        })
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
      
      // Force a reflow to ensure it's rendered
      void overlay.offsetHeight
      
      // Verify visibility
      const isVisible = overlay.offsetParent !== null
      const computedStyle = window.getComputedStyle(overlay)
      
      console.log('[SDK] Loading overlay appended to body:', {
        element: overlay,
        visible: isVisible,
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        zIndex: computedStyle.zIndex,
      })
      
      // If not visible, try to fix it
      if (!isVisible) {
        console.warn('[SDK] Overlay not visible, attempting to fix...')
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
        void overlay.offsetHeight // Force reflow again
        console.log('[SDK] Overlay fixed, now visible:', overlay.offsetParent !== null)
      }
    } else {
      console.error('[SDK] Cannot show loading overlay - document.body is null')
    }
  }
  
  /**
   * Hide loading overlay
   * CRITICAL: This must ALWAYS work, even if there are errors
   * Must be synchronous and immediate - no delays
   */
  private hideLoadingOverlay(): void {
    try {
      // Try multiple ways to find the overlay
      const existingOverlay = document.getElementById('issue-collector-loading-overlay')
      if (existingOverlay) {
        console.log('[SDK] Hiding loading overlay, element:', existingOverlay)
        
        // CRITICAL: Hide immediately and synchronously (no setTimeout, no delays)
        existingOverlay.style.display = 'none'
        existingOverlay.style.visibility = 'hidden'
        existingOverlay.style.opacity = '0'
        existingOverlay.style.pointerEvents = 'none'
        existingOverlay.style.zIndex = '-1'
        
        // Remove from DOM immediately (synchronous)
        try {
          if (existingOverlay.parentNode) {
            existingOverlay.parentNode.removeChild(existingOverlay)
            console.log('[SDK] Loading overlay removed from DOM immediately')
          } else if (existingOverlay.remove) {
            existingOverlay.remove()
            console.log('[SDK] Loading overlay removed using remove() method')
          }
        } catch (removeError) {
          console.warn('[SDK] Error removing overlay:', removeError)
          // Force hide even if removal fails
          existingOverlay.style.display = 'none'
          existingOverlay.style.visibility = 'hidden'
          existingOverlay.style.opacity = '0'
          existingOverlay.style.pointerEvents = 'none'
          existingOverlay.style.zIndex = '-1'
        }
        
        // Double-check immediately (synchronous check)
        const stillExists = document.getElementById('issue-collector-loading-overlay')
        if (stillExists) {
          console.warn('[SDK] Overlay still exists after removal, forcing hide...')
          stillExists.style.display = 'none'
          stillExists.style.visibility = 'hidden'
          stillExists.style.opacity = '0'
          stillExists.style.pointerEvents = 'none'
          stillExists.style.zIndex = '-1'
          try {
            if (stillExists.parentNode) {
              stillExists.parentNode.removeChild(stillExists)
            } else if (stillExists.remove) {
              stillExists.remove()
            }
          } catch (forceError) {
            console.error('[SDK] Failed to force remove overlay:', forceError)
          }
        }
      } else {
        console.log('[SDK] No loading overlay found to hide (already removed or never created)')
      }
    } catch (error) {
      // CRITICAL: Even if there's an error, try to find and hide the overlay
      console.error('[SDK] Error in hideLoadingOverlay:', error)
      try {
        const anyOverlay = document.getElementById('issue-collector-loading-overlay')
        if (anyOverlay) {
          anyOverlay.style.display = 'none'
          anyOverlay.style.visibility = 'hidden'
          anyOverlay.style.opacity = '0'
          anyOverlay.style.pointerEvents = 'none'
          anyOverlay.style.zIndex = '-1'
          console.log('[SDK] Forced overlay to hide after error')
        }
      } catch (finalError) {
        console.error('[SDK] Failed to force hide overlay:', finalError)
      }
    }
    
    // Always clear the reference
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

