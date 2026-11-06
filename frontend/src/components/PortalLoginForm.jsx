import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, InputAdornment, IconButton } from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import { login, persistSession } from '../services/auth.service';
import BrandLogo, { ZMark } from './BrandLogo';
import { BRAND } from '../brand';
import { goldGradient, champagne } from '../theme';

/**
 * Shared login form for all four portals. `isAllowed(user)` decides whether the authenticated
 * account belongs in this portal (checked client-side for UX; every real API call is still
 * independently authorized server-side regardless of which portal issued the token).
 */
export default function PortalLoginForm({
  title, subtitle, identifierLabel, isAllowed, wrongPortalMessage, redirectTo, footer, portalLabel,
}) {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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
    <Box sx={{ maxWidth: 940, mx: 'auto', my: { xs: 3, md: 7 }, px: 2 }}>
      <Paper sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, overflow: 'hidden', borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 24px 60px rgba(14,13,11,0.10)' }}>
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', p: 5, color: 'text.primary', position: 'relative', overflow: 'hidden',
            background: champagne,
          }}
        >
          <BrandLogo showTagline to="/" />
          <ZMark size={260} sx={{ position: 'absolute', right: -40, bottom: 40, opacity: 0.9, filter: 'drop-shadow(0 20px 36px rgba(122,85,23,0.25))' }} />
          <Box sx={{ position: 'relative' }}>
            {portalLabel && <Typography variant="overline" sx={{ color: 'primary.main', fontSize: '0.66rem' }}>{portalLabel}</Typography>}
            <Box sx={{ width: 44, height: 2, backgroundImage: goldGradient, my: 1.5 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 260 }}>{BRAND.description}</Typography>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 3.5, sm: 5 } }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
            <BrandLogo showTagline to="/" />
          </Box>
          <Typography variant="h4" component="h1" sx={{ fontSize: '1.75rem', mb: 0.5 }}>{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{subtitle}</Typography>}
          {!subtitle && <Box sx={{ mb: 3 }} />}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
            <TextField label={identifierLabel} name="identifier" value={form.identifier} onChange={handleChange} required autoFocus autoComplete="username" size="medium" />
            <TextField
              label="Password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange}
              required autoComplete="current-password" size="medium"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                      {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
            {footer && <Box sx={{ mt: 1, '& a': { color: 'secondary.dark', fontWeight: 600 } }}>{footer}</Box>}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
