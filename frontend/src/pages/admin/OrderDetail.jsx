import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Divider, Grid, CircularProgress } from '@mui/material';
import { useParams } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import ShipmentPanel from '../../components/ShipmentPanel';
import * as adminOrderService from '../../services/adminOrder.service';
import * as adminShipmentService from '../../services/adminShipment.service';

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminOrderService.getOrder(id).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  if (!order) return null;

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5">{order.order_number}</Typography>
        <StatusBadge status={order.status} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {order.customer_name} · {order.customer_mobile} · Placed {new Date(order.placed_at).toLocaleString()}
      </Typography>

      {order.sellerOrders.map((so) => (
        <Paper key={so.id} sx={{ p: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1">{so.seller_name} — {so.sub_order_number}</Typography>
            <StatusBadge status={so.status} />
          </Box>
          <Divider sx={{ my: 1.5 }} />
          {so.items.map((item) => (
            <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2">{item.product_name} × {item.quantity}</Typography>
              <Typography variant="body2">{formatINR(item.total)}</Typography>
            </Box>
          ))}
          <Divider sx={{ my: 1.5 }} />
          <Grid container justifyContent="flex-end">
            <Grid item xs={6} sm={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Subtotal</Typography><Typography variant="body2">{formatINR(so.subtotal)}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2" color="text.secondary">Commission</Typography><Typography variant="body2">{formatINR(so.commission_amount)}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="subtitle2">Seller Payable</Typography><Typography variant="subtitle2">{formatINR(so.seller_payable)}</Typography></Box>
            </Grid>
          </Grid>

          <ShipmentPanel sellerOrderId={so.id} initialShipment={so.shipment} initialTracking={so.tracking} service={adminShipmentService} />
        </Paper>
      ))}

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Payments</Typography>
        {order.payments.map((p) => (
          <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="body2">{p.method} — {formatINR(p.amount)}</Typography>
            <StatusBadge status={p.status} />
          </Box>
        ))}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1">Grand Total</Typography>
          <Typography variant="subtitle1">{formatINR(order.grand_total)}</Typography>
        </Box>
      </Paper>
    </Box>
  );
}
