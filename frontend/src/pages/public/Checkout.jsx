import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Container, Grid, Typography, Paper, TextField, Button, Divider, Alert,
  RadioGroup, FormControlLabel, Radio, CircularProgress, Chip,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCart } from '../../services/cart.service';
import { placeOrder } from '../../services/checkout.service';
import { listAddresses } from '../../services/customerAddress.service';
import { getPaymentConfig, createPayment, verifyPayment } from '../../services/payment.service';
import { openRazorpayCheckout } from '../../utils/razorpay';
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
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null); // null = new-address form
  const [address, setAddress] = useState(initialAddress);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [paymentConfig, setPaymentConfig] = useState({ onlinePaymentsEnabled: false, keyId: null });
  const [retryingPayment, setRetryingPayment] = useState(false);

  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);
  // Redux's resetCart() can re-render this still-mounted component (with an empty cart) before
  // the route change actually commits — a ref flips synchronously, unlike state, so it can't
  // race with that re-render the way a boolean state flag could.
  const orderPlacedRef = useRef(false);

  useEffect(() => {
    Promise.all([getCart(), listAddresses(), getPaymentConfig()]).then(([cartSummary, addresses, payConfig]) => {
      dispatch(setCart(cartSummary));
      setSavedAddresses(addresses);
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      setPaymentConfig(payConfig);
      setLoading(false);
    });
  }, []);

  const handleChange = (field) => (e) => setAddress({ ...address, [field]: e.target.value });

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    setPlacing(true);
    try {
      const selected = savedAddresses.find((a) => a.id === selectedAddressId);
      const shippingAddress = selected
        ? {
            name: selected.name, mobile: selected.mobile, addressLine1: selected.address_line1,
            addressLine2: selected.address_line2, city: selected.city, state: selected.state, pincode: selected.pincode,
          }
        : address;

      // idempotencyKey is stable for this page visit, so re-submitting after a failed/cancelled
      // online payment returns the same order instead of placing a second one — safe to retry.
      const result = await placeOrder({ address: shippingAddress, paymentMethod, idempotencyKey, saveAddress: !selected });

      if (paymentMethod === 'ONLINE') {
        const payment = await createPayment(result.orderId);
        const rzpResult = await openRazorpayCheckout({
          keyId: payment.keyId,
          amount: payment.amount,
          currency: payment.currency,
          razorpayOrderId: payment.razorpayOrderId,
          name: 'INDIVO',
          description: 'Order payment',
          prefill: { name: shippingAddress.name, contact: shippingAddress.mobile },
        });
        await verifyPayment({
          orderId: result.orderId,
          razorpayOrderId: rzpResult.razorpayOrderId,
          razorpayPaymentId: rzpResult.razorpayPaymentId,
          razorpaySignature: rzpResult.razorpaySignature,
        });
      }

      orderPlacedRef.current = true;
      navigate(`/account/orders/${result.orderId}`, { state: { justPlaced: true } });
      dispatch(resetCart());
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to place order');
      if (paymentMethod === 'ONLINE') setRetryingPayment(true);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  if (cart.items.length === 0 && !orderPlacedRef.current) {
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

  const usingNewAddress = selectedAddressId === null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Checkout</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }} component="form" onSubmit={handlePlaceOrder}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Delivery Address</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {savedAddresses.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                {savedAddresses.map((addr) => (
                  <Paper
                    key={addr.id}
                    variant="outlined"
                    onClick={() => setSelectedAddressId(addr.id)}
                    sx={{
                      p: 2, cursor: 'pointer',
                      borderColor: selectedAddressId === addr.id ? 'primary.main' : 'divider',
                      borderWidth: selectedAddressId === addr.id ? 2 : 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Radio checked={selectedAddressId === addr.id} size="small" sx={{ p: 0 }} />
                      <Typography variant="subtitle2">{addr.name}</Typography>
                      {addr.is_default ? <Chip size="small" label="Default" color="secondary" /> : null}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
                      {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} {addr.pincode} · {addr.mobile}
                    </Typography>
                  </Paper>
                ))}
                <Button
                  startIcon={<AddRoundedIcon />}
                  onClick={() => setSelectedAddressId(null)}
                  variant={usingNewAddress ? 'contained' : 'outlined'}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Deliver to a new address
                </Button>
              </Box>
            )}

            {usingNewAddress && (
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
            )}

            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Payment Method</Typography>
            <RadioGroup value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setRetryingPayment(false); }}>
              <FormControlLabel value="COD" control={<Radio />} label="Cash on Delivery" />
              <FormControlLabel
                value="ONLINE"
                control={<Radio />}
                disabled={!paymentConfig.onlinePaymentsEnabled}
                label="Pay Online — UPI, Cards, Netbanking (via Razorpay)"
              />
            </RadioGroup>
            {!paymentConfig.onlinePaymentsEnabled && (
              <Typography variant="caption" color="text.secondary">
                Online payment is coming soon — Cash on Delivery is the only option right now.
              </Typography>
            )}

            <Button type="submit" variant="contained" size="large" fullWidth disabled={placing} sx={{ mt: 3 }}>
              {placing
                ? (paymentMethod === 'ONLINE' ? 'Opening Payment…' : 'Placing Order…')
                : retryingPayment
                  ? `Retry Payment — ${formatINR(cart.subtotal)}`
                  : `Place Order — ${formatINR(cart.subtotal)}`}
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
