import { useState } from 'react';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { AxiosError } from 'axios';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.username.trim()) {
      nextErrors.username = 'Username is required';
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const response = await loginUser({
        username: formData.username.trim(),
        password: formData.password
      });
      login(response.username);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error) {
        setServerError(error.response.data.error);
      } else {
        setServerError('Unable to login right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h4">Login</Typography>
        <Typography variant="body1" sx={{ mt: 1, mb: 3 }}>
          Sign in to continue to GameVault.
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <TextField
          label="Username"
          name="username"
          inputProps={{ 'data-testid': 'login-username' }}
          value={formData.username}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={Boolean(errors.username)}
          helperText={errors.username}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          inputProps={{ 'data-testid': 'login-password' }}
          value={formData.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={Boolean(errors.password)}
          helperText={errors.password}
        />

        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading} data-testid="login-submit">
          {loading ? 'Logging in...' : 'Login'}
        </Button>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Do not have an account?{' '}
            <Link component={RouterLink} to="/register">
              Register
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default LoginPage;
