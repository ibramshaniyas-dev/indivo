import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import EmptyState from '../../components/EmptyState';
import * as addressService from '../../services/customerAddress.service';

const initialForm = { name: '', mobile: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' };

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    addressService.listAddresses().then(setAddresses).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await addressService.addAddress(form);
      setDialogOpen(false);
      setForm(initialForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address');
    }
  };

  const handleRemove = async (id) => {
    await addressService.removeAddress(id);
    load();
  };

  const handleSetDefault = async (id) => {
    await addressService.setDefaultAddress(id);
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">My Addresses</Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialogOpen(true)}>Add Address</Button>
      </Box>

      {!loading && addresses.length === 0 && (
        <EmptyState icon={LocationOnRoundedIcon} title="No saved addresses" description="Add an address to speed up checkout next time." />
      )}

      <Grid container spacing={2}>
        {addresses.map((addr) => (
          <Grid item xs={12} sm={6} key={addr.id}>
            <Paper sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2">{addr.name} {addr.is_default ? <Chip size="small" label="Default" color="secondary" sx={{ ml: 1 }} /> : null}</Typography>
                  <Typography variant="body2" color="text.secondary">{addr.mobile}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} {addr.pincode}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => handleRemove(addr.id)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
              </Box>
              {!addr.is_default && (
                <Button size="small" sx={{ mt: 1 }} onClick={() => handleSetDefault(addr.id)}>Set as Default</Button>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Address</DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label="Mobile Number" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required />
            <TextField label="Address Line 1" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} required />
            <TextField label="Address Line 2 (optional)" value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
            <TextField label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <TextField label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
            <TextField label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
