import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import * as adminService from '../../services/admin.service';

const STATUS_FILTERS = ['', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BLOCKED'];

export default function SellerApprovals() {
  const [sellers, setSellers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [status, setStatus] = useState('SUBMITTED');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async (page = meta.page, limit = meta.limit) => {
    setLoading(true);
    setError('');
    try {
      const { data, meta: m } = await adminService.listSellers({ status: status || undefined, search: search || undefined, page, limit });
      setSellers(data);
      setMeta(m);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [status, search]);

  const handleApprove = async (id) => {
    await adminService.approveSeller(id);
    load(meta.page);
  };

  const handleRejectConfirm = async () => {
    await adminService.rejectSeller(rejectTarget, rejectReason);
    setRejectTarget(null);
    setRejectReason('');
    load(meta.page);
  };

  const columns = [
    {
      key: 'company',
      label: 'Company',
      render: (s) => (
        <Box>
          {s.company_name}
          <Typography variant="caption" color="text.secondary" display="block">{s.display_name}</Typography>
        </Box>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (s) => (
        <Box>
          {s.owner_mobile}
          <Typography variant="caption" color="text.secondary" display="block">{s.owner_email}</Typography>
        </Box>
      ),
    },
    { key: 'status', label: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    { key: 'created_at', label: 'Applied', render: (s) => new Date(s.created_at).toLocaleDateString() },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Seller Approvals</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <DataTable
        columns={columns}
        rows={sellers}
        loading={loading}
        total={meta.total}
        page={meta.page}
        limit={meta.limit}
        onPageChange={(p) => load(p)}
        onLimitChange={(l) => load(1, l)}
        onSearch={setSearch}
        searchPlaceholder="Search company, owner name, or mobile"
        filters={
          <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 180 }}>
            {STATUS_FILTERS.map((s) => <MenuItem key={s || 'ALL'} value={s}>{s || 'ALL'}</MenuItem>)}
          </TextField>
        }
        rowActions={(s) => (
          ['SUBMITTED', 'UNDER_REVIEW'].includes(s.status) && (
            <>
              <Button size="small" onClick={() => handleApprove(s.id)}>Approve</Button>
              <Button size="small" color="error" onClick={() => setRejectTarget(s.id)}>Reject</Button>
            </>
          )
        )}
      />

      <Dialog open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)}>
        <DialogTitle>Reject Seller Application</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth multiline minRows={2} sx={{ mt: 1 }}
            label="Rejection reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancel</Button>
          <Button color="error" onClick={handleRejectConfirm} disabled={!rejectReason.trim()}>Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
