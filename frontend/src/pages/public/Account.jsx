import { Box, Container, Typography, Paper, List, ListItemButton, ListItemIcon, ListItemText, Avatar, Divider } from '@mui/material';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../../store/slices/authSlice';
import { resetCart } from '../../store/slices/cartSlice';
import { resetWishlist } from '../../store/slices/wishlistSlice';
import { logout } from '../../services/auth.service';

const LINKS = [
  { label: 'My Orders', icon: ReceiptLongRoundedIcon, to: '/account/orders' },
  { label: 'Addresses', icon: LocationOnRoundedIcon, to: '/account/addresses' },
  { label: 'Wishlist', icon: FavoriteBorderRoundedIcon, to: '/wishlist' },
  { label: 'My Reviews', icon: RateReviewRoundedIcon, to: '/account/reviews' },
];

export default function Account() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
    dispatch(resetCart());
    dispatch(resetWishlist());
    navigate('/login');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
          <PersonRoundedIcon />
        </Avatar>
        <Box>
          <Typography variant="h6">{user?.mobile}</Typography>
          {user?.email && <Typography variant="body2" color="text.secondary">{user.email}</Typography>}
        </Box>
      </Paper>

      <Paper>
        <List disablePadding>
          {LINKS.map((item) => (
            <ListItemButton key={item.label} component={Link} to={item.to}>
              <ListItemIcon><item.icon /></ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
          <Divider />
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><LogoutRoundedIcon color="error" /></ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ color: 'error' }} />
          </ListItemButton>
        </List>
      </Paper>
    </Container>
  );
}
