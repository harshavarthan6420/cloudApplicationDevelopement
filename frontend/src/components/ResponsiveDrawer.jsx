import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RateReviewIcon from '@mui/icons-material/RateReview';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

function ResponsiveDrawer() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, username, logout } = useAuth();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const navItems = [
    { label: 'Home', path: '/', icon: <HomeIcon /> },
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Library', path: '/library', icon: <LibraryBooksIcon /> },
    { label: 'Wishlist', path: '/wishlist', icon: <FavoriteIcon /> },
    { label: 'Reviews', path: '/reviews', icon: <RateReviewIcon /> },
    { label: 'Profile', path: '/profile', icon: <PersonIcon /> }
  ];

  const drawer = (
    <Box sx={{ height: '100%', backgroundColor: '#212227', color: 'text.primary' }}>
      <Toolbar sx={{ minHeight: { xs: 72, sm: 80 }, alignItems: 'flex-start', pt: 2.25 }}>
        <Box>
          <Typography variant="h5" noWrap component="div" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '-0.03em' }}>
            GameVault
          </Typography>
          {isAuthenticated ? (
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Signed in as {username}
            </Typography>
          ) : null}
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.16)' }} />
      <List sx={{ px: 1.25, py: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              data-testid={`nav-${item.label.toLowerCase()}`}
              selected={location.pathname === item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              sx={{ borderRadius: 1, mb: 0.5, '&.Mui-selected': { backgroundColor: 'secondary.main' }, '&.Mui-selected:hover': { backgroundColor: 'secondary.dark' } }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        {isAuthenticated ? (
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} data-testid="nav-logout" sx={{ borderRadius: 1, mt: 1 }}>
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        ) : null}
      </List>
    </Box>
  );
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, backgroundColor: '#212227', borderBottom: '1px solid #36393f' }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ color: 'primary.main', fontWeight: 800 }}>
            GameVault
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 0, backgroundColor: '#212227', color: '#efeff2' }
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Toolbar />
    </Box>
  );
}

export default ResponsiveDrawer;
