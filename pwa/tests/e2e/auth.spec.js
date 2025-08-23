import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('User Login - Valid Credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in valid credentials
    await page.fill('input[name="email"]', 'chp1@mms.org');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/');
    
    // Verify token is stored
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeTruthy();
    
    // Verify we're on the dashboard
    await expect(page.locator('.dashboard')).toBeVisible();
  });

  test('User Login - Invalid Credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'wrong@email.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Incorrect email or password');
    
    // Verify we're still on login page
    await expect(page).toHaveURL(/.*login/);
    
    // Verify no token is stored
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();
  });

  test('Password Visibility Toggle', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('button[aria-label="toggle password visibility"]');
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Type password
    await passwordInput.fill('testpassword');
    
    // Click toggle button
    await toggleButton.click();
    
    // Password should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(passwordInput).toHaveValue('testpassword');
    
    // Click toggle button again
    await toggleButton.click();
    
    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveValue('testpassword');
  });

  test('Session Expiration', async ({ page }) => {
    // First login successfully
    await page.goto('/login');
    await page.fill('input[name="email"]', 'chp1@mms.org');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    
    // Manually expire token
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'expired.token.here');
    });
    
    // Try to access protected route
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForURL('**/login');
    
    // Token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();
  });

  test('Logout Functionality', async ({ page }) => {
    // First login successfully
    await page.goto('/login');
    await page.fill('input[name="email"]', 'chp1@mms.org');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
    
    // Click logout button
    await page.click('button[aria-label="logout"]');
    
    // Should redirect to login
    await page.waitForURL('**/login');
    
    // Token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    expect(token).toBeNull();
  });

  test('Form Validation - Required Fields', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('Form Validation - Invalid Email', async ({ page }) => {
    await page.goto('/login');
    
    // Fill invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('text=Invalid email format')).toBeVisible();
  });

  test('Form Validation - Short Password', async ({ page }) => {
    await page.goto('/login');
    
    // Fill short password
    await page.fill('input[name="email"]', 'chp1@mms.org');
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');
    
    // Should show validation error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('Loading State During Login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill credentials
    await page.fill('input[name="email"]', 'chp1@mms.org');
    await page.fill('input[name="password"]', 'password123');
    
    // Click submit and immediately check for loading state
    await page.click('button[type="submit"]');
    
    // Should show loading state
    await expect(page.locator('text=Signing in...')).toBeVisible();
    
    // Button should be disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('Network Error Handling', async ({ page }) => {
    // Mock network error
    await page.route('**/login', route => {
      route.abort('failed');
    });
    
    await page.goto('/login');
    await page.fill('input[name="email"]', 'chp1@mms.org');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show network error message
    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Network error');
  });

  test('Protected Route Access Without Authentication', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForURL('**/login');
  });

  test('Remember Me Functionality', async ({ page }) => {
    await page.goto('/login');
    
    // Fill credentials and check remember me
    await page.fill('input[name="email"]', 'chp1@mms.org');
    await page.fill('input[name="password"]', 'password123');
    await page.check('input[name="rememberMe"]');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/');
    
    // Verify remember me preference is stored
    const rememberMe = await page.evaluate(() => localStorage.getItem('rememberMe'));
    expect(rememberMe).toBe('true');
  });
});
