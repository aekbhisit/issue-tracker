/**
 * IC-6 Issue Dashboard Browser Tests
 * 
 * Run with: npx playwright test tests/ic6/browser-test.spec.ts
 * Or install playwright first: pnpm add -D @playwright/test && npx playwright install
 */

import { test, expect } from '@playwright/test';

const ADMIN_URL = 'http://localhost:4502';
const API_URL = 'http://localhost:4501/api/admin/v1';

// Helper to login and get session
async function login(page: any) {
  // Navigate to admin login page
  await page.goto(`${ADMIN_URL}/admin`);
  
  // Wait for login form or redirect
  // Assuming there's a login page - adjust selector as needed
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
  const passwordInput = page.locator('input[type="password"], input[name="password"]');
  const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
  
  // Check if already logged in (redirected to dashboard)
  const currentUrl = page.url();
  if (currentUrl.includes('/admin/dashboard') || currentUrl.includes('/admin/issues')) {
    return; // Already logged in
  }
  
  // Fill login form
  if (await emailInput.count() > 0) {
    await emailInput.fill('admin@admin.com');
    await passwordInput.fill('admin');
    await loginButton.click();
    
    // Wait for navigation after login
    await page.waitForURL(/\/admin/, { timeout: 10000 });
  }
}

test.describe('IC-6 Issue Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('Issue List Page - Basic Functionality', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/issues`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check page title/heading
    const heading = page.locator('h1, h2').filter({ hasText: /issue/i });
    await expect(heading.first()).toBeVisible();
    
    // Check table exists
    const table = page.locator('table, [role="table"]');
    await expect(table.first()).toBeVisible();
    
    // Check table columns (at least some should be visible)
    const idColumn = page.locator('th, [role="columnheader"]').filter({ hasText: /id|#/i });
    await expect(idColumn.first()).toBeVisible({ timeout: 5000 });
    
    // Check for issues data
    const issueRows = page.locator('tbody tr, [role="row"]:not(:has(th))');
    const rowCount = await issueRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('Issue List Page - Filters', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/issues`);
    await page.waitForLoadState('networkidle');
    
    // Click show filters button
    const showFiltersButton = page.locator('button').filter({ hasText: /show.*filter|filter/i });
    if (await showFiltersButton.count() > 0) {
      await showFiltersButton.first().click();
      await page.waitForTimeout(500);
    }
    
    // Test status filter
    const statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status/i }).first();
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption({ label: /open/i });
      await page.waitForTimeout(1000); // Wait for filter to apply
      
      // Verify table updated (check network request or table content)
      const table = page.locator('table, [role="table"]').first();
      await expect(table).toBeVisible();
    }
  });

  test('Issue List Page - Pagination', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/issues`);
    await page.waitForLoadState('networkidle');
    
    // Look for pagination controls
    const nextButton = page.locator('button').filter({ hasText: /next|›|>/i });
    const prevButton = page.locator('button').filter({ hasText: /prev|previous|‹|</i });
    const pageInput = page.locator('input[type="number"], input[value*="page"]');
    
    // If pagination exists, test it
    if (await nextButton.count() > 0 && !(await nextButton.first().isDisabled())) {
      await nextButton.first().click();
      await page.waitForTimeout(1000);
      
      // Verify page changed (check URL or page indicator)
      const currentUrl = page.url();
      expect(currentUrl).toContain('page=2');
    }
  });

  test('Issue Detail Page - Basic View', async ({ page }) => {
    // First get an issue ID from the list
    await page.goto(`${ADMIN_URL}/admin/issues`);
    await page.waitForLoadState('networkidle');
    
    // Click on first issue (title or view button)
    const firstIssueLink = page.locator('a[href*="/admin/issues/"], button').filter({ hasText: /view|edit|#/i }).first();
    if (await firstIssueLink.count() > 0) {
      await firstIssueLink.click();
      await page.waitForLoadState('networkidle');
      
      // Verify detail page loaded
      const detailHeading = page.locator('h1, h2').first();
      await expect(detailHeading).toBeVisible();
      
      // Check for issue information sections
      const title = page.locator('text=/title|issue/i').first();
      await expect(title).toBeVisible({ timeout: 5000 });
    }
  });

  test('Issue Detail Page - Add Comment', async ({ page }) => {
    // Navigate to an issue detail page
    await page.goto(`${ADMIN_URL}/admin/issues`);
    await page.waitForLoadState('networkidle');
    
    const firstIssueLink = page.locator('a[href*="/admin/issues/"]').first();
    if (await firstIssueLink.count() > 0) {
      await firstIssueLink.click();
      await page.waitForLoadState('networkidle');
      
      // Look for comment textarea
      const commentTextarea = page.locator('textarea').filter({ hasText: /comment/i }).first();
      const addCommentButton = page.locator('button').filter({ hasText: /add.*comment|comment/i });
      
      if (await commentTextarea.count() > 0) {
        await commentTextarea.fill('Test comment from Playwright');
        await addCommentButton.click();
        
        // Wait for comment to appear
        await page.waitForTimeout(2000);
        
        // Verify comment appears
        const commentText = page.locator('text=Test comment from Playwright');
        await expect(commentText).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('Issue Detail Page - Update Status', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/issues`);
    await page.waitForLoadState('networkidle');
    
    const firstIssueLink = page.locator('a[href*="/admin/issues/"]').first();
    if (await firstIssueLink.count() > 0) {
      await firstIssueLink.click();
      await page.waitForLoadState('networkidle');
      
      // Click edit button
      const editButton = page.locator('button').filter({ hasText: /edit/i });
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);
        
        // Change status
        const statusSelect = page.locator('select, [role="combobox"]').filter({ hasText: /status/i }).first();
        if (await statusSelect.count() > 0) {
          await statusSelect.selectOption({ label: /in.*progress|in-progress/i });
          
          // Save
          const saveButton = page.locator('button').filter({ hasText: /save|update/i });
          await saveButton.click();
          
          // Wait for update
          await page.waitForTimeout(2000);
          
          // Verify status updated (check badge or text)
          const statusBadge = page.locator('text=/in.*progress|in-progress/i');
          await expect(statusBadge.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});

test.describe('API Integration Tests', () => {
  test('Verify API endpoints are accessible', async ({ request }) => {
    // Test health endpoint
    const healthResponse = await request.get(`${API_URL.replace('/api/admin/v1', '')}/health`);
    expect(healthResponse.ok()).toBeTruthy();
    
    // Test login
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'admin@admin.com',
        password: 'admin'
      }
    });
    expect(loginResponse.ok()).toBeTruthy();
    
    const loginData = await loginResponse.json();
    const token = loginData.data?.accessToken;
    expect(token).toBeTruthy();
    
    // Test issues list with auth
    const issuesResponse = await request.get(`${API_URL}/issues?page=1&limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    expect(issuesResponse.ok()).toBeTruthy();
    
    const issuesData = await issuesResponse.json();
    expect(issuesData.data).toBeDefined();
    expect(issuesData.data.data).toBeInstanceOf(Array);
    expect(issuesData.data.pagination).toBeDefined();
  });
});

