import { test, expect } from '@playwright/test';

test.describe('Barcode Scanner E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'chp1@mms.org');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
  });

  test('Barcode Scanner - Camera Access', async ({ page }) => {
    await page.goto('/scanner');
    
    // Grant camera permissions
    await page.setPermissions('camera', 'granted');
    
    // Wait for camera video stream
    await page.waitForSelector('video', { timeout: 10000 });
    
    const videoElement = await page.locator('video');
    await expect(videoElement).toBeVisible();
    
    // Check video source is blob URL
    const videoSrc = await videoElement.getAttribute('src');
    expect(videoSrc).toContain('blob:');
  });

  test('Barcode Scanner - Valid Barcode Detection', async ({ page }) => {
    await page.goto('/scanner');
    await page.waitForSelector('video');
    
    // Mock successful barcode detection
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('barcodeDetected', { 
        detail: { text: 'IRON001' } 
      }));
    });
    
    // Wait for patient info to be displayed
    await expect(page.locator('.patient-info')).toBeVisible({ timeout: 5000 });
    
    // Verify barcode was detected
    await expect(page.locator('.barcode-result')).toContainText('IRON001');
  });

  test('Barcode Scanner - Invalid Barcode', async ({ page }) => {
    await page.goto('/scanner');
    await page.waitForSelector('video');
    
    // Mock invalid barcode detection
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('barcodeError', { 
        detail: { message: 'Invalid barcode' } 
      }));
    });
    
    // Wait for error message
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.error-message')).toContainText('Invalid barcode');
    
    // Check retry button is available
    await expect(page.locator('button[aria-label="retry scan"]')).toBeVisible();
  });

  test('Barcode Scanner - Camera Permission Denied', async ({ page }) => {
    // Deny camera permissions
    await page.setPermissions('camera', 'denied');
    
    await page.goto('/scanner');
    
    // Wait for permission error
    await expect(page.locator('.permission-error')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.permission-error')).toContainText('Camera access denied');
    
    // Check enable camera button
    await expect(page.locator('button[aria-label="enable camera"]')).toBeVisible();
  });

  test('Barcode Scanner - Multiple Camera Devices', async ({ page }) => {
    await page.goto('/scanner');
    
    // Mock multiple cameras
    await page.evaluate(() => {
      navigator.mediaDevices.enumerateDevices = async () => [
        { deviceId: 'back', label: 'Back Camera', kind: 'videoinput' },
        { deviceId: 'front', label: 'Front Camera', kind: 'videoinput' }
      ];
    });
    
    // Check camera selector is available
    const cameraSelector = page.locator('select[name="camera"]');
    await expect(cameraSelector).toBeVisible();
    
    // Check back camera is selected by default
    const selectedCamera = await cameraSelector.inputValue();
    expect(selectedCamera).toBe('back');
  });

  test('Barcode Scanner - Switch Camera', async ({ page }) => {
    await page.goto('/scanner');
    await page.waitForSelector('video');
    
    // Mock multiple cameras
    await page.evaluate(() => {
      navigator.mediaDevices.enumerateDevices = async () => [
        { deviceId: 'back', label: 'Back Camera', kind: 'videoinput' },
        { deviceId: 'front', label: 'Front Camera', kind: 'videoinput' }
      ];
    });
    
    const cameraSelector = page.locator('select[name="camera"]');
    
    // Switch to front camera
    await cameraSelector.selectOption('front');
    
    // Verify camera switched
    const selectedCamera = await cameraSelector.inputValue();
    expect(selectedCamera).toBe('front');
  });

  test('Barcode Scanner - Manual Barcode Entry', async ({ page }) => {
    await page.goto('/scanner');
    
    // Click manual entry button
    await page.click('button[aria-label="manual entry"]');
    
    // Fill in barcode manually
    await page.fill('input[name="barcode"]', 'IRON001');
    await page.click('button[aria-label="submit barcode"]');
    
    // Wait for patient info
    await expect(page.locator('.patient-info')).toBeVisible({ timeout: 5000 });
  });

  test('Barcode Scanner - Flashlight Toggle', async ({ page }) => {
    await page.goto('/scanner');
    await page.waitForSelector('video');
    
    const flashlightButton = page.locator('button[aria-label="toggle flashlight"]');
    
    // Initially flashlight should be off
    await expect(flashlightButton).toHaveAttribute('aria-pressed', 'false');
    
    // Toggle flashlight on
    await flashlightButton.click();
    await expect(flashlightButton).toHaveAttribute('aria-pressed', 'true');
    
    // Toggle flashlight off
    await flashlightButton.click();
    await expect(flashlightButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('Barcode Scanner - Scan History', async ({ page }) => {
    await page.goto('/scanner');
    
    // Mock successful scan
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('barcodeDetected', { 
        detail: { text: 'IRON001' } 
      }));
    });
    
    await expect(page.locator('.patient-info')).toBeVisible({ timeout: 5000 });
    
    // Check scan history
    await page.click('button[aria-label="scan history"]');
    await expect(page.locator('.scan-history')).toBeVisible();
    
    // Verify recent scan is in history
    await expect(page.locator('.scan-history')).toContainText('IRON001');
  });

  test('Barcode Scanner - Network Error Handling', async ({ page }) => {
    await page.goto('/scanner');
    await page.waitForSelector('video');
    
    // Mock network error during barcode lookup
    await page.route('**/supplements/*', route => {
      route.abort('failed');
    });
    
    // Mock barcode detection
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('barcodeDetected', { 
        detail: { text: 'IRON001' } 
      }));
    });
    
    // Should show network error
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.error-message')).toContainText('Network error');
  });

  test('Barcode Scanner - Offline Mode', async ({ page }) => {
    // Set offline mode
    await page.setOfflineMode(true);
    
    await page.goto('/scanner');
    await page.waitForSelector('video');
    
    // Mock barcode detection
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('barcodeDetected', { 
        detail: { text: 'IRON001' } 
      }));
    });
    
    // Should show offline message
    await expect(page.locator('.offline-message')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.offline-message')).toContainText('Offline mode');
  });

  test('Barcode Scanner - Performance Test', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/scanner');
    await page.waitForSelector('video');
    
    const loadTime = Date.now() - startTime;
    
    // Scanner should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('Barcode Scanner - Accessibility', async ({ page }) => {
    await page.goto('/scanner');
    
    // Check ARIA labels
    await expect(page.locator('button[aria-label="toggle flashlight"]')).toBeVisible();
    await expect(page.locator('button[aria-label="retry scan"]')).toBeVisible();
    await expect(page.locator('button[aria-label="manual entry"]')).toBeVisible();
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('button[aria-label="toggle flashlight"]')).toBeFocused();
  });
});
