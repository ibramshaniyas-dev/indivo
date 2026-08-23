import { useMemo, useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Divider, Avatar, Menu, MenuItem, Chip,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../store/slices/authSlice';
import { logout } from '../services/auth.service';
import { ADMIN_NAV } from '../config/adminNav';

const DRAWER_WIDTH = 264;

export default function AdminLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const isSuperAdminPortal = location.pathname.startsWith('/super-admin');
  const basePath = isSuperAdminPortal ? '/super-admin' : '/admin';
  const permissions = useMemo(() => new Set(user?.permissions || []), [user]);
  const hasPermission = (perm) => perm === null || user?.isSuperAdmin || permissions.has(perm);

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
    navigate(isSuperAdminPortal ? '/super-admin/login' : '/admin/login');
  };

  const visibleSections = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPermission(item.permission)),
  })).filter((group) => group.items.length > 0);

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: isSuperAdminPortal ? 'secondary.main' : '#fff' }}>
          INDIVO {isSuperAdminPortal ? 'Control Center' : 'Admin'}
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
        {visibleSections.map((group) => (
          <Box key={group.section || 'root'} sx={{ mb: 1 }}>
            {group.section && (
              <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {group.section}
              </Typography>
            )}
            <List dense disablePadding>
              {group.items.map((item) => {
                const fullPath = `${basePath}${item.to}`;
                const active = location.pathname === fullPath.split('?')[0];
                return (
                  <ListItemButton
                    key={item.label}
                    component={Link}
                    to={fullPath}
                    selected={active}
                    sx={{
                      mx: 1, borderRadius: 2, color: 'rgba(255,255,255,0.85)',
                      '&.Mui-selected': { bgcolor: 'rgba(227,166,62,0.16)', color: 'secondary.light' },
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                      <item.icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 700 : 500 }}>
                      {item.label}
                    </ListItemText>
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
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
            {user?.isSuperAdmin && <Chip label="Super Admin" size="small" color="secondary" sx={{ fontWeight: 700 }} />}
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                {(user?.name || user?.email || 'A')[0].toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
              <MenuItem disabled sx={{ opacity: '1 !important' }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.name || 'Admin'}</Typography>
                  <Typography variant="caption" color="text.secondary">{user?.roles?.join(', ')}</Typography>
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
