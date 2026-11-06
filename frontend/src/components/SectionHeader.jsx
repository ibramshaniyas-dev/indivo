import { Box, Typography, Button } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Link } from 'react-router-dom';
import { goldGradient } from '../theme';

export default function SectionHeader({ title, subtitle, eyebrow, actionLabel, actionHref }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 3 }}>
      <Box>
        {eyebrow && <Typography variant="overline" sx={{ color: 'secondary.dark', fontSize: '0.66rem' }}>{eyebrow}</Typography>}
        <Typography variant="h4" component="h2" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>{title}</Typography>
        <Box sx={{ width: 44, height: 2, backgroundImage: goldGradient, mt: 1.25, mb: subtitle ? 1.25 : 0 }} />
        {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
      </Box>
      {actionLabel && (
        <Button
          component={Link} to={actionHref} endIcon={<ArrowForwardRoundedIcon />}
          sx={{ flexShrink: 0, color: 'text.primary', fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', '&:hover': { color: 'secondary.dark', bgcolor: 'transparent' } }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
