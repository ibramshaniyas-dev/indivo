import { Box, Typography } from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import StarHalfRoundedIcon from '@mui/icons-material/StarHalfRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';

export default function RatingStars({ rating = 0, reviewCount, size = 16, showCount = true }) {
  const rounded = Math.round(rating * 2) / 2;
  const stars = Array.from({ length: 5 }, (_, i) => {
    const position = i + 1;
    if (rounded >= position) return 'full';
    if (rounded + 0.5 === position) return 'half';
    return 'empty';
  });

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ display: 'flex', color: '#E3A63E' }}>
        {stars.map((type, i) => {
          const Icon = type === 'full' ? StarRoundedIcon : type === 'half' ? StarHalfRoundedIcon : StarBorderRoundedIcon;
          return <Icon key={i} sx={{ fontSize: size }} />;
        })}
      </Box>
      {showCount && (
        <Typography variant="caption" color="text.secondary">
          {rating > 0 ? rating.toFixed(1) : 'New'}
          {typeof reviewCount === 'number' && ` (${reviewCount})`}
        </Typography>
      )}
    </Box>
  );
}
