import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, Box, Typography, Alert, ButtonBase, Chip,
} from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { Link } from 'react-router-dom';
import { listAddresses } from '../../services/customerAddress.service';
import { bookHomeDemo } from '../../services/homeDemo.service';
import { pickNearestAddress } from '../../utils/location';

const EMPTY = { name: '', mobile: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', notes: '' };
const fromAddress = (a) => ({
  name: a.name, mobile: a.mobile, addressLine1: a.address_line1, addressLine2: a.address_line2 || '', city: a.city, state: a.state, pincode: a.pincode,
});

/** Book a SEESHAA executive to bring the demo piece home. The visit location is the shopper's GPS point. */
export default function BookDemoDialog({ open, onClose, product, variant, zone, gps }) {
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(''); setDone(null);
    listAddresses().then((list) => {
      setAddresses(list);
      const near = pickNearestAddress(list, gps) || list.find((a) => a.is_default) || list[0];
      if (near) { setSelected(near.id); setForm((f) => ({ ...EMPTY, ...fromAddress(near), notes: f.notes })); }
    }).catch(() => setAddresses([]));
  }, [open]);

  const pick = (a) => { setSelected(a?.id ?? null); setForm((f) => (a ? { ...fromAddress(a), notes: f.notes } : { ...EMPTY, notes: f.notes })); };

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const res = await bookHomeDemo({ ...form, productId: product.id, variantId: variant.id, latitude: gps.lat, longitude: gps.lon });
      setDone(res);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not book the home demo');
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: k === 'mobile' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value });
  const complete = form.name && /^[6-9]\d{9}$/.test(form.mobile) && form.addressLine1 && form.city && form.state && form.pincode;

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} fullWidth maxWidth="sm">
      {done ? (
        <>
          <DialogContent sx={{ textAlign: 'center', py: 5 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 56, color: 'success.main' }} />
            <Typography variant="h6" sx={{ mt: 1 }}>Home demo booked!</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Booking <b>{done.data.bookingNumber}</b>. A SEESHAA executive will bring <b>{product.name}</b> to you within <b>{done.data.zone.slaMinutes} minutes</b>. We'll share their name and number once assigned.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button onClick={onClose}>Close</Button>
            <Button variant="contained" component={Link} to="/account/home-demos">Track my demo</Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BoltRoundedIcon sx={{ color: 'secondary.dark' }} /> Try at home within {zone.slaMinutes} minutes
          </DialogTitle>
          <DialogContent>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FBF5E8', mb: 2 }}>
              <Typography variant="body2"><b>{product.name}</b>{variant?.attributes?.length ? ` · ${variant.attributes.map((a) => a.value).join(' / ')}` : ''}</Typography>
              <Typography variant="caption" color="text.secondary">
                Our executive brings the piece from {zone.name} ({zone.distanceKm} km away). See it, try it — pay only if you love it (UPI, cash or card).
              </Typography>
            </Box>

            {addresses.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Where should we come?</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                  {addresses.map((a) => (
                    <ButtonBase key={a.id} onClick={() => pick(a)} sx={{ display: 'block', textAlign: 'left', p: 1.25, borderRadius: 2, border: '1.5px solid', borderColor: selected === a.id ? 'primary.main' : 'divider', bgcolor: selected === a.id ? 'rgba(201,160,74,0.08)' : '#fff' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{a.name} {a.type && <Chip size="small" label={a.type} sx={{ height: 16, fontSize: '0.55rem', ml: 0.5 }} />}</Typography>
                      <Typography variant="caption" color="text.secondary">{a.address_line1}, {a.city} {a.pincode}</Typography>
                    </ButtonBase>
                  ))}
                  <ButtonBase onClick={() => pick(null)} sx={{ p: 1.25, borderRadius: 2, border: '1.5px dashed', borderColor: selected === null ? 'primary.main' : 'divider' }}>
                    <Typography variant="body2">+ A different address</Typography>
                  </ButtonBase>
                </Box>
              </Box>
            )}

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Name" value={form.name} onChange={set('name')} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Mobile" value={form.mobile} onChange={set('mobile')} inputProps={{ inputMode: 'numeric' }} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="House / flat, street" value={form.addressLine1} onChange={set('addressLine1')} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Area / landmark (optional)" value={form.addressLine2} onChange={set('addressLine2')} /></Grid>
              <Grid item xs={6} sm={4}><TextField fullWidth label="City" value={form.city} onChange={set('city')} /></Grid>
              <Grid item xs={6} sm={4}><TextField fullWidth label="State" value={form.state} onChange={set('state')} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Pincode" value={form.pincode} onChange={set('pincode')} inputProps={{ inputMode: 'numeric' }} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Note for the executive (optional)" placeholder="e.g. Call before coming, 2nd floor" value={form.notes} onChange={set('notes')} /></Grid>
            </Grid>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={onClose} disabled={busy}>Cancel</Button>
            <Button variant="contained" color="secondary" startIcon={<BoltRoundedIcon />} disabled={busy || !complete} onClick={submit}>
              {busy ? 'Booking…' : 'Book home demo'}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
