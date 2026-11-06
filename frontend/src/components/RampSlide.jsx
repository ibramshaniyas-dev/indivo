import { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, IconButton, Button, Skeleton } from '@mui/material';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import PriceTag from './PriceTag';
import RatingStars from './RatingStars';
import { goldGradient, headingFont } from '../theme';

const AUTO_MS = 4200;
const VISIBLE = 3; // items shown on each side of the focused one

/**
 * "On the ramp" product preview: items stand on a soft white stage, the focused one front and
 * centre, neighbours stepping back in depth (smaller, higher, fainter). Arrows, swipe, keyboard
 * and auto-advance move along the line-up; a preview card details the focused product.
 */
export default function RampSlide({ products, loading, eyebrow = 'On the Ramp', title = "This Season's Edit" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef(null);
  const count = products.length;

  useEffect(() => { if (index >= count) setIndex(0); }, [count, index]);

  useEffect(() => {
    if (paused || count < 2 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTO_MS);
    return () => clearInterval(t);
  }, [paused, count]);

  const go = (dir) => setIndex((i) => (i + dir + count) % count);
  const current = products[index];

  // Shortest signed distance on a loop, so the line-up wraps around smoothly.
  const offsetOf = (i) => {
    let d = i - index;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  const navBtnSx = { border: '1px solid', borderColor: 'divider', bgcolor: '#fff', '&:hover': { borderColor: 'secondary.main', bgcolor: '#fff' } };

  return (
    <Box
      component="section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      sx={{ bgcolor: '#FFFFFF', py: { xs: 6, md: 8 }, overflow: 'hidden', borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: { xs: 2, md: 1 } }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'secondary.dark', fontSize: '0.66rem' }}>{eyebrow}</Typography>
            <Typography component="h2" sx={{ fontFamily: headingFont, fontWeight: 400, fontSize: { xs: '2rem', md: '3.4rem' }, lineHeight: 1.05 }}>
              {title}
            </Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
            <IconButton aria-label="Previous product" onClick={() => go(-1)} sx={navBtnSx}><ArrowBackIosNewRoundedIcon sx={{ fontSize: 15 }} /></IconButton>
            <IconButton aria-label="Next product" onClick={() => go(1)} sx={navBtnSx}><ArrowForwardIosRoundedIcon sx={{ fontSize: 15 }} /></IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 300px' }, gap: { xs: 2, md: 4 }, alignItems: 'center' }}>
          {/* Stage */}
          <Box
            tabIndex={0}
            aria-roledescription="carousel"
            aria-label={title}
            onKeyDown={(e) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); }}
            onTouchStart={(e) => { touch.current = e.touches[0].clientX; setPaused(true); }}
            onTouchEnd={(e) => {
              if (touch.current == null) return;
              const dx = e.changedTouches[0].clientX - touch.current;
              if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
              touch.current = null;
            }}
            sx={{
              position: 'relative', height: { xs: 340, sm: 420, md: 500 }, outline: 'none',
              // Soft studio floor: horizon line fading into a lit floor.
              background: 'radial-gradient(ellipse 70% 38% at 50% 88%, #F2EEE6 0%, rgba(242,238,230,0) 70%), linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 62%, #F7F4EE 62.2%, #FBFAF7 100%)',
              '&:focus-visible': { boxShadow: '0 0 0 2px #C9A04A inset' },
            }}
          >
            {loading && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, pb: 4 }}>
                {[0.6, 0.8, 1, 0.8, 0.6].map((s, i) => <Skeleton key={i} variant="rounded" sx={{ width: 150 * s, height: 260 * s, bgcolor: 'rgba(0,0,0,0.05)' }} />)}
              </Box>
            )}
            {!loading && products.map((p, i) => {
              const d = offsetOf(i);
              const a = Math.abs(d);
              if (a > VISIBLE) return null;
              const scale = 1 - a * 0.2;
              return (
                <Box
                  key={p.id}
                  component={d === 0 ? Link : 'button'}
                  to={d === 0 ? `/product/${p.slug}` : undefined}
                  type={d === 0 ? undefined : 'button'}
                  onClick={d === 0 ? undefined : () => setIndex(i)}
                  aria-label={d === 0 ? `View ${p.name}` : `Show ${p.name}`}
                  sx={{
                    position: 'absolute', left: '50%', bottom: { xs: '8%', md: '9%' }, width: { xs: '42%', sm: '30%', md: '26%' },
                    border: 0, p: 0, bgcolor: 'transparent', cursor: 'pointer', display: 'block',
                    transform: `translateX(calc(-50% + ${d * 72}%)) translateY(${-a * 6}%) scale(${scale})`,
                    transformOrigin: '50% 100%', zIndex: 10 - a, opacity: a === VISIBLE ? 0 : 1 - a * 0.18,
                    filter: a ? `saturate(${1 - a * 0.15})` : 'none',
                    transition: 'transform 0.7s cubic-bezier(.22,.8,.24,1), opacity 0.7s ease, filter 0.7s ease',
                  }}
                >
                  <ProductImage
                    src={p.image} alt={p.name} ratio="3 / 4" fit="cover" rounded="14px" placeholderLabel={false} eager={a <= 1}
                    sx={{ boxShadow: a === 0 ? '0 24px 48px rgba(14,13,11,0.22)' : '0 12px 28px rgba(14,13,11,0.14)', border: '1px solid rgba(255,255,255,0.6)' }}
                  />
                  {/* contact shadow on the floor */}
                  <Box sx={{ position: 'absolute', left: '15%', right: '15%', bottom: -6, height: 14, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(14,13,11,0.22) 0%, rgba(14,13,11,0) 70%)', zIndex: -1 }} />
                </Box>
              );
            })}
          </Box>

          {/* Preview card */}
          <Box sx={{ minHeight: 220 }}>
            {current && !loading && (
              <Box key={current.id} sx={{ animation: 'zkFade 0.5s ease', '@keyframes zkFade': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } } }}>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', letterSpacing: '0.2em', fontWeight: 600 }}>
                  {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
                </Typography>
                <Box sx={{ width: 40, height: 2, backgroundImage: goldGradient, my: 2 }} />
                {current.brandName && (
                  <Typography variant="overline" sx={{ color: 'secondary.dark', fontSize: '0.64rem', display: 'block', lineHeight: 1.4 }}>{current.brandName}</Typography>
                )}
                <Typography sx={{ fontFamily: headingFont, fontSize: { xs: '1.4rem', md: '1.7rem' }, lineHeight: 1.2, mb: 1 }}>{current.name}</Typography>
                {current.sellerName && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>by {current.sellerName}</Typography>}
                <RatingStars rating={current.rating} reviewCount={current.reviewCount} />
                <Box sx={{ mt: 1.5, mb: 2.5 }}><PriceTag mrp={current.mrp} price={current.price} size="large" /></Box>
                <Button component={Link} to={`/product/${current.slug}`} variant="contained" endIcon={<ArrowForwardRoundedIcon />}>View Product</Button>
                <Box sx={{ display: 'flex', gap: 0.75, mt: 3 }}>
                  {products.slice(0, 12).map((p, i) => (
                    <Box
                      key={p.id} component="button" aria-label={`Show ${p.name}`} onClick={() => setIndex(i)}
                      sx={{ width: i === index ? 22 : 8, height: 3, p: 0, border: 0, cursor: 'pointer', borderRadius: 2, bgcolor: i === index ? 'secondary.main' : 'divider', transition: 'width 0.3s ease' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
