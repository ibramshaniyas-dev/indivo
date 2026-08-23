import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Divider, Button, Grid, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import ShipmentPanel from '../../components/ShipmentPanel';
import * as sellerOrderService from '../../services/sellerOrder.service';
import * as sellerShipmentService from '../../services/sellerShipment.service';

const NEXT_STATUS = {
  PLACED: 'CONFIRMED',
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'PACKED',
  PACKED: 'SHIPPED',
  SHIPPED: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export default function SellerOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [tracking, setTracking] = useState({ trackingNumber: '', courierName: '' });
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = () => {
    setLoading(true);
    sellerOrderService.getMyOrder(id).then(setOrder).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const advance = async (status, extra = {}) => {
    setError('');
    setUpdating(true);
    try {
      await sellerOrderService.updateOrderStatus(id, { status, ...extra });
      setShipDialogOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => advance('CANCELLED');
  const handleAdvance = () => {
    const next = NEXT_STATUS[order.status];
    if (next === 'SHIPPED') setShipDialogOpen(true);
    else advance(next);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  if (!order) return null;

  const next = NEXT_STATUS[order.status];
  const canCancel = ['PLACED', 'CONFIRMED', 'PROCESSING'].includes(order.status);

  return (
    <Box sx={{ maxWidth: 800 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">{order.sub_order_number}</Typography>
        <StatusBadge status={order.status} />
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Ship To</Typography>
        <Typography variant="body2">{order.shipping_name} · {order.shipping_mobile}</Typography>
        <Typography variant="body2" color="text.secondary">
          {order.shipping_address1}, {order.shipping_address2 ? `${order.shipping_address2}, ` : ''}{order.shipping_city}, {order.shipping_state} {order.shipping_pincode}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Items</Typography>
        {order.items.map((item) => (
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
              <Typography variant="body2">{formatINR(order.subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Commission</Typography>
              <Typography variant="body2" color="error.main">-{formatINR(order.commission_amount)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">You'll receive</Typography>
              <Typography variant="subtitle2">{formatINR(order.seller_payable)}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <ShipmentPanel
          sellerOrderId={order.id}
          initialShipment={order.shipment}
          initialTracking={order.tracking}
          service={sellerShipmentService}
        />
      </Paper>

      <Box sx={{ display: 'flex', gap: 1.5 }}>
        {next && (
          <Button variant="contained" onClick={handleAdvance} disabled={updating}>
            Mark as {next.replace(/_/g, ' ')}
          </Button>
        )}
        {canCancel && (
          <Button variant="outlined" color="error" onClick={handleCancel} disabled={updating}>
            Cancel Order
          </Button>
        )}
      </Box>

      <Dialog open={shipDialogOpen} onClose={() => setShipDialogOpen(false)}>
        <DialogTitle>Mark as Shipped</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 320 }}>
          <TextField label="Courier Name" value={tracking.courierName} onChange={(e) => setTracking({ ...tracking, courierName: e.target.value })} />
          <TextField label="Tracking Number" value={tracking.trackingNumber} onChange={(e) => setTracking({ ...tracking, trackingNumber: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShipDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => advance('SHIPPED', tracking)} disabled={updating}>Confirm Shipped</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
