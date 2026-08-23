import { Box, Typography, Button } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

export default function SectionHeader({ title, subtitle, actionLabel, actionHref }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 2.5 }}>
      <Box>
        <Typography variant="h5">{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
      </Box>
      {actionLabel && (
        <Button href={actionHref} endIcon={<ArrowForwardRoundedIcon />} sx={{ flexShrink: 0 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
