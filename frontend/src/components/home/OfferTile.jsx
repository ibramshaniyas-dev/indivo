import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

/** Compact colour ad tile: headline + computed offer + two real product photos. */
export default function OfferTile({ title, big, sub, href, theme, photos = [], sx }) {
  return (
    <Box
      component={Link} to={href}
      sx={{
        position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', color: theme.ink,
        background: theme.bg, borderRadius: 3, p: { xs: 1.25, md: 2 }, minHeight: { xs: 110, md: 0 }, height: '100%',
        boxShadow: '0 8px 22px rgba(14,13,11,0.14)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' }, ...sx,
      }}
    >
      <Box sx={{ position: 'absolute', right: -40, bottom: -60, width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
      <Box sx={{ position: 'relative', zIndex: 1, minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.78rem', md: '1rem' }, lineHeight: 1.15 }}>{title}</Typography>
        {big && <Typography sx={{ fontWeight: 900, color: theme.accent, fontSize: { xs: '1.25rem', md: '1.9rem' }, lineHeight: 1.05, my: 0.25 }}>{big}</Typography>}
        {sub && <Typography sx={{ fontSize: { xs: '0.62rem', md: '0.76rem' }, opacity: 0.9 }}>{sub}</Typography>}
      </Box>
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexShrink: 0 }}>
        {photos.slice(0, 2).map((p, k) => (
          <Box
            key={p.id} component="img" src={p.src} srcSet={p.srcSet} sizes="110px" alt="" loading="lazy" decoding="async"
            sx={{
              width: { xs: 50, md: 86 }, aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 1.5, border: '3px solid #fff',
              boxShadow: '0 6px 14px rgba(0,0,0,0.3)', ml: k ? { xs: -2, md: -3 } : 0, transform: `rotate(${k ? 6 : -4}deg)`,
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
