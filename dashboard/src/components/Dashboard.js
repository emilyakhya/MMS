import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  People as PeopleIcon,
  Medication as MedicationIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalRecords: 0,
    aiCounts: 0,
    manualCounts: 0,
    totalPatients: 0,
    totalSupplements: 0,
  });
  const [records, setRecords] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [recordsResponse, patientsResponse] = await Promise.all([
        axios.get('/records'),
        axios.get('/patients'),
      ]);

      const recordsData = recordsResponse.data;
      const patientsData = patientsResponse.data;

      // Calculate statistics
      const aiCounts = recordsData.filter(r => r.source === 'ai').length;
      const manualCounts = recordsData.filter(r => r.source === 'manual').length;

      setStats({
        totalRecords: recordsData.length,
        aiCounts,
        manualCounts,
        totalPatients: patientsData.length,
        totalSupplements: patientsData.length * 2, // Assuming 2 supplements per patient
      });

      setRecords(recordsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    // Group records by date for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayRecords = records.filter(r => 
        r.timestamp.startsWith(date)
      );
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ai: dayRecords.filter(r => r.source === 'ai').length,
        manual: dayRecords.filter(r => r.source === 'manual').length,
      };
    });
  };

  const getPieData = () => [
    { name: 'AI Counts', value: stats.aiCounts },
    { name: 'Manual Counts', value: stats.manualCounts },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Patients
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalPatients}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MedicationIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Supplements
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalSupplements}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    AI Counts
                  </Typography>
                  <Typography variant="h4">
                    {stats.aiCounts}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Manual Counts
                  </Typography>
                  <Typography variant="h4">
                    {stats.manualCounts}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Pill Counts (Last 7 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ai" fill="#4CAF50" name="AI Counts" />
                  <Bar dataKey="manual" fill="#FF9800" name="Manual Counts" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Count Source Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getPieData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          {records.length === 0 ? (
            <Typography color="textSecondary">
              No recent pill counting activity.
            </Typography>
          ) : (
            <Box>
              {records.slice(0, 5).map((record) => (
                <Box key={record.id} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
                  <Typography variant="body2">
                    <strong>Patient {record.patient_id}</strong> - {record.pill_count} pills counted
                    <span style={{ 
                      color: record.source === 'ai' ? '#4CAF50' : '#FF9800',
                      marginLeft: 8 
                    }}>
                      ({record.source.toUpperCase()})
                    </span>
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(record.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Dashboard;
