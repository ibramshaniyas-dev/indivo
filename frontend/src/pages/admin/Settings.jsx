import { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Chip, Alert, Switch, FormControlLabel, Skeleton,
  InputAdornment, IconButton, Tooltip, Divider,
} from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { getAdminSettings, saveSettings, testIntegration } from '../../services/settings.service';
import { refreshStoreSettings } from '../../hooks/useStoreSettings';

const SECTIONS = [
  {
    group: 'general', title: 'Store Profile', icon: StorefrontRoundedIcon,
    description: 'Shown to customers across the storefront — footer, Contact page and invoices.',
  },
  {
    group: 'razorpay', title: 'Razorpay — Online Payments', icon: PaymentsRoundedIcon, test: 'razorpay',
    description: 'Get the keys from Razorpay Dashboard → Account & Settings → API Keys. Online payment appears at checkout once Key ID and Key secret are saved.',
    webhook: '/api/v1/webhooks/razorpay',
    webhookHelp: 'Razorpay Dashboard → Webhooks → Add: paste this URL, choose events payment.captured and payment.failed, and use the same Webhook secret as below.',
  },
  {
    group: 'shiprocket', title: 'Shiprocket — Shipping', icon: LocalShippingRoundedIcon, test: 'shiprocket',
    description: 'Use the API user from Shiprocket → Settings → API → Configure (not your main login).',
    webhook: '/api/v1/webhooks/shiprocket',
    webhookHelp: 'Shiprocket → Settings → API → Webhooks: paste this URL and put the Webhook token below in the "X-Api-Key" header field.',
  },
  {
    group: 'order', title: 'Checkout', icon: ReceiptLongRoundedIcon,
    description: 'Payment options offered to customers.',
  },
];

const SOURCE_CHIP = {
  dashboard: { label: 'Saved here', color: 'success' },
  'env/default': { label: 'From server config', color: 'default' },
  unset: { label: 'Not set', color: 'warning' },
};

function SecretField({ setting, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <TextField
      fullWidth
      label={setting.label}
      type={show ? 'text' : 'password'}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={setting.configured ? 'Leave blank to keep the current value' : 'Enter value'}
      autoComplete="new-password"
      helperText={setting.configured ? `Current: ${setting.maskedValue} (hidden for security)` : 'Not configured yet'}
      InputProps={{
        startAdornment: <InputAdornment position="start"><LockRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment>,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton size="small" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide' : 'Show'}>
              {show ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
}

function Section({ section, settings, onSaved }) {
  const items = settings.filter((s) => s.group === section.group);
  const initial = useMemo(() => Object.fromEntries(items.map((s) => [s.key, s.secret ? '' : (s.value ?? '')])), [settings]);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null); // { severity, message }

  useEffect(() => setForm(initial), [initial]);

  const dirty = items.some((s) => (s.secret ? form[s.key] !== '' : String(form[s.key] ?? '') !== String(initial[s.key] ?? '')));
  const webhookUrl = section.webhook ? `${window.location.origin}${section.webhook}` : null;

  const save = async () => {
    setSaving(true); setResult(null);
    try {
      const updates = items
        .filter((s) => (s.secret ? form[s.key] !== '' : String(form[s.key] ?? '') !== String(initial[s.key] ?? '')))
        .map((s) => ({ group: s.group, key: s.key, value: form[s.key] }));
      const res = await saveSettings(updates);
      onSaved(res.data);
      if (section.group === 'general' || section.group === 'order') refreshStoreSettings();
      setResult({ severity: 'success', message: 'Saved. Changes are live now.' });
    } catch (err) {
      setResult({ severity: 'error', message: err.response?.data?.message || 'Could not save settings' });
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true); setResult(null);
    try {
      const res = await testIntegration(section.test);
      setResult({ severity: 'success', message: res.message });
    } catch (err) {
      setResult({ severity: 'error', message: err.response?.data?.message || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Paper sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(201,160,74,0.15)', color: 'primary.main', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <section.icon fontSize="small" />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ lineHeight: 1.3 }}>{section.title}</Typography>
          <Typography variant="body2" color="text.secondary">{section.description}</Typography>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {items.map((s) => (
          <Grid item xs={12} md={s.multiline || s.type === 'BOOLEAN' ? 12 : 6} key={s.key}>
            {s.type === 'BOOLEAN' ? (
              <FormControlLabel
                control={<Switch checked={Boolean(form[s.key])} onChange={(e) => setForm({ ...form, [s.key]: e.target.checked })} />}
                label={s.label}
              />
            ) : s.secret ? (
              <SecretField setting={s} value={form[s.key]} onChange={(v) => setForm({ ...form, [s.key]: v })} />
            ) : (
              <TextField
                fullWidth
                label={s.label}
                type={s.type === 'NUMBER' ? 'number' : 'text'}
                value={form[s.key] ?? ''}
                onChange={(e) => setForm({ ...form, [s.key]: e.target.value })}
                multiline={s.multiline}
                minRows={s.multiline ? 2 : undefined}
              />
            )}
            <Chip size="small" variant="outlined" {...SOURCE_CHIP[s.source]} sx={{ mt: 0.75, height: 20, fontSize: '0.65rem' }} />
          </Grid>
        ))}
      </Grid>

      {webhookUrl && (
        <Box sx={{ mt: 2.5, p: 1.75, borderRadius: 2, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Webhook URL</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', flexGrow: 1 }}>{webhookUrl}</Typography>
            <Tooltip title="Copy">
              <IconButton size="small" onClick={() => navigator.clipboard?.writeText(webhookUrl)} aria-label="Copy webhook URL">
                <ContentCopyRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="caption" color="text.secondary">{section.webhookHelp}</Typography>
        </Box>
      )}

      {result && <Alert severity={result.severity} sx={{ mt: 2 }} onClose={() => setResult(null)}>{result.message}</Alert>}

      <Divider sx={{ my: 2.5 }} />
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {section.test && (
          <Button variant="outlined" onClick={test} disabled={testing || saving || dirty} startIcon={<CheckCircleRoundedIcon />}>
            {testing ? 'Testing…' : dirty ? 'Save first to test' : 'Test connection'}
          </Button>
        )}
        <Button variant="contained" onClick={save} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </Box>
    </Paper>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminSettings().then(setSettings).catch((err) => setError(err.response?.data?.message || 'Could not load settings'));
  }, []);

  return (
    <Box sx={{ maxWidth: 980 }}>
      <Typography variant="h5">Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Store details and integration credentials. Secrets are encrypted and never shown in full. Changes apply immediately — no server restart needed.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!settings && !error && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={220} sx={{ mb: 3 }} />)}
      {settings && SECTIONS.map((section) => (
        <Section key={section.group} section={section} settings={settings} onSaved={setSettings} />
      ))}
    </Box>
  );
}
