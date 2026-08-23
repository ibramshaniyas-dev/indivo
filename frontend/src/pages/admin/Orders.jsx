import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import * as adminOrderService from '../../services/adminOrder.service';

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (page = meta.page, limit = meta.limit) => {
    setLoading(true);
    try {
      const { data, meta: m } = await adminOrderService.listOrders({ search: search || undefined, page, limit });
      setOrders(data);
      setMeta(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [search]);

  const columns = [
    { key: 'order_number', label: 'Order', render: (o) => <Box component={Link} to={`/admin/orders/${o.id}`} sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}>{o.order_number}</Box> },
    { key: 'customer_name', label: 'Customer' },
    { key: 'seller_order_count', label: 'Sellers' },
    { key: 'grand_total', label: 'Total', render: (o) => formatINR(o.grand_total) },
    { key: 'payment_status', label: 'Payment', render: (o) => <StatusBadge status={o.payment_status} /> },
    { key: 'status', label: 'Status', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'placed_at', label: 'Placed', render: (o) => new Date(o.placed_at).toLocaleString() },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Orders</Typography>
      <DataTable
        columns={columns}
        rows={orders}
        loading={loading}
        total={meta.total}
        page={meta.page}
        limit={meta.limit}
        onPageChange={(p) => load(p)}
        onLimitChange={(l) => load(1, l)}
        onSearch={setSearch}
        searchPlaceholder="Search order number or customer"
      />
    </Box>
  );
}
