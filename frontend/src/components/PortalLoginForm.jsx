import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import { login, persistSession } from '../services/auth.service';

/**
 * Shared login form for all four portals. `isAllowed(user)` decides whether the authenticated
 * account belongs in this portal (checked client-side for UX; every real API call is still
 * independently authorized server-side regardless of which portal issued the token).
 */
export default function PortalLoginForm({
  title, subtitle, identifierLabel, isAllowed, wrongPortalMessage, redirectTo, footer,
}) {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await login(form);
      if (!isAllowed(session.user)) {
        setError(wrongPortalMessage);
        return;
      }
      persistSession(session);
      dispatch(setUser(session.user));
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6, px: 2 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{subtitle}</Typography>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label={identifierLabel} name="identifier" value={form.identifier} onChange={handleChange} required autoFocus />
          <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} required />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
          {footer}
        </Box>
      </Paper>
    </Box>
  );
}
