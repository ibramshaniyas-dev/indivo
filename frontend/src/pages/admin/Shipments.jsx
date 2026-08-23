import { useEffect, useState } from 'react';
import { Box, Typography, MenuItem, TextField } from '@mui/material';
import { Link } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import * as adminShipmentService from '../../services/adminShipment.service';

const STATUS_FILTERS = [
  '', 'NOT_CREATED', 'SHIPMENT_CREATED', 'AWB_ASSIGNED', 'PICKUP_REQUESTED', 'PICKED_UP',
  'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RTO_INITIATED', 'RTO_IN_TRANSIT', 'RTO_DELIVERED',
];

export default function AdminShipments() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (page = meta.page, limit = meta.limit) => {
    setLoading(true);
    try {
      const { data, meta: m } = await adminShipmentService.listShipments({
        status: status || undefined, search: search || undefined, page, limit,
      });
      setRows(data);
      setMeta(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [status, search]);

  const columns = [
    {
      key: 'order_number', label: 'Order',
      render: (r) => (
        <Box component={Link} to={`/admin/orders/${r.order_id}`} sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 600 }}>
          {r.order_number}
        </Box>
      ),
    },
    { key: 'sub_order_number', label: 'Sub-order' },
    { key: 'seller_name', label: 'Seller' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'payment_method', label: 'Payment' },
    {
      key: 'shipment_status', label: 'Shipment Status',
      render: (r) => (r.shipment_id ? <StatusBadge status={r.shipment_status} /> : <StatusBadge status="NOT_CREATED" />),
    },
    {
      key: 'courier_name', label: 'Courier / AWB',
      render: (r) => r.tracking_number
        ? `${r.courier_name || ''} · ${r.tracking_number}`
        : (r.courier_name || '—'),
    },
    { key: 'placed_at', label: 'Placed', render: (r) => new Date(r.placed_at).toLocaleDateString() },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Shipments &amp; Tracking</Typography>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey="seller_order_id"
        loading={loading}
        total={meta.total}
        page={meta.page}
        limit={meta.limit}
        onPageChange={(p) => load(p)}
        onLimitChange={(l) => load(1, l)}
        onSearch={setSearch}
        searchPlaceholder="Search order, AWB, customer or seller"
        filters={
          <TextField select size="small" label="Shipment Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 200 }}>
            {STATUS_FILTERS.map((s) => <MenuItem key={s || 'ALL'} value={s}>{s ? s.replace(/_/g, ' ') : 'ALL'}</MenuItem>)}
          </TextField>
        }
      />
    </Box>
  );
}
