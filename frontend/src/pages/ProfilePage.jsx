import { useEffect, useState } from 'react';
import { Container, Grid, Paper, Typography } from '@mui/material';
import { AxiosError } from 'axios';
import ErrorMessage from '../components/ErrorMessage';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { getProfile } from '../services/authService';
import { getDashboardStats } from '../services/dashboardService';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const mapError = (error, fallback) => {
    if (error instanceof AxiosError && error.response?.data?.error) {
      return error.response.data.error;
    }
    return fallback;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const [profilePayload, statsPayload] = await Promise.all([getProfile(), getDashboardStats()]);
        setProfile(profilePayload);
        setStats(statsPayload);
      } catch (error) {
        setErrorMessage(mapError(error, 'Unable to load profile details.'));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader title="Profile" subtitle="Account details and quick collection summary." />
      <ErrorMessage message={errorMessage} />

      {loading ? <LoadingState message="Loading profile..." /> : null}

      {!loading && profile ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6">Username</Typography>
              <Typography variant="body1" sx={{ mt: 0.75 }}>
                {profile.username}
              </Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Account Created
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.75 }}>
                {profile.created_at ? new Date(profile.created_at).toLocaleString() : 'Not available'}
              </Typography>
            </Paper>
          </Grid>

          {stats ? (
            <>
              <Grid item xs={6} md={3}><StatCard label="Library Games" value={stats.total_games} /></Grid>
              <Grid item xs={6} md={3}><StatCard label="Wishlist" value={stats.wishlist_count} /></Grid>
              <Grid item xs={6} md={3}><StatCard label="Reviews" value={stats.review_count} /></Grid>
              <Grid item xs={6} md={3}><StatCard label="Hours Played" value={stats.total_hours_played} /></Grid>
            </>
          ) : null}
        </Grid>
      ) : null}
    </Container>
  );
}

export default ProfilePage;
