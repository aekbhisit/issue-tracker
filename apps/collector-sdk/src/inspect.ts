/**
 * @module Inspect Mode
 * @description Inspect mode for element selection with hover highlighting
 */

/**
 * Throttle function to limit function calls
 */
function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

/**
 * Show loading overlay immediately (called from inspect mode)
 */
function showLoadingOverlayImmediate(): void {
  // Remove existing overlay if present
  const existing = document.getElementById('issue-collector-loading-overlay')
  if (existing && existing.parentNode) {
    existing.parentNode.removeChild(existing)
  }
  
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
      </style>
    </div>
  `
  
  if (document.body) {
    document.body.appendChild(overlay)
    // Force immediate render and layout
    void overlay.offsetHeight
    // Force a reflow to ensure visibility
    overlay.style.display = 'flex'
    // Verify it's actually visible
    const isVisible = overlay.offsetParent !== null
    console.log('[SDK Inspect] Loading overlay shown immediately, visible:', isVisible, {
      display: window.getComputedStyle(overlay).display,
      visibility: window.getComputedStyle(overlay).visibility,
      opacity: window.getComputedStyle(overlay).opacity,
      zIndex: window.getComputedStyle(overlay).zIndex,
    })
    
    // If not visible, try to fix it
    if (!isVisible) {
      console.warn('[SDK Inspect] Overlay not visible, attempting to fix...')
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
    }
  }
}

/**
 * Start inspect mode
 * @param onElementSelected Callback when element is clicked
 * @param onCancel Callback when inspect mode is cancelled (ESC key)
 * @returns Cleanup function to stop inspect mode
 */
export function startInspectMode(
  onElementSelected: (element: HTMLElement) => void,
  onCancel: () => void
): () => void {
  // Create overlay element
  const overlay = document.createElement('div')
  overlay.id = 'issue-collector-inspect-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999999;
    pointer-events: auto;
    cursor: crosshair;
  `
  document.body.appendChild(overlay)

  // Create highlight element
  const highlight = document.createElement('div')
  highlight.id = 'issue-collector-inspect-highlight'
  highlight.style.cssText = `
    position: absolute;
    border: 2px solid #3b82f6;
    background-color: rgba(59, 130, 246, 0.1);
    pointer-events: none;
    z-index: 1000000;
    box-sizing: border-box;
    transition: all 0.1s ease;
    display: none;
  `
  overlay.appendChild(highlight)

  let currentElement: HTMLElement | null = null
  let isActive = true

  /**
   * Update highlight position and size
   */
  const updateHighlight = throttle((element: HTMLElement) => {
    if (!isActive || !element || element === overlay || element === highlight) {
      highlight.style.display = 'none'
      currentElement = null
      return
    }

    // Skip if element is part of the SDK widget
    if (element.closest('#issue-collector-widget')) {
      highlight.style.display = 'none'
      currentElement = null
      return
    }

    const rect = element.getBoundingClientRect()
    highlight.style.display = 'block'
    // CRITICAL: Highlight is inside a fixed overlay, so use viewport coordinates (getBoundingClientRect)
    // NOT document coordinates (scrollX/scrollY) - fixed positioning is relative to viewport
    highlight.style.left = `${rect.left}px`
    highlight.style.top = `${rect.top}px`
    highlight.style.width = `${rect.width}px`
    highlight.style.height = `${rect.height}px`
    currentElement = element
    
    // Debug logging to verify position
    console.log('[Inspect] Highlight updated:', {
      element: element.tagName,
      rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      highlight: { left: highlight.style.left, top: highlight.style.top },
      scroll: { scrollX: window.scrollX, scrollY: window.scrollY },
    })
  }, 50) // Throttle to 50ms

  /**
   * Handle mouse move
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!isActive) return
    
    // Temporarily disable overlay hit-testing so we can get the underlying element
    const prevPointerEvents = overlay.style.pointerEvents
    overlay.style.pointerEvents = 'none'
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
    overlay.style.pointerEvents = prevPointerEvents

    if (target) {
      updateHighlight(target)
    }
  }

  /**
   * Handle click
   */
  const handleClick = (e: MouseEvent) => {
    if (!isActive) return

    e.preventDefault()
    e.stopPropagation()

    // Temporarily disable overlay hit-testing so we can get the underlying element
    const prevPointerEvents = overlay.style.pointerEvents
    overlay.style.pointerEvents = 'none'
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
    overlay.style.pointerEvents = prevPointerEvents
    if (target && currentElement && !target.closest('#issue-collector-widget')) {
      // Find the actual selected element (might be a child)
      let selectedElement: HTMLElement = currentElement

      // If clicked element is a child of highlighted element, use highlighted element
      if (currentElement.contains(target)) {
        selectedElement = currentElement
      } else if (target.contains(currentElement)) {
        selectedElement = target
      } else {
        selectedElement = target
      }

      // Ensure it's an HTMLElement
      if (selectedElement instanceof HTMLElement) {
        // CRITICAL: Get element position BEFORE stopping inspect mode
        // This ensures we capture the correct element position
        const finalRect = selectedElement.getBoundingClientRect()
        console.log('[Inspect] Element clicked, final position:', {
          tagName: selectedElement.tagName,
          id: selectedElement.id,
          rect: {
            left: finalRect.left,
            top: finalRect.top,
            width: finalRect.width,
            height: finalRect.height,
          },
          scroll: {
            scrollX: window.scrollX,
            scrollY: window.scrollY,
          },
        })
        
        // CRITICAL: Show loading overlay IMMEDIATELY before stopping inspect mode
        // This ensures user sees feedback right away
        showLoadingOverlayImmediate()
        
        // Small delay to ensure overlay is rendered before stopping inspect mode
        // This prevents visual glitches and ensures element position is stable
        requestAnimationFrame(() => {
          // Stop inspect mode (removes inspect overlay)
          stopInspectMode()
          
          // Call callback immediately - widget will handle panel opening
          onElementSelected(selectedElement)
        })
      }
    }
  }

  /**
   * Handle ESC key
   */
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isActive) return

    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      stopInspectMode()
      onCancel()
    }
  }

  /**
   * Stop inspect mode
   */
  function stopInspectMode() {
    if (!isActive) return
    isActive = false

    overlay.removeEventListener('mousemove', handleMouseMove)
    overlay.removeEventListener('click', handleClick)
    document.removeEventListener('keydown', handleKeyDown)

    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay)
    }
  }

  // Add event listeners
  overlay.addEventListener('mousemove', handleMouseMove, { passive: true })
  overlay.addEventListener('click', handleClick)
  document.addEventListener('keydown', handleKeyDown)

  // Prevent default behaviors during inspect mode
  overlay.addEventListener('contextmenu', (e) => e.preventDefault())
  overlay.addEventListener('selectstart', (e) => e.preventDefault())

  // Return cleanup function
  return stopInspectMode
}

