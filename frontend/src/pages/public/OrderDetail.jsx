import { useEffect, useState } from 'react';
import { Box, Container, Typography, Paper, Divider, Alert, Grid, CircularProgress, Chip } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import { useParams, useLocation } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import { getMyOrder } from '../../services/order.service';

const TRACKING_STEPS = ['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function Tracker({ sellerOrder }) {
  const isCancelled = sellerOrder.status === 'CANCELLED';
  const currentIndex = TRACKING_STEPS.indexOf(sellerOrder.status);

  if (isCancelled) {
    return <Alert severity="error" sx={{ my: 2 }}>This order was cancelled.</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', overflowX: 'auto', py: 2, gap: 0 }}>
      {TRACKING_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const historyEntry = sellerOrder.history?.find((h) => h.status === step);
        return (
          <Box key={step} sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 }}>
              {done ? <CheckCircleRoundedIcon color="success" /> : <RadioButtonUncheckedRoundedIcon color="disabled" />}
              <Typography variant="caption" sx={{ mt: 0.5, textAlign: 'center', fontWeight: done ? 700 : 400 }}>
                {step.replace(/_/g, ' ')}
              </Typography>
              {historyEntry && (
                <Typography variant="caption" color="text.secondary">
                  {new Date(historyEntry.changed_at).toLocaleDateString()}
                </Typography>
              )}
            </Box>
            {i < TRACKING_STEPS.length - 1 && (
              <Box sx={{ width: 40, height: 2, bgcolor: i < currentIndex ? 'success.main' : 'grey.300' }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrder(id).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  if (!order) return null;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {location.state?.justPlaced && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Your order has been placed successfully! You'll pay by Cash on Delivery.
        </Alert>
      )}

      <Typography variant="h5" gutterBottom>Order {order.order_number}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Placed on {new Date(order.placed_at).toLocaleString()} · Deliver to {order.shipping_name}, {order.shipping_city}, {order.shipping_state} {order.shipping_pincode}
      </Typography>

      {order.sellerOrders.map((so) => (
        <Paper key={so.id} sx={{ p: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1">{so.seller_name}</Typography>
            <StatusBadge status={so.status} />
          </Box>
          <Typography variant="caption" color="text.secondary">Sub-order {so.sub_order_number}</Typography>

          <Tracker sellerOrder={so} />

          {so.shipment?.tracking_number && (
            <Chip size="small" label={`Tracking: ${so.shipment.tracking_number}${so.shipment.courier_name ? ` via ${so.shipment.courier_name}` : ''}`} sx={{ mb: 1 }} />
          )}

          <Divider sx={{ my: 2 }} />
          {so.items.map((item) => (
            <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
              <Typography variant="body2">{item.product_name} × {item.quantity}</Typography>
              <Typography variant="body2">{formatINR(item.total)}</Typography>
            </Box>
          ))}
          <Divider sx={{ my: 1.5 }} />
          <Grid container justifyContent="flex-end">
            <Grid item xs={6} sm={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2">{formatINR(so.subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Tax</Typography>
                <Typography variant="body2">{formatINR(so.tax)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Shipping</Typography>
                <Typography variant="body2">{formatINR(so.shipping_charge)}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      ))}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1">Order Total</Typography>
          <Typography variant="subtitle1">{formatINR(order.grand_total)}</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">Payment: Cash on Delivery ({order.payment_status})</Typography>
      </Paper>
    </Container>
  );
}
