import { useRef } from 'react';
import { Box, Typography, IconButton, Skeleton, Paper } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';

/**
 * Compact horizontal product row (Amazon/Flipkart style): title bar with "View all", arrow
 * buttons on desktop, touch-scroll on mobile, and a final "View all" tile.
 */
export default function ProductRail({
  title, subtitle, viewAllHref, products = [], loading, wishlistIds = [], onToggleWishlist, header, accent, sx,
}) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  if (!loading && products.length === 0) return null;

  const arrowSx = {
    position: 'absolute', top: '42%', zIndex: 2, bgcolor: '#fff', boxShadow: '0 4px 14px rgba(14,13,11,0.18)', width: 36, height: 60, borderRadius: 1.5,
    display: { xs: 'none', md: 'inline-flex' }, '&:hover': { bgcolor: '#fff' },
  };

  return (
    <Paper sx={{ p: { xs: 1, md: 2 }, mb: { xs: 1, md: 2 }, borderRadius: 2, ...sx }}>
      {header || (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1rem', md: '1.15rem' }, color: accent || 'text.primary' }} noWrap>{title}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{subtitle}</Typography>}
          </Box>
          {viewAllHref && (
            <Box component={Link} to={viewAllHref} sx={{ flexShrink: 0, px: 1.75, py: 0.6, borderRadius: 1.5, bgcolor: 'primary.main', color: '#fff', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', '&:hover': { bgcolor: 'primary.light' } }}>
              View all
            </Box>
          )}
        </Box>
      )}
      <Box sx={{ position: 'relative' }}>
        <IconButton aria-label="Scroll left" onClick={() => scroll(-1)} sx={{ ...arrowSx, left: -8 }}><ChevronLeftRoundedIcon /></IconButton>
        <Box
          ref={ref}
          sx={{
            display: 'grid', gridAutoFlow: 'column', gridAutoColumns: { xs: '34%', sm: '24%', md: 'calc((100% - 6 * 12px) / 7)' },
            gap: { xs: '8px', md: '12px' }, overflowX: 'auto', scrollSnapType: 'x mandatory', pb: 0.5,
            scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, '& > *': { scrollSnapAlign: 'start' },
          }}
        >
          {loading
            ? Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} variant="rounded" sx={{ aspectRatio: '1 / 1.55', height: 'auto' }} />)
            : products.map((p) => (
              <ProductCard key={p.id} product={p} dense wishlisted={wishlistIds.includes(p.id)} onToggleWishlist={() => onToggleWishlist?.(p)} />
            ))}
          {!loading && viewAllHref && (
            <Box
              component={Link} to={viewAllHref}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, borderRadius: 2, border: '1px dashed', borderColor: 'secondary.main', textDecoration: 'none', color: 'primary.main', bgcolor: '#FBF5E8', minHeight: 200 }}
            >
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center' }}><ArrowForwardRoundedIcon /></Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>View all</Typography>
            </Box>
          )}
        </Box>
        <IconButton aria-label="Scroll right" onClick={() => scroll(1)} sx={{ ...arrowSx, right: -8 }}><ChevronRightRoundedIcon /></IconButton>
      </Box>
    </Paper>
  );
}
