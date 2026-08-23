import { useEffect, useState } from 'react';
import { Box, Container, Typography, Paper, CircularProgress } from '@mui/material';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { listMyOrders } from '../../services/order.service';

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    listMyOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>My Orders</Typography>
      {orders.length === 0 ? (
        <EmptyState
          icon={ReceiptLongRoundedIcon}
          title="No orders yet"
          description="Your placed orders will show up here."
          actionLabel="Start Shopping"
          onAction={() => navigate('/search')}
        />
      ) : (
        orders.map((o) => (
          <Paper
            key={o.id} component={Link} to={`/account/orders/${o.id}`}
            sx={{ p: 2.5, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
          >
            <Box>
              <Typography variant="subtitle2">{o.order_number}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(o.placed_at).toLocaleDateString()} · {o.item_count} item{o.item_count !== 1 ? 's' : ''} · {o.seller_order_count} seller{o.seller_order_count !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle2">{formatINR(o.grand_total)}</Typography>
              <StatusBadge status={o.status} />
            </Box>
          </Paper>
        ))
      )}
    </Container>
  );
}
