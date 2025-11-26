/**
 * @module Modal Component
 * @description Modal dialog for issue reporting form with screenshot preview
 */

import type { Severity, IssuePayload, ScreenshotMetadata } from './types'
import { submitIssue } from './api'
import { collectMetadata, getUserInfo } from './metadata'

export interface ModalCallbacks {
  onClose: () => void
  onSubmit: (payload: IssuePayload) => Promise<void>
  onStartInspect?: () => void  // Callback to start inspect mode
  getLogs?: () => import('./types').LogData | undefined  // Callback to get logs from widget
}

export interface ModalState {
  currentView: 'form' | 'preview'
  screenshot?: ScreenshotMetadata
}

/**
 * Create modal element with form
 */
export function createModal(
  shadowRoot: ShadowRoot,
  projectKey: string,
  apiUrl: string,
  callbacks: ModalCallbacks
): HTMLElement {
  const overlay = document.createElement('div')
  overlay.className = 'issue-collector-overlay'
  
  const modal = document.createElement('div')
  modal.className = 'issue-collector-modal'
  
  // Modal styles
  const styles = `
    .issue-collector-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000000;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .issue-collector-modal {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    
    .issue-collector-modal-header {
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .issue-collector-modal-title {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    
    .issue-collector-modal-close {
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
    
    .issue-collector-modal-close:hover {
      background-color: #f3f4f6;
      color: #111827;
    }
    
    .issue-collector-modal-body {
      padding: 20px;
      flex: 1;
    }
    
    .issue-collector-form-group {
      margin-bottom: 20px;
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
    
    .issue-collector-error {
      color: #ef4444;
      font-size: 12px;
      margin-top: 4px;
      display: none;
    }
    
    .issue-collector-error.show {
      display: block;
    }
    
    .issue-collector-modal-footer {
      padding: 16px 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      background-color: #f9fafb;
    }
    
    .issue-collector-button {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    .issue-collector-button-primary {
      background-color: #3b82f6;
      color: white;
    }
    
    .issue-collector-button-primary:hover:not(:disabled) {
      background-color: #2563eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .issue-collector-button-secondary {
      background-color: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    
    .issue-collector-button-secondary:hover:not(:disabled) {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }
    
    .issue-collector-screenshot-button {
      background-color: #f9fafb;
      border: 1px dashed #d1d5db;
      color: #6b7280;
    }
    
    .issue-collector-screenshot-button:hover {
      background-color: #f3f4f6;
      border-color: #9ca3af;
      color: #374151;
    }
    
    .issue-collector-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
      margin-right: 8px;
      vertical-align: middle;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .issue-collector-preview-container {
      display: none;
    }
    
    .issue-collector-preview-container.show {
      display: block;
    }
    
    .issue-collector-preview-image {
      max-width: 100%;
      max-height: 400px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .issue-collector-preview-metadata {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 20px;
    }
    
    .issue-collector-preview-metadata-item {
      margin-bottom: 12px;
    }
    
    .issue-collector-preview-metadata-item:last-child {
      margin-bottom: 0;
    }
    
    .issue-collector-preview-metadata-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .issue-collector-preview-metadata-value {
      font-size: 13px;
      color: #111827;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      word-break: break-all;
      background-color: white;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    
    .issue-collector-preview-html-toggle {
      cursor: pointer;
      color: #3b82f6;
      font-size: 12px;
      margin-top: 4px;
      user-select: none;
    }
    
    .issue-collector-preview-html-toggle:hover {
      text-decoration: underline;
    }
    
    .issue-collector-preview-html-content {
      display: none;
      max-height: 200px;
      overflow-y: auto;
      margin-top: 8px;
      font-size: 11px;
    }
    
    .issue-collector-preview-html-content.show {
      display: block;
    }
    
    .issue-collector-form-container {
      display: block;
    }
    
    .issue-collector-form-container.hidden {
      display: none;
    }
  `
  
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  shadowRoot.appendChild(styleElement)
  
  // Header
  const header = document.createElement('div')
  header.className = 'issue-collector-modal-header'
  
  const title = document.createElement('h2')
  title.className = 'issue-collector-modal-title'
  title.textContent = 'Report Issue'
  
  const closeButton = document.createElement('button')
  closeButton.className = 'issue-collector-modal-close'
  closeButton.setAttribute('aria-label', 'Close')
  closeButton.innerHTML = '×'
  closeButton.addEventListener('click', callbacks.onClose)
  
  header.appendChild(title)
  header.appendChild(closeButton)
  
  // Body
  const body = document.createElement('div')
  body.className = 'issue-collector-modal-body'
  
  // Message container
  const messageDiv = document.createElement('div')
  messageDiv.className = 'issue-collector-message'
  body.appendChild(messageDiv)
  
  // Form container
  const formContainer = document.createElement('div')
  formContainer.className = 'issue-collector-form-container'
  
  // Preview container
  const previewContainer = document.createElement('div')
  previewContainer.className = 'issue-collector-preview-container'
  
  // Form
  const form = document.createElement('form')
  
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
  
  // Screenshot button - styled as an action button
  const screenshotGroup = document.createElement('div')
  screenshotGroup.className = 'issue-collector-form-group'
  screenshotGroup.style.cssText = 'margin-top: 8px;'
  const screenshotButton = document.createElement('button')
  screenshotButton.type = 'button'
  screenshotButton.className = 'issue-collector-button issue-collector-button-secondary issue-collector-screenshot-button'
  screenshotButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: middle;">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
    Capture Screenshot
  `
  screenshotButton.style.cssText = 'width: 100%; display: flex; align-items: center; justify-content: center; padding: 10px 16px;'
  screenshotButton.addEventListener('click', () => {
    if (callbacks.onStartInspect) {
      callbacks.onStartInspect()
    }
  })
  screenshotGroup.appendChild(screenshotButton)
  
  form.appendChild(titleGroup)
  form.appendChild(descGroup)
  form.appendChild(severityGroup)
  form.appendChild(screenshotGroup)
  
  // Footer
  const footer = document.createElement('div')
  footer.className = 'issue-collector-modal-footer'
  
  const cancelButton = document.createElement('button')
  cancelButton.type = 'button'
  cancelButton.className = 'issue-collector-button issue-collector-button-secondary'
  cancelButton.textContent = 'Cancel'
  cancelButton.addEventListener('click', callbacks.onClose)
  
  const submitButton = document.createElement('button')
  submitButton.type = 'submit'
  submitButton.className = 'issue-collector-button issue-collector-button-primary'
  submitButton.textContent = 'Submit Issue'
  submitButton.style.cssText = 'min-width: 120px;'
  
  footer.appendChild(cancelButton)
  footer.appendChild(submitButton)
  
  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    
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
    submitButton.disabled = true
    submitButton.innerHTML = '<span class="issue-collector-loading"></span>Submitting...'
    
    try {
      // Collect metadata
      const metadata = collectMetadata()
      const userInfo = getUserInfo()
      
      // Get logs if callback is available
      const logs = callbacks.getLogs ? callbacks.getLogs() : undefined
      
      // Create payload
      const payload: IssuePayload = {
        projectKey,
        title: titleInput.value.trim(),
        description: descTextarea.value.trim(),
        severity: severitySelect.value as Severity,
        metadata,
        userInfo,
        logs,  // Include logs if available
      }
      
      // Submit
      const response = await submitIssue(payload, apiUrl)
      
      if (response.success) {
        // Show success message
        messageDiv.className = 'issue-collector-message issue-collector-message-success show'
        messageDiv.textContent = response.message || 'Issue submitted successfully!'
        
        // Close modal after delay
        setTimeout(() => {
          callbacks.onClose()
        }, 1500)
      } else {
        // Show error message
        messageDiv.className = 'issue-collector-message issue-collector-message-error show'
        messageDiv.textContent = response.error || 'Failed to submit issue. Please try again.'
        
        submitButton.disabled = false
        submitButton.textContent = 'Submit'
      }
    } catch (error) {
      messageDiv.className = 'issue-collector-message issue-collector-message-error show'
      messageDiv.textContent = error instanceof Error ? error.message : 'An unexpected error occurred'
      
      submitButton.disabled = false
      submitButton.textContent = 'Submit'
    }
  })
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      callbacks.onClose()
    }
  })
  
  // Close on ESC key
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      callbacks.onClose()
    }
  }
  document.addEventListener('keydown', handleEsc)
  
  // Cleanup on close
  const originalClose = callbacks.onClose
  callbacks.onClose = () => {
    document.removeEventListener('keydown', handleEsc)
    originalClose()
  }
  
  formContainer.appendChild(form)
  body.appendChild(formContainer)
  body.appendChild(previewContainer)
  
  // State management
  let currentScreenshot: ScreenshotMetadata | undefined = undefined
  
  /**
   * Show preview view
   */
  function showPreview(screenshot: ScreenshotMetadata) {
    currentScreenshot = screenshot
    formContainer.classList.add('hidden')
    previewContainer.classList.add('show')
    
    // Update title
    title.textContent = 'Screenshot Preview'
    
    // Clear preview content
    previewContainer.innerHTML = ''
    
    // Screenshot image
    const img = document.createElement('img')
    img.className = 'issue-collector-preview-image'
    img.src = screenshot.screenshot.dataUrl
    img.alt = 'Screenshot preview'
    previewContainer.appendChild(img)
    
    // Metadata container
    const metadataDiv = document.createElement('div')
    metadataDiv.className = 'issue-collector-preview-metadata'
    
    // CSS Selector
    const cssSelectorItem = document.createElement('div')
    cssSelectorItem.className = 'issue-collector-preview-metadata-item'
    const cssLabel = document.createElement('div')
    cssLabel.className = 'issue-collector-preview-metadata-label'
    cssLabel.textContent = 'CSS Selector'
    const cssValue = document.createElement('div')
    cssValue.className = 'issue-collector-preview-metadata-value'
    cssValue.textContent = screenshot.selector.cssSelector
    cssValue.style.cursor = 'pointer'
    cssValue.title = 'Click to copy'
    cssValue.addEventListener('click', () => {
      navigator.clipboard.writeText(screenshot.selector.cssSelector).catch(() => {})
      cssValue.style.backgroundColor = '#dbeafe'
      setTimeout(() => {
        cssValue.style.backgroundColor = 'white'
      }, 500)
    })
    cssSelectorItem.appendChild(cssLabel)
    cssSelectorItem.appendChild(cssValue)
    metadataDiv.appendChild(cssSelectorItem)
    
    // XPath
    const xpathItem = document.createElement('div')
    xpathItem.className = 'issue-collector-preview-metadata-item'
    const xpathLabel = document.createElement('div')
    xpathLabel.className = 'issue-collector-preview-metadata-label'
    xpathLabel.textContent = 'XPath'
    const xpathValue = document.createElement('div')
    xpathValue.className = 'issue-collector-preview-metadata-value'
    xpathValue.textContent = screenshot.selector.xpath
    xpathValue.style.cursor = 'pointer'
    xpathValue.title = 'Click to copy'
    xpathValue.addEventListener('click', () => {
      navigator.clipboard.writeText(screenshot.selector.xpath).catch(() => {})
      xpathValue.style.backgroundColor = '#dbeafe'
      setTimeout(() => {
        xpathValue.style.backgroundColor = 'white'
      }, 500)
    })
    xpathItem.appendChild(xpathLabel)
    xpathItem.appendChild(xpathValue)
    metadataDiv.appendChild(xpathItem)
    
    // Bounding Box
    const bboxItem = document.createElement('div')
    bboxItem.className = 'issue-collector-preview-metadata-item'
    const bboxLabel = document.createElement('div')
    bboxLabel.className = 'issue-collector-preview-metadata-label'
    bboxLabel.textContent = 'Bounding Box'
    const bboxValue = document.createElement('div')
    bboxValue.className = 'issue-collector-preview-metadata-value'
    bboxValue.textContent = `x: ${screenshot.selector.boundingBox.x}, y: ${screenshot.selector.boundingBox.y}, width: ${screenshot.selector.boundingBox.width}, height: ${screenshot.selector.boundingBox.height}`
    bboxItem.appendChild(bboxLabel)
    bboxItem.appendChild(bboxValue)
    metadataDiv.appendChild(bboxItem)
    
    // HTML Snippet (collapsible)
    const htmlItem = document.createElement('div')
    htmlItem.className = 'issue-collector-preview-metadata-item'
    const htmlLabel = document.createElement('div')
    htmlLabel.className = 'issue-collector-preview-metadata-label'
    htmlLabel.textContent = 'HTML Snippet'
    const htmlToggle = document.createElement('div')
    htmlToggle.className = 'issue-collector-preview-html-toggle'
    htmlToggle.textContent = 'Show HTML'
    const htmlContent = document.createElement('div')
    htmlContent.className = 'issue-collector-preview-html-content'
    htmlContent.textContent = screenshot.selector.outerHTML
    htmlContent.style.whiteSpace = 'pre-wrap'
    htmlContent.style.fontFamily = 'Monaco, Menlo, Ubuntu Mono, monospace'
    
    let htmlExpanded = false
    htmlToggle.addEventListener('click', () => {
      htmlExpanded = !htmlExpanded
      htmlContent.classList.toggle('show', htmlExpanded)
      htmlToggle.textContent = htmlExpanded ? 'Hide HTML' : 'Show HTML'
    })
    
    htmlItem.appendChild(htmlLabel)
    htmlItem.appendChild(htmlToggle)
    htmlItem.appendChild(htmlContent)
    metadataDiv.appendChild(htmlItem)
    
    previewContainer.appendChild(metadataDiv)
    
    // Update footer buttons
    footer.innerHTML = ''
    const retakeButton = document.createElement('button')
    retakeButton.type = 'button'
    retakeButton.className = 'issue-collector-button issue-collector-button-secondary'
    retakeButton.textContent = 'Retake Screenshot'
    retakeButton.addEventListener('click', () => {
      if (callbacks.onStartInspect) {
        callbacks.onStartInspect()
      }
    })
    
    const skipButton = document.createElement('button')
    skipButton.type = 'button'
    skipButton.className = 'issue-collector-button issue-collector-button-secondary'
    skipButton.textContent = 'Skip Screenshot'
    skipButton.addEventListener('click', () => {
      currentScreenshot = undefined
      showForm()
    })
    
    const useButton = document.createElement('button')
    useButton.type = 'button'
    useButton.className = 'issue-collector-button issue-collector-button-primary'
    useButton.textContent = 'Use This Screenshot'
    useButton.addEventListener('click', () => {
      showForm()
    })
    
    footer.appendChild(retakeButton)
    footer.appendChild(skipButton)
    footer.appendChild(useButton)
  }
  
  /**
   * Show form view
   */
  function showForm() {
    formContainer.classList.remove('hidden')
    previewContainer.classList.remove('show')
    title.textContent = 'Report Issue'
    
    // Restore footer buttons
    footer.innerHTML = ''
    const cancelBtn = document.createElement('button')
    cancelBtn.type = 'button'
    cancelBtn.className = 'issue-collector-button issue-collector-button-secondary'
    cancelBtn.textContent = 'Cancel'
    cancelBtn.addEventListener('click', callbacks.onClose)
    
    const submitBtn = document.createElement('button')
    submitBtn.type = 'submit'
    submitBtn.className = 'issue-collector-button issue-collector-button-primary'
    submitBtn.textContent = 'Submit'
    
    footer.appendChild(cancelBtn)
    footer.appendChild(submitBtn)
    
    // Re-attach form submit handler
    form.onsubmit = null
    form.addEventListener('submit', handleFormSubmit)
  }
  
  /**
   * Form submit handler
   */
  async function handleFormSubmit(e: Event) {
    e.preventDefault()
    
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
      
      // Create payload
      const payload: IssuePayload = {
        projectKey,
        title: titleInput.value.trim(),
        description: descTextarea.value.trim(),
        severity: severitySelect.value as Severity,
        metadata,
        userInfo,
        screenshot: currentScreenshot,  // Include screenshot if available
        logs: callbacks.getLogs ? callbacks.getLogs() : undefined,  // Include logs if available
      }
      
      // Submit
      const response = await submitIssue(payload, apiUrl)
      
      if (response.success) {
        // Show success message
        messageDiv.className = 'issue-collector-message issue-collector-message-success show'
        messageDiv.textContent = response.message || 'Issue submitted successfully!'
        
        // Close modal after delay
        setTimeout(() => {
          callbacks.onClose()
        }, 1500)
      } else {
        // Show error message
        messageDiv.className = 'issue-collector-message issue-collector-message-error show'
        messageDiv.textContent = response.error || 'Failed to submit issue. Please try again.'
        
        if (submitBtn) {
          submitBtn.disabled = false
          submitBtn.textContent = 'Submit'
        }
      }
    } catch (error) {
      messageDiv.className = 'issue-collector-message issue-collector-message-error show'
      messageDiv.textContent = error instanceof Error ? error.message : 'An unexpected error occurred'
      
      const submitBtn = footer.querySelector('button[type="submit"]') as HTMLButtonElement
      if (submitBtn) {
        submitBtn.disabled = false
        submitBtn.textContent = 'Submit'
      }
    }
  }
  
  // Initial form submit handler
  form.addEventListener('submit', handleFormSubmit)
  
  // Export function to update screenshot
  ;(overlay as any).updateScreenshot = (screenshot: ScreenshotMetadata) => {
    showPreview(screenshot)
  }
  
  modal.appendChild(header)
  modal.appendChild(body)
  modal.appendChild(footer)
  overlay.appendChild(modal)
  
  shadowRoot.appendChild(overlay)
  return overlay
}

