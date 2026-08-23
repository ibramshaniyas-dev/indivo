import { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Divider, Avatar, Menu, MenuItem,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import WarehouseRoundedIcon from '@mui/icons-material/WarehouseRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../store/slices/authSlice';
import { logout } from '../services/auth.service';

const DRAWER_WIDTH = 240;

const NAV = [
  { label: 'Dashboard', icon: DashboardRoundedIcon, to: '/seller/dashboard' },
  { label: 'Products', icon: Inventory2RoundedIcon, to: '/seller/products' },
  { label: 'Add Product', icon: AddBoxRoundedIcon, to: '/seller/products/new' },
  { label: 'Inventory', icon: WarehouseRoundedIcon, to: '/seller/inventory' },
  { label: 'Orders', icon: ReceiptLongRoundedIcon, to: '/seller/orders' },
  { label: 'Profile', icon: PersonRoundedIcon, to: '/seller/profile' },
];

export default function SellerDashboardLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
    navigate('/seller/login');
  };

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>INDIVO Seller</Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <List dense sx={{ py: 1 }}>
        {NAV.map((item) => {
          const active = location.pathname === item.to;
          return (
            <ListItemButton
              key={item.label}
              component={Link}
              to={item.to}
              selected={active}
              sx={{
                mx: 1, borderRadius: 2, color: 'rgba(255,255,255,0.85)',
                '&.Mui-selected': { bgcolor: 'rgba(201,151,75,0.18)', color: 'secondary.light' },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}><item.icon fontSize="small" /></ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 700 : 500 }}>
                {item.label}
              </ListItemText>
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: 'primary.main' } }}
        >
          {sidebarContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: 'primary.main', border: 'none' } }}
        >
          {sidebarContent}
        </Drawer>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton sx={{ display: { md: 'none' } }} onClick={() => setMobileOpen(true)}>
              <MenuRoundedIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                {(user?.sellerName || user?.mobile || 'S')[0].toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
              <MenuItem disabled sx={{ opacity: '1 !important' }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.sellerName}</Typography>
                  <Typography variant="caption" color="text.secondary">{user?.mobile}</Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
