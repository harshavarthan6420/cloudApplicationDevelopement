import { Navigate, Route, Routes } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ResponsiveDrawer from './components/ResponsiveDrawer';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LibraryPage from './pages/LibraryPage';
import WishlistPage from './pages/WishlistPage';
import ReviewsPage from './pages/ReviewsPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#a855f7', dark: '#7e22ce', contrastText: '#ffffff' },
    secondary: { main: '#c084fc', dark: '#9333ea', contrastText: '#1b1c20' },
    background: { default: '#1b1c20', paper: '#232529' },
    text: { primary: '#efeff2', secondary: '#a3a6ad' },
    divider: '#36393f'
  },
  typography: {
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 }
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 700, boxShadow: 'none' }
      }
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiCard: {
      styleOverrides: {
        root: { border: '1px solid #36393f', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.22)' }
      }
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        <ResponsiveDrawer />
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2.5, md: 3.5 } }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
