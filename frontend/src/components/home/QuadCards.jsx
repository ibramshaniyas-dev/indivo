import { Box, Paper, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { inr, pct } from './adUtils';
import { OFFER_RED } from '../ProductCard';

/**
 * Amazon-style "2×2" cards: each card shows four product photos under one offer heading,
 * so a single row of the page presents 16 products at a glance.
 * cards = [{ title, href, link, products: [with src/srcSet] }]
 */
export default function QuadCards({ cards }) {
  const list = cards.filter((c) => c.products.length >= 2);
  if (!list.length) return null;
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: { xs: 1, md: 2 }, mb: { xs: 1.5, md: 2 } }}>
      {list.map((c) => (
        <Paper key={c.title} sx={{ p: { xs: 1, md: 1.75 }, borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.8rem', md: '1.02rem' }, mb: { xs: 0.75, md: 1.25 }, lineHeight: 1.2 }} noWrap>{c.title}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: { xs: 0.75, md: 1.25 }, flex: 1 }}>
            {c.products.slice(0, 4).map((p) => (
              <Box key={p.id} component={Link} to={`/product/${p.slug}`} sx={{ textDecoration: 'none', color: 'text.primary', minWidth: 0 }}>
                <Box sx={{ position: 'relative', borderRadius: 1.5, overflow: 'hidden', bgcolor: '#F6F1E7' }}>
                  <Box component="img" src={p.src} srcSet={p.srcSet} sizes="(max-width: 600px) 22vw, 160px" alt={p.name} loading="lazy" decoding="async" sx={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block', transition: 'transform 0.4s', '&:hover': { transform: 'scale(1.06)' } }} />
                  {pct(p) >= 5 && (
                    <Box sx={{ position: 'absolute', left: 4, top: 4, px: 0.5, borderRadius: 0.75, bgcolor: OFFER_RED, color: '#fff', fontSize: '0.56rem', fontWeight: 800 }}>{pct(p)}% OFF</Box>
                  )}
                </Box>
                <Typography noWrap sx={{ fontSize: { xs: '0.62rem', md: '0.72rem' }, mt: 0.4, color: 'text.secondary' }}>{p.name}</Typography>
                <Typography sx={{ fontSize: { xs: '0.72rem', md: '0.82rem' }, fontWeight: 800, lineHeight: 1.1 }}>{inr(p.price)}</Typography>
              </Box>
            ))}
          </Box>
          <Typography component={Link} to={c.href} sx={{ mt: 1, fontSize: { xs: '0.7rem', md: '0.8rem' }, fontWeight: 700, color: 'primary.main', textDecoration: 'none' }}>
            {c.link || 'See all'} ›
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
