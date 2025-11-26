/**
 * @module Floating Button
 * @description Floating button component for opening the issue report modal
 */

/**
 * Create floating button element
 */
export function createButton(shadowRoot: ShadowRoot, onClick: () => void): HTMLElement {
  const button = document.createElement('button')
  button.setAttribute('type', 'button')
  button.setAttribute('aria-label', 'Report Issue')
  button.setAttribute('title', 'Report Issue')
  button.className = 'issue-collector-button'
  button.style.pointerEvents = 'auto'
  
  // Button styles
  const styles = `
    .issue-collector-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #f59e0b;
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      pointer-events: auto !important;
    }
    
    .issue-collector-button svg {
      width: 14px;
      height: 14px;
      display: block;
      flex-shrink: 0;
    }
    
    .issue-collector-button:hover {
      background-color: #d97706;
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.5);
    }
    
    .issue-collector-button:active {
      transform: scale(0.95);
    }
    
    .issue-collector-button:focus {
      outline: 2px solid #f59e0b;
      outline-offset: 2px;
    }
    
    .issue-collector-button.active {
      background-color: #d97706;
      transform: scale(0.95);
    }
  `
  
  // Inject styles into shadow DOM
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  shadowRoot.appendChild(styleElement)
  
  // Button icon (alert triangle - matches theme icon style)
  button.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    </svg>
  `
  
  // Event handlers
  button.addEventListener('click', (e) => {
    e.stopPropagation()
    onClick()
  })
  
  // Keyboard support
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  })
  
  shadowRoot.appendChild(button)
  return button
}

