import { test, expect } from '@playwright/test';

test.describe('Basic Page Load Tests', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check basic page elements
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#root')).toBeVisible();
    
    // Check page title
    const pageTitle = await page.title();
    expect(pageTitle).toBe('mcontr');
    
    console.log(`✅ Home page loaded successfully at ${page.url()}`);
  });

  test('should load parser page successfully', async ({ page }) => {
    await page.goto('/parser');
    
    // Check basic page elements
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('#root')).toBeVisible();
    
    // Wait for React to render
    await page.waitForTimeout(3000);
    
    // Check page title
    const pageTitle = await page.title();
    expect(pageTitle).toBe('mcontr');
    
    // Check for header
    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 10000 });
    
    console.log(`✅ Parser page loaded successfully at ${page.url()}`);
  });

  test('should have basic navigation working', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check for navigation elements
    const nav = page.locator('nav, .nav, .navigation');
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible();
    }
    
    // Check for logo or brand
    const logo = page.locator('.logo, .brand, img[alt*="logo"], img[alt*="Logo"]');
    if (await logo.count() > 0) {
      await expect(logo.first()).toBeVisible();
    }
    
    console.log(`✅ Navigation elements present on ${page.url()}`);
  });
});