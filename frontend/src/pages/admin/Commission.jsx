import { useEffect, useState } from 'react';
import {
  Box, Grid, Paper, Typography, Button, TextField, MenuItem, Chip, Alert, Table, TableHead, TableRow, TableCell,
  TableBody, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Tooltip, Skeleton, TablePagination, InputAdornment,
} from '@mui/material';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useSelector } from 'react-redux';
import {
  getCommissionOverview, getCommissionLedger, updateDefaultCommission, updateSellerCommission, resetSellerCommission,
} from '../../services/commission.service';
import { inr, fmtDate, rateLabel, RangeToggle, StageChip, Tile, SectionTitle } from '../../components/commission/shared';

function RateFields({ rate, onChange }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5 }}>
      <TextField select label="Type" value={rate.type} onChange={(e) => onChange({ ...rate, type: e.target.value })} sx={{ width: 170 }}>
        <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
        <MenuItem value="FIXED">Fixed (₹ per order)</MenuItem>
      </TextField>
      <TextField
        label="Commission" type="number" value={rate.value}
        onChange={(e) => onChange({ ...rate, value: e.target.value })}
        inputProps={{ min: 0, max: rate.type === 'PERCENTAGE' ? 100 : undefined, step: 0.5 }}
        InputProps={rate.type === 'PERCENTAGE'
          ? { endAdornment: <InputAdornment position="end">%</InputAdornment> }
          : { startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
        sx={{ width: 160 }}
      />
    </Box>
  );
}

export default function Commission() {
  const { user } = useSelector((s) => s.auth);
  const canEdit = Boolean(user?.isSuperAdmin || user?.permissions?.includes('commission.edit'));
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState(null);
  const [globalForm, setGlobalForm] = useState(null);
  const [editing, setEditing] = useState(null); // { seller, rate }
  const [busy, setBusy] = useState(false);
  const [ledger, setLedger] = useState(null);
  const [ledgerSeller, setLedgerSeller] = useState('');
  const [page, setPage] = useState(0);

  const load = () => getCommissionOverview(range)
    .then((d) => { setData(d); setGlobalForm({ type: d.global.type, value: d.global.value }); })
    .catch((e) => setError(e.response?.data?.message || 'Could not load commission data'));

  useEffect(() => { load(); }, [range]);
  useEffect(() => {
    getCommissionLedger({ range, sellerId: ledgerSeller || undefined, page: page + 1, limit: 15 }).then(setLedger).catch(() => {});
  }, [range, ledgerSeller, page]);

  const run = async (fn) => {
    setBusy(true); setMsg(null);
    try {
      const res = await fn();
      setMsg({ severity: 'success', text: res.message });
      await load();
      return true;
    } catch (e) {
      setMsg({ severity: 'error', text: e.response?.data?.message || 'Could not save' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const globalDirty = data && globalForm && (globalForm.type !== data.global.type || Number(globalForm.value) !== Number(data.global.value));

  return (
    <Box sx={{ maxWidth: 1200 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
        <Box>
          <Typography variant="h5">Commission</Typography>
          <Typography variant="body2" color="text.secondary">Set what each seller pays and track commission on every order.</Typography>
        </Box>
        <RangeToggle value={range} onChange={(v) => { setRange(v); setPage(0); }} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {msg && <Alert severity={msg.severity} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}
      {!data && !error && <Skeleton variant="rounded" height={420} />}

      {data && (
        <>
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={6} md={3}><Tile label="Total commission" value={inr(data.totals.commission)} hint={`on ${inr(data.totals.sales)} sales · ${(data.totals.effectiveRate * 100).toFixed(1)}% effective`} emphasis /></Grid>
            <Grid item xs={6} md={3}><Tile label="Earned (delivered)" value={inr(data.totals.earnedCommission)} hint="commission on delivered orders" /></Grid>
            <Grid item xs={6} md={3}><Tile label="In progress" value={inr(data.totals.inProgressCommission)} hint="orders not yet delivered" /></Grid>
            <Grid item xs={6} md={3}><Tile label="Seller payouts due" value={inr(data.totals.readyForPayout)} hint="delivered, owed to sellers" /></Grid>
          </Grid>

          <Paper sx={{ p: 2.5, mb: 2.5 }}>
            <SectionTitle title="Default commission" subtitle="Applies to every seller without a custom rate" />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {globalForm && <RateFields rate={globalForm} onChange={setGlobalForm} />}
              {canEdit && (
                <Button variant="contained" disabled={!globalDirty || busy} onClick={() => run(() => updateDefaultCommission({ type: globalForm.type, value: Number(globalForm.value) }))}>
                  Save default
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1.5, color: 'text.secondary' }}>
              <InfoOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption">Rate changes apply to new orders only. Orders already placed keep the commission calculated at checkout.</Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 2.5, mb: 2.5 }}>
            <SectionTitle title="Seller rates" subtitle="Give a seller a special rate, or reset them to the default" />
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Seller</TableCell>
                    <TableCell>Commission rate</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Sales</TableCell>
                    <TableCell align="right">Commission</TableCell>
                    <TableCell align="right">Seller payout</TableCell>
                    {canEdit && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.sellers.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.name}</Typography>
                        {s.status !== 'APPROVED' && <Typography variant="caption" color="text.secondary">{s.status.replace('_', ' ').toLowerCase()}</Typography>}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{rateLabel(s.rate)}</Typography>
                          <Chip size="small" variant="outlined" color={s.rate.source === 'SELLER' ? 'secondary' : 'default'} label={s.rate.source === 'SELLER' ? 'Custom' : 'Default'} sx={{ height: 20, fontSize: '0.65rem' }} />
                        </Box>
                      </TableCell>
                      <TableCell align="right">{s.orders}</TableCell>
                      <TableCell align="right">{inr(s.sales)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{inr(s.commission)}</TableCell>
                      <TableCell align="right">{inr(s.payable)}</TableCell>
                      {canEdit && (
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="Set custom rate">
                            <IconButton size="small" onClick={() => setEditing({ seller: s, rate: { type: s.rate.type, value: s.rate.value } })}><EditRoundedIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          {s.rate.source === 'SELLER' && (
                            <Tooltip title="Reset to default">
                              <IconButton size="small" disabled={busy} onClick={() => run(() => resetSellerCommission(s.id))}><RestartAltRoundedIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <SectionTitle
              title="Commission ledger"
              subtitle="Commission on every order"
              action={(
                <TextField select size="small" label="Seller" value={ledgerSeller} onChange={(e) => { setLedgerSeller(e.target.value); setPage(0); }} sx={{ minWidth: 220 }}>
                  <MenuItem value="">All sellers</MenuItem>
                  {data.sellers.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </TextField>
              )}
            />
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Seller</TableCell>
                    <TableCell align="right">Sales</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Commission</TableCell>
                    <TableCell align="right">Seller payout</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ledger?.rows.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</TableCell>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.orderNumber}</TableCell>
                      <TableCell>{r.sellerName}</TableCell>
                      <TableCell align="right">{inr(r.sales)}</TableCell>
                      <TableCell align="right">{r.ratePercent.toFixed(1)}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{inr(r.commission)}</TableCell>
                      <TableCell align="right">{inr(r.payable)}</TableCell>
                      <TableCell><StageChip stage={r.stage} /></TableCell>
                    </TableRow>
                  ))}
                  {ledger && ledger.rows.length === 0 && (
                    <TableRow><TableCell colSpan={8}><Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No orders in this period.</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
            {ledger && ledger.total > ledger.limit && (
              <TablePagination component="div" count={ledger.total} page={page} rowsPerPage={ledger.limit} rowsPerPageOptions={[]} onPageChange={(e, p) => setPage(p)} />
            )}
          </Paper>
        </>
      )}

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)}>
        <DialogTitle>Commission for {editing?.seller.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            This seller will pay this rate on new orders instead of the default ({data ? rateLabel(data.global) : ''}).
          </Typography>
          {editing && <RateFields rate={editing.rate} onChange={(rate) => setEditing({ ...editing, rate })} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button
            variant="contained" disabled={busy}
            onClick={async () => {
              const ok = await run(() => updateSellerCommission(editing.seller.id, { type: editing.rate.type, value: Number(editing.rate.value) }));
              if (ok) setEditing(null);
            }}
          >
            Save rate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
