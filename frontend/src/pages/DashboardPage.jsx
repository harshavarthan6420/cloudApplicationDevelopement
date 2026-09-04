import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Container, Grid, Paper, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { getDashboardStats } from '../services/dashboardService';

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const mapError = (error, fallback) => {
    if (error instanceof AxiosError && error.response?.data?.error) {
      return error.response.data.error;
    }
    return fallback;
  };

  const loadStats = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const payload = await getDashboardStats();
      setStats(payload);
    } catch (error) {
      setErrorMessage(mapError(error, 'Unable to load dashboard statistics.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const statusChartData = stats
    ? Object.entries(stats.charts.games_by_status || {}).map(([status, count]) => ({ status, count }))
    : [];

  const ratingChartData = stats
    ? Object.entries(stats.charts.rating_distribution || {}).map(([rating, count]) => ({ rating, count }))
    : [];

  const wishlistVsLibrary = stats
    ? [
        { name: 'Library', value: stats.charts.library_vs_wishlist?.library || 0 },
        { name: 'Wishlist', value: stats.charts.library_vs_wishlist?.wishlist || 0 }
      ]
    : [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Dashboard"
        subtitle="Track your collection totals, play status, and review distribution."
      />

      <ErrorMessage message={errorMessage} />

      {loading ? <LoadingState message="Loading dashboard..." /> : null}

      {!loading && stats && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}><StatCard label="Total Games" value={stats.total_games} /></Grid>
            <Grid item xs={6} md={3}><StatCard label="Playing" value={stats.currently_playing} /></Grid>
            <Grid item xs={6} md={3}><StatCard label="Completed" value={stats.completed_games} /></Grid>
            <Grid item xs={6} md={3}><StatCard label="Backlog" value={stats.backlog_games} /></Grid>
            <Grid item xs={6} md={3}><StatCard label="Dropped" value={stats.dropped_games} /></Grid>
            <Grid item xs={6} md={3}><StatCard label="Wishlist" value={stats.wishlist_count} /></Grid>
            <Grid item xs={6} md={3}><StatCard label="Reviews" value={stats.review_count} /></Grid>
            <Grid item xs={6} md={3}><StatCard label="Hours Played" value={stats.total_hours_played} /></Grid>
          </Grid>

          {stats.total_games === 0 && stats.wishlist_count === 0 && stats.review_count === 0 ? (
            <EmptyState
              title="No collection data yet"
              description="Add games to your library or wishlist to populate dashboard analytics."
            />
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>
                    Games by Status
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={statusChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#1976d2" name="Games" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>
                    Library vs Wishlist
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={wishlistVsLibrary} dataKey="value" nameKey="name" outerRadius={95} label />
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>
                    Rating Distribution
                  </Typography>
                  {ratingChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={ratingChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="rating" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#2e7d32" name="Reviews" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState
                      title="No ratings yet"
                      description="Create reviews to visualize rating distribution."
                    />
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </Container>
  );
}

export default DashboardPage;
