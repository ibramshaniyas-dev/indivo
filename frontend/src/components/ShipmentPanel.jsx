import { useState } from 'react';
import {
  Box, Typography, Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItemButton, ListItemText, CircularProgress, Alert, Link as MuiLink,
} from '@mui/material';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import StatusBadge from './StatusBadge';

const CANCELLABLE = ['SHIPMENT_CREATED', 'AWB_ASSIGNED', 'PICKUP_REQUESTED'];
const TRACKABLE = ['PICKUP_REQUESTED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'];

// Shared by admin and seller order-detail pages — `service` is either adminShipment.service.js
// or sellerShipment.service.js (same 7-function shape, different scoped API base path).
export default function ShipmentPanel({ sellerOrderId, initialShipment, initialTracking, service }) {
  const [shipment, setShipment] = useState(initialShipment || null);
  const [tracking, setTracking] = useState(initialTracking || []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [courierDialogOpen, setCourierDialogOpen] = useState(false);
  const [couriers, setCouriers] = useState([]);

  const run = async (label, fn) => {
    setError('');
    setBusy(label);
    try {
      await fn();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${label}`);
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    const data = await service.getShipment(sellerOrderId);
    setShipment(data.shipment);
    setTracking(data.tracking);
  };

  const handleCreate = () => run('create shipment', async () => {
    await service.createShipment(sellerOrderId);
    await refresh();
  });

  const handleOpenCouriers = () => run('load couriers', async () => {
    const list = await service.getCouriers(sellerOrderId);
    setCouriers(list);
    setCourierDialogOpen(true);
  });

  const handleSelectCourier = (courierId) => run('generate AWB', async () => {
    await service.generateAWB(sellerOrderId, courierId);
    setCourierDialogOpen(false);
    await refresh();
  });

  const handlePickup = () => run('request pickup', async () => {
    await service.requestPickup(sellerOrderId);
    await refresh();
  });

  const handleTrack = () => run('refresh tracking', async () => {
    const data = await service.trackShipment(sellerOrderId);
    setShipment(data.shipment);
    setTracking(data.tracking);
  });

  const handleLabel = () => run('generate label', async () => {
    const result = await service.generateLabel(sellerOrderId);
    if (result?.label_url) window.open(result.label_url, '_blank');
    await refresh();
  });

  const handleCancel = () => run('cancel shipment', async () => {
    await service.cancelShipment(sellerOrderId);
    await refresh();
  });

  return (
    <Box sx={{ mt: 2 }}>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <LocalShippingRoundedIcon fontSize="small" color="action" />
        <Typography variant="subtitle2">Shipment &amp; Tracking</Typography>
        {shipment && <StatusBadge status={shipment.status} />}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

      {shipment && (
        <Box sx={{ mb: 1.5 }}>
          {shipment.courier_name && (
            <Typography variant="body2" color="text.secondary">
              {shipment.courier_name} {shipment.tracking_number && `· AWB ${shipment.tracking_number}`}
            </Typography>
          )}
          {shipment.tracking_url && (
            <MuiLink href={shipment.tracking_url} target="_blank" rel="noreferrer" variant="body2">
              Track on courier site
            </MuiLink>
          )}
        </Box>
      )}

      {tracking.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2, pl: 0.5 }}>
          {tracking.map((event, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              {i === tracking.length - 1 ? <CheckCircleRoundedIcon fontSize="small" color="success" /> : <RadioButtonUncheckedRoundedIcon fontSize="small" color="disabled" />}
              <Box>
                <Typography variant="body2">{event.status}{event.location ? ` — ${event.location}` : ''}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(event.tracked_at).toLocaleString()}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {!shipment && (
          <Button size="small" variant="contained" disabled={busy} onClick={handleCreate}>
            {busy === 'create shipment' ? <CircularProgress size={16} /> : 'Create Shipment'}
          </Button>
        )}
        {shipment?.status === 'SHIPMENT_CREATED' && (
          <Button size="small" variant="contained" disabled={busy} onClick={handleOpenCouriers}>
            {busy === 'load couriers' ? <CircularProgress size={16} /> : 'Select Courier & Generate AWB'}
          </Button>
        )}
        {shipment?.status === 'AWB_ASSIGNED' && (
          <Button size="small" variant="contained" disabled={busy} onClick={handlePickup}>
            {busy === 'request pickup' ? <CircularProgress size={16} /> : 'Request Pickup'}
          </Button>
        )}
        {shipment && TRACKABLE.includes(shipment.status) && (
          <Button size="small" variant="outlined" disabled={busy} onClick={handleTrack}>
            {busy === 'refresh tracking' ? <CircularProgress size={16} /> : 'Refresh Tracking'}
          </Button>
        )}
        {shipment?.tracking_number && (
          <Button size="small" variant="outlined" disabled={busy} onClick={handleLabel}>
            {busy === 'generate label' ? <CircularProgress size={16} /> : 'Download Label'}
          </Button>
        )}
        {shipment && CANCELLABLE.includes(shipment.status) && (
          <Button size="small" color="error" variant="outlined" disabled={busy} onClick={handleCancel}>
            {busy === 'cancel shipment' ? <CircularProgress size={16} /> : 'Cancel Shipment'}
          </Button>
        )}
      </Box>

      <Dialog open={courierDialogOpen} onClose={() => setCourierDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Select a Courier</DialogTitle>
        <DialogContent>
          {couriers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No couriers are serviceable for this route.</Typography>
          ) : (
            <List>
              {couriers.map((c) => (
                <ListItemButton key={c.courierId} onClick={() => handleSelectCourier(c.courierId)} disabled={busy}>
                  <ListItemText
                    primary={c.courierName}
                    secondary={`₹${c.rate} · ETA ${c.etd || 'N/A'}${c.codCharges ? ` · COD charge ₹${c.codCharges}` : ''}`}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCourierDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
