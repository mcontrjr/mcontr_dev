/* eslint-disable no-undef */
import { test, expect } from '@playwright/test';

test.describe('Parser Upload Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to parser page
    await page.goto('/parser');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait for parser container or upload section to be present
    await page.waitForSelector('.parser-container, .upload-section, section', { timeout: 15000 });
  });

  test.describe('File Upload Interface', () => {
    test('should display parser page correctly', async ({ page }) => {
      // Check basic page elements first
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('#root')).toBeVisible();
      
      // Wait for React to render
      await page.waitForTimeout(2000);
      
      // Check for parser container or any main content
      const mainContent = page.locator('.parser-container, .upload-section, section, main, .content');
      await expect(mainContent.first()).toBeVisible({ timeout: 15000 });
      
      // Check file input exists (this is fundamental to the upload functionality)
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached({ timeout: 10000 });
      
      // Verify the page has loaded correctly
      const pageTitle = await page.title();
      expect(pageTitle).toBe('mcontr');
      
      console.log(`✅ Parser page loaded successfully at ${page.url()}`);
    });

    test('should have proper file input attributes', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]');
      
      // Should accept PDF files
      const accept = await fileInput.getAttribute('accept');
      expect(accept).toContain('.pdf');
      
      // Should allow multiple files
      const multiple = await fileInput.getAttribute('multiple');
      expect(multiple).toBe('');
    });

    test('should show supported banks section', async ({ page }) => {
      const supportedBanks = page.locator('.supported-banks-compact, .supported-banks');
      await expect(supportedBanks).toBeVisible();
      
      // Should display bank logos/names
      const bankLogos = page.locator('.supported-banks img, .supported-banks-compact img');
      const logoCount = await bankLogos.count();
      expect(logoCount).toBeGreaterThan(0);
    });
  });

  test.describe('File Selection', () => {
    test('should open file dialog when dropzone is clicked', async ({ page }) => {
      const dropzone = page.locator('.upload-dropzone');
      
      // Set up file chooser listener
      const fileChooserPromise = page.waitForEvent('filechooser');
      await dropzone.click();
      
      const fileChooser = await fileChooserPromise;
      expect(fileChooser.isMultiple()).toBeTruthy();
    });

    test('should show file thumbnails after selection', async ({ page }) => {
      // Create a mock PDF file for testing
      const fileContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF');
      
      const fileInput = page.locator('input[type="file"]');
      
      // Simulate file selection
      await fileInput.setInputFiles({
        name: 'test-statement.pdf',
        mimeType: 'application/pdf',
        buffer: fileContent,
      });
      
      // Should show file thumbnails
      await expect(page.locator('.pdf-thumbnail, .uploaded-files-grid')).toBeVisible({ timeout: 5000 });
      
      // Should show file name
      await expect(page.locator('.pdf-thumbnail-name, .file-name')).toContainText('test-statement.pdf');
    });

    test('should handle multiple file selection', async ({ page }) => {
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      
      const fileInput = page.locator('input[type="file"]');
      
      // Select multiple files
      await fileInput.setInputFiles([
        {
          name: 'statement1.pdf',
          mimeType: 'application/pdf',
          buffer: fileContent,
        },
        {
          name: 'statement2.pdf',
          mimeType: 'application/pdf',
          buffer: fileContent,
        }
      ]);
      
      // Should show multiple thumbnails
      const thumbnails = page.locator('.pdf-thumbnail, .file-item');
      await expect(thumbnails).toHaveCount(2);
      
      // Should show correct file count
      const fileCount = page.locator('.files-count');
      await expect(fileCount).toContainText('2');
    });
  });

  test.describe('Upload Process', () => {
    test('should show upload progress', async ({ page }) => {
      // Mock the upload API
      await page.route('**/parse/', async route => {
        // Simulate slow upload
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success', records: [] })
        });
      });
      
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileContent,
      });
      
      // Should show uploading status
      await expect(page.locator('.upload-status-badge.uploading')).toBeVisible({ timeout: 10000 });
      
      // Should show progress indicator
      await expect(page.locator('.upload-progress, .status-spinner')).toBeVisible();
    });

    test('should show success status after upload', async ({ page }) => {
      // Mock successful upload
      await page.route('**/parse/', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            status: 'success', 
            records: [
              {
                id: 1,
                date: '2024-01-01',
                description: 'Test Transaction',
                amount: -50.00,
                category: 'Food',
                bank: 'Test Bank'
              }
            ]
          })
        });
      });
      
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileContent,
      });
      
      // Should show success status
      await expect(page.locator('.upload-status-badge.success')).toBeVisible({ timeout: 15000 });
      
      // Should show success message
      await expect(page.locator('.upload-message.success')).toBeVisible();
    });

    test('should handle upload errors gracefully', async ({ page }) => {
      // Mock failed upload
      await page.route('**/parse/', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Upload failed' })
        });
      });
      
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileContent,
      });
      
      // Should show error status
      await expect(page.locator('.upload-status-badge.error')).toBeVisible({ timeout: 15000 });
      
      // Should show error message
      await expect(page.locator('.upload-message.error')).toBeVisible();
    });

    test('should handle partial upload failures', async ({ page }) => {
      let uploadCount = 0;
      
      // Mock partial failure (first file succeeds, second fails)
      await page.route('**/parse/', async route => {
        uploadCount++;
        if (uploadCount === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ status: 'success', records: [] })
          });
        } else {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Upload failed' })
          });
        }
      });
      
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      
      await fileInput.setInputFiles([
        {
          name: 'success.pdf',
          mimeType: 'application/pdf',
          buffer: fileContent,
        },
        {
          name: 'failure.pdf',
          mimeType: 'application/pdf',
          buffer: fileContent,
        }
      ]);
      
      // Should show both success and error states
      await expect(page.locator('.upload-status-badge.success')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('.upload-status-badge.error')).toBeVisible({ timeout: 15000 });
      
      // Should show partial success message
      await expect(page.locator('.upload-message')).toContainText(/uploaded.*of.*failed/i);
    });
  });

  test.describe('File Management', () => {
    test('should allow file removal', async ({ page }) => {
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileContent,
      });
      
      // Should show remove button on hover
      const thumbnail = page.locator('.pdf-thumbnail');
      await thumbnail.hover();
      
      const removeButton = page.locator('.pdf-thumbnail-remove, .remove-file-btn');
      await expect(removeButton).toBeVisible();
      
      // Click remove button
      await removeButton.click();
      
      // File should be removed
      await expect(thumbnail).not.toBeVisible();
    });

    test('should allow clearing all files', async ({ page }) => {
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      
      await fileInput.setInputFiles([
        {
          name: 'test1.pdf',
          mimeType: 'application/pdf',
          buffer: fileContent,
        },
        {
          name: 'test2.pdf',
          mimeType: 'application/pdf',
          buffer: fileContent,
        }
      ]);
      
      // Should show clear all button
      const clearButton = page.locator('.clear-files-btn');
      await expect(clearButton).toBeVisible();
      
      await clearButton.click();
      
      // All files should be removed
      const thumbnails = page.locator('.pdf-thumbnail, .file-item');
      await expect(thumbnails).toHaveCount(0);
    });

    test('should show retry option for failed uploads', async ({ page }) => {
      // Mock failed upload
      await page.route('**/parse/', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Upload failed' })
        });
      });
      
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileContent,
      });
      
      // Wait for error state
      await expect(page.locator('.upload-status-badge.error')).toBeVisible({ timeout: 15000 });
      
      // Should show retry button
      const thumbnail = page.locator('.pdf-thumbnail');
      await thumbnail.hover();
      
      const retryButton = page.locator('.pdf-thumbnail-retry');
      await expect(retryButton).toBeVisible();
    });
  });

  test.describe('Non-PDF File Handling', () => {
    test('should reject non-PDF files', async ({ page }) => {
      const textContent = Buffer.from('This is not a PDF file');
      const fileInput = page.locator('input[type="file"]');
      
      await fileInput.setInputFiles({
        name: 'document.txt',
        mimeType: 'text/plain',
        buffer: textContent,
      });
      
      // Should show error message for non-PDF files
      await expect(page.locator('.upload-message')).toContainText(/pdf/i);
    });
  });
});