import { Box } from '@mui/material';
import { BrandMark } from './BrandLogo';

/** Lightweight placeholder shown while a lazily-loaded page chunk downloads. */
export default function PageLoader() {
  return (
    <Box role="status" aria-label="Loading" sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <BrandMark
        size={44}
        sx={{
          animation: 'zkPulse 1.1s ease-in-out infinite',
          '@keyframes zkPulse': { '0%, 100%': { opacity: 0.35, transform: 'scale(0.94)' }, '50%': { opacity: 1, transform: 'scale(1)' } },
        }}
      />
    </Box>
  );
}
