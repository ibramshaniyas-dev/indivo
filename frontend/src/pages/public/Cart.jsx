import { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Paper, IconButton, Divider, Button, Alert, Chip, Grid, CircularProgress,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/EmptyState';
import { getCart, updateCartItem, removeCartItem } from '../../services/cart.service';
import { setCart } from '../../store/slices/cartSlice';

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export default function Cart() {
  const cart = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busyItemId, setBusyItemId] = useState(null);

  const refresh = async () => {
    const summary = await getCart();
    dispatch(setCart(summary));
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const handleQuantity = async (item, delta) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    setBusyItemId(item.id);
    try {
      const summary = await updateCartItem(item.id, newQty);
      dispatch(setCart(summary));
    } finally {
      setBusyItemId(null);
    }
  };

  const handleRemove = async (item) => {
    setBusyItemId(item.id);
    try {
      const summary = await removeCartItem(item.id);
      dispatch(setCart(summary));
    } finally {
      setBusyItemId(null);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  if (cart.items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <EmptyState
          icon={ShoppingCartOutlinedIcon}
          title="Your cart is empty"
          description="Browse the catalog and add something you like."
          actionLabel="Start Shopping"
          onAction={() => navigate('/search')}
        />
      </Container>
    );
  }

  const canCheckout = !cart.hasIssues;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Shopping Cart</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''} from {cart.sellerGroups.length} seller{cart.sellerGroups.length !== 1 ? 's' : ''}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {cart.sellerGroups.map((group) => (
            <Paper key={group.sellerId} sx={{ mb: 2, p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Sold by {group.sellerName}</Typography>
              <Divider sx={{ mb: 1.5 }} />
              {group.items.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', gap: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box
                    component={Link}
                    to={`/product/${item.productSlug}`}
                    sx={{
                      width: 80, height: 80, borderRadius: 2, flexShrink: 0, bgcolor: 'grey.100',
                      backgroundImage: item.image ? `url(${item.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                    }}
                  />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography component={Link} to={`/product/${item.productSlug}`} sx={{ color: 'text.primary', textDecoration: 'none', fontWeight: 500 }}>
                      {item.productName}
                    </Typography>
                    {item.attributes.length > 0 && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.attributes.map((a) => `${a.name}: ${a.value}`).join(', ')}
                      </Typography>
                    )}
                    {!item.available && (
                      <Chip size="small" color="error" label={item.availableStock === 0 ? 'Out of stock' : 'Unavailable'} sx={{ mt: 0.5 }} />
                    )}
                    {item.priceChanged && item.available && (
                      <Chip size="small" color="warning" label="Price updated" sx={{ mt: 0.5 }} />
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <IconButton size="small" disabled={busyItemId === item.id} onClick={() => handleQuantity(item, -1)}>
                        <RemoveRoundedIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2">{item.quantity}</Typography>
                      <IconButton size="small" disabled={busyItemId === item.id || item.quantity >= item.availableStock} onClick={() => handleQuantity(item, 1)}>
                        <AddRoundedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" sx={{ ml: 1 }} disabled={busyItemId === item.id} onClick={() => handleRemove(item)}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography sx={{ fontWeight: 700 }}>{formatINR(item.lineTotal)}</Typography>
                </Box>
              ))}
            </Paper>
          ))}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, position: 'sticky', top: 88 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Order Summary</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2">{formatINR(cart.subtotal)}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">Shipping and taxes calculated at checkout</Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1">Total</Typography>
              <Typography variant="subtitle1">{formatINR(cart.subtotal)}</Typography>
            </Box>
            {!canCheckout && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Some items are unavailable or have changed price. Remove or update them to continue.
              </Alert>
            )}
            <Button fullWidth variant="contained" size="large" disabled={!canCheckout} onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
