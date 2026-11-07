import { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Paper, Chip, Button, Alert, Skeleton, Link as MuiLink, Stepper, Step, StepLabel,
} from '@mui/material';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import { Link } from 'react-router-dom';
import ProductImage from '../../components/ProductImage';
import { getMyDemoBookings, cancelMyDemoBooking } from '../../services/homeDemo.service';

const STEPS = ['Requested', 'Confirmed', 'On the way', 'Done'];
const stepOf = (s) => ({ REQUESTED: 0, CONFIRMED: 1, ON_THE_WAY: 2, PURCHASED: 4, NOT_PURCHASED: 4 }[s] ?? 0);
const LABEL = {
  REQUESTED: ['Waiting for confirmation', 'warning'], CONFIRMED: ['Executive assigned', 'info'], ON_THE_WAY: ['On the way to you', 'secondary'],
  PURCHASED: ['Purchased', 'success'], NOT_PURCHASED: ['Demo done', 'default'], CANCELLED: ['Cancelled', 'default'],
};
const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

export default function MyHomeDemos() {
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = () => getMyDemoBookings().then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const cancel = async (b) => {
    try {
      await cancelMyDemoBooking(b.id);
      setMsg({ severity: 'success', text: `${b.booking_number} cancelled` });
      load();
    } catch (e) {
      setMsg({ severity: 'error', text: e.response?.data?.message || 'Could not cancel' });
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><BoltRoundedIcon sx={{ color: 'secondary.dark' }} /> My home demos</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Products our executives bring to your home to try before you buy.</Typography>
      {msg && <Alert severity={msg.severity} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}
      {!rows && <Skeleton variant="rounded" height={180} />}
      {rows?.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No home demos yet. Look for <b>"Try at home within 1 hour"</b> on products near you.</Typography>
          <Button component={Link} to="/" sx={{ mt: 2 }} variant="contained">Explore products</Button>
        </Paper>
      )}
      {rows?.map((b) => {
        const [label, color] = LABEL[b.status];
        const active = ['REQUESTED', 'CONFIRMED', 'ON_THE_WAY'].includes(b.status);
        const left = b.slaMinutes - b.minutesSince;
        return (
          <Paper key={b.id} sx={{ p: 2.5, mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box component={Link} to={`/product/${b.productSlug}`} sx={{ width: 88, flexShrink: 0, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <ProductImage src={b.image} alt={b.productName} placeholderLabel={false} sizes="88px" />
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 220 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontWeight: 700 }}>{b.productName}</Typography>
                  <Chip size="small" color={color} label={label} />
                </Box>
                <Typography variant="caption" color="text.secondary">{b.booking_number} · {b.variantLabel || b.variantSku} · {inr(b.price)}</Typography>
                {active && (
                  <Typography variant="body2" sx={{ mt: 0.75, fontWeight: 600, color: b.late ? 'error.main' : 'text.primary' }}>
                    {b.late ? 'Running a little late — sorry! The executive will reach you shortly.' : `Expected within ${Math.max(left, 0)} minutes`}
                  </Typography>
                )}
                {b.agent_name && active && (
                  <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">Executive: <b>{b.agent_name}</b></Typography>
                    <MuiLink href={`tel:${b.agent_phone}`} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}><PhoneRoundedIcon fontSize="small" />{b.agent_phone}</MuiLink>
                  </Box>
                )}
                {b.status === 'PURCHASED' && b.orderNumber && (
                  <Typography variant="body2" sx={{ mt: 0.75 }}>
                    Order <MuiLink component={Link} to={`/account/orders/${b.order_id}`}>{b.orderNumber}</MuiLink> · paid by {b.payment_mode}
                  </Typography>
                )}
                {b.status === 'CANCELLED' && b.cancel_reason && <Typography variant="caption" color="text.secondary">{b.cancel_reason}</Typography>}
              </Box>
              {['REQUESTED', 'CONFIRMED'].includes(b.status) && (
                <Button color="error" size="small" onClick={() => cancel(b)} sx={{ alignSelf: 'flex-start' }}>Cancel</Button>
              )}
            </Box>
            {b.status !== 'CANCELLED' && (
              <Stepper activeStep={stepOf(b.status)} alternativeLabel sx={{ mt: 2 }}>
                {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
              </Stepper>
            )}
          </Paper>
        );
      })}
    </Container>
  );
}
