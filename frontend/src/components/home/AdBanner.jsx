import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { inr, pct } from './adUtils';

/** Wide mid-page advert: colour band with headline/offer on the left and a strip of real product photos. */
export default function AdBanner({ eyebrow, title, big, sub, cta = 'Shop now', href, theme, photos = [] }) {
  if (!photos.length) return null;
  return (
    <Box
      component={Link} to={href}
      sx={{
        position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 3 }, textDecoration: 'none',
        color: theme.ink, background: theme.bg, borderRadius: 3, px: { xs: 1.75, md: 4 }, py: { xs: 1.75, md: 2.5 }, mb: { xs: 1.5, md: 2 },
        boxShadow: '0 10px 28px rgba(14,13,11,0.16)',
      }}
    >
      <Box sx={{ position: 'absolute', left: '30%', top: '-80%', width: 340, height: 340, borderRadius: '50%', border: '30px solid rgba(255,255,255,0.06)' }} />
      <Box sx={{ position: 'relative', zIndex: 1, flex: { xs: '0 0 42%', md: '0 0 30%' }, minWidth: 0 }}>
        {eyebrow && <Typography sx={{ fontSize: { xs: '0.58rem', md: '0.72rem' }, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.accent }}>{eyebrow}</Typography>}
        <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', md: '1.5rem' }, lineHeight: 1.15 }}>{title}</Typography>
        {big && <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.4rem', md: '2.4rem' }, color: theme.accent, lineHeight: 1.05 }}>{big}</Typography>}
        {sub && <Typography sx={{ fontSize: { xs: '0.62rem', md: '0.82rem' }, opacity: 0.9, mb: 1 }}>{sub}</Typography>}
        <Box sx={{ display: 'inline-block', px: { xs: 1.25, md: 2 }, py: { xs: 0.4, md: 0.7 }, borderRadius: 5, bgcolor: '#fff', color: '#2B1E6B', fontWeight: 800, fontSize: { xs: '0.66rem', md: '0.82rem' } }}>{cta} ›</Box>
      </Box>
      <Box sx={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0, display: 'grid', gridAutoFlow: 'column', gridAutoColumns: { xs: '46%', sm: '30%', md: 'calc((100% - 4 * 12px) / 5)' }, gap: { xs: 1, md: 1.5 }, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        {photos.map((p) => (
          <Box key={p.id} sx={{ bgcolor: '#fff', borderRadius: 2, p: 0.5, boxShadow: '0 6px 16px rgba(0,0,0,0.22)' }}>
            <Box sx={{ position: 'relative' }}>
              <Box component="img" src={p.src} srcSet={p.srcSet} sizes="(max-width: 600px) 40vw, 180px" alt={p.name} loading="lazy" decoding="async" sx={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 1.5, display: 'block' }} />
              {pct(p) >= 5 && <Box sx={{ position: 'absolute', top: 4, left: 4, px: 0.5, borderRadius: 0.75, bgcolor: '#C62828', color: '#fff', fontSize: '0.58rem', fontWeight: 800 }}>{pct(p)}% OFF</Box>}
            </Box>
            <Typography noWrap sx={{ color: '#1a1a1a', fontSize: { xs: '0.62rem', md: '0.72rem' }, px: 0.25, pt: 0.4 }}>{p.name}</Typography>
            <Typography sx={{ color: '#1a1a1a', fontWeight: 800, fontSize: { xs: '0.74rem', md: '0.84rem' }, px: 0.25 }}>{inr(p.price)}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
