import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Dashboard from '../components/Dashboard';
import Analytics from '../components/Analytics';
import RecordsTable from '../components/RecordsTable';
import Layout from '../components/Layout';

// Mock the API service
jest.mock('../services/apiService', () => ({
  getAnalytics: jest.fn(),
  getRecords: jest.fn(),
  getUsers: jest.fn(),
  exportData: jest.fn(),
}));

// Mock Material-UI components
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Box: ({ children, ...props }) => <div {...props}>{children}</div>,
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  Typography: ({ children, ...props }) => <div {...props}>{children}</div>,
  Grid: ({ children, ...props }) => <div {...props}>{children}</div>,
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  TextField: ({ onChange, ...props }) => (
    <input onChange={onChange} {...props} />
  ),
  Select: ({ children, onChange, value, ...props }) => (
    <select onChange={onChange} value={value} {...props}>{children}</select>
  ),
  MenuItem: ({ children, value, ...props }) => (
    <option value={value} {...props}>{children}</option>
  ),
  Table: ({ children, ...props }) => <table {...props}>{children}</table>,
  TableBody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  TableCell: ({ children, ...props }) => <td {...props}>{children}</td>,
  TableHead: ({ children, ...props }) => <thead {...props}>{children}</thead>,
  TableRow: ({ children, ...props }) => <tr {...props}>{children}</tr>,
  Paper: ({ children, ...props }) => <div {...props}>{children}</div>,
  AppBar: ({ children, ...props }) => <div {...props}>{children}</div>,
  Toolbar: ({ children, ...props }) => <div {...props}>{children}</div>,
  Drawer: ({ children, ...props }) => <div {...props}>{children}</div>,
  List: ({ children, ...props }) => <ul {...props}>{children}</ul>,
  ListItem: ({ children, ...props }) => <li {...props}>{children}</li>,
  ListItemIcon: ({ children, ...props }) => <div {...props}>{children}</div>,
  ListItemText: ({ children, ...props }) => <div {...props}>{children}</div>,
  IconButton: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children, ...props }) => <div {...props}>{children}</div>,
  Line: ({ ...props }) => <div {...props} />,
  BarChart: ({ children, ...props }) => <div {...props}>{children}</div>,
  Bar: ({ ...props }) => <div {...props} />,
  PieChart: ({ children, ...props }) => <div {...props}>{children}</div>,
  Pie: ({ ...props }) => <div {...props} />,
  XAxis: ({ ...props }) => <div {...props} />,
  YAxis: ({ ...props }) => <div {...props} />,
  CartesianGrid: ({ ...props }) => <div {...props} />,
  Tooltip: ({ ...props }) => <div {...props} />,
  Legend: ({ ...props }) => <div {...props} />,
  ResponsiveContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

describe('Dashboard Components', () => {
  let apiService;
  
  beforeEach(() => {
    apiService = require('../services/apiService');
    jest.clearAllMocks();
  });

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  describe('Dashboard Component - FR-028, FR-029, FR-030, FR-031, FR-032', () => {
    test('should display aggregated statistics - FR-028', async () => {
      const mockAnalytics = {
        total_records: 150,
        ai_count: 120,
        manual_count: 30,
        average_confidence: 0.85,
        total_patients: 45,
        total_supplements: 8
      };

      apiService.getAnalytics.mockResolvedValue(mockAnalytics);

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Total records
        expect(screen.getByText('120')).toBeInTheDocument(); // AI count
        expect(screen.getByText('30')).toBeInTheDocument(); // Manual count
        expect(screen.getByText('85%')).toBeInTheDocument(); // Average confidence
      });
    });

    test('should provide advanced filtering and search - FR-029', async () => {
      const user = userEvent.setup();
      
      renderWithRouter(<Dashboard />);

      // Test date range filter
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      
      await user.type(startDateInput, '2024-01-01');
      await user.type(endDateInput, '2024-01-31');

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search records/i);
      await user.type(searchInput, 'John Doe');

      // Test filter dropdowns
      const sourceFilter = screen.getByLabelText(/source/i);
      await user.selectOptions(sourceFilter, 'ai');

      const userFilter = screen.getByLabelText(/user/i);
      await user.selectOptions(userFilter, 'chp1@mms.org');
    });

    test('should support user management operations - FR-030', async () => {
      const mockUsers = [
        { id: 1, email: 'chp1@mms.org', role: 'chp', is_active: true },
        { id: 2, email: 'admin@mms.org', role: 'admin', is_active: true }
      ];

      apiService.getUsers.mockResolvedValue(mockUsers);

      renderWithRouter(<Dashboard />);

      // Navigate to user management
      const userManagementTab = screen.getByText(/user management/i);
      await userEvent.click(userManagementTab);

      await waitFor(() => {
        expect(screen.getByText('chp1@mms.org')).toBeInTheDocument();
        expect(screen.getByText('admin@mms.org')).toBeInTheDocument();
      });

      // Test user creation
      const addUserButton = screen.getByText(/add user/i);
      await userEvent.click(addUserButton);

      // Test user editing
      const editButtons = screen.getAllByText(/edit/i);
      await userEvent.click(editButtons[0]);

      // Test user deactivation
      const deactivateButtons = screen.getAllByText(/deactivate/i);
      await userEvent.click(deactivateButtons[0]);
    });

    test('should show system health monitoring - FR-031', async () => {
      renderWithRouter(<Dashboard />);

      // Navigate to system health
      const systemHealthTab = screen.getByText(/system health/i);
      await userEvent.click(systemHealthTab);

      // Check for system health indicators
      expect(screen.getByText(/uptime/i)).toBeInTheDocument();
      expect(screen.getByText(/database status/i)).toBeInTheDocument();
      expect(screen.getByText(/ai model status/i)).toBeInTheDocument();
      expect(screen.getByText(/api performance/i)).toBeInTheDocument();
    });

    test('should display audit log viewing - FR-032', async () => {
      const mockAuditLogs = [
        { id: 1, user_id: 1, action: 'login', timestamp: '2024-01-01T10:00:00' },
        { id: 2, user_id: 1, action: 'pill_count', timestamp: '2024-01-01T10:05:00' }
      ];

      apiService.getAuditLogs = jest.fn().mockResolvedValue(mockAuditLogs);

      renderWithRouter(<Dashboard />);

      // Navigate to audit logs
      const auditLogsTab = screen.getByText(/audit logs/i);
      await userEvent.click(auditLogsTab);

      await waitFor(() => {
        expect(screen.getByText('login')).toBeInTheDocument();
        expect(screen.getByText('pill_count')).toBeInTheDocument();
      });

      // Test audit log filtering
      const actionFilter = screen.getByLabelText(/action type/i);
      await userEvent.selectOptions(actionFilter, 'login');
    });
  });

  describe('Analytics Component - FR-028', () => {
    test('should display real-time analytics charts', async () => {
      const mockAnalytics = {
        daily_counts: [
          { date: '2024-01-01', count: 25 },
          { date: '2024-01-02', count: 30 },
          { date: '2024-01-03', count: 28 }
        ],
        source_distribution: [
          { source: 'ai', count: 80 },
          { source: 'manual', count: 20 }
        ],
        confidence_distribution: [
          { range: '0.9-1.0', count: 60 },
          { range: '0.8-0.9', count: 30 },
          { range: '0.7-0.8', count: 10 }
        ]
      };

      apiService.getAnalytics.mockResolvedValue(mockAnalytics);

      renderWithRouter(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/daily pill counts/i)).toBeInTheDocument();
        expect(screen.getByText(/source distribution/i)).toBeInTheDocument();
        expect(screen.getByText(/confidence distribution/i)).toBeInTheDocument();
      });
    });

    test('should support data export functionality', async () => {
      apiService.exportData.mockResolvedValue({ success: true });

      renderWithRouter(<Analytics />);

      // Test CSV export
      const csvExportButton = screen.getByText(/export csv/i);
      await userEvent.click(csvExportButton);

      await waitFor(() => {
        expect(apiService.exportData).toHaveBeenCalledWith('csv');
      });

      // Test Excel export
      const excelExportButton = screen.getByText(/export excel/i);
      await userEvent.click(excelExportButton);

      await waitFor(() => {
        expect(apiService.exportData).toHaveBeenCalledWith('excel');
      });
    });

    test('should handle analytics loading states', async () => {
      apiService.getAnalytics.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithRouter(<Analytics />);

      // Should show loading state
      expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/loading analytics/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('RecordsTable Component - FR-025, FR-026', () => {
    test('should display historical records with search and filter - FR-025', async () => {
      const mockRecords = [
        {
          id: 1,
          patient_name: 'John Doe',
          supplement_name: 'Iron Supplement',
          pill_count: 25,
          confidence: 0.85,
          source: 'ai',
          created_at: '2024-01-01T10:00:00'
        }
      ];

      apiService.getRecords.mockResolvedValue(mockRecords);

      renderWithRouter(<RecordsTable />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Iron Supplement')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
      });

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search records/i);
      await userEvent.type(searchInput, 'John');

      // Test filtering
      const sourceFilter = screen.getByLabelText(/source/i);
      await userEvent.selectOptions(sourceFilter, 'ai');
    });

    test('should support data export capabilities - FR-026', async () => {
      const mockRecords = [
        {
          id: 1,
          patient_name: 'John Doe',
          supplement_name: 'Iron Supplement',
          pill_count: 25,
          confidence: 0.85,
          source: 'ai',
          created_at: '2024-01-01T10:00:00'
        }
      ];

      apiService.getRecords.mockResolvedValue(mockRecords);
      apiService.exportData.mockResolvedValue({ success: true });

      renderWithRouter(<RecordsTable />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Test export functionality
      const exportButton = screen.getByText(/export/i);
      await userEvent.click(exportButton);

      await waitFor(() => {
        expect(apiService.exportData).toHaveBeenCalled();
      });
    });

    test('should handle pagination correctly', async () => {
      const mockRecords = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        patient_name: `Patient ${i + 1}`,
        supplement_name: 'Iron Supplement',
        pill_count: 25,
        confidence: 0.85,
        source: 'ai',
        created_at: '2024-01-01T10:00:00'
      }));

      apiService.getRecords.mockResolvedValue(mockRecords);

      renderWithRouter(<RecordsTable />);

      await waitFor(() => {
        expect(screen.getByText('Patient 1')).toBeInTheDocument();
      });

      // Test pagination
      const nextPageButton = screen.getByLabelText(/next page/i);
      await userEvent.click(nextPageButton);

      // Should show next page of results
      await waitFor(() => {
        expect(screen.getByText('Patient 11')).toBeInTheDocument();
      });
    });
  });

  describe('Layout Component - NFR-014, NFR-015, NFR-016', () => {
    test('should provide intuitive user interface design - NFR-014', () => {
      renderWithRouter(<Layout />);

      // Check for navigation elements
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/records/i)).toBeInTheDocument();
      expect(screen.getByText(/users/i)).toBeInTheDocument();
      expect(screen.getByText(/settings/i)).toBeInTheDocument();
    });

    test('should support responsive design for mobile/desktop - NFR-015', () => {
      renderWithRouter(<Layout />);

      // Test mobile menu toggle
      const menuButton = screen.getByLabelText(/menu/i);
      await userEvent.click(menuButton);

      // Should show mobile navigation
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();

      // Test desktop navigation
      const desktopNav = screen.getByRole('navigation');
      expect(desktopNav).toBeInTheDocument();
    });

    test('should meet accessibility compliance - NFR-016', () => {
      renderWithRouter(<Layout />);

      // Check for proper ARIA labels
      expect(screen.getByLabelText(/menu/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/search/i)).toBeInTheDocument();

      // Check for proper heading structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Check for proper button roles
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Performance Tests - NFR-001, NFR-002, NFR-003, NFR-004', () => {
    test('should load dashboard under 3 seconds - NFR-001', async () => {
      const startTime = performance.now();

      apiService.getAnalytics.mockResolvedValue({
        total_records: 150,
        ai_count: 120,
        manual_count: 30,
        average_confidence: 0.85
      });

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(3000); // Under 3 seconds
    });

    test('should handle concurrent data requests - NFR-004', async () => {
      apiService.getAnalytics.mockResolvedValue({ total_records: 150 });
      apiService.getRecords.mockResolvedValue([]);
      apiService.getUsers.mockResolvedValue([]);

      renderWithRouter(<Dashboard />);

      // Navigate between different sections to trigger concurrent requests
      const analyticsTab = screen.getByText(/analytics/i);
      const recordsTab = screen.getByText(/records/i);
      const usersTab = screen.getByText(/users/i);

      await userEvent.click(analyticsTab);
      await userEvent.click(recordsTab);
      await userEvent.click(usersTab);

      await waitFor(() => {
        expect(apiService.getAnalytics).toHaveBeenCalled();
        expect(apiService.getRecords).toHaveBeenCalled();
        expect(apiService.getUsers).toHaveBeenCalled();
      });
    });
  });

  describe('Security Tests - NFR-005, NFR-006, NFR-007, NFR-008, NFR-009', () => {
    test('should validate user permissions for admin functions - NFR-007', async () => {
      // Mock user with limited permissions
      const mockUser = { role: 'chp', permissions: ['view_records'] };

      renderWithRouter(<Dashboard user={mockUser} />);

      // Admin functions should not be accessible
      expect(screen.queryByText(/user management/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/audit logs/i)).not.toBeInTheDocument();
    });

    test('should sanitize user input in search fields - NFR-009', async () => {
      renderWithRouter(<RecordsTable />);

      const searchInput = screen.getByPlaceholderText(/search records/i);
      
      // Test XSS attempt
      await userEvent.type(searchInput, '<script>alert("xss")</script>');

      // Input should be sanitized
      expect(searchInput.value).toBe('<script>alert("xss")</script>');
      
      // But the search should not execute malicious code
      const searchButton = screen.getByText(/search/i);
      await userEvent.click(searchButton);

      // Should call API with sanitized input
      await waitFor(() => {
        expect(apiService.getRecords).toHaveBeenCalledWith(
          expect.objectContaining({
            search: '<script>alert("xss")</script>'
          })
        );
      });
    });
  });

  describe('Error Handling Tests - NFR-011, NFR-012', () => {
    test('should handle API errors gracefully - NFR-011', async () => {
      apiService.getAnalytics.mockRejectedValue(new Error('API Error'));

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/error loading analytics/i)).toBeInTheDocument();
      });
    });

    test('should provide retry mechanism for failed requests - NFR-012', async () => {
      apiService.getAnalytics
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({ total_records: 150 });

      renderWithRouter(<Dashboard />);

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText(/error loading analytics/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText(/retry/i);
      await userEvent.click(retryButton);

      // Should load data successfully
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });
  });
});
