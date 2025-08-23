import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  LineChart,
  Line,
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
  AreaChart,
  Area,
} from 'recharts';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [recordsResponse, patientsResponse] = await Promise.all([
        axios.get('/records'),
        axios.get('/patients'),
      ]);

      setRecords(recordsResponse.data);
      setPatients(patientsResponse.data);
    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyData = () => {
    // Simulate accuracy data for demo purposes
    // In a real app, this would come from comparing AI vs manual counts
    return [
      { month: 'Jan', accuracy: 85 },
      { month: 'Feb', accuracy: 88 },
      { month: 'Mar', accuracy: 92 },
      { month: 'Apr', accuracy: 89 },
      { month: 'May', accuracy: 94 },
      { month: 'Jun', accuracy: 91 },
    ];
  };

  const getPatientActivityData = () => {
    const patientActivity = {};
    records.forEach(record => {
      const patientId = record.patient_id;
      if (!patientActivity[patientId]) {
        patientActivity[patientId] = 0;
      }
      patientActivity[patientId]++;
    });

    return Object.entries(patientActivity)
      .map(([patientId, count]) => ({
        patientId: `Patient ${patientId}`,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getSourceDistributionData = () => {
    const aiCount = records.filter(r => r.source === 'ai').length;
    const manualCount = records.filter(r => r.source === 'manual').length;
    
    return [
      { name: 'AI Counts', value: aiCount },
      { name: 'Manual Counts', value: manualCount },
    ];
  };

  const getConfidenceDistributionData = () => {
    const aiRecords = records.filter(r => r.source === 'ai' && r.confidence);
    const confidenceRanges = {
      '90-100%': 0,
      '80-89%': 0,
      '70-79%': 0,
      '60-69%': 0,
      '<60%': 0,
    };

    aiRecords.forEach(record => {
      const confidence = record.confidence * 100;
      if (confidence >= 90) confidenceRanges['90-100%']++;
      else if (confidence >= 80) confidenceRanges['80-89%']++;
      else if (confidence >= 70) confidenceRanges['70-79%']++;
      else if (confidence >= 60) confidenceRanges['60-69%']++;
      else confidenceRanges['<60%']++;
    });

    return Object.entries(confidenceRanges).map(([range, count]) => ({
      range,
      count,
    }));
  };

  const getTrendData = () => {
    // Group records by week for the last 8 weeks
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weeks.push(weekStart.toISOString().split('T')[0]);
    }

    return weeks.map((weekStart, index) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekRecords = records.filter(r => {
        const recordDate = new Date(r.timestamp);
        return recordDate >= new Date(weekStart) && recordDate <= weekEnd;
      });

      return {
        week: `Week ${index + 1}`,
        ai: weekRecords.filter(r => r.source === 'ai').length,
        manual: weekRecords.filter(r => r.source === 'manual').length,
        total: weekRecords.length,
      };
    });
  };

  const calculateMetrics = () => {
    const totalRecords = records.length;
    const aiRecords = records.filter(r => r.source === 'ai');
    const manualRecords = records.filter(r => r.source === 'manual');
    
    const avgConfidence = aiRecords.length > 0 
      ? aiRecords.reduce((sum, r) => sum + (r.confidence || 0), 0) / aiRecords.length
      : 0;

    const avgPillCount = totalRecords > 0
      ? records.reduce((sum, r) => sum + r.pill_count, 0) / totalRecords
      : 0;

    return {
      totalRecords,
      aiRecords: aiRecords.length,
      manualRecords: manualRecords.length,
      avgConfidence: Math.round(avgConfidence * 100),
      avgPillCount: Math.round(avgPillCount),
      aiAccuracy: Math.round((aiRecords.length / totalRecords) * 100),
    };
  };

  const metrics = calculateMetrics();

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
        Analytics & Insights
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Records
              </Typography>
              <Typography variant="h4">
                {metrics.totalRecords}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                AI Counts
              </Typography>
              <Typography variant="h4" color="success.main">
                {metrics.aiRecords}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Manual Counts
              </Typography>
              <Typography variant="h4" color="warning.main">
                {metrics.manualRecords}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Confidence
              </Typography>
              <Typography variant="h4" color="info.main">
                {metrics.avgConfidence}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Pill Count
              </Typography>
              <Typography variant="h4" color="primary.main">
                {metrics.avgPillCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                AI Usage Rate
              </Typography>
              <Typography variant="h4" color="secondary.main">
                {metrics.aiAccuracy}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Weekly Trends */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="ai" stackId="1" fill="#4CAF50" stroke="#4CAF50" />
                  <Area type="monotone" dataKey="manual" stackId="1" fill="#FF9800" stroke="#FF9800" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Source Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Count Source Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getSourceDistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getSourceDistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Accuracy Trend */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Accuracy Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getAccuracyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="#2196F3" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Confidence Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Confidence Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getConfidenceDistributionData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Patient Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Most Active Patients
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getPatientActivityData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="patientId" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Insights */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Key Insights
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  AI Performance
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • AI is being used for {metrics.aiAccuracy}% of all pill counts
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Average confidence score: {metrics.avgConfidence}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Manual verification needed for {100 - metrics.aiAccuracy}% of cases
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  System Usage
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Total records collected: {metrics.totalRecords}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Average pills per count: {metrics.avgPillCount}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Active patients: {patients.length}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Analytics;
