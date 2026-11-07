import { Chip, Paper, Typography, ToggleButtonGroup, ToggleButton, Box } from '@mui/material';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import KeyboardReturnRoundedIcon from '@mui/icons-material/KeyboardReturnRounded';

export const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export const fmtDate = (d) => new Date(String(d).replace(' ', 'T')).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Cancelled/returned orders carry no commission or payout (excluded from every total too). */
export const noCommission = (row) => row.stage === 'CANCELLED' || row.stage === 'RETURNED';

export const rateLabel =(rate) => (rate.type === 'FIXED' ? `${inr(rate.value)} / order` : `${Number(rate.value)}%`);

export const COMMISSION_RANGES = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: '365d', label: '12 months' },
  { key: 'all', label: 'All time' },
];

export function RangeToggle({ value, onChange }) {
  return (
    <ToggleButtonGroup size="small" exclusive value={value} onChange={(e, v) => v && onChange(v)} sx={{ bgcolor: '#fff' }}>
      {COMMISSION_RANGES.map((r) => <ToggleButton key={r.key} value={r.key} sx={{ px: 1.5, textTransform: 'none' }}>{r.label}</ToggleButton>)}
    </ToggleButtonGroup>
  );
}

// Settlement stage — colour always paired with an icon and a text label.
const STAGES = {
  EARNED: { label: 'Earned · ready for payout', color: 'success', icon: <CheckCircleRoundedIcon /> },
  IN_PROGRESS: { label: 'In progress', color: 'warning', icon: <HourglassTopRoundedIcon /> },
  CANCELLED: { label: 'Cancelled · no commission', color: 'default', icon: <CancelRoundedIcon /> },
  RETURNED: { label: 'Returned · no commission', color: 'default', icon: <KeyboardReturnRoundedIcon /> },
};

export function StageChip({ stage }) {
  const s = STAGES[stage] || STAGES.IN_PROGRESS;
  return <Chip size="small" variant="outlined" color={s.color} icon={s.icon} label={s.label} sx={{ '& .MuiChip-icon': { fontSize: 16 } }} />;
}

export function Tile({ label, value, hint, emphasis }) {
  return (
    <Paper sx={{ p: 2, height: '100%', ...(emphasis ? { borderColor: 'rgba(168,106,0,0.45)', bgcolor: '#FBF5E8' } : {}) }}>
      <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
      <Typography sx={{ fontFamily: "'Jost', sans-serif", fontSize: { xs: '1.35rem', md: '1.6rem' }, fontWeight: 600, mt: 0.5 }}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Paper>
  );
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
      <Box>
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </Box>
      {action}
    </Box>
  );
}
