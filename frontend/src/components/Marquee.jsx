import { Box, Typography } from '@mui/material';
import { ZMark } from './BrandLogo';

/** Endless gold-on-black ticker. Content is duplicated so the loop is seamless. */
export default function Marquee({ items, speed = 38 }) {
  const row = (hidden) => (
    <Box aria-hidden={hidden || undefined} sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {items.map((t) => (
        <Box key={t} sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography component="span" sx={{ fontFamily: "'Jost', sans-serif", fontSize: { xs: '0.95rem', md: '1.15rem' }, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#4A3310', whiteSpace: 'nowrap', px: { xs: 2.5, md: 4 } }}>
            {t}
          </Typography>
          <ZMark size={16} sx={{ opacity: 0.9 }} />
        </Box>
      ))}
    </Box>
  );

  return (
    <Box sx={{ background: 'linear-gradient(90deg, #E9C46A 0%, #F7E3A1 50%, #E2BA5C 100%)', py: { xs: 1.6, md: 2 }, overflow: 'hidden', borderTop: '1px solid rgba(122,85,23,0.2)', borderBottom: '1px solid rgba(122,85,23,0.2)' }}>
      <Box
        sx={{
          display: 'flex', width: 'max-content',
          animation: `zkMarquee ${speed}s linear infinite`,
          '@keyframes zkMarquee': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          '&:hover': { animationPlayState: 'paused' },
        }}
      >
        {row(false)}
        {row(true)}
      </Box>
    </Box>
  );
}
