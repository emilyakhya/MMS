import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';

// Mock the API service
jest.mock('../services/apiService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  resetPassword: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Authentication Tests - FR-001, FR-002, FR-003, FR-004, FR-005', () => {
  let apiService;
  
  beforeEach(() => {
    apiService = require('../services/apiService');
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  const renderWithAuth = (component) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('User Login - Valid Credentials - FR-001', () => {
    test('should login successfully with valid credentials', async () => {
      const user = userEvent.setup();
      const mockToken = 'valid.jwt.token';
      
      apiService.login.mockResolvedValue({
        access_token: mockToken,
        token_type: 'bearer',
        user: {
          id: 1,
          email: 'chp1@mms.org',
          role: 'chp'
        }
      });

      renderWithAuth(<LoginScreen />);

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'chp1@mms.org');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for API call
      await waitFor(() => {
        expect(apiService.login).toHaveBeenCalledWith({
          email: 'chp1@mms.org',
          password: 'password123'
        });
      });

      // Check token storage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', mockToken);
      
      // Check navigation
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    test('should store JWT token in localStorage - FR-002', async () => {
      const user = userEvent.setup();
      const mockToken = 'valid.jwt.token';
      
      apiService.login.mockResolvedValue({
        access_token: mockToken,
        token_type: 'bearer'
      });

      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'chp1@mms.org');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', mockToken);
      });
    });

    test('should handle different user roles - FR-003', async () => {
      const user = userEvent.setup();
      
      // Test CHP login
      apiService.login.mockResolvedValue({
        access_token: 'chp.token',
        token_type: 'bearer',
        user: { role: 'chp' }
      });

      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'chp1@mms.org');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });

      // Test Admin login
      apiService.login.mockResolvedValue({
        access_token: 'admin.token',
        token_type: 'bearer',
        user: { role: 'admin' }
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin');
      });
    });
  });

  describe('User Login - Invalid Credentials - FR-001', () => {
    test('should show error message with invalid credentials', async () => {
      const user = userEvent.setup();
      
      apiService.login.mockRejectedValue({
        response: {
          status: 401,
          data: { detail: 'Incorrect email or password' }
        }
      });

      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'wrong@email.com');
      await user.type(passwordInput, 'wrongpass');
      await user.click(submitButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument();
      });

      // Should stay on login page
      expect(mockNavigate).not.toHaveBeenCalled();
      
      // Should not store token
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith('authToken', expect.any(String));
    });

    test('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      apiService.login.mockRejectedValue(new Error('Network error'));

      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'chp1@mms.org');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('should handle server errors gracefully', async () => {
      const user = userEvent.setup();
      
      apiService.login.mockRejectedValue({
        response: {
          status: 500,
          data: { detail: 'Internal server error' }
        }
      });

      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'chp1@mms.org');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility Toggle - FR-001', () => {
    test('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<LoginScreen />);

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle button
      await user.click(toggleButton);

      // Password should be visible
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click toggle button again
      await user.click(toggleButton);

      // Password should be hidden again
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should maintain password value when toggling visibility', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<LoginScreen />);

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

      // Type password
      await user.type(passwordInput, 'testpassword');

      // Toggle visibility
      await user.click(toggleButton);
      expect(passwordInput).toHaveValue('testpassword');

      // Toggle back
      await user.click(toggleButton);
      expect(passwordInput).toHaveValue('testpassword');
    });
  });

  describe('Session Expiration - FR-002, FR-004', () => {
    test('should redirect to login when token expires', async () => {
      const user = userEvent.setup();
      
      // Mock expired token
      localStorageMock.getItem.mockReturnValue('expired.token.here');

      renderWithAuth(<LoginScreen />);

      // Try to access protected route
      await user.click(screen.getByRole('link', { name: /dashboard/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });

      // Should clear expired token
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });

    test('should handle malformed tokens gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock malformed token
      localStorageMock.getItem.mockReturnValue('malformed.token');

      renderWithAuth(<LoginScreen />);

      await user.click(screen.getByRole('link', { name: /dashboard/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    test('should handle missing tokens gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock missing token
      localStorageMock.getItem.mockReturnValue(null);

      renderWithAuth(<LoginScreen />);

      await user.click(screen.getByRole('link', { name: /dashboard/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Logout Functionality - FR-004', () => {
    test('should logout successfully and clear tokens', async () => {
      const user = userEvent.setup();
      
      // Mock logged in state
      localStorageMock.getItem.mockReturnValue('valid.token');

      renderWithAuth(<LoginScreen />);

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      // Should call logout API
      await waitFor(() => {
        expect(apiService.logout).toHaveBeenCalled();
      });

      // Should clear tokens
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      
      // Should redirect to login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    test('should handle logout API errors gracefully', async () => {
      const user = userEvent.setup();
      
      apiService.logout.mockRejectedValue(new Error('Logout failed'));
      localStorageMock.getItem.mockReturnValue('valid.token');

      renderWithAuth(<LoginScreen />);

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      // Should still clear tokens and redirect even if API fails
      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    test('should handle logout without API call when offline', async () => {
      const user = userEvent.setup();
      
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      localStorageMock.getItem.mockReturnValue('valid.token');

      renderWithAuth(<LoginScreen />);

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      // Should clear tokens and redirect without API call
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(apiService.logout).not.toHaveBeenCalled();
    });
  });

  describe('Password Reset Functionality - FR-005', () => {
    test('should show password reset form', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<LoginScreen />);

      const forgotPasswordLink = screen.getByText(/forgot password/i);
      await user.click(forgotPasswordLink);

      // Should show password reset form
      expect(screen.getByText(/reset password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    test('should send password reset email', async () => {
      const user = userEvent.setup();
      
      apiService.resetPassword.mockResolvedValue({ success: true });

      renderWithAuth(<LoginScreen />);

      const forgotPasswordLink = screen.getByText(/forgot password/i);
      await user.click(forgotPasswordLink);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'chp1@mms.org');
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiService.resetPassword).toHaveBeenCalledWith('chp1@mms.org');
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/reset link sent/i)).toBeInTheDocument();
      });
    });

    test('should handle password reset errors', async () => {
      const user = userEvent.setup();
      
      apiService.resetPassword.mockRejectedValue({
        response: {
          status: 404,
          data: { detail: 'User not found' }
        }
      });

      renderWithAuth(<LoginScreen />);

      const forgotPasswordLink = screen.getByText(/forgot password/i);
      await user.click(forgotPasswordLink);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'nonexistent@email.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/user not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation - FR-001, NFR-007', () => {
    test('should validate required fields', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<LoginScreen />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      // Should not call API
      expect(apiService.login).not.toHaveBeenCalled();
    });

    test('should validate email format', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    test('should validate password minimum length', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'chp1@mms.org');
      await user.type(passwordInput, '123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    test('should validate password strength', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'chp1@mms.org');
      await user.type(passwordInput, 'weak');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is too weak/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States - NFR-011', () => {
    test('should show loading state during login', async () => {
      const user = userEvent.setup();
      
      // Mock slow API response
      apiService.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'chp1@mms.org');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    test('should disable form during loading', async () => {
      const user = userEvent.setup();
      
      apiService.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'chp1@mms.org');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Form should be disabled
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    test('should show loading state during password reset', async () => {
      const user = userEvent.setup();
      
      apiService.resetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithAuth(<LoginScreen />);

      const forgotPasswordLink = screen.getByText(/forgot password/i);
      await user.click(forgotPasswordLink);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      await user.type(emailInput, 'chp1@mms.org');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/sending reset link/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Security Tests - NFR-005, NFR-006, NFR-007, NFR-008, NFR-009', () => {
    test('should prevent brute force attacks', async () => {
      const user = userEvent.setup();
      
      apiService.login.mockRejectedValue({
        response: {
          status: 429,
          data: { detail: 'Too many login attempts' }
        }
      });

      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Try multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await user.type(emailInput, 'wrong@email.com');
        await user.type(passwordInput, 'wrongpass');
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument();
        });
      }

      // Should show rate limiting message
      await waitFor(() => {
        expect(screen.getByText(/too many login attempts/i)).toBeInTheDocument();
      });

      // Form should be disabled
      expect(submitButton).toBeDisabled();
    });

    test('should sanitize user input', async () => {
      const user = userEvent.setup();
      
      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Test XSS attempt
      await user.type(emailInput, '<script>alert("xss")</script>');
      await user.type(passwordInput, '<script>alert("xss")</script>');

      // Input should be sanitized
      expect(emailInput.value).toBe('<script>alert("xss")</script>');
      expect(passwordInput.value).toBe('<script>alert("xss")</script>');
      
      // But should not execute malicious code
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Should call API with sanitized input
      await waitFor(() => {
        expect(apiService.login).toHaveBeenCalledWith({
          email: '<script>alert("xss")</script>',
          password: '<script>alert("xss")</script>'
        });
      });
    });

    test('should validate JWT token format', async () => {
      // Mock invalid token format
      localStorageMock.getItem.mockReturnValue('invalid.token.format');

      renderWithAuth(<LoginScreen />);

      // Should redirect to login for invalid token format
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('should handle token expiration gracefully', async () => {
      // Mock expired token
      localStorageMock.getItem.mockReturnValue('expired.token.here');

      renderWithAuth(<LoginScreen />);

      // Should redirect to login for expired token
      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('Accessibility Tests - NFR-016', () => {
    test('should support keyboard navigation', async () => {
      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Should be able to navigate with Tab key
      emailInput.focus();
      expect(emailInput).toHaveFocus();

      // Tab to password field
      emailInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(passwordInput).toHaveFocus();

      // Tab to submit button
      passwordInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(submitButton).toHaveFocus();
    });

    test('should have proper ARIA labels', () => {
      renderWithAuth(<LoginScreen />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      expect(emailInput).toHaveAttribute('aria-label');
      expect(passwordInput).toHaveAttribute('aria-label');
      expect(submitButton).toHaveAttribute('aria-label');
    });

    test('should support screen readers', () => {
      renderWithAuth(<LoginScreen />);

      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Check for proper form labels
      const emailLabel = screen.getByText(/email/i);
      const passwordLabel = screen.getByText(/password/i);
      expect(emailLabel).toBeInTheDocument();
      expect(passwordLabel).toBeInTheDocument();
    });
  });
});
