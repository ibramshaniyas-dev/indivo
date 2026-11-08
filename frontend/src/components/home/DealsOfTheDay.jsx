import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import { Link } from 'react-router-dom';
import ProductRail from './ProductRail';
import { OFFER_RED } from '../ProductCard';

function untilMidnight() {
  const now = new Date();
  const end = new Date(now); end.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((end - now) / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((v) => String(v).padStart(2, '0'));
}

/** Today's biggest discounts with a countdown to midnight (when the deal list refreshes). */
export default function DealsOfTheDay({ products, loading, wishlistIds, onToggleWishlist }) {
  const [t, setT] = useState(untilMidnight);
  useEffect(() => { const id = setInterval(() => setT(untilMidnight()), 1000); return () => clearInterval(id); }, []);
  const top = products.length ? Math.max(...products.map((p) => Math.round((1 - p.price / p.mrp) * 100))) : 0;

  const header = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, mb: 1.5, flexWrap: 'wrap' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <LocalFireDepartmentRoundedIcon sx={{ color: OFFER_RED }} />
        <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', md: '1.25rem' } }}>Deals of the Day</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} aria-label={`Ends in ${t.join(':')}`}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>Ends in</Typography>
        {t.map((v, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ minWidth: 30, textAlign: 'center', px: 0.5, py: 0.25, borderRadius: 1, bgcolor: OFFER_RED, color: '#fff', fontWeight: 800, fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>{v}</Box>
            {i < 2 && <Typography sx={{ fontWeight: 800, color: OFFER_RED }}>:</Typography>}
          </Box>
        ))}
      </Box>
      {top > 0 && (
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: OFFER_RED, display: { xs: 'none', sm: 'block' } }}>Up to {top}% off</Typography>
      )}
      <Box component={Link} to="/search?sort=discount" sx={{ ml: 'auto', px: 1.75, py: 0.6, borderRadius: 1.5, bgcolor: OFFER_RED, color: '#fff', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>
        View all deals
      </Box>
    </Box>
  );

  return (
    <ProductRail
      header={header} products={products} loading={loading} viewAllHref="/search?sort=discount"
      wishlistIds={wishlistIds} onToggleWishlist={onToggleWishlist}
      sx={{ border: '1.5px solid rgba(198,40,40,0.25)', background: 'linear-gradient(180deg, #FFF6F5 0%, #FFFFFF 120px)' }}
    />
  );
}
