import { useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Alert, Avatar, Chip, Divider,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../../store/slices/authSlice';
import { updateMyProfile, changeMyPassword } from '../../services/settings.service';

/** The signed-in admin's own profile (name / email / mobile) and password — replaces the .env-only super admin details. */
export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', mobile: user?.mobile || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setProfileMsg(null);
    try {
      const updated = await updateMyProfile(form);
      const merged = { ...user, ...updated };
      dispatch(setUser(merged));
      try { localStorage.setItem('user', JSON.stringify(merged)); } catch { /* ignore */ }
      setProfileMsg({ severity: 'success', text: 'Profile updated' });
    } catch (err) {
      const errors = err.response?.data?.errors;
      setProfileMsg({ severity: 'error', text: errors?.[0]?.msg || err.response?.data?.message || 'Could not update profile' });
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) { setPwMsg({ severity: 'error', text: 'New passwords do not match' }); return; }
    setChanging(true); setPwMsg(null);
    try {
      await changeMyPassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwMsg({ severity: 'success', text: 'Password changed. Use the new password next time you sign in.' });
    } catch (err) {
      const errors = err.response?.data?.errors;
      setPwMsg({ severity: 'error', text: errors?.[0]?.msg || err.response?.data?.message || 'Could not change password' });
    } finally {
      setChanging(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 760 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>My Profile</Typography>

      <Paper sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.4rem' }}>
            {(form.name || form.email || 'A')[0].toUpperCase()}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 700 }}>{user?.name || 'Admin'}</Typography>
            <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
              {user?.isSuperAdmin && <Chip size="small" color="secondary" label="Super Admin" />}
              {(user?.roles || []).filter((r) => r !== 'SUPER_ADMIN').map((r) => <Chip key={r} size="small" variant="outlined" label={r} />)}
            </Box>
          </Box>
        </Box>

        <Box component="form" onSubmit={saveProfile}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="email" label="Email (used to sign in)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Mobile" value={form.mobile} inputProps={{ inputMode: 'numeric' }}
                onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              />
            </Grid>
          </Grid>
          {profileMsg && <Alert severity={profileMsg.severity} sx={{ mt: 2 }}>{profileMsg.text}</Alert>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h6">Change password</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>At least 8 characters.</Typography>
        <Divider sx={{ mb: 2 }} />
        <Box component="form" onSubmit={savePassword}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth type="password" label="Current password" autoComplete="current-password" required
                value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="password" label="New password" autoComplete="new-password" required
                value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="password" label="Confirm new password" autoComplete="new-password" required
                value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </Grid>
          </Grid>
          {pwMsg && <Alert severity={pwMsg.severity} sx={{ mt: 2 }}>{pwMsg.text}</Alert>}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button type="submit" variant="contained" disabled={changing}>{changing ? 'Updating…' : 'Change password'}</Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
