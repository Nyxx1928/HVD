import { test, expect } from '@playwright/test';

test.describe('Example Tests', () => {
  test('has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Valentine/i);
  });

  test('page loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
