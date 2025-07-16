import { test, expect } from '@playwright/test';

test.describe('Responsive Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Desktop Layout (1920x1080)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
    });

    test('should display desktop layout correctly', async ({ page }) => {
      // Check main container exists and is properly sized
      const container = page.locator('.parser-container');
      await expect(container).toBeVisible();
      
      // Check header is displayed correctly
      const header = page.locator('header, .my-header');
      await expect(header).toBeVisible();
      
      // Check navigation elements are visible
      const nav = page.locator('nav, .navigation');
      if (await nav.count() > 0) {
        await expect(nav).toBeVisible();
      }
    });

    test('should have proper spacing and margins on desktop', async ({ page }) => {
      const container = page.locator('.parser-container');
      
      // Check container has proper width
      const boundingBox = await container.boundingBox();
      expect(boundingBox.width).toBeGreaterThan(800);
      
      // Check sections have proper spacing
      const sections = page.locator('section');
      const sectionCount = await sections.count();
      
      if (sectionCount > 1) {
        for (let i = 0; i < sectionCount - 1; i++) {
          const currentSection = sections.nth(i);
          const nextSection = sections.nth(i + 1);
          
          const currentBox = await currentSection.boundingBox();
          const nextBox = await nextSection.boundingBox();
          
          // Ensure there's spacing between sections
          expect(nextBox.y).toBeGreaterThan(currentBox.y + currentBox.height);
        }
      }
    });
  });

  test.describe('Laptop Layout (1366x768)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 });
    });

    test('should adapt layout for laptop screens', async ({ page }) => {
      const container = page.locator('.parser-container');
      await expect(container).toBeVisible();
      
      // Check container adapts to smaller width
      const boundingBox = await container.boundingBox();
      expect(boundingBox.width).toBeLessThanOrEqual(1366);
      expect(boundingBox.width).toBeGreaterThan(600);
    });

    test('should maintain functionality on laptop screens', async ({ page }) => {
      // Check upload section is functional
      const uploadSection = page.locator('.upload-section');
      await expect(uploadSection).toBeVisible();
      
      // Check file input is clickable
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await expect(fileInput).toBeAttached();
      }
    });
  });

  test.describe('Tablet Layout (768x1024)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test('should display tablet layout correctly', async ({ page }) => {
      const container = page.locator('.parser-container');
      await expect(container).toBeVisible();
      
      // Check container uses full width on tablet
      const boundingBox = await container.boundingBox();
      expect(boundingBox.width).toBeLessThanOrEqual(768);
      expect(boundingBox.width).toBeGreaterThan(500);
    });

    test('should stack elements vertically on tablet', async ({ page }) => {
      // Check filter sections stack properly
      const filterSections = page.locator('.filter-section, .breakdown-filters-row > *');
      const count = await filterSections.count();
      
      if (count > 1) {
        const firstElement = filterSections.first();
        const lastElement = filterSections.last();
        
        const firstBox = await firstElement.boundingBox();
        const lastBox = await lastElement.boundingBox();
        
        // On tablet, elements should stack (y positions different)
        expect(Math.abs(firstBox.y - lastBox.y)).toBeGreaterThan(50);
      }
    });
  });

  test.describe('Mobile Layout (375x667)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should display mobile layout correctly', async ({ page }) => {
      const container = page.locator('.parser-container');
      await expect(container).toBeVisible();
      
      // Check container uses full mobile width
      const boundingBox = await container.boundingBox();
      expect(boundingBox.width).toBeLessThanOrEqual(375);
      expect(boundingBox.width).toBeGreaterThan(300);
    });

    test('should have mobile-optimized spacing', async ({ page }) => {
      // Check reduced padding on mobile
      const sections = page.locator('section');
      const sectionCount = await sections.count();
      
      for (let i = 0; i < sectionCount; i++) {
        const section = sections.nth(i);
        const styles = await section.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            paddingLeft: computed.paddingLeft,
            paddingRight: computed.paddingRight,
            marginLeft: computed.marginLeft,
            marginRight: computed.marginRight
          };
        });
        
        // Mobile should have reduced padding
        const paddingValue = parseInt(styles.paddingLeft);
        expect(paddingValue).toBeLessThan(50); // Should be less than desktop padding
      }
    });

    test('should make buttons touch-friendly on mobile', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) { // Check first 5 buttons
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const boundingBox = await button.boundingBox();
          
          // Touch targets should be at least 44px (Apple HIG) or 48dp (Material Design)
          expect(Math.max(boundingBox.width, boundingBox.height)).toBeGreaterThanOrEqual(40);
        }
      }
    });
  });

  test.describe('Landscape Mobile Layout (667x375)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 });
    });

    test('should handle landscape mobile orientation', async ({ page }) => {
      const container = page.locator('.parser-container');
      await expect(container).toBeVisible();
      
      // Should adapt to landscape dimensions
      const boundingBox = await container.boundingBox();
      expect(boundingBox.width).toBeLessThanOrEqual(667);
      expect(boundingBox.width).toBeGreaterThan(400);
    });

    test('should maintain usability in landscape mode', async ({ page }) => {
      // Check that important elements are still accessible
      const uploadSection = page.locator('.upload-section');
      await expect(uploadSection).toBeVisible();
      
      // Check buttons are still clickable
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });
  });

  test.describe('Ultra-wide Layout (2560x1440)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 2560, height: 1440 });
    });

    test('should handle ultra-wide screens gracefully', async ({ page }) => {
      const container = page.locator('.parser-container');
      await expect(container).toBeVisible();
      
      // Content should not stretch too wide
      const boundingBox = await container.boundingBox();
      
      // Container should have reasonable max-width even on ultra-wide
      expect(boundingBox.width).toBeLessThan(2000); // Reasonable max width
    });
  });

  test.describe('Cross-Browser Layout Consistency', () => {
    test('should maintain consistent layout across browsers', async ({ page, browserName }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      
      const container = page.locator('.parser-container');
      await expect(container).toBeVisible();
      
      // Basic layout should work across all browsers
      const boundingBox = await container.boundingBox();
      expect(boundingBox.width).toBeGreaterThan(500);
      expect(boundingBox.height).toBeGreaterThan(200);
      
      // Log browser for debugging
      console.log(`Testing on ${browserName}: Layout OK`);
    });
  });

  test.describe('Dynamic Resize Tests', () => {
    test('should adapt when window is resized', async ({ page }) => {
      // Start with desktop size
      await page.setViewportSize({ width: 1200, height: 800 });
      
      const container = page.locator('.parser-container');
      const initialBox = await container.boundingBox();
      
      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500); // Allow layout to settle
      
      const mobileBox = await container.boundingBox();
      
      // Width should have changed significantly
      expect(Math.abs(initialBox.width - mobileBox.width)).toBeGreaterThan(200);
      
      // Container should still be visible and functional
      await expect(container).toBeVisible();
    });
  });
});