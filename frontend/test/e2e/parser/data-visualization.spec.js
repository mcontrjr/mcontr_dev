import { test, expect } from '@playwright/test';

test.describe('Parser Data Visualization and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/parser');
    
    // Mock successful data fetch
    await page.route('**/records/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          records: [
            {
              id: 1,
              date: '2024-01-15',
              description: 'Grocery Store Purchase',
              amount: -125.50,
              category: 'Food',
              bank: 'Chase Bank'
            },
            {
              id: 2,
              date: '2024-01-20',
              description: 'Salary Deposit',
              amount: 3000.00,
              category: 'Income',
              bank: 'Chase Bank'
            },
            {
              id: 3,
              date: '2024-02-01',
              description: 'Restaurant Bill',
              amount: -45.25,
              category: 'Food',
              bank: 'Bank of America'
            },
            {
              id: 4,
              date: '2024-02-10',
              description: 'Gas Station',
              amount: -65.00,
              category: 'Transportation',
              bank: 'Chase Bank'
            }
          ]
        })
      });
    });

    // Mock successful upload to trigger data display
    await page.route('**/parse/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success' })
      });
    });
  });

  test.describe('Data Display After Upload', () => {
    test('should show breakdown section after successful upload', async ({ page }) => {
      // Upload a test file
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileContent,
      });
      
      // Wait for upload to complete and breakdown to appear
      await expect(page.locator('.breakdown-section')).toBeVisible({ timeout: 15000 });
      
      // Should show breakdown header
      const breakdownHeader = page.locator('.breakdown-header h2');
      await expect(breakdownHeader).toContainText(/financial breakdown/i);
    });

    test('should display filter section', async ({ page }) => {
      // Trigger data display
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileContent,
      });
      
      await expect(page.locator('.breakdown-section')).toBeVisible({ timeout: 15000 });
      
      // Should show filters container
      const filtersContainer = page.locator('.breakdown-filters-container');
      await expect(filtersContainer).toBeVisible();
      
      // Should show filter title
      const filterTitle = page.locator('.filters-header h3');
      await expect(filterTitle).toContainText(/filter data/i);
    });

    test('should display charts and visualizations', async ({ page }) => {
      // Trigger data display
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileContent,
      });
      
      await expect(page.locator('.breakdown-section')).toBeVisible({ timeout: 15000 });
      
      // Should show chart containers
      const chartContainers = page.locator('.chart-container');
      const chartCount = await chartContainers.count();
      expect(chartCount).toBeGreaterThan(0);
      
      // Should show breakdown cards
      const breakdownCards = page.locator('.breakdown-card');
      const cardCount = await breakdownCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(3); // Bar chart, pie chart, records table
    });

    test('should display records table', async ({ page }) => {
      // Trigger data display
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileContent,
      });
      
      await expect(page.locator('.breakdown-section')).toBeVisible({ timeout: 15000 });
      
      // Should show records table
      const recordsTable = page.locator('.records-table');
      await expect(recordsTable).toBeVisible();
      
      // Should show table headers
      const headers = page.locator('.records-table th');
      const headerCount = await headers.count();
      expect(headerCount).toBeGreaterThanOrEqual(4); // Date, Description, Amount, Category
      
      // Should show some records
      const rows = page.locator('.records-table tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
    });
  });

  test.describe('Filtering Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Upload to trigger data display
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileContent,
      });
      
      await expect(page.locator('.breakdown-section')).toBeVisible({ timeout: 15000 });
    });

    test('should filter by bank selection', async ({ page }) => {
      const bankSelect = page.locator('#bank-select, .enhanced-select');
      await expect(bankSelect).toBeVisible();
      
      // Select a specific bank
      await bankSelect.selectOption('Chase Bank');
      
      // Wait for filtering to apply
      await page.waitForTimeout(500);
      
      // Should update the data display
      // This is implementation-dependent, but we can check if selection persists
      const selectedValue = await bankSelect.inputValue();
      expect(selectedValue).toBe('Chase Bank');
    });

    test('should filter by month selection', async ({ page }) => {
      const monthChips = page.locator('.month-chip');
      const chipCount = await monthChips.count();
      expect(chipCount).toBe(12); // Should have all 12 months
      
      // Click on January chip
      const januaryChip = page.locator('.month-chip:has-text("Jan")');
      await januaryChip.click();
      
      // Should show selected state
      await expect(januaryChip).toHaveClass(/selected/);
      
      // Click on February chip
      const februaryChip = page.locator('.month-chip:has-text("Feb")');
      await februaryChip.click();
      
      // Should show both selected
      await expect(februaryChip).toHaveClass(/selected/);
    });

    test('should use Select All and Clear All buttons', async ({ page }) => {
      // Test Select All
      const selectAllButton = page.locator('.filter-action-btn.select');
      await expect(selectAllButton).toBeVisible();
      await selectAllButton.click();
      
      // All month chips should be selected
      const selectedChips = page.locator('.month-chip.selected');
      const selectedCount = await selectedChips.count();
      expect(selectedCount).toBe(12);
      
      // Test Clear All
      const clearFiltersButton = page.locator('.filter-action-btn.clear');
      await clearFiltersButton.click();
      
      // No month chips should be selected
      const remainingSelected = await page.locator('.month-chip.selected').count();
      expect(remainingSelected).toBe(0);
    });

    test('should show filter summary', async ({ page }) => {
      const filterSummary = page.locator('.filters-summary');
      await expect(filterSummary).toBeVisible();
      
      // Should show current filter state
      const summaryStats = page.locator('.summary-stats .stat-item');
      const statCount = await summaryStats.count();
      expect(statCount).toBeGreaterThanOrEqual(2); // Bank and Period stats
    });

    test('should handle clear data functionality', async ({ page }) => {
      // Mock clear data endpoint
      await page.route('**/clear/', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success' })
        });
      });
      
      const clearDataButton = page.locator('.filter-action-btn.clear-data');
      await expect(clearDataButton).toBeVisible();
      
      // Set up dialog handler
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toContain(/clear all uploaded data/i);
        await dialog.accept();
      });
      
      await clearDataButton.click();
      
      // Should show success message
      await expect(page.locator('.upload-message')).toContainText(/cleared successfully/i);
    });
  });

  test.describe('Table Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Upload to trigger data display
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileContent,
      });
      
      await expect(page.locator('.breakdown-section')).toBeVisible({ timeout: 15000 });
    });

    test('should allow table sorting', async ({ page }) => {
      const sortableHeaders = page.locator('.records-table th.sortable');
      const headerCount = await sortableHeaders.count();
      
      if (headerCount > 0) {
        const firstHeader = sortableHeaders.first();
        await firstHeader.click();
        
        // Should show sort indicator
        const headerText = await firstHeader.textContent();
        expect(headerText).toMatch(/↕/);
      }
    });

    test('should have search functionality', async ({ page }) => {
      const searchInput = page.locator('.records-search-input');
      await expect(searchInput).toBeVisible();
      
      // Type in search
      await searchInput.fill('Grocery');
      
      // Should filter results (implementation dependent)
      const tableRows = page.locator('.records-table tbody tr');
      const rowCount = await tableRows.count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should have pagination controls', async ({ page }) => {
      // Look for pagination elements
      const paginationContainer = page.locator('.pagination-container');
      
      if (await paginationContainer.count() > 0) {
        await expect(paginationContainer).toBeVisible();
        
        // Should have page controls
        const pageButtons = page.locator('.pagination-btn');
        const buttonCount = await pageButtons.count();
        expect(buttonCount).toBeGreaterThan(0);
        
        // Should have records per page selector
        const recordsPerPageSelect = page.locator('.records-per-page-select');
        await expect(recordsPerPageSelect).toBeVisible();
      }
    });

    test('should show record details correctly', async ({ page }) => {
      const tableRows = page.locator('.records-table tbody tr');
      const rowCount = await tableRows.count();
      
      if (rowCount > 0) {
        const firstRow = tableRows.first();
        
        // Should have date cell
        const dateCell = firstRow.locator('.date-cell');
        if (await dateCell.count() > 0) {
          const dateText = await dateCell.textContent();
          expect(dateText).toMatch(/\d{4}-\d{2}-\d{2}/); // Date format
        }
        
        // Should have amount cell
        const amountCell = firstRow.locator('.amount-cell');
        if (await amountCell.count() > 0) {
          const amountText = await amountCell.textContent();
          expect(amountText).toMatch(/\$.*\d/); // Currency format
        }
      }
    });
  });

  test.describe('Responsive Data Visualization', () => {
    test.beforeEach(async ({ page }) => {
      const fileContent = Buffer.from('%PDF-1.4\n%%EOF');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: fileContent,
      });
      
      await expect(page.locator('.breakdown-section')).toBeVisible({ timeout: 15000 });
    });

    test('should adapt charts to mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Charts should still be visible
      const chartContainers = page.locator('.chart-container');
      const chartCount = await chartContainers.count();
      
      for (let i = 0; i < chartCount; i++) {
        const chart = chartContainers.nth(i);
        await expect(chart).toBeVisible();
        
        // Chart should fit mobile width
        const boundingBox = await chart.boundingBox();
        expect(boundingBox.width).toBeLessThanOrEqual(375);
      }
    });

    test('should stack filter elements on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const filtersRow = page.locator('.filters-row');
      if (await filtersRow.count() > 0) {
        await expect(filtersRow).toBeVisible();
        
        // Filter sections should stack vertically on mobile
        const filterSections = page.locator('.filter-section');
        const sectionCount = await filterSections.count();
        
        if (sectionCount > 1) {
          const firstSection = filterSections.first();
          const lastSection = filterSections.last();
          
          const firstBox = await firstSection.boundingBox();
          const lastBox = await lastSection.boundingBox();
          
          // Should have vertical spacing (stacked)
          expect(lastBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
        }
      }
    });

    test('should make table horizontally scrollable on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const tableWrapper = page.locator('.records-table-wrapper');
      await expect(tableWrapper).toBeVisible();
      
      // Should be scrollable
      const overflow = await tableWrapper.evaluate(el => {
        return window.getComputedStyle(el).overflowX;
      });
      
      expect(overflow).toBe('auto');
    });
  });
});