import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../store/slices/authSlice';
import { logout } from '../services/auth.service';

export default function AdminLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
    navigate('/login');
  };

  return (
    <Box>
      <AppBar position="static" color="secondary">
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" component={Link} to="/admin/sellers" sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 700 }}>
            INDIVO Admin
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2">{user?.mobile}</Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
