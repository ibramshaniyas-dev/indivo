import { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, Button, IconButton } from '@mui/material';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { Link } from 'react-router-dom';
import { BrandMark } from './BrandLogo';
import { BRAND } from '../brand';
import { goldGradient } from '../theme';
import { realImage, responsiveImage } from '../utils/images';

const AUTO_ADVANCE_MS = 6000;

const FALLBACK_SLIDES = [
  { id: 'f1', title: 'Discover Something Special — Curated fashion, fabrics and fragrances from India\'s finest sellers', link: '/search' },
];

/**
 * Homepage hero, driven by the `banners` table via /cms/banners (admin can add/reorder/retire
 * slides without a code change). Purely typographic on the brand's black-and-gold — banner
 * photos are intentionally not shown; the storefront only displays real product photos.
 * A title written as "Headline — supporting line" is split into the two text levels.
 */
export default function HeroSlider({ banners, products = [] }) {
  const slides = banners.length ? banners : FALLBACK_SLIDES;
  // Up to three products with a real photo, shown as floating cards (desktop).
  const featured = products
    .map((p) => ({ ...p, img: realImage(p.image) }))
    .filter((p) => p.img)
    .filter((p, i, arr) => arr.findIndex((q) => q.img === p.img) === i)
    .slice(0, 3);
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  useEffect(() => { if (index >= slides.length) setIndex(0); }, [slides.length, index]);

  const goTo = (next) => {
    clearInterval(timerRef.current);
    setIndex(next);
  };

  const navBtnSx = {
    border: '1px solid rgba(122,85,23,0.35)', color: 'primary.main', bgcolor: 'rgba(255,255,255,0.6)',
    '&:hover': { bgcolor: '#fff' },
  };

  return (
    <Box
      sx={{
        position: 'relative', overflow: 'hidden', color: 'text.primary', bgcolor: '#FBF3DE',
        backgroundImage: 'radial-gradient(ellipse at 78% 45%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 50%), radial-gradient(ellipse at 0% 100%, rgba(233,196,106,0.35) 0%, rgba(233,196,106,0) 55%), linear-gradient(135deg, #FDF8EC 0%, #F5E6BF 55%, #EED69B 100%)',
      }}
    >
      {/* Right-hand composition: gold Z with a travelling light sweep, plus floating product cards. */}
      <Box sx={{ position: 'absolute', right: { xs: -60, md: '4%' }, top: '50%', transform: 'translateY(-50%)', width: { xs: 260, md: 520 }, height: { xs: 260, md: 460 }, pointerEvents: 'none' }}>
        <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: { xs: 0.22, md: featured.length ? 0.7 : 1 } }}>
          <BrandMark size="100%" sx={{ filter: 'drop-shadow(0 24px 40px rgba(122,85,23,0.25))' }} />
          <Box
            sx={{
              position: 'absolute', top: '-20%', bottom: '-20%', width: '35%', left: '-40%',
              background: 'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,246,214,0.55) 50%, rgba(255,255,255,0) 100%)',
              mixBlendMode: 'overlay', transform: 'skewX(-18deg)',
              animation: 'zkSweep 5.5s ease-in-out infinite',
              '@keyframes zkSweep': { '0%': { left: '-40%' }, '55%, 100%': { left: '120%' } },
              '@media (prefers-reduced-motion: reduce)': { animation: 'none', display: 'none' },
            }}
          />
        </Box>
        {featured.map((p, i) => {
          const pos = [
            { top: '4%', left: '2%', w: '40%', rot: -6, delay: 0 },
            { top: '20%', left: '50%', w: '44%', rot: 4, delay: 1.2 },
            { top: '56%', left: '16%', w: '36%', rot: -2, delay: 2.4 },
          ][i];
          return (
            <Box
              key={p.id}
              component={Link}
              to={`/product/${p.slug}`}
              sx={{
                display: { xs: 'none', md: 'block' }, position: 'absolute', top: pos.top, left: pos.left, width: pos.w,
                pointerEvents: 'auto', textDecoration: 'none', color: 'inherit',
                '--rot': `${pos.rot}deg`,
                animation: `zkFloat 7s ease-in-out ${pos.delay}s infinite`,
                '@keyframes zkFloat': { '0%, 100%': { transform: 'translateY(0) rotate(var(--rot))' }, '50%': { transform: 'translateY(-14px) rotate(var(--rot))' } },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none', transform: 'rotate(var(--rot))' },
                '&:hover .zk-card': { boxShadow: '0 30px 60px rgba(122,85,23,0.35), 0 0 0 1px rgba(201,160,74,0.8)' },
              }}
            >
              <Box className="zk-card" sx={{ bgcolor: '#fff', p: 0.75, pb: 1.25, borderRadius: 2, boxShadow: '0 22px 44px rgba(122,85,23,0.22)', transition: 'box-shadow 0.3s ease' }}>
                <Box component="img" src={responsiveImage(p.img).src} srcSet={responsiveImage(p.img).srcSet} sizes="240px" alt={p.name} decoding="async" sx={{ width: '100%', aspectRatio: '4 / 5', objectFit: 'cover', borderRadius: 1.5, display: 'block' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mt: 1, px: 0.5 }}>
                  <Typography noWrap sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.primary' }}>{p.name}</Typography>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'secondary.dark', flexShrink: 0 }}>₹{Number(p.price).toLocaleString('en-IN')}</Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Container maxWidth="xl" sx={{ position: 'relative', minHeight: { xs: 380, md: 500 }, display: 'flex', alignItems: 'center', py: { xs: 7, md: 0 } }}>
        <Box sx={{ position: 'relative', width: '100%', maxWidth: 620, minHeight: { xs: 250, md: 280 } }}>
          {slides.map((s, i) => {
            const [headline, supporting] = String(s.title || '').split(/\s+[—–-]\s+/, 2);
            const active = i === index;
            return (
              <Box
                key={s.id}
                aria-hidden={!active}
                sx={{
                  position: i === 0 ? 'relative' : 'absolute', inset: 0,
                  opacity: active ? 1 : 0, transform: active ? 'none' : 'translateY(12px)',
                  transition: 'opacity 0.6s ease, transform 0.6s ease', pointerEvents: active ? 'auto' : 'none',
                  visibility: active ? 'visible' : 'hidden',
                }}
              >
                <Typography variant="overline" sx={{ color: 'primary.main', fontSize: '0.7rem' }}>{BRAND.tagline}</Typography>
                <Box sx={{ width: 56, height: 2, backgroundImage: goldGradient, my: 2 }} />
                <Typography variant="h2" component="h1" sx={{ fontSize: { xs: '2.1rem', md: '3.4rem' }, lineHeight: 1.1, mb: 2 }}>
                  {headline}
                </Typography>
                {supporting && (
                  <Typography sx={{ color: 'text.secondary', fontSize: { xs: '0.95rem', md: '1.1rem' }, maxWidth: 480, mb: 4 }}>{supporting}</Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: supporting ? 0 : 3 }}>
                  <Button component={Link} to={s.link || '/search'} variant="contained" color="secondary" size="large" tabIndex={active ? 0 : -1}>
                    Shop Now
                  </Button>
                  <Button
                    component={Link} to="/search?sort=newest" variant="outlined" size="large" tabIndex={active ? 0 : -1}
                    sx={{ color: 'primary.main', borderColor: 'rgba(122,85,23,0.45)', bgcolor: 'rgba(255,255,255,0.55)', '&:hover': { borderColor: 'primary.main', bgcolor: '#fff' } }}
                  >
                    New Arrivals
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>

      {slides.length > 1 && (
        <Container maxWidth="xl" sx={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton size="small" aria-label="Previous slide" onClick={() => goTo((index - 1 + slides.length) % slides.length)} sx={navBtnSx}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {slides.map((s, i) => (
              <Box
                key={s.id}
                component="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                sx={{
                  width: i === index ? 28 : 10, height: 3, border: 0, p: 0, cursor: 'pointer', borderRadius: 2,
                  bgcolor: i === index ? 'primary.main' : 'rgba(122,85,23,0.25)', transition: 'width 0.3s ease',
                }}
              />
            ))}
          </Box>
          <IconButton size="small" aria-label="Next slide" onClick={() => goTo((index + 1) % slides.length)} sx={navBtnSx}>
            <ArrowForwardIosRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Container>
      )}
    </Box>
  );
}
