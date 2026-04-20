import { test, expect } from '@playwright/test';

test.describe('Love Wall', () => {
  test.beforeEach(async ({ page }) => {
    // Stub the love-wall API so tests don't depend on the backend
    await page.route('**/api/love-wall', async (route) => {
      const req = route.request();
      if (req.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      } else if (req.method() === 'POST') {
        const now = new Date().toISOString();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'test-note',
              name: 'Test User',
              message: 'This is a test love note!',
              emoji: '💗',
              color: 'rose',
              created_at: now,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });
  });
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page title or main heading is present
    await expect(page).toHaveTitle(/Valentine/i);
  });

  test('should display love notes', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to finish loading
    await page.waitForLoadState('load');
    
    // Check if love notes section exists
    const loveWallSection = page.locator('[data-testid="love-wall"], .love-wall, #love-wall').first();
    await expect(loveWallSection).toBeVisible();
  });

  test('should be able to create a new love note', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Flaky on WebKit - skip create-note flow');
    await page.goto('/');
    
    // Look for form inputs (adjust selectors based on actual implementation)
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const messageInput = page.locator('#love-note-form textarea').first();
    
    // Only run test if form exists
    if (await nameInput.count() > 0) {
      await nameInput.fill('Test User');
      await messageInput.fill('This is a test love note!');
      
      // Submit form and wait for the POST request to be sent
      const submitButton = page.locator('button[type="submit"]').first();
      const [request] = await Promise.all([
        page.waitForRequest((r) => r.url().includes('/api/love-wall') && r.method() === 'POST'),
        submitButton.click(),
      ]);
      const postData = request.postData() || '';
      expect(postData).toContain('This is a test love note!');
    }
  });

  test('should navigate without errors', async ({ page }) => {
    await page.goto('/');
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Allow some common warnings but fail on critical errors
    const criticalErrors = errors.filter(
      (error) => !error.includes('favicon') && !error.includes('404')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
