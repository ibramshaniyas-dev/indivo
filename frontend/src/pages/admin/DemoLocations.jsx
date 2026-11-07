import { useEffect, useMemo, useState } from 'react';
import {
  Box, Grid, Paper, Typography, Button, TextField, Slider, Switch, FormControlLabel, Alert, Chip, List, ListItemButton,
  ListItemText, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Autocomplete, Avatar, Tooltip, Divider,
} from '@mui/material';
import AddLocationAltRoundedIcon from '@mui/icons-material/AddLocationAltRounded';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import TouchAppRoundedIcon from '@mui/icons-material/TouchAppRounded';
import { useSelector } from 'react-redux';
import ZoneMap from '../../components/homeDemo/ZoneMap';
import api from '../../services/api';
import { realImage } from '../../utils/images';
import {
  getDemoZones, createDemoZone, updateDemoZone, deleteDemoZone, getDemoZoneProducts, setDemoZoneProduct, removeDemoZoneProduct,
} from '../../services/homeDemo.service';

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const NEW_DRAFT = { id: null, name: '', city: '', lat: null, lng: null, radiusKm: 5, slaMinutes: 60, isActive: true };

/** Super Admin: draw home-demo locations on the map and assign demo pieces to each. */
export default function DemoLocations() {
  const { user } = useSelector((s) => s.auth);
  const canEdit = Boolean(user?.isSuperAdmin || user?.permissions?.includes('settings.edit'));
  const [zones, setZones] = useState([]);
  const [draft, setDraft] = useState(NEW_DRAFT);
  const [focus, setFocus] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadZones = () => getDemoZones().then(setZones).catch((e) => setMsg({ severity: 'error', text: e.response?.data?.message || 'Could not load locations' }));
  const loadProducts = (zoneId) => (zoneId ? getDemoZoneProducts(zoneId).then(setProducts).catch(() => setProducts([])) : setProducts([]));

  useEffect(() => { loadZones(); }, []);

  useEffect(() => {
    if (!search || search.length < 2) { setOptions([]); return undefined; }
    const t = setTimeout(() => {
      api.get('/admin/products', { params: { search, status: 'ACTIVE', limit: 15 } })
        .then((r) => setOptions(r.data.data || []))
        .catch(() => setOptions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const selectZone = (z) => {
    setDraft({ id: z.id, name: z.name, city: z.city || '', lat: z.latitude, lng: z.longitude, radiusKm: z.radiusKm, slaMinutes: z.slaMinutes, isActive: z.isActive });
    setFocus({ lat: z.latitude, lng: z.longitude });
    loadProducts(z.id);
    setMsg(null);
  };

  const run = async (fn, after) => {
    setBusy(true); setMsg(null);
    try {
      const res = await fn();
      setMsg({ severity: 'success', text: res.message });
      await after?.(res);
    } catch (e) {
      setMsg({ severity: 'error', text: e.response?.data?.message || 'Something went wrong' });
    } finally {
      setBusy(false);
    }
  };

  const saveZone = () => {
    const body = { name: draft.name, city: draft.city, latitude: draft.lat, longitude: draft.lng, radiusKm: Number(draft.radiusKm), slaMinutes: Number(draft.slaMinutes), isActive: draft.isActive };
    return run(
      () => (draft.id ? updateDemoZone(draft.id, body) : createDemoZone(body)),
      async (res) => {
        await loadZones();
        if (!draft.id && res.data?.id) setDraft((d) => ({ ...d, id: res.data.id }));
      }
    );
  };

  const useMyLocation = () => navigator.geolocation?.getCurrentPosition(
    (p) => { const pt = { lat: p.coords.latitude, lng: p.coords.longitude }; setDraft((d) => ({ ...d, ...pt })); setFocus(pt); },
    () => setMsg({ severity: 'warning', text: 'Could not read your location — click on the map instead.' }),
    { enableHighAccuracy: true, timeout: 10000 }
  );

  const assignedIds = useMemo(() => new Set(products.map((p) => p.productId)), [products]);

  return (
    <Box sx={{ maxWidth: 1300 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <Box>
          <Typography variant="h5">Home Demo · Locations</Typography>
          <Typography variant="body2" color="text.secondary">
            Drop a pin, set the radius, and choose which demo pieces are kept there. Customers inside the circle can book a home demo.
          </Typography>
        </Box>
        {canEdit && (
          <Button variant="contained" startIcon={<AddLocationAltRoundedIcon />} onClick={() => { setDraft(NEW_DRAFT); setProducts([]); setMsg(null); }}>
            New location
          </Button>
        )}
      </Box>
      {msg && <Alert severity={msg.severity} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 1, maxHeight: 640, overflowY: 'auto' }}>
            <Typography variant="overline" sx={{ px: 1.5, color: 'text.secondary' }}>{zones.length} location(s)</Typography>
            <List dense disablePadding>
              {zones.map((z) => (
                <ListItemButton key={z.id} selected={draft.id === z.id} onClick={() => selectZone(z)} sx={{ borderRadius: 2, mb: 0.5 }}>
                  <ListItemText
                    primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{z.name}</Typography>{!z.isActive && <Chip size="small" label="Off" sx={{ height: 18, fontSize: '0.6rem' }} />}</Box>}
                    secondary={`${z.radiusKm} km · ${z.productCount} pieces · ${z.activeBookings} active · ${z.purchases} sold`}
                  />
                </ListItemButton>
              ))}
              {zones.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>No locations yet. Click "New location", then click on the map.</Typography>}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 1.5, mb: 2, position: 'relative' }}>
            <ZoneMap zones={zones} draft={draft} focus={focus} onPick={canEdit ? (pt) => setDraft((d) => ({ ...d, ...pt })) : undefined} />
            {canEdit && !draft.lat && (
              <Box sx={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 500, bgcolor: '#fff', px: 2, py: 1, borderRadius: 2, boxShadow: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TouchAppRoundedIcon fontSize="small" color="primary" /><Typography variant="body2">Click on the map to drop the pin</Typography>
              </Box>
            )}
          </Paper>

          {canEdit && (
            <Paper sx={{ p: 2.5, mb: 2 }}>
              <Typography sx={{ fontWeight: 700, mb: 2 }}>{draft.id ? `Edit: ${draft.name}` : 'New demo location'}</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}><TextField fullWidth label="Location name" placeholder="e.g. Gandhipuram Hub" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Grid>
                <Grid item xs={12} sm={3}><TextField fullWidth label="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></Grid>
                <Grid item xs={12} sm={5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField fullWidth size="small" label="Pin" value={draft.lat ? `${draft.lat.toFixed(5)}, ${draft.lng.toFixed(5)}` : ''} placeholder="Click the map" InputProps={{ readOnly: true }} />
                    <Tooltip title="Use my current location"><IconButton onClick={useMyLocation}><MyLocationRoundedIcon /></IconButton></Tooltip>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <Typography variant="body2" color="text.secondary">Service radius: <b>{draft.radiusKm} km</b></Typography>
                  <Slider value={Number(draft.radiusKm)} min={1} max={25} step={0.5} onChange={(e, v) => setDraft({ ...draft, radiusKm: v })} valueLabelDisplay="auto" />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth type="number" label="Visit within (minutes)" value={draft.slaMinutes} inputProps={{ min: 15, max: 480, step: 5 }} onChange={(e) => setDraft({ ...draft, slaMinutes: e.target.value })} />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <FormControlLabel control={<Switch checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} />} label="Active" />
                </Grid>
                <Grid item xs={12} sm={2} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  {draft.id && (
                    <Tooltip title="Delete location"><IconButton color="error" disabled={busy} onClick={() => run(() => deleteDemoZone(draft.id), async () => { setDraft(NEW_DRAFT); setProducts([]); await loadZones(); })}><DeleteOutlineRoundedIcon /></IconButton></Tooltip>
                  )}
                  <Button variant="contained" disabled={busy || !draft.lat || !draft.name.trim()} onClick={saveZone}>Save</Button>
                </Grid>
              </Grid>
            </Paper>
          )}

          {draft.id && (
            <Paper sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Demo pieces at {draft.name}</Typography>
                  <Typography variant="caption" color="text.secondary">Only these products show "Home demo in {draft.slaMinutes} min" to customers in this area.</Typography>
                </Box>
                {canEdit && (
                  <Autocomplete
                    sx={{ width: 340 }}
                    size="small"
                    options={options.filter((o) => !assignedIds.has(o.id))}
                    getOptionLabel={(o) => o.name || ''}
                    filterOptions={(x) => x}
                    onInputChange={(e, v) => setSearch(v)}
                    onChange={(e, o) => o && run(() => setDemoZoneProduct(draft.id, o.id, 1), () => { loadProducts(draft.id); loadZones(); })}
                    renderOption={(props, o) => (
                      <li {...props} key={o.id}>
                        <Avatar variant="rounded" src={realImage(o.image) || undefined} sx={{ width: 28, height: 28, mr: 1 }} />
                        <Box><Typography variant="body2">{o.name}</Typography><Typography variant="caption" color="text.secondary">{o.seller_name || o.sellerName}</Typography></Box>
                      </li>
                    )}
                    renderInput={(params) => <TextField {...params} label="Add a product (type to search)" />}
                    noOptionsText={search.length < 2 ? 'Type at least 2 letters' : 'No live products found'}
                  />
                )}
              </Box>
              <Divider />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Seller</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right" sx={{ width: 130 }}>Pieces here</TableCell>
                    <TableCell align="right">On a visit now</TableCell>
                    {canEdit && <TableCell />}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.productId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar variant="rounded" src={realImage(p.image) || undefined} sx={{ width: 32, height: 32 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                          {p.status !== 'ACTIVE' && <Chip size="small" color="warning" label="Not live" />}
                        </Box>
                      </TableCell>
                      <TableCell>{p.sellerName}</TableCell>
                      <TableCell align="right">{inr(p.price)}</TableCell>
                      <TableCell align="right">
                        {canEdit ? (
                          <TextField
                            size="small" type="number" defaultValue={p.pieces} inputProps={{ min: 0, max: 100, style: { textAlign: 'right' } }} sx={{ width: 80 }}
                            onBlur={(e) => Number(e.target.value) !== p.pieces && run(() => setDemoZoneProduct(draft.id, p.productId, Number(e.target.value)), () => loadProducts(draft.id))}
                          />
                        ) : p.pieces}
                      </TableCell>
                      <TableCell align="right">{p.inUse}</TableCell>
                      {canEdit && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => run(() => removeDemoZoneProduct(draft.id, p.productId), () => { loadProducts(draft.id); loadZones(); })}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {products.length === 0 && (
                    <TableRow><TableCell colSpan={6}><Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No demo pieces yet — search above to add products.</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
