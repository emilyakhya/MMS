import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';

const columns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'patient_id', headerName: 'Patient ID', width: 120 },
  { field: 'supplement_id', headerName: 'Supplement ID', width: 150 },
  { 
    field: 'pill_count', 
    headerName: 'Pill Count', 
    width: 120,
    renderCell: (params) => (
      <Typography variant="body2" fontWeight="bold" color="primary">
        {params.value}
      </Typography>
    ),
  },
  { 
    field: 'source', 
    headerName: 'Source', 
    width: 120,
    renderCell: (params) => (
      <Chip
        label={params.value.toUpperCase()}
        color={params.value === 'ai' ? 'success' : 'warning'}
        size="small"
      />
    ),
  },
  { 
    field: 'confidence', 
    headerName: 'Confidence', 
    width: 120,
    renderCell: (params) => {
      if (!params.value) return 'N/A';
      const percentage = Math.round(params.value * 100);
      return `${percentage}%`;
    },
  },
  { 
    field: 'timestamp', 
    headerName: 'Date/Time', 
    width: 200,
    renderCell: (params) => new Date(params.value).toLocaleString(),
  },
  { 
    field: 'notes', 
    headerName: 'Notes', 
    width: 200,
    renderCell: (params) => params.value || '-',
  },
];

function RecordsTable() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [filters, setFilters] = useState({
    patientId: '',
    supplementId: '',
    source: '',
    startDate: null,
    endDate: null,
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, filters]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/records');
      setRecords(response.data);
    } catch (err) {
      console.error('Error loading records:', err);
      setError('Failed to load records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    if (filters.patientId) {
      filtered = filtered.filter(r => 
        r.patient_id.toString().includes(filters.patientId)
      );
    }

    if (filters.supplementId) {
      filtered = filtered.filter(r => 
        r.supplement_id.toString().includes(filters.supplementId)
      );
    }

    if (filters.source) {
      filtered = filtered.filter(r => r.source === filters.source);
    }

    if (filters.startDate) {
      filtered = filtered.filter(r => 
        new Date(r.timestamp) >= filters.startDate
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(r => 
        new Date(r.timestamp) <= filters.endDate
      );
    }

    setFilteredRecords(filtered);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.get('/export/csv');
      
      // Create and download CSV file
      const blob = new Blob([response.data.csv_content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pill-counting-records-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      patientId: '',
      supplementId: '',
      source: '',
      startDate: null,
      endDate: null,
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Pill Counting Records
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadRecords}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Patient ID"
                value={filters.patientId}
                onChange={(e) => setFilters({ ...filters, patientId: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Supplement ID"
                value={filters.supplementId}
                onChange={(e) => setFilters({ ...filters, supplementId: e.target.value })}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select
                  value={filters.source}
                  label="Source"
                  onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="ai">AI</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => setFilters({ ...filters, startDate: date })}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => setFilters({ ...filters, endDate: date })}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                fullWidth
                size="small"
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Records ({filteredRecords.length})
            </Typography>
          </Box>
          
          <div style={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredRecords}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              checkboxSelection
              disableSelectionOnClick
              loading={loading}
              sx={{
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #e0e0e0',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  borderBottom: '2px solid #e0e0e0',
                },
              }}
            />
          </div>
        </CardContent>
      </Card>
    </Box>
  );
}

export default RecordsTable;
