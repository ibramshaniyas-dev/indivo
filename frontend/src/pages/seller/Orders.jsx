import { useEffect, useState } from 'react';
import { Box, Typography, MenuItem, TextField } from '@mui/material';
import { Link } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import * as sellerOrderService from '../../services/sellerOrder.service';

const STATUS_FILTERS = ['', 'PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await sellerOrderService.listMyOrders(status ? { status } : {});
      setOrders(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const columns = [
    { key: 'sub_order_number', label: 'Order', render: (o) => <Box component={Link} to={`/seller/orders/${o.id}`} sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}>{o.sub_order_number}</Box> },
    { key: 'customer_name', label: 'Customer' },
    { key: 'item_count', label: 'Items' },
    { key: 'seller_payable', label: 'Payable', render: (o) => formatINR(o.seller_payable) },
    { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'created_at', label: 'Date', render: (o) => new Date(o.created_at).toLocaleDateString() },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Orders</Typography>
      <DataTable
        columns={columns}
        rows={orders}
        loading={loading}
        filters={
          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
            {STATUS_FILTERS.map((s) => <MenuItem key={s || 'ALL'} value={s}>{s || 'ALL'}</MenuItem>)}
          </TextField>
        }
      />
    </Box>
  );
}
