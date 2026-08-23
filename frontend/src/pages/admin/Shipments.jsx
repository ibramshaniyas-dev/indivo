import { useEffect, useState } from 'react';
import { Box, Typography, Tabs, Tab, Badge } from '@mui/material';
import { Link } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import * as adminShipmentService from '../../services/adminShipment.service';

// Mirrors Shiprocket's own seller-panel tabs (New / Ready To Ship / Pickup / In Transit /
// Delivered / RTO / All Orders) so this reads the same way for anyone used to that dashboard.
const TABS = [
  { key: 'NEW', label: 'New' },
  { key: 'READY_TO_SHIP', label: 'Ready To Ship' },
  { key: 'PICKUP', label: 'Pickup' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'RTO', label: 'RTO' },
  { key: 'ALL', label: 'All Orders' },
];

export default function AdminShipments() {
  const [bucket, setBucket] = useState('ALL');
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [counts, setCounts] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (page = 1, limit = meta.limit) => {
    setLoading(true);
    try {
      const [{ data, meta: m }, countsData] = await Promise.all([
        adminShipmentService.listShipments({
          bucket: bucket === 'ALL' ? undefined : bucket, search: search || undefined, page, limit,
        }),
        adminShipmentService.getShipmentCounts(),
      ]);
      setRows(data);
      setMeta(m);
      setCounts(countsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [bucket, search]);

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

      <Tabs
        value={bucket}
        onChange={(e, val) => setBucket(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((t) => (
          <Tab
            key={t.key}
            value={t.key}
            label={
              <Badge
                badgeContent={counts[t.key] ?? 0}
                color="primary"
                max={999}
                sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none', ml: 1 } }}
              >
                {t.label}
              </Badge>
            }
          />
        ))}
      </Tabs>

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
      />
    </Box>
  );
}
