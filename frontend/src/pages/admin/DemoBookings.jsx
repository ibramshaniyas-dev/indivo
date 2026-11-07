import { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Tabs, Tab, Table, TableHead, TableRow, TableCell, TableBody, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, Avatar, Link as MuiLink, ToggleButtonGroup, ToggleButton, TablePagination, Stack,
} from '@mui/material';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { realImage } from '../../utils/images';
import { getDemoBookings, updateDemoBooking } from '../../services/homeDemo.service';

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const TABS = [
  ['ACTIVE', 'Active'], ['REQUESTED', 'New'], ['CONFIRMED', 'Confirmed'], ['ON_THE_WAY', 'On the way'],
  ['PURCHASED', 'Purchased'], ['NOT_PURCHASED', 'Not purchased'], ['CANCELLED', 'Cancelled'], ['', 'All'],
];
const STATUS = {
  REQUESTED: { label: 'New request', color: 'warning' },
  CONFIRMED: { label: 'Confirmed', color: 'info' },
  ON_THE_WAY: { label: 'On the way', color: 'secondary' },
  PURCHASED: { label: 'Purchased', color: 'success' },
  NOT_PURCHASED: { label: 'Not purchased', color: 'default' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
};

function Timer({ b }) {
  const active = ['REQUESTED', 'CONFIRMED', 'ON_THE_WAY'].includes(b.status);
  if (!active) return <Typography variant="caption" color="text.secondary">{new Date(String(b.created_at).replace(' ', 'T') + 'Z').toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</Typography>;
  const left = b.slaMinutes - b.minutesSince;
  return b.late ? (
    <Chip size="small" color="error" icon={<WarningAmberRoundedIcon />} label={`Late by ${-left} min`} />
  ) : (
    <Chip size="small" color={left <= 15 ? 'warning' : 'default'} variant="outlined" icon={<TimerOutlinedIcon />} label={`${left} min left`} />
  );
}

/** Home-demo bookings: confirm & assign an executive, track the 1-hour promise, record the outcome. */
export default function DemoBookings() {
  const { user } = useSelector((s) => s.auth);
  const canEdit = Boolean(user?.isSuperAdmin || user?.permissions?.includes('orders.edit'));
  const base = useLocation().pathname.startsWith('/super-admin') ? '/super-admin' : '/admin';
  const [tab, setTab] = useState('ACTIVE');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [dialog, setDialog] = useState(null); // { action, booking }
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => getDemoBookings({ status: tab, page: page + 1, limit: 25 }).then(setData).catch((e) => setMsg({ severity: 'error', text: e.response?.data?.message || 'Could not load bookings' }));
  useEffect(() => { load(); }, [tab, page]);
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t); }, [tab, page]); // live countdowns

  const act = async (booking, action, body = {}) => {
    setBusy(true); setMsg(null);
    try {
      const res = await updateDemoBooking(booking.id, action, body);
      setMsg({ severity: 'success', text: `${booking.booking_number}: ${res.message}` });
      setDialog(null);
      await load();
    } catch (e) {
      setMsg({ severity: 'error', text: e.response?.data?.message || 'Could not update booking' });
    } finally {
      setBusy(false);
    }
  };

  const open = (action, booking) => {
    setForm(action === 'confirm' ? { agentName: booking.agent_name || '', agentPhone: booking.agent_phone || '' } : action === 'purchased' ? { paymentMode: 'UPI' } : { reason: '' });
    setDialog({ action, booking });
  };

  const counts = data?.counts || {};
  const activeCount = (counts.REQUESTED || 0) + (counts.CONFIRMED || 0) + (counts.ON_THE_WAY || 0);

  return (
    <Box sx={{ maxWidth: 1350 }}>
      <Typography variant="h5">Home Demo · Bookings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Confirm each request, send an executive with the demo piece, and record whether the customer bought it.
      </Typography>
      {msg && <Alert severity={msg.severity} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(e, v) => { setTab(v); setPage(0); }} variant="scrollable" scrollButtons="auto">
          {TABS.map(([k, l]) => {
            const n = k === 'ACTIVE' ? activeCount : k ? counts[k] || 0 : null;
            return <Tab key={k || 'all'} value={k} label={n === null ? l : `${l} (${n})`} />;
          })}
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Booking</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Demo piece</TableCell>
                <TableCell>Executive</TableCell>
                <TableCell>Status</TableCell>
                {canEdit && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.rows.map((b) => (
                <TableRow key={b.id} hover sx={{ verticalAlign: 'top', bgcolor: b.late ? '#FDF3F2' : undefined }}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{b.booking_number}</Typography>
                    <Typography variant="caption" color="text.secondary">{b.zoneName} · {b.distanceKm} km</Typography>
                  </TableCell>
                  <TableCell><Timer b={b} /></TableCell>
                  <TableCell sx={{ minWidth: 220 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{b.name}</Typography>
                    <Stack direction="row" spacing={1.5} sx={{ my: 0.25 }}>
                      <MuiLink href={`tel:${b.mobile}`} variant="caption" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}><PhoneRoundedIcon sx={{ fontSize: 14 }} />{b.mobile}</MuiLink>
                      <MuiLink href={`https://www.google.com/maps?q=${b.latitude},${b.longitude}`} target="_blank" rel="noreferrer" variant="caption" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}><MapRoundedIcon sx={{ fontSize: 14 }} />Map</MuiLink>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{[b.address_line1, b.address_line2, b.city, b.pincode].filter(Boolean).join(', ')}</Typography>
                    {b.notes && <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>“{b.notes}”</Typography>}
                  </TableCell>
                  <TableCell sx={{ minWidth: 220 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Avatar variant="rounded" src={realImage(b.image) || undefined} sx={{ width: 36, height: 36 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{b.productName}</Typography>
                        <Typography variant="caption" color="text.secondary">{b.variantLabel || b.variantSku} · {inr(b.price)}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>by {b.sellerName}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {b.agent_name ? (
                      <Box>
                        <Typography variant="body2">{b.agent_name}</Typography>
                        <MuiLink href={`tel:${b.agent_phone}`} variant="caption">{b.agent_phone}</MuiLink>
                      </Box>
                    ) : <Typography variant="caption" color="text.secondary">Not assigned</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" color={STATUS[b.status].color} label={STATUS[b.status].label} />
                    {b.orderNumber && (
                      <MuiLink component={Link} to={`${base}/orders/${b.order_id}`} variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        Order {b.orderNumber} · {b.payment_mode}
                      </MuiLink>
                    )}
                    {b.cancel_reason && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{b.cancel_reason}</Typography>}
                  </TableCell>
                  {canEdit && (
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {b.status === 'REQUESTED' && <Button size="small" variant="contained" onClick={() => open('confirm', b)}>Confirm & assign</Button>}
                      {b.status === 'CONFIRMED' && <Button size="small" variant="contained" disabled={busy} onClick={() => act(b, 'dispatch')}>On the way</Button>}
                      {['CONFIRMED', 'ON_THE_WAY'].includes(b.status) && (
                        <>
                          <Button size="small" color="success" variant="outlined" sx={{ ml: 1 }} onClick={() => open('purchased', b)}>Purchased</Button>
                          <Button size="small" sx={{ ml: 1 }} disabled={busy} onClick={() => act(b, 'not_purchased')}>Not purchased</Button>
                        </>
                      )}
                      {['REQUESTED', 'CONFIRMED', 'ON_THE_WAY'].includes(b.status) && (
                        <Button size="small" color="error" sx={{ ml: 1 }} onClick={() => open('cancel', b)}>Cancel</Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {data && data.rows.length === 0 && (
                <TableRow><TableCell colSpan={7}><Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No bookings here.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
        {data && data.total > data.limit && (
          <TablePagination component="div" count={data.total} page={page} rowsPerPage={data.limit} rowsPerPageOptions={[]} onPageChange={(e, p) => setPage(p)} />
        )}
      </Paper>

      <Dialog open={Boolean(dialog)} onClose={() => !busy && setDialog(null)} fullWidth maxWidth="xs">
        {dialog?.action === 'confirm' && (
          <>
            <DialogTitle>Assign an executive</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {dialog.booking.productName} → {dialog.booking.name}, {dialog.booking.city}. The customer will see the executive's name and number.
              </Typography>
              <Stack spacing={2}>
                <TextField label="Executive name" value={form.agentName} onChange={(e) => setForm({ ...form, agentName: e.target.value })} autoFocus />
                <TextField label="Executive mobile" value={form.agentPhone} onChange={(e) => setForm({ ...form, agentPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })} inputProps={{ inputMode: 'numeric' }} />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog(null)}>Back</Button>
              <Button variant="contained" disabled={busy || !form.agentName?.trim() || form.agentPhone?.length !== 10} onClick={() => act(dialog.booking, 'confirm', form)}>Confirm booking</Button>
            </DialogActions>
          </>
        )}
        {dialog?.action === 'purchased' && (
          <>
            <DialogTitle>Record the sale</DialogTitle>
            <DialogContent>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#EFF8F3', mb: 2 }}>
                <Typography variant="body2"><b>{dialog.booking.productName}</b> ({dialog.booking.variantLabel || dialog.booking.variantSku})</Typography>
                <Typography variant="body2">Collect <b>{inr(dialog.booking.price)}</b> + tax from {dialog.booking.name}</Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 1 }}>How did the customer pay?</Typography>
              <ToggleButtonGroup exclusive fullWidth value={form.paymentMode} onChange={(e, v) => v && setForm({ paymentMode: v })}>
                <ToggleButton value="UPI">UPI</ToggleButton>
                <ToggleButton value="CASH">Cash</ToggleButton>
                <ToggleButton value="CARD">Card</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                An order is created as Delivered and Paid, the seller's stock goes down by one and the demo piece count here drops by one.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog(null)}>Back</Button>
              <Button variant="contained" color="success" disabled={busy} onClick={() => act(dialog.booking, 'purchased', form)}>Record sale</Button>
            </DialogActions>
          </>
        )}
        {dialog?.action === 'cancel' && (
          <>
            <DialogTitle>Cancel booking {dialog.booking.booking_number}?</DialogTitle>
            <DialogContent>
              <TextField fullWidth label="Reason (shown to the customer)" value={form.reason} onChange={(e) => setForm({ reason: e.target.value })} sx={{ mt: 1 }} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog(null)}>Back</Button>
              <Button color="error" variant="contained" disabled={busy} onClick={() => act(dialog.booking, 'cancel', form)}>Cancel booking</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
