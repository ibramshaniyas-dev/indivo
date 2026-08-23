import { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button,
  MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from '@mui/material';
import * as adminService from '../../services/admin.service';

const STATUS_FILTERS = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED', 'BLOCKED', ''];

export default function SellerApprovals() {
  const [sellers, setSellers] = useState([]);
  const [status, setStatus] = useState('SUBMITTED');
  const [error, setError] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setError('');
    try {
      const { data } = await adminService.listSellers(status);
      setSellers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sellers');
    }
  };

  useEffect(() => { load(); }, [status]);

  const handleApprove = async (id) => {
    await adminService.approveSeller(id);
    load();
  };

  const handleRejectConfirm = async () => {
    await adminService.rejectSeller(rejectTarget, rejectReason);
    setRejectTarget(null);
    setRejectReason('');
    load();
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Seller Approvals</Typography>
      <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ mb: 2, minWidth: 200 }}>
        {STATUS_FILTERS.map((s) => <MenuItem key={s || 'ALL'} value={s}>{s || 'ALL'}</MenuItem>)}
      </TextField>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Company</TableCell>
            <TableCell>Owner</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Applied</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sellers.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.company_name}<br /><Typography variant="caption" color="text.secondary">{s.display_name}</Typography></TableCell>
              <TableCell>{s.owner_mobile}<br /><Typography variant="caption" color="text.secondary">{s.owner_email}</Typography></TableCell>
              <TableCell><Chip size="small" label={s.status} /></TableCell>
              <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
              <TableCell align="right">
                {['SUBMITTED', 'UNDER_REVIEW'].includes(s.status) && (
                  <>
                    <Button size="small" onClick={() => handleApprove(s.id)}>Approve</Button>
                    <Button size="small" color="error" onClick={() => setRejectTarget(s.id)}>Reject</Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
