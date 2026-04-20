# Playwright E2E Testing Guide

This guide covers how to run and write Playwright tests for the Valentine's Love Wall frontend.

## Installation

### First Time Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

### Browsers Only (if already installed)

```bash
npx playwright install
```

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run Specific Test File

```bash
npx playwright test tests/love-wall.spec.ts
```

### Run Tests in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

### Run Tests in Specific Browser

```bash
# Chromium
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# WebKit (Safari)
npx playwright test --project=webkit
```

## Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    
    // Your test code here
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Common Patterns

#### Navigation

```typescript
await page.goto('/');
await page.goto('/about');
```

#### Locators

```typescript
// By test ID
page.locator('[data-testid="submit-button"]')

// By text
page.locator('text=Submit')

// By role
page.locator('role=button[name="Submit"]')

// By CSS
page.locator('.submit-button')
```

#### Interactions

```typescript
// Click
await page.locator('button').click();

// Fill input
await page.locator('input[name="email"]').fill('test@example.com');

// Select dropdown
await page.locator('select').selectOption('value');

// Check checkbox
await page.locator('input[type="checkbox"]').check();
```

#### Assertions

```typescript
// Visibility
await expect(page.locator('h1')).toBeVisible();

// Text content
await expect(page.locator('h1')).toHaveText('Welcome');

// Count
await expect(page.locator('.item')).toHaveCount(5);

// URL
await expect(page).toHaveURL('/dashboard');

// Title
await expect(page).toHaveTitle(/Dashboard/);
```

#### Waiting

```typescript
// Wait for element
await page.waitForSelector('.loading', { state: 'hidden' });

// Wait for navigation
await page.waitForURL('/dashboard');

// Wait for load state
await page.waitForLoadState('networkidle');

// Wait for timeout
await page.waitForTimeout(1000);
```

## Test Organization

```
tests/
├── example.spec.ts       # Basic example tests
├── love-wall.spec.ts     # Love wall feature tests
└── fixtures/             # Shared test data and helpers
```

## Configuration

Edit `playwright.config.ts` to customize:

- Test directory
- Browsers to test
- Base URL
- Timeouts
- Retries
- Reporters
- Screenshots/videos

## CI/CD Integration

Tests run automatically in the CI pipeline (Phase 4):
- All browsers (Chromium, Firefox, WebKit)
- Retries on failure (2 retries in CI)
- Artifacts uploaded on failure

## Debugging Tips

### 1. Use UI Mode

```bash
npx playwright test --ui
```

Best for interactive debugging and test development.

### 2. Use Debug Mode

```bash
npx playwright test --debug
```

Opens Playwright Inspector for step-by-step debugging.

### 3. Add Console Logs

```typescript
test('debug test', async ({ page }) => {
  console.log('Current URL:', page.url());
  
  const text = await page.locator('h1').textContent();
  console.log('Heading text:', text);
});
```

### 4. Take Screenshots

```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### 5. Slow Down Execution

```typescript
test.use({ slowMo: 1000 }); // 1 second delay between actions
```

## Best Practices

1. **Use data-testid attributes** for stable selectors
2. **Wait for elements** before interacting
3. **Use meaningful test descriptions**
4. **Keep tests independent** - don't rely on test order
5. **Clean up after tests** - reset state if needed
6. **Use page object models** for complex pages
7. **Avoid hard-coded waits** - use waitForSelector instead
8. **Test user flows**, not implementation details

## Common Issues

### Tests Fail Locally But Pass in CI

- Check Node.js version (should be 20+)
- Ensure all dependencies are installed
- Clear `.next` cache: `rm -rf .next`

### Browser Not Found

```bash
npx playwright install --with-deps
```

### Timeout Errors

Increase timeout in `playwright.config.ts`:

```typescript
use: {
  actionTimeout: 10000, // 10 seconds
  navigationTimeout: 30000, // 30 seconds
}
```

### Flaky Tests

- Add proper waits
- Use `waitForLoadState('networkidle')`
- Increase retries for specific tests

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selectors Guide](https://playwright.dev/docs/selectors)
