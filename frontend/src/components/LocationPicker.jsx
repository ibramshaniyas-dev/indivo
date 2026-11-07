import { useEffect, useState } from 'react';
import {
  Box, ButtonBase, Typography, Popover, Button, TextField, CircularProgress, Alert, Divider,
} from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

const STORAGE_KEY = 'seeshaa.location';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
}
const EVENT = 'seeshaa:location';
function save(loc) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loc)); } catch { /* private mode etc. */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: loc })); // keep every picker instance in sync
}

/** Coordinates -> { city, pincode, state } via BigDataCloud's free client-side reverse geocoder. */
async function reverseGeocode(lat, lon) {
  // api-bdc.io is BigDataCloud's current host (api.bigdatacloud.net 307-redirects here).
  const url = `https://api-bdc.io/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('lookup failed');
  const d = await res.json();
  return {
    city: d.city || d.locality || d.principalSubdivision || '',
    pincode: d.postcode || '',
    state: d.principalSubdivision || '',
    source: 'gps',
  };
}

/** Pincode -> city via India Post's public API (best effort; falls back to the bare pincode). */
async function lookupPincode(pincode) {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const [d] = await res.json();
    const po = d?.PostOffice?.[0];
    if (po) return { city: po.District || po.Block || po.Name, pincode, state: po.State, source: 'pincode' };
  } catch { /* ignore */ }
  return { city: '', pincode, state: '', source: 'pincode' };
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) { reject(new Error('unsupported')); return; }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 });
  });
}

function label(loc) {
  if (!loc) return null;
  return [loc.city, loc.pincode].filter(Boolean).join(' ');
}

/**
 * "Deliver to <city> <pincode>" header control. Uses the browser's live location on request
 * (never prompts on page load) or a manually entered pincode; remembered per device.
 */
export default function LocationPicker({ variant = 'inline', autoDetect = false }) {
  const [loc, setLoc] = useState(loadSaved);
  const [anchor, setAnchor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');

  const detect = async ({ silent = false } = {}) => {
    if (!silent) { setBusy(true); setError(''); }
    try {
      const pos = await getPosition();
      const next = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      setLoc(next); save(next);
      if (!silent) setAnchor(null);
    } catch (e) {
      if (!silent) {
        setError(e?.code === 1
          ? 'Location permission was denied. Allow location for this site in your browser, or enter a pincode below.'
          : 'Could not detect your location. Please enter your pincode instead.');
      }
    } finally {
      if (!silent) setBusy(false);
    }
  };

  useEffect(() => {
    const onChange = (e) => setLoc(e.detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  // If the visitor already granted location permission earlier, refresh silently on each visit
  // (only the primary instance does this, so the lookup runs once per page load).
  useEffect(() => {
    if (!autoDetect) return;
    navigator.permissions?.query({ name: 'geolocation' })
      .then((status) => { if (status.state === 'granted') detect({ silent: true }); })
      .catch(() => {});
  }, [autoDetect]);

  const applyPincode = async (e) => {
    e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pin.trim())) { setError('Enter a valid 6-digit pincode.'); return; }
    setBusy(true); setError('');
    const next = await lookupPincode(pin.trim());
    setLoc(next); save(next); setBusy(false); setAnchor(null); setPin('');
  };

  const text = label(loc);

  const trigger = variant === 'bar' ? (
    <ButtonBase
      onClick={(e) => setAnchor(e.currentTarget)}
      sx={{ width: '100%', justifyContent: 'flex-start', gap: 0.75, px: 2, py: 0.9, bgcolor: '#FBF3DE', borderTop: '1px solid', borderColor: 'divider' }}
    >
      <PlaceOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
      <Typography noWrap sx={{ fontSize: '0.8rem', color: 'text.primary' }}>
        {text ? <>Deliver to <b>{text}</b></> : <b>Select your delivery location</b>}
      </Typography>
      <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: 'text.secondary', ml: 'auto' }} />
    </ButtonBase>
  ) : (
    <ButtonBase
      onClick={(e) => setAnchor(e.currentTarget)}
      aria-label={text ? `Delivery location: ${text}. Change` : 'Select delivery location'}
      sx={{
        display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.6, borderRadius: 2, flexShrink: 0, textAlign: 'left',
        border: '1px solid transparent', '&:hover': { borderColor: 'divider', bgcolor: 'background.default' },
      }}
    >
      <PlaceOutlinedIcon sx={{ fontSize: 22, color: 'primary.main' }} />
      <Box sx={{ lineHeight: 1.15, maxWidth: 150 }}>
        <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1.2 }}>
          {text ? 'Deliver to' : 'Hello'}
        </Typography>
        <Typography noWrap sx={{ fontSize: '0.84rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.25 }}>
          {text || 'Select location'}
        </Typography>
      </Box>
    </ButtonBase>
  );

  return (
    <>
      {trigger}
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => { setAnchor(null); setError(''); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 1, width: 320, maxWidth: 'calc(100vw - 32px)', p: 2.25, borderRadius: 3 } } }}
      >
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Choose your location</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Delivery options and times can vary by location.
        </Typography>

        <Button
          fullWidth variant="contained" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <MyLocationRoundedIcon />}
          onClick={() => detect()} disabled={busy}
        >
          Use my current location
        </Button>

        <Divider sx={{ my: 2, fontSize: '0.75rem', color: 'text.secondary' }}>or</Divider>

        <Box component="form" onSubmit={applyPincode} sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small" fullWidth placeholder="Enter 6-digit pincode" value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ inputMode: 'numeric', 'aria-label': 'Pincode' }}
          />
          <Button type="submit" variant="outlined" disabled={busy}>Apply</Button>
        </Box>

        {error && <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>}
        {text && !error && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            Current: {[loc.city, loc.state, loc.pincode].filter(Boolean).join(', ')}
          </Typography>
        )}
      </Popover>
    </>
  );
}
