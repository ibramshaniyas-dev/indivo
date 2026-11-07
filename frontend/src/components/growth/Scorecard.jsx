import { Box, Paper, Typography, Chip, Grid } from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import ThumbUpAltRoundedIcon from '@mui/icons-material/ThumbUpAltRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import FiberNewRoundedIcon from '@mui/icons-material/FiberNewRounded';

export const BANDS = {
  EXCELLENT: { label: 'Excellent', color: 'success', hex: '#1E8E62', icon: <EmojiEventsRoundedIcon /> },
  GOOD: { label: 'Good', color: 'info', hex: '#2F6FDB', icon: <ThumbUpAltRoundedIcon /> },
  NEEDS_ATTENTION: { label: 'Needs attention', color: 'warning', hex: '#D9921C', icon: <WarningAmberRoundedIcon /> },
  AT_RISK: { label: 'At risk', color: 'error', hex: '#D6453D', icon: <ErrorRoundedIcon /> },
  NEW: { label: 'New seller', color: 'default', hex: '#8A8170', icon: <FiberNewRoundedIcon /> },
};

export function BandChip({ band, size = 'small' }) {
  const b = BANDS[band] || BANDS.NEW;
  return <Chip size={size} color={b.color} variant="outlined" icon={b.icon} label={b.label} sx={{ fontWeight: 700, '& .MuiChip-icon': { fontSize: 16 } }} />;
}

/** Circular score gauge (single value — no legend needed; the number is printed inside). */
export function ScoreRing({ score, band, size = 96 }) {
  const b = BANDS[band] || BANDS.NEW;
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} role="img" aria-label={`Seller score ${score} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0E9DA" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={b.hex} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <Box>
          <Typography sx={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: size / 3.4, lineHeight: 1 }}>{score}</Typography>
          <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>/ 100</Typography>
        </Box>
      </Box>
    </Box>
  );
}

const hours = (h) => (h === null || h === undefined ? '—' : h < 1 ? `${Math.round(h * 60)} min` : `${h.toFixed(1)} h`);
const pct = (v) => `${Math.round((v || 0) * 100)}%`;

/** Full scorecard for one seller: score, band, key metrics and "how to improve". */
export default function Scorecard({ card }) {
  if (!card) return null;
  const metrics = [
    ['Orders in period', card.orders],
    ['Avg. time to confirm', hours(card.avgConfirmHours)],
    ['Avg. time to ship', hours(card.avgShipHours)],
    ['Late shipments', `${card.lateShipments} (${pct(card.lateShipRate)})`],
    ['Cancellation rate', pct(card.cancellationRate)],
    ['RTO rate', pct(card.rtoRate)],
    ['Rating', card.reviewCount ? `${card.rating.toFixed(1)} ★ (${card.reviewCount})` : 'No reviews yet'],
    ['Out of stock', `${card.outOfStock} of ${card.variants} variants`],
  ];
  return (
    <Paper id="scorecard" sx={{ p: { xs: 2, md: 2.5 }, mb: 2.5 }}>
      <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <ScoreRing score={card.score} band={card.band} />
        <Box sx={{ flexGrow: 1, minWidth: 220 }}>
          <Typography sx={{ fontWeight: 700 }}>Seller scorecard</Typography>
          <Box sx={{ my: 0.75 }}><BandChip band={card.band} /></Box>
          <Typography variant="caption" color="text.secondary">
            Based on the last 90 days: confirm within 24h, ship within 48h, keep cancellations and returns low, stock accurate and photos real.
            {card.band === 'NEW' && ' Your band is shown once you have 3 or more orders.'}
          </Typography>
        </Box>
      </Box>
      <Grid container spacing={1.25} sx={{ mb: card.deductions.length ? 2 : 0 }}>
        {metrics.map(([l, v]) => (
          <Grid item xs={6} sm={3} key={l}>
            <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'background.default', height: '100%' }}>
              <Typography variant="caption" color="text.secondary">{l}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{v}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      {card.deductions.length > 0 && (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75 }}>How to improve</Typography>
          {card.deductions.map((d) => (
            <Box key={d.reason} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.6, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2">{d.reason}</Typography>
              <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 700, flexShrink: 0 }}>−{d.points}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
