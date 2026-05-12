# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sos.spec.ts >> SOS Emergency Protocol Verification
- Location: e2e\sos.spec.ts:3:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
Call log:
  - navigating to "http://localhost:3001/", waiting until "networkidle"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('SOS Emergency Protocol Verification', async ({ page }) => {
> 4  |   await page.goto('/', { waitUntil: 'networkidle' });
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/
  5  |   
  6  |   // Verify Branding
  7  |   await expect(page.locator('text=SHIELD AI')).toBeVisible();
  8  | 
  9  |   // Trigger SOS
  10 |   const sosButton = page.locator('button:has-text("Emergency SOS")');
  11 |   await expect(sosButton).toBeVisible();
  12 |   
  13 |   // Listen for the dialog and accept it
  14 |   page.once('dialog', dialog => dialog.accept());
  15 |   await sosButton.click();
  16 | 
  17 |   // Verify Toast notification (Standard Playwright Matcher)
  18 |   await expect(page.getByText(/SHIELD Signal Transmitted/i)).toBeVisible({ timeout: 15000 });
  19 | 
  20 |   // Verify Admin Dashboard update
  21 |   await page.goto('/admin', { waitUntil: 'networkidle' });
  22 |   await expect(page.locator('text=SOS')).toBeVisible();
  23 | });
  24 | 
```