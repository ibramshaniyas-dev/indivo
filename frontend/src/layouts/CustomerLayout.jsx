import { useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box, Button, InputBase, IconButton, Badge, Container,
  Divider, Link as MuiLink, Paper,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../store/slices/authSlice';
import { setCart, resetCart } from '../store/slices/cartSlice';
import { logout } from '../services/auth.service';
import { getCart } from '../services/cart.service';

const FOOTER_COLUMNS = [
  { title: 'INDIVO', links: [{ label: 'About Us', href: '/about' }, { label: 'Careers', href: '#' }, { label: 'Press', href: '#' }] },
  { title: 'Customer Service', links: [{ label: 'Track Order', href: '/orders' }, { label: 'Returns & Refunds', href: '#' }, { label: 'Contact Us', href: '/contact' }] },
  { title: 'Sell on INDIVO', links: [{ label: 'Become a Seller', href: '/sell' }, { label: 'Seller Login', href: '/login' }] },
  { title: 'Legal', links: [{ label: 'Privacy Policy', href: '#' }, { label: 'Terms of Use', href: '#' }, { label: 'Seller Policy', href: '#' }] },
];

export default function CustomerLayout() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cartCount = useSelector((state) => state.cart.itemCount);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated && user?.userType === 'CUSTOMER') {
      getCart().then((summary) => dispatch(setCart(summary))).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
    dispatch(resetCart());
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box sx={{ bgcolor: 'primary.main', color: '#fff', py: 0.5, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ fontWeight: 500, letterSpacing: 0.3 }}>
          India's Best Marketplace — Discover Something Special
        </Typography>
      </Box>

      <AppBar position="sticky" color="default" sx={{ bgcolor: '#fff' }} elevation={0}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: { xs: 1, md: 3 }, py: 1.5 }}>
            <Typography
              variant="h5"
              component={Link}
              to="/"
              sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 800, letterSpacing: '-0.02em', flexShrink: 0 }}
            >
              INDIVO
            </Typography>

            <Paper
              component="form"
              onSubmit={handleSearch}
              elevation={0}
              sx={{
                flexGrow: 1, display: 'flex', alignItems: 'center', px: 1.5, py: 0.25,
                border: '1.5px solid', borderColor: 'divider', borderRadius: 10,
                '&:focus-within': { borderColor: 'primary.main' },
              }}
            >
              <SearchRoundedIcon sx={{ color: 'text.secondary', mr: 1 }} />
              <InputBase
                fullWidth
                placeholder="Search for products, brands and more"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{ fontSize: '0.9rem' }}
              />
            </Paper>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              <IconButton component={Link} to="/wishlist" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                <FavoriteBorderRoundedIcon />
              </IconButton>
              <IconButton component={Link} to="/cart">
                <Badge badgeContent={cartCount} color="secondary">
                  <ShoppingCartOutlinedIcon />
                </Badge>
              </IconButton>

              {isAuthenticated ? (
                <>
                  <Button
                    startIcon={<PersonOutlineRoundedIcon />}
                    onClick={handleLogout}
                    sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: 'text.primary' }}
                  >
                    {user?.mobile}
                  </Button>
                </>
              ) : (
                <Button variant="contained" size="small" component={Link} to="/login" sx={{ ml: 1 }}>
                  Login
                </Button>
              )}
              <Button
                component={Link}
                to="/sell"
                variant="outlined"
                size="small"
                sx={{ display: { xs: 'none', md: 'inline-flex' }, ml: 1 }}
              >
                Sell on INDIVO
              </Button>
            </Box>
          </Toolbar>
        </Container>
        <Divider />
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, pb: { xs: 8, md: 0 } }}>
        <Outlet />
      </Box>

      <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'rgba(255,255,255,0.85)', mt: 6, pt: 6, pb: { xs: 10, md: 4 } }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 4 }}>
            {FOOTER_COLUMNS.map((col) => (
              <Box key={col.title}>
                <Typography variant="subtitle2" sx={{ color: '#fff', mb: 1.5 }}>{col.title}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {col.links.map((l) => (
                    <MuiLink key={l.label} component={Link} to={l.href} underline="hover" color="inherit" variant="body2">
                      {l.label}
                    </MuiLink>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', my: 4 }} />
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            &copy; {new Date().getFullYear()} INDIVO — an IHARO Groups marketplace. All rights reserved.
          </Typography>
        </Container>
      </Box>

      <Paper
        elevation={3}
        sx={{
          display: { xs: 'flex', md: 'none' }, position: 'fixed', bottom: 0, left: 0, right: 0,
          justifyContent: 'space-around', py: 1, zIndex: 10, borderRadius: 0,
        }}
      >
        {[
          { icon: HomeRoundedIcon, label: 'Home', to: '/' },
          { icon: CategoryRoundedIcon, label: 'Categories', to: '/categories' },
          { icon: SearchRoundedIcon, label: 'Search', to: '/search' },
          { icon: FavoriteBorderRoundedIcon, label: 'Wishlist', to: '/wishlist' },
          { icon: isAuthenticated ? StorefrontRoundedIcon : PersonOutlineRoundedIcon, label: isAuthenticated ? 'Account' : 'Login', to: isAuthenticated ? '/account' : '/login' },
        ].map(({ icon: Icon, label, to }) => (
          <Box
            key={label}
            component={Link}
            to={to}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary', textDecoration: 'none', gap: 0.25 }}
          >
            <Icon fontSize="small" />
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{label}</Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
