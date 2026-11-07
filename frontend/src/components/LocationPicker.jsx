import { useCallback, useEffect, useState } from 'react';
import {
  Box, ButtonBase, Typography, Popover, Button, CircularProgress, Alert, Chip, Link as MuiLink,
} from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import NearMeRoundedIcon from '@mui/icons-material/NearMeRounded';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { listAddresses } from '../services/customerAddress.service';
import {
  LOCATION_EVENT, getSavedLocation, saveLocation, pickNearestAddress, locationFromAddress,
  reverseGeocode, getCurrentPosition, shortPlace,
} from '../utils/location';

const ASKED_KEY = 'seeshaa.geoAsked';

/**
 * Amazon/Flipkart-style "Deliver to" control.
 *  - Detects the shopper's current location automatically (browser permission, asked once).
 *  - For signed-in customers, lists their saved addresses and auto-selects the one nearest to
 *    where they are now; they can pick any address or switch to the current location.
 *  - No pincode typing.
 */
export default function LocationPicker({ variant = 'inline', autoDetect = false }) {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const isCustomer = isAuthenticated && user?.userType === 'CUSTOMER';
  const [loc, setLoc] = useState(getSavedLocation);
  const [addresses, setAddresses] = useState([]);
  const [anchor, setAnchor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const gps = loc?.gps || (loc?.source === 'gps' ? loc : null);
  const nearest = pickNearestAddress(addresses, gps);

  // Keep every picker instance (desktop + mobile) in sync.
  useEffect(() => {
    const onChange = (e) => setLoc(e.detail);
    window.addEventListener(LOCATION_EVENT, onChange);
    return () => window.removeEventListener(LOCATION_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!isCustomer) { setAddresses([]); return; }
    listAddresses().then(setAddresses).catch(() => setAddresses([]));
  }, [isCustomer]);

  /** Picks what to show: the shopper's manual choice wins; otherwise nearest saved address, else GPS. */
  const autoChoose = useCallback((detected, list) => {
    const current = getSavedLocation();
    if (current?.manual && current.source === 'address' && list.some((a) => a.id === current.addressId)) {
      saveLocation({ ...current, gps: detected });
      return;
    }
    const near = pickNearestAddress(list, detected);
    saveLocation(near ? { ...locationFromAddress(near), gps: detected, auto: true } : { ...detected, gps: detected });
  }, []);

  const detect = useCallback(async ({ silent = false, manual = false } = {}) => {
    if (!silent) { setBusy(true); setError(''); }
    try {
      const pos = await getCurrentPosition();
      const detected = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      if (manual) saveLocation({ ...detected, gps: detected, manual: true });
      else autoChoose(detected, addresses);
      if (!silent) setAnchor(null);
    } catch (e) {
      if (!silent) {
        setError(e?.code === 1
          ? 'Location access is blocked. Allow location for this site in your browser settings (padlock icon in the address bar), then try again.'
          : 'Could not detect your location right now. Please try again.');
      }
    } finally {
      try { localStorage.setItem(ASKED_KEY, '1'); } catch { /* ignore */ }
      if (!silent) setBusy(false);
    }
  }, [addresses, autoChoose]);

  // Auto-track on visit: if permission is granted (or not yet asked) detect the current location.
  // A denied permission is never re-prompted automatically.
  useEffect(() => {
    if (!autoDetect) return;
    let asked = false;
    try { asked = localStorage.getItem(ASKED_KEY) === '1'; } catch { /* ignore */ }
    const run = () => detect({ silent: true });
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((st) => { if (st.state === 'granted' || (st.state === 'prompt' && !asked)) run(); })
        .catch(() => { if (!asked) run(); });
    } else if (!asked) run();
    // re-run once saved addresses arrive so the nearest one can be picked
  }, [autoDetect, addresses.length]);

  const chooseAddress = (a) => {
    saveLocation({ ...locationFromAddress(a), gps, manual: true });
    setAnchor(null);
  };

  const who = loc?.source === 'address' && loc.name ? loc.name.split(' ')[0] : (isCustomer && user?.name ? user.name.split(' ')[0] : '');
  const place = shortPlace(loc);
  const topLine = place ? `Deliver to${who ? ` ${who}` : ''}` : 'Hello';
  const bottomLine = place || 'Select your address';

  const trigger = variant === 'bar' ? (
    <ButtonBase
      onClick={(e) => setAnchor(e.currentTarget)}
      sx={{ width: '100%', justifyContent: 'flex-start', gap: 0.75, px: 2, py: 0.9, bgcolor: '#FBF3DE', borderTop: '1px solid', borderColor: 'divider' }}
    >
      <PlaceOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
      <Typography noWrap sx={{ fontSize: '0.8rem', color: 'text.primary' }}>
        {place ? <>{topLine} — <b>{bottomLine}</b></> : <b>Select your delivery location</b>}
      </Typography>
      <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: 'text.secondary', ml: 'auto' }} />
    </ButtonBase>
  ) : (
    <ButtonBase
      onClick={(e) => setAnchor(e.currentTarget)}
      aria-label={place ? `${topLine} ${bottomLine}. Change delivery location` : 'Select delivery location'}
      sx={{
        display: 'flex', alignItems: 'center', gap: 0.75, px: 1.25, py: 0.6, borderRadius: 2, flexShrink: 0, textAlign: 'left',
        border: '1px solid transparent', '&:hover': { borderColor: 'divider', bgcolor: 'background.default' },
      }}
    >
      <PlaceOutlinedIcon sx={{ fontSize: 22, color: 'primary.main' }} />
      <Box sx={{ lineHeight: 1.15, maxWidth: 170 }}>
        <Typography noWrap sx={{ fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1.2 }}>{topLine}</Typography>
        <Typography noWrap sx={{ fontSize: '0.84rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.25 }}>{bottomLine}</Typography>
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
        slotProps={{ paper: { sx: { mt: 1, width: 360, maxWidth: 'calc(100vw - 32px)', borderRadius: 3, overflow: 'hidden' } } }}
      >
        <Box sx={{ px: 2.25, py: 1.75, bgcolor: '#FBF3DE', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 700 }}>Choose your location</Typography>
          <Typography variant="body2" color="text.secondary">
            Select a delivery address to see product availability and delivery options.
          </Typography>
        </Box>

        <Box sx={{ p: 2, maxHeight: 380, overflowY: 'auto' }}>
          {isCustomer && addresses.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2 }}>
              {addresses.map((a) => {
                const selected = loc?.source === 'address' && loc.addressId === a.id;
                const isNearest = nearest?.id === a.id;
                return (
                  <ButtonBase
                    key={a.id}
                    onClick={() => chooseAddress(a)}
                    sx={{
                      display: 'block', textAlign: 'left', p: 1.5, borderRadius: 2, border: '1.5px solid',
                      borderColor: selected ? 'primary.main' : 'divider', bgcolor: selected ? 'rgba(201,160,74,0.08)' : '#fff',
                      '&:hover': { borderColor: 'primary.light' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.25 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{a.name}</Typography>
                      {a.type && <Chip size="small" label={a.type} variant="outlined" sx={{ height: 18, fontSize: '0.6rem' }} />}
                      {isNearest && (
                        <Chip size="small" icon={<NearMeRoundedIcon sx={{ fontSize: '12px !important' }} />} label="Nearest to you" color="success" sx={{ height: 18, fontSize: '0.6rem' }} />
                      )}
                      {!!a.is_default && <Chip size="small" label="Default" sx={{ height: 18, fontSize: '0.6rem' }} />}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                      {[a.address_line1, a.address_line2].filter(Boolean).join(', ')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{a.city}, {a.state} {a.pincode}</Typography>
                  </ButtonBase>
                );
              })}
              <MuiLink component={Link} to="/account/addresses" onClick={() => setAnchor(null)} underline="hover" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Add or manage addresses
              </MuiLink>
            </Box>
          )}

          {!isCustomer && (
            <Button component={Link} to="/login" onClick={() => setAnchor(null)} fullWidth variant="contained" sx={{ mb: 1.5 }}>
              Sign in to see your addresses
            </Button>
          )}
          {isCustomer && addresses.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              No saved addresses yet. <MuiLink component={Link} to="/account/addresses" onClick={() => setAnchor(null)}>Add an address</MuiLink>
            </Typography>
          )}

          <Button
            fullWidth variant="outlined" onClick={() => detect({ manual: true })} disabled={busy}
            startIcon={busy ? <CircularProgress size={16} /> : <MyLocationRoundedIcon />}
          >
            {busy ? 'Detecting your location…' : 'Use my current location'}
          </Button>

          {gps && (
            <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <MyLocationRoundedIcon sx={{ fontSize: 16, color: 'primary.main', mt: 0.3 }} />
              <Typography variant="caption" color="text.secondary">
                You are currently near <b>{[gps.locality, gps.city, gps.state].filter(Boolean).join(', ')}{gps.pincode ? ` ${gps.pincode}` : ''}</b>
                {loc?.source === 'gps' && ' — delivering here'}
              </Typography>
            </Box>
          )}

          {error && <Alert severity="warning" sx={{ mt: 1.5 }}>{error}</Alert>}
        </Box>
      </Popover>
    </>
  );
}
