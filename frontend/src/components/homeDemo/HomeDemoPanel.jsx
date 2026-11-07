import { useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useHomeDemo from '../../hooks/useHomeDemo';
import { getCurrentPosition, reverseGeocode, saveLocation, getSavedLocation } from '../../utils/location';
import BookDemoDialog from './BookDemoDialog';

/**
 * Product page block: shows "Try at home within 60 minutes" when this product is a demo piece in
 * the shopper's area. Without a known location it offers to check; elsewhere it renders nothing.
 */
export default function HomeDemoPanel({ product, variant }) {
  const { zone, productIds, hasLocation, gps, loading } = useHomeDemo();
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');

  const checkLocation = async () => {
    setChecking(true); setCheckError('');
    try {
      const pos = await getCurrentPosition();
      const detected = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      const current = getSavedLocation();
      saveLocation(current?.source === 'address' ? { ...current, gps: detected } : { ...detected, gps: detected });
    } catch (e) {
      setCheckError(e?.code === 1 ? 'Allow location access in your browser to check home demo.' : 'Could not detect your location.');
    } finally {
      setChecking(false);
    }
  };

  if (!hasLocation) {
    return (
      <Box sx={{ mt: 2, p: 1.75, borderRadius: 2, border: '1px dashed', borderColor: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <BoltRoundedIcon sx={{ color: 'secondary.dark' }} />
        <Typography variant="body2" sx={{ flexGrow: 1 }}>See it before you buy — check if <b>home demo in 1 hour</b> is available near you.</Typography>
        <Button size="small" variant="outlined" startIcon={checking ? <CircularProgress size={14} /> : <MyLocationRoundedIcon />} disabled={checking} onClick={checkLocation}>Check my location</Button>
        {checkError && <Typography variant="caption" color="error.main" sx={{ width: '100%' }}>{checkError}</Typography>}
      </Box>
    );
  }
  if (loading || !zone || !productIds.has(product.id)) return null;

  const book = () => {
    if (!isAuthenticated || user?.userType !== 'CUSTOMER') { navigate(`/login?redirect=/product/${product.slug}`); return; }
    setOpen(true);
  };

  return (
    <Box sx={{ mt: 2, p: 2, borderRadius: 2.5, background: 'linear-gradient(135deg, #FDF8EC 0%, #F6E9C6 100%)', border: '1px solid rgba(168,106,0,0.35)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ width: 42, height: 42, borderRadius: '50%', bgcolor: '#fff', display: 'grid', placeItems: 'center', border: '1px solid rgba(168,106,0,0.35)' }}>
          <BoltRoundedIcon sx={{ color: 'secondary.dark' }} />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 200 }}>
          <Typography sx={{ fontWeight: 700 }}>Try at home within {zone.slaMinutes} minutes</Typography>
          <Typography variant="caption" color="text.secondary">
            A SEESHAA executive brings this piece to you. Love it? Pay right there — UPI, cash or card. No obligation.
          </Typography>
        </Box>
        <Button variant="contained" color="secondary" onClick={book} disabled={!variant}>Book home demo</Button>
      </Box>
      {open && <BookDemoDialog open={open} onClose={() => setOpen(false)} product={product} variant={variant} zone={zone} gps={gps} />}
    </Box>
  );
}
