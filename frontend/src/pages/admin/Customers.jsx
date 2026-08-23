import { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import * as adminCustomerService from '../../services/adminCustomer.service';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);

  const load = async (page = meta.page, limit = meta.limit) => {
    setLoading(true);
    try {
      const { data, meta: m } = await adminCustomerService.listCustomers({ search: search || undefined, page, limit });
      setCustomers(data);
      setMeta(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [search]);

  const handleAction = async (action) => {
    setMenuAnchor(null);
    if (action === 'activate') await adminCustomerService.activateCustomer(menuTarget.id);
    if (action === 'deactivate') await adminCustomerService.deactivateCustomer(menuTarget.id);
    if (action === 'block') await adminCustomerService.blockCustomer(menuTarget.id);
    load(meta.page);
  };

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (c) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'grey.100', color: 'text.secondary' }}><PersonRoundedIcon fontSize="small" /></Avatar>
          <Box>
            {c.name}
            <Typography variant="caption" color="text.secondary" display="block">{c.mobile}</Typography>
          </Box>
        </Box>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'order_count', label: 'Orders' },
    { key: 'status', label: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'created_at', label: 'Joined', render: (c) => new Date(c.created_at).toLocaleDateString() },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Customers</Typography>
      <DataTable
        columns={columns}
        rows={customers}
        loading={loading}
        total={meta.total}
        page={meta.page}
        limit={meta.limit}
        onPageChange={(p) => load(p)}
        onLimitChange={(l) => load(1, l)}
        onSearch={setSearch}
        searchPlaceholder="Search name, mobile, or email"
        rowActions={(c) => (
          <IconButton size="small" onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuTarget(c); }}>
            <MoreVertRoundedIcon fontSize="small" />
          </IconButton>
        )}
      />
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => handleAction('activate')}>Activate</MenuItem>
        <MenuItem onClick={() => handleAction('deactivate')}>Deactivate</MenuItem>
        <MenuItem onClick={() => handleAction('block')}>Block</MenuItem>
      </Menu>
    </Box>
  );
}
