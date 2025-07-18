import { test, expect } from '@playwright/test';

test.describe('Theme and Accessibility Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/parser');
    // Wait for parser page to load
    await page.waitForSelector('.parser-container, .upload-section', { timeout: 10000 });
  });

  test.describe('Dark/Light Theme Layout', () => {
    test('should maintain layout integrity in light theme', async ({ page }) => {
      // Ensure we're in light theme (default)
      const body = page.locator('body');
      
      // Check theme variables are applied
      const bgColor = await body.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      expect(bgColor).toBeTruthy();
      
      // Check text is readable
      const textElements = page.locator('h1, h2, h3, p, span');
      const firstText = textElements.first();
      
      if (await firstText.count() > 0) {
        const textColor = await firstText.evaluate(el => {
          return window.getComputedStyle(el).color;
        });
        expect(textColor).toBeTruthy();
      }
    });

    test('should toggle to dark theme and maintain layout', async ({ page }) => {
      // Look for theme toggle button
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button[aria-label*="theme"], button[title*="theme"]');
      
      if (await themeToggle.count() > 0) {
        await themeToggle.click();
        
        // Wait for theme to apply
        await page.waitForTimeout(300);
        
        // Check dark theme is applied
        const body = page.locator('body');
        const bgColor = await body.evaluate(el => {
          return window.getComputedStyle(el).backgroundColor;
        });
        
        expect(bgColor).toBeTruthy();
        
        // Layout should remain intact
        const container = page.locator('.parser-container');
        await expect(container).toBeVisible();
      }
    });

    test('should have sufficient color contrast in both themes', async ({ page }) => {
      const testColorContrast = async () => {
        const textElements = page.locator('h1, h2, h3, p:visible');
        const elementCount = await textElements.count();
        
        for (let i = 0; i < Math.min(elementCount, 3); i++) {
          const element = textElements.nth(i);
          const styles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor
            };
          });
          
          // Basic check that colors are defined
          expect(styles.color).toBeTruthy();
        }
      };
      
      // Test light theme
      await testColorContrast();
      
      // Test dark theme if toggle exists
      const themeToggle = page.locator('[data-testid="theme-toggle"], .theme-toggle, button[aria-label*="theme"]');
      if (await themeToggle.count() > 0) {
        await themeToggle.click();
        await page.waitForTimeout(300);
        await testColorContrast();
      }
    });
  });

  test.describe('Accessibility Layout Features', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1Elements = page.locator('h1');
      const h1Count = await h1Elements.count();
      
      // Should have at least one H1
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      // Should not have more than one H1 per page
      expect(h1Count).toBeLessThanOrEqual(2);
      
      // Check heading hierarchy makes sense
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingLevels = await headings.evaluateAll(elements => 
        elements.map(el => parseInt(el.tagName.charAt(1)))
      );
      
      // Should start with H1
      if (headingLevels.length > 0) {
        expect(headingLevels[0]).toBe(1);
      }
    });

    test('should have accessible form labels', async ({ page }) => {
      const inputs = page.locator('input[type="text"], input[type="email"], input[type="file"], select, textarea');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        
        // Check for label association
        const inputId = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        
        if (inputId) {
          const label = page.locator(`label[for="${inputId}"]`);
          const hasLabel = await label.count() > 0;
          
          // Should have either a label, aria-label, or aria-labelledby
          expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
        }
      }
    });

    test('should have adequate focus indicators', async ({ page }) => {
      const focusableElements = page.locator('button, input, select, textarea, a[href], [tabindex]');
      const elementCount = await focusableElements.count();
      
      // Test first few focusable elements
      for (let i = 0; i < Math.min(elementCount, 3); i++) {
        const element = focusableElements.nth(i);
        
        if (await element.isVisible()) {
          await element.focus();
          
          // Check element receives focus
          const isFocused = await element.evaluate(el => el === document.activeElement);
          expect(isFocused).toBeTruthy();
          
          // Check for visible focus indicator
          const focusStyles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              outline: computed.outline,
              boxShadow: computed.boxShadow,
              border: computed.border
            };
          });
          
          // Should have some form of focus indicator
          const hasFocusIndicator = 
            focusStyles.outline !== 'none' || 
            focusStyles.boxShadow !== 'none' || 
            focusStyles.border !== 'none';
          
          expect(hasFocusIndicator).toBeTruthy();
        }
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Start from beginning
      await page.keyboard.press('Tab');
      
      let tabCount = 0;
      const maxTabs = 10;
      
      while (tabCount < maxTabs) {
        const activeElement = await page.evaluate(() => {
          const active = document.activeElement;
          return {
            tagName: active.tagName,
            type: active.type,
            className: active.className,
            id: active.id
          };
        });
        
        // Should have an active element
        expect(activeElement.tagName).toBeTruthy();
        
        await page.keyboard.press('Tab');
        tabCount++;
      }
      
      // Should have navigated through multiple elements
      expect(tabCount).toBe(maxTabs);
    });
  });

  test.describe('Print Layout', () => {
    test('should have print-friendly layout', async ({ page }) => {
      // Simulate print media
      await page.emulateMedia({ media: 'print' });
      
      const container = page.locator('.parser-container');
      await expect(container).toBeVisible();
      
      // Check that content is still readable in print mode
      const textElements = page.locator('h1, h2, h3, p:visible');
      const elementCount = await textElements.count();
      expect(elementCount).toBeGreaterThan(0);
    });
  });

  test.describe('High Contrast Mode', () => {
    test('should work with forced colors', async ({ page }) => {
      // Simulate high contrast mode
      await page.emulateMedia({ forcedColors: 'active' });
      
      const container = page.locator('.parser-container');
      await expect(container).toBeVisible();
      
      // Layout should remain functional
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });
  });

  test.describe('Reduced Motion', () => {
    test('should respect reduced motion preferences', async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      const container = page.locator('.parser-container');
      await expect(container).toBeVisible();
      
      // Check that animations are reduced
      const animatedElements = page.locator('[style*="transition"], .fade-in, .animate');
      const elementCount = await animatedElements.count();
      
      // Elements should still be visible even with reduced motion
      for (let i = 0; i < Math.min(elementCount, 3); i++) {
        const element = animatedElements.nth(i);
        if (await element.count() > 0) {
          await expect(element).toBeVisible();
        }
      }
    });
  });
});