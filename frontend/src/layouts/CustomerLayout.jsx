import { useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box, Button, InputBase, IconButton, Badge, Container,
  Divider, Link as MuiLink, Paper,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCart } from '../store/slices/cartSlice';
import { setWishlist } from '../store/slices/wishlistSlice';
import { getCart } from '../services/cart.service';
import { getWishlist } from '../services/wishlist.service';
import BrandLogo from '../components/BrandLogo';
import { BRAND } from '../brand';
import { goldGradient, champagne, champagneSoft } from '../theme';
import api from '../services/api';

const FOOTER_COLUMNS = [
  { title: BRAND.name, links: [{ label: 'About Us', href: '/about' }, { label: 'Contact Us', href: '/contact' }] },
  { title: 'Customer Care', links: [{ label: 'Track Order', href: '/account/orders' }, { label: 'My Account', href: '/account' }, { label: 'Wishlist', href: '/wishlist' }] },
  { title: 'Sell with Us', links: [{ label: 'Become a Seller', href: '/sell' }, { label: 'Seller Login', href: '/seller/login' }] },
];

export default function CustomerLayout() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cartCount = useSelector((state) => state.cart.itemCount);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user?.userType === 'CUSTOMER') {
      getCart().then((summary) => dispatch(setCart(summary))).catch(() => {});
      getWishlist().then((items) => dispatch(setWishlist(items))).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    api.get('/categories', { params: { parentId: 'null' } })
      .then((res) => setCategories(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const iconBtnSx = { color: 'primary.main', '&:hover': { color: 'secondary.dark', bgcolor: 'transparent' } };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box sx={{ background: champagne, color: '#5C3F10', py: 0.75, textAlign: 'center', borderBottom: '1px solid rgba(154,114,40,0.18)' }}>
        <Typography variant="overline" sx={{ fontSize: '0.62rem' }}>
          {BRAND.tagline}
        </Typography>
      </Box>

      <AppBar position="sticky" color="default" sx={{ bgcolor: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)' }} elevation={0}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: { xs: 1.5, md: 4 }, py: 1.5, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            <BrandLogo size="medium" showTagline sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />
            <BrandLogo size="small" sx={{ display: { xs: 'inline-flex', sm: 'none' } }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flexShrink: 0, ml: { xs: 'auto', md: 0 }, order: { xs: 1, md: 3 } }}>
              <IconButton component={Link} to="/wishlist" aria-label="Wishlist" sx={{ ...iconBtnSx, display: { xs: 'none', sm: 'inline-flex' } }}>
                <FavoriteBorderRoundedIcon />
              </IconButton>
              <IconButton component={Link} to="/cart" aria-label="Cart" sx={iconBtnSx}>
                <Badge badgeContent={cartCount} color="secondary">
                  <ShoppingBagOutlinedIcon />
                </Badge>
              </IconButton>
              {isAuthenticated ? (
                <Button
                  startIcon={<PersonOutlineRoundedIcon />}
                  component={Link}
                  to="/account"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: 'text.primary', maxWidth: 180 }}
                >
                  <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name || user?.mobile}
                  </Box>
                </Button>
              ) : (
                <Button variant="contained" size="small" component={Link} to="/login" sx={{ ml: 1 }}>
                  Sign in
                </Button>
              )}
            </Box>

            <Paper
              component="form"
              onSubmit={handleSearch}
              elevation={0}
              sx={{
                order: { xs: 2, md: 2 }, flexBasis: { xs: '100%', md: 560 }, flexShrink: 1, mx: { md: 'auto' }, display: 'flex', alignItems: 'center',
                pl: 2, pr: 0.5, py: 0.4, border: '1px solid', borderColor: 'divider', borderRadius: 999, bgcolor: 'background.default',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                '&:focus-within': { borderColor: 'secondary.main', boxShadow: '0 0 0 3px rgba(201,160,74,0.18)', bgcolor: '#fff' },
              }}
            >
              <InputBase
                fullWidth
                placeholder="Search fashion, fabrics, fragrances…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputProps={{ 'aria-label': 'Search products' }}
                sx={{ fontSize: '0.9rem' }}
              />
              <IconButton type="submit" aria-label="Search" size="small" sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.light' } }}>
                <SearchRoundedIcon fontSize="small" />
              </IconButton>
            </Paper>
          </Toolbar>
        </Container>

        {categories.length > 0 && (
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', display: { xs: 'none', md: 'block' } }}>
            <Container maxWidth="xl">
              <Box sx={{ display: 'flex', gap: 4, overflowX: 'auto', py: 1.1, scrollbarWidth: 'none' }}>
                <NavItem to="/search">All</NavItem>
                {categories.slice(0, 9).map((c) => (
                  <NavItem key={c.id} to={`/search?category=${c.id}`}>{c.name}</NavItem>
                ))}
              </Box>
            </Container>
          </Box>
        )}
        <Box sx={{ height: 2, backgroundImage: goldGradient }} />
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, pb: { xs: 8, md: 0 } }}>
        <Outlet />
      </Box>

      <Box component="footer" sx={{ background: champagneSoft, color: 'text.secondary', mt: 8, pb: { xs: 10, md: 4 }, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ height: 2, backgroundImage: goldGradient }} />
        <Container maxWidth="xl" sx={{ pt: 7 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1.6fr repeat(3, 1fr)' }, gap: 5 }}>
            <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
              <BrandLogo size="medium" showTagline />
              <Typography variant="body2" sx={{ mt: 2.5, maxWidth: 340, lineHeight: 1.8 }}>
                {BRAND.description}
              </Typography>
            </Box>
            {FOOTER_COLUMNS.map((col) => (
              <Box key={col.title}>
                <Typography variant="overline" sx={{ color: 'primary.main', display: 'block', mb: 1.5, fontSize: '0.68rem' }}>{col.title}</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {col.links.map((l) => (
                    <MuiLink key={l.label} component={Link} to={l.href} underline="none" color="text.primary" variant="body2" sx={{ '&:hover': { color: 'primary.main' } }}>
                      {l.label}
                    </MuiLink>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
          <Divider sx={{ my: 5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.6 }}>
              &copy; {new Date().getFullYear()} {BRAND.name} — an IHARO Groups marketplace. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.6 }}>{BRAND.supportEmail}</Typography>
          </Box>
        </Container>
      </Box>

      <Paper
        elevation={3}
        sx={{
          display: { xs: 'flex', md: 'none' }, position: 'fixed', bottom: 0, left: 0, right: 0,
          justifyContent: 'space-around', py: 1, zIndex: 10, borderRadius: 0, bgcolor: '#FFFCF4', borderTop: '1px solid', borderColor: 'divider',
        }}
      >
        {[
          { icon: HomeRoundedIcon, label: 'Home', to: '/' },
          { icon: CategoryRoundedIcon, label: 'Shop', to: '/search' },
          { icon: FavoriteBorderRoundedIcon, label: 'Wishlist', to: '/wishlist' },
          { icon: ShoppingBagOutlinedIcon, label: 'Bag', to: '/cart' },
          { icon: PersonOutlineRoundedIcon, label: isAuthenticated ? 'Account' : 'Sign in', to: isAuthenticated ? '/account' : '/login' },
        ].map(({ icon: Icon, label, to }) => (
          <Box
            key={label}
            component={NavLink}
            to={to}
            end={to === '/'}
            sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'text.secondary', textDecoration: 'none', gap: 0.25,
              '&.active': { color: 'primary.main', fontWeight: 700 },
            }}
          >
            <Icon fontSize="small" />
            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{label}</Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

function NavItem({ to, children }) {
  return (
    <Box
      component={Link}
      to={to}
      sx={{
        flexShrink: 0, fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'text.primary', textDecoration: 'none', position: 'relative', py: 0.5,
        '&::after': {
          content: '""', position: 'absolute', left: 0, right: 0, bottom: 0, height: 1.5, bgcolor: 'secondary.main',
          transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.25s ease',
        },
        '&:hover': { color: 'secondary.dark' },
        '&:hover::after': { transform: 'scaleX(1)' },
      }}
    >
      {children}
    </Box>
  );
}
