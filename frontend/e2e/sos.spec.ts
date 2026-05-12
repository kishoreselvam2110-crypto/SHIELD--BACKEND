import { test, expect } from '@playwright/test';

test('SOS Emergency Protocol Verification', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  
  // Verify Branding
  await expect(page.locator('text=SHIELD AI')).toBeVisible();

  // Trigger SOS
  const sosButton = page.locator('button:has-text("Emergency SOS")');
  await expect(sosButton).toBeVisible();
  
  // Listen for the dialog and accept it
  page.once('dialog', dialog => dialog.accept());
  await sosButton.click();

  // Verify Toast notification (Standard Playwright Matcher)
  await expect(page.getByText(/SHIELD Signal Transmitted/i)).toBeVisible({ timeout: 15000 });

  // Verify Admin Dashboard update
  await page.goto('/admin', { waitUntil: 'networkidle' });
  await expect(page.locator('text=SOS')).toBeVisible();
});
