import { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, Skeleton, Grid, MenuItem, TablePagination, Chip,
} from '@mui/material';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useSelector } from 'react-redux';
import { getPayoutsDue, getSettlementHistory, recordPayout } from '../../services/growth.service';
import { inr, fmtDate, Tile, SectionTitle } from '../../components/commission/shared';

const today = () => new Date().toISOString().slice(0, 10);

/** Seller payouts: what's due (delivered, unpaid orders) and the history of payouts made. */
export default function Settlements() {
  const { user } = useSelector((s) => s.auth);
  const canPay = Boolean(user?.isSuperAdmin || user?.permissions?.includes('settlements.approve'));
  const [due, setDue] = useState(null);
  const [history, setHistory] = useState(null);
  const [sellerFilter, setSellerFilter] = useState('');
  const [page, setPage] = useState(0);
  const [paying, setPaying] = useState(null);
  const [form, setForm] = useState({ referenceNo: '', paidAt: today(), notes: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [dialogError, setDialogError] = useState('');

  const loadDue = () => getPayoutsDue().then(setDue).catch((e) => setMsg({ severity: 'error', text: e.response?.data?.message || 'Could not load payouts' }));
  const loadHistory = () => getSettlementHistory({ sellerId: sellerFilter || undefined, page: page + 1, limit: 15 }).then(setHistory).catch(() => {});

  useEffect(() => { loadDue(); }, []);
  useEffect(() => { loadHistory(); }, [sellerFilter, page]);

  const totalDue = (due || []).reduce((s, d) => s + d.payable, 0);

  const submit = async () => {
    setBusy(true); setDialogError('');
    try {
      const res = await recordPayout(paying.sellerId, form);
      setMsg({ severity: 'success', text: res.message });
      setPaying(null);
      await Promise.all([loadDue(), loadHistory()]);
    } catch (e) {
      setDialogError(e.response?.data?.message || 'Could not record payout');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Typography variant="h5">Settlements</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Pay sellers for delivered orders and keep a record of every payout.
      </Typography>
      {msg && <Alert severity={msg.severity} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={4}><Tile label="Due to sellers now" value={inr(totalDue)} hint={`${due?.length || 0} seller(s) waiting`} emphasis /></Grid>
        <Grid item xs={6} sm={4}><Tile label="Total paid out" value={inr(history?.totalPaid)} hint={`${history?.total || 0} payouts recorded`} /></Grid>
        <Grid item xs={6} sm={4}><Tile label="Orders awaiting payout" value={(due || []).reduce((s, d) => s + d.orders, 0)} hint="delivered, not yet paid" /></Grid>
      </Grid>

      <Paper sx={{ p: 2.5, mb: 2.5 }}>
        <SectionTitle title="Payouts due" subtitle="Delivered orders not yet paid. Transfer the amount to the seller's bank account, then record it here with the UTR." />
        {!due && <Skeleton variant="rounded" height={120} />}
        {due && due.length === 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main', py: 1 }}>
            <CheckCircleRoundedIcon fontSize="small" /><Typography variant="body2">All sellers are paid up.</Typography>
          </Box>
        )}
        {due && due.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Seller</TableCell>
                  <TableCell>Bank account</TableCell>
                  <TableCell align="right">Orders</TableCell>
                  <TableCell align="right">Sales</TableCell>
                  <TableCell align="right">Commission</TableCell>
                  <TableCell align="right">To pay</TableCell>
                  <TableCell>Waiting since</TableCell>
                  {canPay && <TableCell align="right" />}
                </TableRow>
              </TableHead>
              <TableBody>
                {due.map((d) => (
                  <TableRow key={d.sellerId} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{d.sellerName}</TableCell>
                    <TableCell>
                      {d.accountLast4 ? (
                        <Box>
                          <Typography variant="body2">{d.bankName} ••••{d.accountLast4}</Typography>
                          <Typography variant="caption" color="text.secondary">{d.accountHolder} · {d.ifsc}</Typography>
                        </Box>
                      ) : <Chip size="small" color="warning" variant="outlined" label="No bank details" />}
                    </TableCell>
                    <TableCell align="right">{d.orders}</TableCell>
                    <TableCell align="right">{inr(d.sales)}</TableCell>
                    <TableCell align="right">{inr(d.commission)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{inr(d.payable)}</TableCell>
                    <TableCell>{fmtDate(d.oldestOrder)}</TableCell>
                    {canPay && (
                      <TableCell align="right">
                        <Button size="small" variant="contained" startIcon={<PaymentsRoundedIcon />} onClick={() => { setPaying(d); setForm({ referenceNo: '', paidAt: today(), notes: '' }); setDialogError(''); }}>
                          Record payout
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <SectionTitle
          title="Payout history"
          action={(
            <TextField select size="small" label="Seller" value={sellerFilter} onChange={(e) => { setSellerFilter(e.target.value); setPage(0); }} sx={{ minWidth: 220 }}>
              <MenuItem value="">All sellers</MenuItem>
              {[...new Map((history?.rows || []).concat(due || []).map((r) => [r.sellerId, r.sellerName])).entries()].map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}
            </TextField>
          )}
        />
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Paid on</TableCell>
                <TableCell>Seller</TableCell>
                <TableCell>Orders from</TableCell>
                <TableCell align="right">Orders</TableCell>
                <TableCell align="right">Commission</TableCell>
                <TableCell align="right">Amount paid</TableCell>
                <TableCell>UTR / reference</TableCell>
                <TableCell>Recorded by</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history?.rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(r.paidAt)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{r.sellerName}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}</TableCell>
                  <TableCell align="right">{r.orders}</TableCell>
                  <TableCell align="right">{inr(r.commission)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{inr(r.amount)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{r.referenceNo}</Typography>
                    {r.notes && <Typography variant="caption" color="text.secondary">{r.notes}</Typography>}
                  </TableCell>
                  <TableCell>{r.paidByName || '—'}</TableCell>
                </TableRow>
              ))}
              {history && history.rows.length === 0 && (
                <TableRow><TableCell colSpan={8}><Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No payouts recorded yet.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
        {history && history.total > history.limit && (
          <TablePagination component="div" count={history.total} page={page} rowsPerPage={history.limit} rowsPerPageOptions={[]} onPageChange={(e, p) => setPage(p)} />
        )}
      </Paper>

      <Dialog open={Boolean(paying)} onClose={() => !busy && setPaying(null)} fullWidth maxWidth="xs">
        <DialogTitle>Record payout to {paying?.sellerName}</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FBF5E8', mb: 2 }}>
            <Typography variant="caption" color="text.secondary">Amount to transfer</Typography>
            <Typography sx={{ fontFamily: "'Jost', sans-serif", fontSize: '1.6rem', fontWeight: 600 }}>{inr(paying?.payable)}</Typography>
            <Typography variant="caption" color="text.secondary">{paying?.orders} delivered order(s) · after {inr(paying?.commission)} commission</Typography>
            {paying?.accountLast4 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <AccountBalanceRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="body2">{paying.accountHolder} · {paying.bankName} ••••{paying.accountLast4} · {paying.ifsc}</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Bank UTR / transaction reference" required value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} autoFocus />
            <TextField label="Paid on" type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ max: today() }} />
            <TextField label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} multiline minRows={2} />
          </Box>
          {dialogError && <Alert severity="error" sx={{ mt: 2 }}>{dialogError}</Alert>}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            Record this only after the bank transfer is complete. The seller will see these orders as Paid.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaying(null)} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={busy || !form.referenceNo.trim()}>{busy ? 'Saving…' : 'Confirm payout'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
