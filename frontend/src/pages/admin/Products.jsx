import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, MenuItem, TextField, Avatar, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Menu, Chip,
} from '@mui/material';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { useSearchParams } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import * as adminProductService from '../../services/adminProduct.service';

const STATUS_FILTERS = ['', 'DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'INACTIVE', 'BLOCKED', 'OUT_OF_STOCK'];

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const status = searchParams.get('status') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [search, setSearch] = useState('');

  const load = async (page = meta.page, limit = meta.limit) => {
    setLoading(true);
    setError('');
    try {
      const { data, meta: m } = await adminProductService.listProducts({
        status: status || undefined, search: search || undefined, page, limit,
      });
      setProducts(data);
      setMeta(m);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [status, search]);

  const setStatusFilter = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('status', value); else next.delete('status');
    setSearchParams(next);
  };

  const handleApprove = async (id) => {
    await adminProductService.approveProduct(id);
    setMenuAnchor(null);
    load(meta.page);
  };

  const handleRejectConfirm = async () => {
    await adminProductService.rejectProduct(rejectTarget, rejectReason);
    setRejectTarget(null);
    setRejectReason('');
    load(meta.page);
  };

  const handleAction = async (action) => {
    setMenuAnchor(null);
    if (action === 'block') await adminProductService.blockProduct(menuTarget.id);
    if (action === 'deactivate') await adminProductService.deactivateProduct(menuTarget.id);
    if (action === 'feature') await adminProductService.setFeatured(menuTarget.id, true);
    if (action === 'unfeature') await adminProductService.setFeatured(menuTarget.id, false);
    load(meta.page);
  };

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar variant="rounded" src={p.image} sx={{ width: 40, height: 40, bgcolor: 'grey.100' }}>
            <Inventory2RoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          </Avatar>
          <Box>
            {p.name}
            <Typography variant="caption" color="text.secondary" display="block">{p.sku}</Typography>
          </Box>
        </Box>
      ),
    },
    { key: 'seller_name', label: 'Seller' },
    { key: 'category_name', label: 'Category' },
    { key: 'selling_price', label: 'Price', render: (p) => `₹${Number(p.selling_price).toLocaleString('en-IN')}` },
    { key: 'status', label: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'created_at', label: 'Created', render: (p) => new Date(p.created_at).toLocaleDateString() },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Product Management</Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={columns}
        rows={products}
        loading={loading}
        total={meta.total}
        page={meta.page}
        limit={meta.limit}
        onPageChange={(p) => load(p)}
        onLimitChange={(l) => load(1, l)}
        onSearch={setSearch}
        searchPlaceholder="Search product name or SKU"
        filters={
          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 200 }}>
            {STATUS_FILTERS.map((s) => <MenuItem key={s || 'ALL'} value={s}>{s || 'ALL'}</MenuItem>)}
          </TextField>
        }
        rowActions={(p) => (
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            {p.status === 'PENDING_REVIEW' && (
              <>
                <Button size="small" onClick={() => handleApprove(p.id)}>Approve</Button>
                <Button size="small" color="error" onClick={() => setRejectTarget(p.id)}>Reject</Button>
              </>
            )}
            {p.is_featured ? <Chip size="small" label="Featured" color="secondary" sx={{ mr: 0.5 }} /> : null}
            <IconButton size="small" onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuTarget(p); }}>
              <MoreVertRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      />

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => handleAction('feature')}>Mark Featured</MenuItem>
        <MenuItem onClick={() => handleAction('unfeature')}>Remove Featured</MenuItem>
        <MenuItem onClick={() => handleAction('deactivate')}>Deactivate</MenuItem>
        <MenuItem onClick={() => handleAction('block')}>Block</MenuItem>
      </Menu>

      <Dialog open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)}>
        <DialogTitle>Reject Product</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline minRows={2} sx={{ mt: 1 }} label="Rejection reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button color="error" onClick={handleRejectConfirm} disabled={!rejectReason.trim()}>Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
