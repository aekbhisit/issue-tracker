/**
 * @module Panel Component
 * @description Chat-style widget panel with tabbed interface for issue reporting
 */

import type { Severity, IssuePayload, ScreenshotMetadata, ElementSelector, ScreenshotData } from './types'
import { submitIssue, fetchIssues, fetchProjectDetails } from './api'
import { collectMetadata, getUserInfo, collectStorageData } from './metadata'

export type PanelTab = 'submit' | 'list' | 'project'

export interface PanelCallbacks {
  onClose: () => void
  onMinimize: () => void
  onReopen: () => void
  onSubmit: (payload: IssuePayload) => Promise<void>
  onStartInspect?: () => void
  getLogs?: () => import('./types').LogData | undefined
}

/**
 * Convert File to ScreenshotData
 */
function convertFileToScreenshotData(file: File): Promise<ScreenshotData> {
  return new Promise((resolve, reject) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      reject(new Error('Invalid file type. Please select an image file (JPEG, PNG, or WebP).'))
      return
    }
    
    // Validate file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      reject(new Error(`File size exceeds 10MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`))
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        resolve({
          dataUrl,
          mimeType: file.type,
          fileSize: file.size,
          width: img.width,
          height: img.height,
        })
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = dataUrl
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Create panel element with tabbed interface
 */
export function createPanel(
  shadowRoot: ShadowRoot,
  projectKey: string,
  apiUrl: string,
  callbacks: PanelCallbacks
): HTMLElement {
  const panel = document.createElement('div')
  panel.className = 'issue-collector-panel'
  
  // Panel styles
  const styles = `
    .issue-collector-panel {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 400px;
      max-height: calc(100vh - 100px);
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      z-index: 2147483645;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      transform: translateY(0);
      transition: transform 0.3s ease-out, opacity 0.3s ease-out;
      opacity: 1;
      box-sizing: border-box;
      overflow: hidden; /* keep rounded corners, inner content scrolls */
    }
    
    .issue-collector-panel.minimized {
      transform: translateY(calc(100% + 20px));
      opacity: 0;
      pointer-events: none;
    }
    
    @media (max-width: 480px) {
      .issue-collector-panel {
        width: calc(100vw - 40px);
        right: 20px;
        left: 20px;
        max-height: calc(100vh - 100px);
      }
    }
    
    .issue-collector-panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    
    .issue-collector-panel-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    
    .issue-collector-panel-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .issue-collector-panel-close:hover {
      background-color: #f3f4f6;
      color: #111827;
    }
    
    .issue-collector-panel-tabs {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      padding: 0 20px;
      flex-shrink: 0;
      flex-grow: 0;
      background-color: #f9fafb;
    }
    
    .issue-collector-panel-tab {
      padding: 12px 16px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      position: relative;
      bottom: -1px;
    }
    
    .issue-collector-panel-tab:hover {
      color: #111827;
      background-color: #f3f4f6;
    }
    
    .issue-collector-panel-tab.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }
    
    .issue-collector-panel-content {
      flex: 1 1 auto;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 20px;
      padding-bottom: 24px;
      min-height: 0; /* required so flex item can shrink and scroll */
      position: relative;
      -webkit-overflow-scrolling: touch;
    }
    
    .issue-collector-panel-footer {
      padding: 16px 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      background-color: #f9fafb;
      flex-shrink: 0;
      flex-grow: 0;
      width: 100%;
      box-sizing: border-box;
      margin: 0;
      clear: both;
      position: relative;
      z-index: 5;
    }
    
    .issue-collector-form-group {
      margin-bottom: 20px;
      display: block;
      position: relative;
    }
    
    .issue-collector-form-group:last-of-type {
      margin-bottom: 0;
    }
    
    .issue-collector-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }
    
    .issue-collector-label-required::after {
      content: ' *';
      color: #ef4444;
    }
    
    .issue-collector-input,
    .issue-collector-textarea,
    .issue-collector-select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
      background-color: #ffffff;
      color: #111827;
    }
    
    .issue-collector-input::placeholder,
    .issue-collector-textarea::placeholder {
      color: #9ca3af;
    }
    
    .issue-collector-input:focus,
    .issue-collector-textarea:focus,
    .issue-collector-select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .issue-collector-textarea {
      min-height: 120px;
      resize: vertical;
    }
    
    .issue-collector-select {
      background-color: #ffffff;
      color: #111827;
      cursor: pointer;
      position: relative;
      z-index: 1;
    }
    
    .issue-collector-select:focus {
      z-index: 10;
    }
    
    .issue-collector-select option {
      background-color: #ffffff;
      color: #111827;
      padding: 8px 12px;
    }
    
    .issue-collector-error {
      color: #ef4444;
      font-size: 12px;
      margin-top: 4px;
      display: none;
    }
    
    .issue-collector-error.show {
      display: block;
    }
    
    .issue-collector-panel .issue-collector-button,
    .issue-collector-panel button.issue-collector-button {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      font-family: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      white-space: nowrap;
      flex-shrink: 0;
      margin: 0;
      position: static !important;
      bottom: auto !important;
      right: auto !important;
      width: auto !important;
      height: auto !important;
      box-shadow: none !important;
    }
    
    .issue-collector-panel .issue-collector-button-primary,
    .issue-collector-panel button.issue-collector-button-primary {
      background-color: #3b82f6;
      color: white;
    }
    
    .issue-collector-panel .issue-collector-button-primary:hover:not(:disabled),
    .issue-collector-panel button.issue-collector-button-primary:hover:not(:disabled) {
      background-color: #2563eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .issue-collector-panel .issue-collector-button-secondary,
    .issue-collector-panel button.issue-collector-button-secondary {
      background-color: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    
    .issue-collector-panel .issue-collector-button-secondary:hover:not(:disabled),
    .issue-collector-panel button.issue-collector-button-secondary:hover:not(:disabled) {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }
    
    .issue-collector-panel .issue-collector-button:disabled,
    .issue-collector-panel button.issue-collector-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .issue-collector-action-buttons {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .issue-collector-action-button {
      flex: 1;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid #d1d5db;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background-color: white;
      color: #374151;
      position: static !important;
      bottom: auto !important;
      right: auto !important;
      width: auto !important;
      height: auto !important;
      box-shadow: none !important;
      z-index: auto !important;
    }
    
    .issue-collector-action-button:hover {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }
    
    .issue-collector-action-button svg {
      width: 16px;
      height: 16px;
      stroke-width: 2;
    }
    
    .issue-collector-message {
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
      display: none;
    }
    
    .issue-collector-message.show {
      display: block;
    }
    
    .issue-collector-message-success {
      background-color: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    
    .issue-collector-message-error {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    
    .issue-collector-loading {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .issue-collector-screenshot-preview {
      margin-top: 16px;
      padding: 12px;
      border: 1px dashed #d1d5db;
      border-radius: 6px;
      background-color: #f9fafb;
      display: none;
    }
    
    .issue-collector-screenshot-preview.show {
      display: block;
    }
    
    .issue-collector-screenshot-preview img {
      max-width: 100%;
      max-height: 200px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    
    .issue-collector-screenshot-preview-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    
    .issue-collector-tab-content {
      display: none;
    }
    
    .issue-collector-tab-content.active {
      display: block;
    }
    
    .issue-collector-empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #6b7280;
    }
    
    .issue-collector-empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    .issue-collector-list-item {
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .issue-collector-list-item:hover {
      border-color: #3b82f6;
      background-color: #f9fafb;
    }
    
    .issue-collector-list-item-title {
      font-weight: 500;
      color: #111827;
      margin-bottom: 4px;
    }
    
    .issue-collector-list-item-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #6b7280;
    }
    
    .issue-collector-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .issue-collector-badge-severity-low {
      background-color: #dbeafe;
      color: #1e40af;
    }
    
    .issue-collector-badge-severity-medium {
      background-color: #fef3c7;
      color: #92400e;
    }
    
    .issue-collector-badge-severity-high {
      background-color: #fed7aa;
      color: #9a3412;
    }
    
    .issue-collector-badge-severity-critical {
      background-color: #fee2e2;
      color: #991b1b;
    }
    
    .issue-collector-badge-status-open {
      background-color: #dbeafe;
      color: #1e40af;
    }
    
    .issue-collector-badge-status-in-progress {
      background-color: #fef3c7;
      color: #92400e;
    }
    
    .issue-collector-badge-status-resolved {
      background-color: #d1fae5;
      color: #065f46;
    }
    
    .issue-collector-badge-status-closed {
      background-color: #f3f4f6;
      color: #374151;
    }
  `
  
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  shadowRoot.appendChild(styleElement)
  
  // Header
  const header = document.createElement('div')
  header.className = 'issue-collector-panel-header'
  
  const title = document.createElement('h2')
  title.className = 'issue-collector-panel-title'
  title.textContent = 'Report Issue'
  
  const closeButton = document.createElement('button')
  closeButton.className = 'issue-collector-panel-close'
  closeButton.setAttribute('aria-label', 'Close')
  closeButton.innerHTML = '×'
  closeButton.addEventListener('click', callbacks.onClose)
  
  header.appendChild(title)
  header.appendChild(closeButton)
  
  // Tabs
  const tabsContainer = document.createElement('div')
  tabsContainer.className = 'issue-collector-panel-tabs'
  
  const submitTab = document.createElement('button')
  submitTab.className = 'issue-collector-panel-tab active'
  submitTab.textContent = 'Submit'
  submitTab.setAttribute('data-tab', 'submit')
  
  const listTab = document.createElement('button')
  listTab.className = 'issue-collector-panel-tab'
  listTab.textContent = 'List'
  listTab.setAttribute('data-tab', 'list')
  
  const projectTab = document.createElement('button')
  projectTab.className = 'issue-collector-panel-tab'
  projectTab.textContent = 'Project'
  projectTab.setAttribute('data-tab', 'project')
  
  tabsContainer.appendChild(submitTab)
  tabsContainer.appendChild(listTab)
  tabsContainer.appendChild(projectTab)
  
  // Content area
  const content = document.createElement('div')
  content.className = 'issue-collector-panel-content'
  
  // Tab contents
  const submitContent = document.createElement('div')
  submitContent.className = 'issue-collector-tab-content active'
  submitContent.setAttribute('data-tab-content', 'submit')
  
  const listContent = document.createElement('div')
  listContent.className = 'issue-collector-tab-content'
  listContent.setAttribute('data-tab-content', 'list')
  
  const projectContent = document.createElement('div')
  projectContent.className = 'issue-collector-tab-content'
  projectContent.setAttribute('data-tab-content', 'project')
  
  content.appendChild(submitContent)
  content.appendChild(listContent)
  content.appendChild(projectContent)
  
  // Footer
  const footer = document.createElement('div')
  footer.className = 'issue-collector-panel-footer'
  
  // Current tab state
  let currentTab: PanelTab = 'submit'
  let currentScreenshot: ScreenshotMetadata | undefined = undefined
  
  // Tab switching
  function switchTab(tab: PanelTab) {
    currentTab = tab
    
    // Update tab buttons
    tabsContainer.querySelectorAll('.issue-collector-panel-tab').forEach((btn) => {
      btn.classList.remove('active')
      if (btn.getAttribute('data-tab') === tab) {
        btn.classList.add('active')
      }
    })
    
    // Update tab contents
    content.querySelectorAll('.issue-collector-tab-content').forEach((tabContent) => {
      tabContent.classList.remove('active')
      if (tabContent.getAttribute('data-tab-content') === tab) {
        tabContent.classList.add('active')
        
        // Refresh data when switching to List or Project tab
        if (tab === 'list' && (tabContent as any).refresh) {
          ;(tabContent as any).refresh()
        } else if (tab === 'project' && (tabContent as any).refresh) {
          ;(tabContent as any).refresh()
        }
      }
    })
    
    // Update footer based on tab
    updateFooter()
  }
  
  // Tab click handlers
  submitTab.addEventListener('click', () => switchTab('submit'))
  listTab.addEventListener('click', () => switchTab('list'))
  projectTab.addEventListener('click', () => switchTab('project'))
  
  // Initialize Submit tab
  initializeSubmitTab(submitContent, footer, callbacks)
  
  // Initialize List tab
  initializeListTab(listContent, projectKey, apiUrl)
  
  // Initialize Project tab
  initializeProjectTab(projectContent, projectKey, apiUrl)
  
  // Assemble panel
  panel.appendChild(header)
  panel.appendChild(tabsContainer)
  panel.appendChild(content)
  panel.appendChild(footer)
  
  // Store callbacks and config on panel for access
  ;(panel as any).callbacks = callbacks
  ;(panel as any).projectKey = projectKey
  ;(panel as any).apiUrl = apiUrl
  ;(panel as any).currentScreenshot = currentScreenshot
  
  // Export methods
  ;(panel as any).minimize = () => {
    panel.classList.add('minimized')
    callbacks.onMinimize()
  }
  
  ;(panel as any).reopen = () => {
    panel.classList.remove('minimized')
    callbacks.onReopen()
  }
  
  ;(panel as any).updateScreenshot = (screenshot: ScreenshotMetadata) => {
    console.log('[SDK Panel] updateScreenshot called:', {
      hasScreenshot: !!screenshot.screenshot,
      hasSelector: !!screenshot.selector,
      selectorDetails: screenshot.selector ? {
        cssSelector: screenshot.selector.cssSelector?.substring(0, 50) + '...',
        xpath: screenshot.selector.xpath?.substring(0, 50) + '...',
        outerHTML: screenshot.selector.outerHTML?.substring(0, 100) + '...',
        boundingBox: screenshot.selector.boundingBox,
      } : null,
    })
    currentScreenshot = screenshot
    ;(panel as any).currentScreenshot = screenshot
    console.log('[SDK Panel] Screenshot stored on panel, currentScreenshot set:', {
      exists: !!(panel as any).currentScreenshot,
      hasScreenshot: !!(panel as any).currentScreenshot?.screenshot,
      hasSelector: !!(panel as any).currentScreenshot?.selector,
    })
    updateScreenshotPreview(submitContent)
  }
  
  ;(panel as any).showLoadingScreenshot = (selector: ElementSelector) => {
    console.log('[SDK Panel] showLoadingScreenshot called with selector')
    // Store selector immediately, screenshot will be added later
    currentScreenshot = {
      screenshot: null as any, // Will be set when screenshot is captured
      selector,
    } as any
    ;(panel as any).currentScreenshot = currentScreenshot
    updateScreenshotPreview(submitContent, true) // Pass loading flag
  }
  
  ;(panel as any).switchTab = switchTab
  
  // Update footer function
  function updateFooter() {
    footer.innerHTML = ''
    
    if (currentTab === 'submit') {
      // Get the form from submit content
      const submitContent = content.querySelector('[data-tab-content="submit"]') as HTMLElement
      const form = submitContent?.querySelector('form') as HTMLFormElement
      
      if (form) {
        const submitButton = document.createElement('button')
        submitButton.type = 'submit'
        submitButton.className = 'issue-collector-button issue-collector-button-primary'
        submitButton.textContent = 'Submit Issue'
        submitButton.style.cssText = 'min-width: 120px;'
        
        // Connect button to form
        submitButton.setAttribute('form', form.id || 'issue-form')
        footer.appendChild(submitButton)
      }
    }
  }
  
  // Initial footer setup
  updateFooter()
  
  return panel
}

/**
 * Initialize Submit tab
 */
function initializeSubmitTab(
  content: HTMLElement,
  footer: HTMLElement,
  callbacks: PanelCallbacks
) {
  const messageDiv = document.createElement('div')
  messageDiv.className = 'issue-collector-message'
  content.appendChild(messageDiv)
  
  // Action buttons container - at top of form
  const actionsContainer = document.createElement('div')
  actionsContainer.className = 'issue-collector-action-buttons'
  
  // Inspect button
  const inspectButton = document.createElement('button')
  inspectButton.type = 'button'
  inspectButton.className = 'issue-collector-action-button'
  inspectButton.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12h20M12 2v20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"></path>
    </svg>
    Inspect Element
  `
  inspectButton.setAttribute('title', 'Select element to capture')
  inspectButton.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const panel = content.closest('.issue-collector-panel') as any
    if (panel && panel.callbacks && panel.callbacks.onStartInspect) {
      panel.callbacks.onStartInspect()
    }
  })
  
  // Upload Image button
  const uploadButton = document.createElement('button')
  uploadButton.type = 'button'
  uploadButton.className = 'issue-collector-action-button'
  uploadButton.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
    Upload Image
  `
  uploadButton.setAttribute('title', 'Upload an image file')
  
  // Hidden file input
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/jpeg,image/jpg,image/png,image/webp'
  fileInput.style.display = 'none'
  fileInput.setAttribute('aria-label', 'Upload image file')
  
  // File upload handler
  uploadButton.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    fileInput.click()
  })
  
  fileInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    const panel = content.closest('.issue-collector-panel') as any
    if (!panel) return
    
    try {
      // Convert file to ScreenshotData
      const screenshotData = await convertFileToScreenshotData(file)
      
      // Create ScreenshotMetadata without selector (uploaded images don't have selectors)
      const screenshotMetadata: ScreenshotMetadata = {
        screenshot: screenshotData,
        // selector is optional, so we can omit it for uploaded images
      }
      
      // Update panel with uploaded image
      if ((panel as any).updateScreenshot) {
        ;(panel as any).updateScreenshot(screenshotMetadata)
      }
    } catch (error) {
      console.error('[SDK] Failed to process uploaded image:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to process image'
      alert(`Error: ${errorMsg}`)
    } finally {
      // Reset file input to allow selecting the same file again
      fileInput.value = ''
    }
  })
  
  actionsContainer.appendChild(inspectButton)
  actionsContainer.appendChild(uploadButton)
  content.appendChild(actionsContainer)
  content.appendChild(fileInput)
  
  // Form
  const form = document.createElement('form')
  form.id = 'issue-form'
  
  // Title field
  const titleGroup = document.createElement('div')
  titleGroup.className = 'issue-collector-form-group'
  const titleLabel = document.createElement('label')
  titleLabel.className = 'issue-collector-label issue-collector-label-required'
  titleLabel.textContent = 'Title'
  titleLabel.setAttribute('for', 'issue-title')
  const titleInput = document.createElement('input')
  titleInput.type = 'text'
  titleInput.id = 'issue-title'
  titleInput.className = 'issue-collector-input'
  titleInput.required = true
  titleInput.maxLength = 255
  titleInput.placeholder = 'Enter issue title'
  const titleError = document.createElement('div')
  titleError.className = 'issue-collector-error'
  titleError.textContent = 'Title is required'
  titleGroup.appendChild(titleLabel)
  titleGroup.appendChild(titleInput)
  titleGroup.appendChild(titleError)
  
  // Description field
  const descGroup = document.createElement('div')
  descGroup.className = 'issue-collector-form-group'
  const descLabel = document.createElement('label')
  descLabel.className = 'issue-collector-label issue-collector-label-required'
  descLabel.textContent = 'Description'
  descLabel.setAttribute('for', 'issue-description')
  const descTextarea = document.createElement('textarea')
  descTextarea.id = 'issue-description'
  descTextarea.className = 'issue-collector-textarea'
  descTextarea.required = true
  descTextarea.maxLength = 5000
  descTextarea.placeholder = 'Describe the issue in detail'
  const descError = document.createElement('div')
  descError.className = 'issue-collector-error'
  descError.textContent = 'Description is required'
  descGroup.appendChild(descLabel)
  descGroup.appendChild(descTextarea)
  descGroup.appendChild(descError)
  
  // Severity field
  const severityGroup = document.createElement('div')
  severityGroup.className = 'issue-collector-form-group'
  const severityLabel = document.createElement('label')
  severityLabel.className = 'issue-collector-label issue-collector-label-required'
  severityLabel.textContent = 'Severity'
  severityLabel.setAttribute('for', 'issue-severity')
  const severitySelect = document.createElement('select')
  severitySelect.id = 'issue-severity'
  severitySelect.className = 'issue-collector-select'
  severitySelect.required = true
  const severities: Severity[] = ['low', 'medium', 'high', 'critical']
  severities.forEach(severity => {
    const option = document.createElement('option')
    option.value = severity
    option.textContent = severity.charAt(0).toUpperCase() + severity.slice(1)
    severitySelect.appendChild(option)
  })
  severitySelect.value = 'medium'
  severityGroup.appendChild(severityLabel)
  severityGroup.appendChild(severitySelect)
  
  form.appendChild(titleGroup)
  form.appendChild(descGroup)
  form.appendChild(severityGroup)
  
  // Screenshot preview area (initially hidden)
  const screenshotPreview = document.createElement('div')
  screenshotPreview.className = 'issue-collector-screenshot-preview'
  form.appendChild(screenshotPreview)
  
  content.appendChild(form)
  
  // Form submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    // Get callbacks from panel
    const panel = content.closest('.issue-collector-panel') as any
    if (!panel || !panel.callbacks) return
    
    const panelCallbacks = panel.callbacks as PanelCallbacks
    
    // Reset errors
    titleError.classList.remove('show')
    descError.classList.remove('show')
    messageDiv.classList.remove('show')
    
    // Validate
    let isValid = true
    if (!titleInput.value.trim()) {
      titleError.classList.add('show')
      isValid = false
    }
    if (!descTextarea.value.trim()) {
      descError.classList.add('show')
      isValid = false
    }
    
    if (!isValid) {
      return
    }
    
    // Show loading
    const submitBtn = footer.querySelector('button[type="submit"]') as HTMLButtonElement
    if (submitBtn) {
      submitBtn.disabled = true
      submitBtn.innerHTML = '<span class="issue-collector-loading"></span>Submitting...'
    }
    
    try {
      // Collect metadata
      const metadata = collectMetadata()
      const userInfo = getUserInfo()
      
      // Get screenshot from panel
      const currentScreenshot = (panel as any).currentScreenshot
      console.log('[SDK] Form submission - currentScreenshot:', {
        exists: !!currentScreenshot,
        hasScreenshot: currentScreenshot?.screenshot ? {
          width: currentScreenshot.screenshot.width,
          height: currentScreenshot.screenshot.height,
          fileSize: currentScreenshot.screenshot.fileSize,
          mimeType: currentScreenshot.screenshot.mimeType,
          dataUrlLength: currentScreenshot.screenshot.dataUrl?.length || 0,
        } : null,
        hasSelector: currentScreenshot?.selector ? {
          cssSelector: currentScreenshot.selector.cssSelector,
          xpath: currentScreenshot.selector.xpath,
          outerHTMLLength: currentScreenshot.selector.outerHTML?.length || 0,
          hasBoundingBox: !!currentScreenshot.selector.boundingBox,
        } : null,
      })
      
      // Get form data if available (from inspect mode)
      const formData = (panel as any).formData
      
      // Collect storage data
      const storageData = collectStorageData()
      
      // Get logs if callback is available
      const logs = panelCallbacks.getLogs ? panelCallbacks.getLogs() : undefined
      
      // Create payload
      // Ensure screenshot is valid (has either screenshot data or selector, or both)
      let validScreenshot: ScreenshotMetadata | undefined = currentScreenshot
      if (currentScreenshot) {
        // Only include screenshot if it has either screenshot data or selector
        if (!currentScreenshot.screenshot && !currentScreenshot.selector) {
          // Invalid screenshot metadata, don't include it
          validScreenshot = undefined
        } else if (!currentScreenshot.screenshot && currentScreenshot.selector) {
          // Valid: has selector but no screenshot (screenshot capture failed)
          // This is acceptable - selector data is still useful
          validScreenshot = currentScreenshot
        } else if (currentScreenshot.screenshot && !currentScreenshot.selector) {
          // Valid: has screenshot but no selector (uploaded image)
          // This is acceptable - uploaded images don't have selectors
          validScreenshot = currentScreenshot
        }
      }
      
      const payload: IssuePayload = {
        projectKey: panel.projectKey,
        title: titleInput.value.trim(),
        description: descTextarea.value.trim(),
        severity: severitySelect.value as Severity,
        metadata,
        userInfo,
        screenshot: validScreenshot,
        logs,
        storageData,
        formData,
      }
      
      console.log('[SDK] Payload created for submission:', {
        projectKey: payload.projectKey,
        title: payload.title,
        hasScreenshot: !!payload.screenshot,
        screenshotDetails: payload.screenshot ? {
          hasScreenshotData: !!payload.screenshot.screenshot,
          hasSelector: !!payload.screenshot.selector,
          selectorDetails: payload.screenshot.selector ? {
            cssSelector: payload.screenshot.selector.cssSelector?.substring(0, 50) + '...',
            xpath: payload.screenshot.selector.xpath?.substring(0, 50) + '...',
            outerHTML: payload.screenshot.selector.outerHTML?.substring(0, 100) + '...',
            boundingBox: payload.screenshot.selector.boundingBox,
          } : null,
        } : null,
        hasLogs: !!payload.logs,
        hasFormData: !!payload.formData,
      })
      
      // Submit
      console.log('[SDK] Submitting issue to API:', panel.apiUrl)
      const response = await submitIssue(payload, panel.apiUrl)
      console.log('[SDK] API response:', response)
      
      if (response.success) {
        // Show success message
        messageDiv.className = 'issue-collector-message issue-collector-message-success show'
        messageDiv.textContent = response.message || 'Issue submitted successfully!'
        
        // Reset form
        titleInput.value = ''
        descTextarea.value = ''
        severitySelect.value = 'medium'
        screenshotPreview.classList.remove('show')
        screenshotPreview.innerHTML = ''
        ;(panel as any).currentScreenshot = undefined
        
        // Close panel after delay
        setTimeout(() => {
          panelCallbacks.onClose()
        }, 1500)
      } else {
        // Show error message
        messageDiv.className = 'issue-collector-message issue-collector-message-error show'
        messageDiv.textContent = response.error || 'Failed to submit issue. Please try again.'
        
        if (submitBtn) {
          submitBtn.disabled = false
          submitBtn.textContent = 'Submit Issue'
        }
      }
    } catch (error) {
      messageDiv.className = 'issue-collector-message issue-collector-message-error show'
      messageDiv.textContent = error instanceof Error ? error.message : 'An unexpected error occurred'
      
      const submitBtn = footer.querySelector('button[type="submit"]') as HTMLButtonElement
      if (submitBtn) {
        submitBtn.disabled = false
        submitBtn.textContent = 'Submit Issue'
      }
    }
  })
  
  // Store references for later use
  ;(content as any).form = form
  ;(content as any).titleInput = titleInput
  ;(content as any).descTextarea = descTextarea
  ;(content as any).severitySelect = severitySelect
  ;(content as any).screenshotPreview = screenshotPreview
  ;(content as any).messageDiv = messageDiv
}

/**
 * Update screenshot preview in Submit tab
 */
function updateScreenshotPreview(content: HTMLElement, isLoading: boolean = false, errorMessage?: string) {
  const screenshotPreview = (content as any).screenshotPreview as HTMLElement
  if (!screenshotPreview) return
  
  const panel = content.closest('.issue-collector-panel') as any
  const currentScreenshot = panel?.currentScreenshot as ScreenshotMetadata | undefined
  
  if (currentScreenshot) {
    const selector = currentScreenshot.selector
    const hasScreenshot = currentScreenshot.screenshot && currentScreenshot.screenshot.dataUrl

    const selectorSummary = selector
      ? selector.cssSelector || selector.xpath || ''
      : ''
    const truncatedSelector =
      selectorSummary.length > 80 ? selectorSummary.slice(0, 77) + '…' : selectorSummary

    const outerHtml = selector?.outerHTML || ''
    
    // For uploaded images (no selector), show a different message
    const isUploadedImage = hasScreenshot && !selector
    const maxOuterHtmlLength = 800
    const truncatedOuterHtml =
      outerHtml.length > maxOuterHtmlLength
        ? outerHtml.slice(0, maxOuterHtmlLength - 3) + '...'
        : outerHtml

    screenshotPreview.classList.add('show')
    
    // Show error state if screenshot capture failed
    if (errorMessage) {
      screenshotPreview.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; min-height: 200px;">
          <div style="width: 48px; height: 48px; margin-bottom: 16px; color: #ef4444;">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div style="font-size: 14px; font-weight: 500; color: #dc2626; margin-bottom: 4px;">Screenshot Capture Failed</div>
          <div style="font-size: 12px; color: #6b7280; text-align: center; margin-bottom: 16px;">${escapeHtml(errorMessage)}</div>
          <div style="font-size: 12px; color: #059669; padding: 8px 12px; background-color: #d1fae5; border-radius: 6px; text-align: center;">
            ✓ Element selector information has been captured
          </div>
        </div>
        ${
          truncatedSelector
            ? `<div style="margin-top: 16px; padding: 12px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                 <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Selected Element</div>
                 <div style="font-family: monospace; font-size: 11px; color: #4b5563; word-break: break-all;">
                   ${escapeHtml(truncatedSelector)}
                 </div>
               </div>`
            : ''
        }
        ${
          truncatedOuterHtml
            ? `<div style="margin-top: 12px; padding: 12px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                 <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Element HTML</div>
                 <pre style="max-height: 120px; overflow: auto; padding: 8px; background-color: #ffffff; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 11px; white-space: pre-wrap; word-break: break-all; margin: 0; color: #4b5563;">
${escapeHtml(truncatedOuterHtml)}
                 </pre>
               </div>`
            : ''
        }
        <div class="issue-collector-screenshot-preview-actions" style="margin-top: 12px; display: flex; gap: 8px;">
          <button type="button" class="issue-collector-button issue-collector-button-secondary" data-action="retake" style="flex: 1;">
            Try Again
          </button>
          <button type="button" class="issue-collector-button issue-collector-button-secondary" data-action="remove" style="flex: 1;">
            Remove
          </button>
        </div>
      `
      // Attach event handlers
      screenshotPreview.querySelector('[data-action="retake"]')?.addEventListener('click', () => {
        const panel = content.closest('.issue-collector-panel') as any
        if (panel && panel.callbacks && panel.callbacks.onStartInspect) {
          panel.callbacks.onStartInspect()
        }
      })
      screenshotPreview.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
        screenshotPreview.classList.remove('show')
        screenshotPreview.innerHTML = ''
        const panel = content.closest('.issue-collector-panel') as any
        if (panel) {
          panel.currentScreenshot = undefined
        }
      })
      return
    }
    
    // Show loading state if screenshot is not yet available
    if (isLoading || !hasScreenshot) {
      screenshotPreview.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; min-height: 200px;">
          <div style="width: 48px; height: 48px; border: 4px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
          <div style="font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 4px;">Capturing screenshot...</div>
          <div style="font-size: 12px; color: #6b7280;">Please wait while we capture the element</div>
        </div>
        ${
          truncatedSelector
            ? `<div style="margin-top: 16px; padding: 12px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                 <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Selected Element</div>
                 <div style="font-family: monospace; font-size: 11px; color: #4b5563; word-break: break-all;">
                   ${escapeHtml(truncatedSelector)}
                 </div>
               </div>`
            : ''
        }
        ${
          truncatedOuterHtml
            ? `<div style="margin-top: 12px; padding: 12px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                 <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">Element HTML</div>
                 <pre style="max-height: 120px; overflow: auto; padding: 8px; background-color: #ffffff; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 11px; white-space: pre-wrap; word-break: break-all; margin: 0; color: #4b5563;">
${escapeHtml(truncatedOuterHtml)}
                 </pre>
               </div>`
            : ''
        }
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `
      return
    }
    
    // Show complete screenshot preview
    screenshotPreview.innerHTML = `
      <img src="${currentScreenshot.screenshot.dataUrl}" alt="Screenshot preview" style="max-width: 100%; height: auto; border-radius: 6px;" />
      ${
        isUploadedImage
          ? `<div style="margin-top: 12px; padding: 12px; background-color: #eff6ff; border-radius: 6px; border: 1px solid #bfdbfe;">
               <div style="font-size: 12px; font-weight: 600; color: #1e40af; margin-bottom: 4px;">Uploaded Image</div>
               <div style="font-size: 11px; color: #3b82f6;">
                 ${currentScreenshot.screenshot.width} × ${currentScreenshot.screenshot.height} pixels • ${(currentScreenshot.screenshot.fileSize / 1024).toFixed(1)} KB
               </div>
             </div>`
          : ''
      }
      ${
        truncatedSelector && !isUploadedImage
          ? `<div style="margin-top: 4px; font-size: 12px; color: #4b5563;">
               <div style="font-weight: 500; margin-bottom: 2px;">Selected element</div>
               <div style="font-family: monospace; word-break: break-all;">
                 ${escapeHtml(truncatedSelector)}
               </div>
             </div>`
          : ''
      }
      ${
        truncatedOuterHtml && !isUploadedImage
          ? `<div style="margin-top: 6px; font-size: 12px; color: #4b5563;">
               <div style="font-weight: 500; margin-bottom: 2px;">Selected element HTML</div>
               <pre style="max-height: 160px; overflow: auto; padding: 8px; background-color: #f3f4f6; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 11px; white-space: pre-wrap; word-break: break-all;">
${escapeHtml(truncatedOuterHtml)}
               </pre>
             </div>`
          : ''
      }
      <div class="issue-collector-screenshot-preview-actions">
        ${isUploadedImage 
          ? `<button type="button" class="issue-collector-button issue-collector-button-secondary" data-action="change" style="flex: 1;">
               Change Image
             </button>`
          : `<button type="button" class="issue-collector-button issue-collector-button-secondary" data-action="retake" style="flex: 1;">
               Retake
             </button>`
        }
        <button type="button" class="issue-collector-button issue-collector-button-secondary" data-action="remove" style="flex: 1;">
          Remove
        </button>
      </div>
    `
    
    // Handle change/retake button
    const changeRetakeButton = screenshotPreview.querySelector('[data-action="change"], [data-action="retake"]')
    if (changeRetakeButton) {
      changeRetakeButton.addEventListener('click', () => {
        if (isUploadedImage) {
          // For uploaded images, trigger file input again
          const fileInput = content.querySelector('input[type="file"]') as HTMLInputElement
          if (fileInput) {
            fileInput.click()
          }
        } else {
          // For inspect element, start inspect mode again
          const panel = content.closest('.issue-collector-panel') as any
          if (panel && panel.callbacks && panel.callbacks.onStartInspect) {
            panel.callbacks.onStartInspect()
          }
        }
      })
    }
    
    // Handle remove button
    screenshotPreview.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
      screenshotPreview.classList.remove('show')
      screenshotPreview.innerHTML = ''
      const panel = content.closest('.issue-collector-panel') as any
      if (panel) {
        panel.currentScreenshot = undefined
      }
    })
  } else {
    screenshotPreview.classList.remove('show')
    screenshotPreview.innerHTML = ''
  }
}

/**
 * Initialize List tab with API integration
 */
function initializeListTab(content: HTMLElement, projectKey: string, apiUrl: string) {
  let currentPage = 1
  const limit = 10
  
  const loadIssues = async () => {
    // Show loading state
    content.innerHTML = `
      <div class="issue-collector-empty-state">
        <div class="issue-collector-empty-state-icon">📋</div>
        <div>Loading issues...</div>
      </div>
    `
    
    const result = await fetchIssues(projectKey, apiUrl, currentPage, limit)
    
    if (!result.success || !result.data) {
      content.innerHTML = `
        <div class="issue-collector-empty-state">
          <div class="issue-collector-empty-state-icon">⚠️</div>
          <div>${result.error || 'Failed to load issues'}</div>
        </div>
      `
      return
    }
    
    const { data: issues, pagination } = result.data
    
    if (issues.length === 0) {
      content.innerHTML = `
        <div class="issue-collector-empty-state">
          <div class="issue-collector-empty-state-icon">📋</div>
          <div>No issues found</div>
        </div>
      `
      return
    }
    
    // Clear content
    content.innerHTML = ''
    
    // Create list container
    const listContainer = document.createElement('div')
    
    // Add issues
    issues.forEach((issue) => {
      const item = document.createElement('div')
      item.className = 'issue-collector-list-item'
      
      const severityClass = `issue-collector-badge-severity-${issue.severity}`
      const statusClass = `issue-collector-badge-status-${issue.status}`
      
      const date = new Date(issue.createdAt).toLocaleDateString()
      
      item.innerHTML = `
        <div class="issue-collector-list-item-title">${escapeHtml(issue.title)}</div>
        <div class="issue-collector-list-item-meta">
          <span class="issue-collector-badge ${severityClass}">${issue.severity}</span>
          <span class="issue-collector-badge ${statusClass}">${issue.status}</span>
          <span>${date}</span>
        </div>
      `
      
      listContainer.appendChild(item)
    })
    
    // Add pagination if needed
    if (pagination.totalPages > 1) {
      const paginationDiv = document.createElement('div')
      paginationDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;'
      
      const prevButton = document.createElement('button')
      prevButton.className = 'issue-collector-button issue-collector-button-secondary'
      prevButton.textContent = 'Previous'
      prevButton.disabled = currentPage === 1
      prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--
          loadIssues()
        }
      })
      
      const nextButton = document.createElement('button')
      nextButton.className = 'issue-collector-button issue-collector-button-secondary'
      nextButton.textContent = 'Next'
      nextButton.disabled = currentPage >= pagination.totalPages
      nextButton.addEventListener('click', () => {
        if (currentPage < pagination.totalPages) {
          currentPage++
          loadIssues()
        }
      })
      
      const pageInfo = document.createElement('span')
      pageInfo.style.cssText = 'font-size: 14px; color: #6b7280;'
      pageInfo.textContent = `Page ${currentPage} of ${pagination.totalPages}`
      
      paginationDiv.appendChild(prevButton)
      paginationDiv.appendChild(pageInfo)
      paginationDiv.appendChild(nextButton)
      
      listContainer.appendChild(paginationDiv)
    }
    
    content.appendChild(listContainer)
  }
  
  // Load issues on initialization
  loadIssues()
  
  // Store load function for refresh
  ;(content as any).refresh = loadIssues
}

/**
 * Initialize Project Details tab with API integration
 */
function initializeProjectTab(content: HTMLElement, projectKey: string, apiUrl: string) {
  const loadProjectDetails = async () => {
    // Show loading state
    content.innerHTML = `
      <div class="issue-collector-empty-state">
        <div class="issue-collector-empty-state-icon">ℹ️</div>
        <div>Loading project details...</div>
      </div>
    `
    
    const result = await fetchProjectDetails(projectKey, apiUrl)
    
    if (!result.success || !result.data) {
      content.innerHTML = `
        <div class="issue-collector-empty-state">
          <div class="issue-collector-empty-state-icon">⚠️</div>
          <div>${result.error || 'Failed to load project details'}</div>
        </div>
      `
      return
    }
    
    const project = result.data
    
    // Clear content
    content.innerHTML = ''
    
    // Create details container
    const detailsContainer = document.createElement('div')
    detailsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 16px;'
    
    // Project name
    const nameDiv = document.createElement('div')
    nameDiv.innerHTML = `
      <div class="issue-collector-label" style="margin-bottom: 4px;">Project Name</div>
      <div style="font-size: 18px; font-weight: 600; color: #111827;">${escapeHtml(project.name)}</div>
    `
    detailsContainer.appendChild(nameDiv)
    
    // Public key
    const keyDiv = document.createElement('div')
    keyDiv.innerHTML = `
      <div class="issue-collector-label" style="margin-bottom: 4px;">Public Key</div>
      <div style="font-family: monospace; font-size: 12px; color: #6b7280; word-break: break-all; padding: 8px; background-color: #f9fafb; border-radius: 4px;">${escapeHtml(project.publicKey)}</div>
    `
    detailsContainer.appendChild(keyDiv)
    
    // Status
    const statusDiv = document.createElement('div')
    const statusBadge = project.status 
      ? '<span class="issue-collector-badge" style="background-color: #d1fae5; color: #065f46;">Active</span>'
      : '<span class="issue-collector-badge" style="background-color: #fee2e2; color: #991b1b;">Inactive</span>'
    statusDiv.innerHTML = `
      <div class="issue-collector-label" style="margin-bottom: 4px;">Status</div>
      <div>${statusBadge}</div>
    `
    detailsContainer.appendChild(statusDiv)
    
    // Allowed domains
    const domainsDiv = document.createElement('div')
    domainsDiv.innerHTML = `
      <div class="issue-collector-label" style="margin-bottom: 4px;">Allowed Domains</div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        ${project.allowedDomains.length > 0 
          ? project.allowedDomains.map(domain => `<div style="font-family: monospace; font-size: 12px; color: #6b7280; padding: 4px 8px; background-color: #f9fafb; border-radius: 4px;">${escapeHtml(domain)}</div>`).join('')
          : '<div style="color: #6b7280; font-style: italic;">No restrictions</div>'
        }
      </div>
    `
    detailsContainer.appendChild(domainsDiv)
    
    // Confirmation message
    const confirmDiv = document.createElement('div')
    confirmDiv.style.cssText = 'margin-top: 16px; padding: 12px; background-color: #dbeafe; border-radius: 6px; color: #1e40af; font-size: 14px;'
    confirmDiv.textContent = '✓ Correct project is embedded'
    detailsContainer.appendChild(confirmDiv)
    
    content.appendChild(detailsContainer)
  }
  
  // Load project details on initialization
  loadProjectDetails()
  
  // Store load function for refresh
  ;(content as any).refresh = loadProjectDetails
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
