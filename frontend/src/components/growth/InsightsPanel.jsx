import { Box, Paper, Typography, Button, Skeleton } from '@mui/material';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import { Link } from 'react-router-dom';

// Severity always shown as icon + label + colour (never colour alone).
const SEVERITY = {
  critical: { label: 'Urgent', icon: ErrorRoundedIcon, color: 'error.main', bg: '#FDF1F0', border: 'rgba(214,69,61,0.35)' },
  warning: { label: 'Action needed', icon: WarningAmberRoundedIcon, color: 'warning.main', bg: '#FDF6E9', border: 'rgba(217,146,28,0.35)' },
  info: { label: 'Heads-up', icon: InfoRoundedIcon, color: 'info.main', bg: '#F1F6FD', border: 'rgba(47,111,219,0.25)' },
  success: { label: 'Good news', icon: CheckCircleRoundedIcon, color: 'success.main', bg: '#EFF8F3', border: 'rgba(30,142,98,0.3)' },
};

/** "What to do next" list. `basePath` is prefixed to relative admin action paths. */
export default function InsightsPanel({ insights, loading, basePath = '', title = 'What to do next' }) {
  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 }, mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.75 }}>
        <TipsAndUpdatesOutlinedIcon sx={{ color: 'primary.main' }} />
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
      </Box>
      {loading && <Skeleton variant="rounded" height={64} />}
      {!loading && insights?.length === 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
          <CheckCircleRoundedIcon fontSize="small" />
          <Typography variant="body2">All caught up — nothing needs your attention right now.</Typography>
        </Box>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.25 }}>
        {!loading && insights?.map((i) => {
          const s = SEVERITY[i.severity] || SEVERITY.info;
          const Icon = s.icon;
          const to = i.actionPath?.startsWith('/seller') ? i.actionPath : `${basePath}${i.actionPath}`;
          return (
            <Box key={i.id} sx={{ display: 'flex', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: s.bg, border: '1px solid', borderColor: s.border }}>
              <Icon sx={{ color: s.color, mt: 0.25 }} />
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: s.color, fontWeight: 700, letterSpacing: '0.04em' }}>{s.label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.35 }}>{i.title}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{i.detail}</Typography>
              </Box>
              {i.actionLabel && i.actionPath && (
                <Button size="small" component={Link} to={to} sx={{ alignSelf: 'center', flexShrink: 0, whiteSpace: 'nowrap' }}>{i.actionLabel}</Button>
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
