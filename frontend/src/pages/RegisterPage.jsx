import { useState } from 'react';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
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
import { registerUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
    setSuccessMessage('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.username.trim()) {
      nextErrors.username = 'Username is required';
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required';
    }
    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Confirm password is required';
    }
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
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
    setSuccessMessage('');

    try {
      await registerUser({
        username: formData.username.trim(),
        password: formData.password
      });
      setSuccessMessage('User registered successfully. Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 900);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error) {
        setServerError(error.response.data.error);
      } else {
        setServerError('Unable to register right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4 }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h4">Register</Typography>
        <Typography variant="body1" sx={{ mt: 1, mb: 3 }}>
          Create your GameVault account.
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <TextField
          label="Username"
          name="username"
          inputProps={{ 'data-testid': 'register-username' }}
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
          inputProps={{ 'data-testid': 'register-password' }}
          value={formData.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={Boolean(errors.password)}
          helperText={errors.password}
        />
        <TextField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          inputProps={{ 'data-testid': 'register-confirm-password' }}
          value={formData.confirmPassword}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={Boolean(errors.confirmPassword)}
          helperText={errors.confirmPassword}
        />

        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading} data-testid="register-submit">
          {loading ? 'Registering...' : 'Register'}
        </Button>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login">
              Login
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default RegisterPage;
