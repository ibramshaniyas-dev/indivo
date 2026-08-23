import { useEffect, useMemo, useState } from 'react';
import {
  Box, Container, Grid, Typography, Paper, TextField, Button, Divider, Alert,
  RadioGroup, FormControlLabel, Radio, CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCart } from '../../services/cart.service';
import { placeOrder } from '../../services/checkout.service';
import { setCart, resetCart } from '../../store/slices/cartSlice';

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

const initialAddress = { name: '', mobile: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' };

export default function Checkout() {
  const cart = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState(initialAddress);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    getCart().then((summary) => {
      dispatch(setCart(summary));
      setLoading(false);
    });
  }, []);

  const handleChange = (field) => (e) => setAddress({ ...address, [field]: e.target.value });

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    setPlacing(true);
    try {
      const result = await placeOrder({ address, paymentMethod: 'COD', idempotencyKey });
      dispatch(resetCart());
      navigate(`/account/orders/${result.orderId}`, { state: { justPlaced: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  if (cart.items.length === 0) {
    navigate('/cart');
    return null;
  }
  if (cart.hasIssues) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="warning">
          Some items in your cart are unavailable or changed price. Please review your cart before checking out.
        </Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/cart')}>Back to Cart</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Checkout</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }} component="form" onSubmit={handlePlaceOrder}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Delivery Address</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Full Name" value={address.name} onChange={handleChange('name')} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Mobile Number" value={address.mobile} onChange={handleChange('mobile')} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Address Line 1" value={address.addressLine1} onChange={handleChange('addressLine1')} required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Address Line 2 (optional)" value={address.addressLine2} onChange={handleChange('addressLine2')} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="City" value={address.city} onChange={handleChange('city')} required />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="State" value={address.state} onChange={handleChange('state')} required />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Pincode" value={address.pincode} onChange={handleChange('pincode')} required />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Payment Method</Typography>
            <RadioGroup value="COD">
              <FormControlLabel value="COD" control={<Radio />} label="Cash on Delivery" />
            </RadioGroup>
            <Typography variant="caption" color="text.secondary">
              Online payment is coming soon — Cash on Delivery is the only option right now.
            </Typography>

            <Button type="submit" variant="contained" size="large" fullWidth disabled={placing} sx={{ mt: 3 }}>
              {placing ? 'Placing Order…' : `Place Order — ${formatINR(cart.subtotal)}`}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Order Summary</Typography>
            {cart.sellerGroups.map((group) => (
              <Box key={group.sellerId} sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">Sold by {group.sellerName}</Typography>
                {group.items.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2">{item.productName} × {item.quantity}</Typography>
                    <Typography variant="body2">{formatINR(item.lineTotal)}</Typography>
                  </Box>
                ))}
              </Box>
            ))}
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">Total</Typography>
              <Typography variant="subtitle1">{formatINR(cart.subtotal)}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">Final tax and shipping calculated per seller at checkout.</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
