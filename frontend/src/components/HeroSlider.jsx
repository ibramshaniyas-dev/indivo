import { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, Button, IconButton } from '@mui/material';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { Link } from 'react-router-dom';
import { ZMark } from './BrandLogo';
import { BRAND } from '../brand';
import { goldGradient } from '../theme';

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
export default function HeroSlider({ banners }) {
  const slides = banners.length ? banners : FALLBACK_SLIDES;
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
    border: '1px solid rgba(243,217,139,0.35)', color: 'secondary.light',
    '&:hover': { bgcolor: 'rgba(243,217,139,0.12)' },
  };

  return (
    <Box
      sx={{
        position: 'relative', overflow: 'hidden', color: '#fff', bgcolor: 'primary.main',
        backgroundImage: 'radial-gradient(ellipse at 78% 40%, rgba(201,160,74,0.28) 0%, rgba(14,13,11,0) 55%), radial-gradient(ellipse at 10% 110%, rgba(201,160,74,0.12) 0%, rgba(14,13,11,0) 50%)',
      }}
    >
      <ZMark
        size={{ xs: 260, md: 460 }}
        sx={{ position: 'absolute', right: { xs: -60, md: '6%' }, top: '50%', transform: 'translateY(-50%)', opacity: { xs: 0.12, md: 0.9 }, filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.5))', pointerEvents: 'none' }}
      />

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
                <Typography variant="overline" sx={{ color: 'secondary.light', fontSize: '0.7rem' }}>{BRAND.tagline}</Typography>
                <Box sx={{ width: 56, height: 2, backgroundImage: goldGradient, my: 2 }} />
                <Typography variant="h2" component="h1" sx={{ fontSize: { xs: '2.1rem', md: '3.4rem' }, lineHeight: 1.1, mb: 2 }}>
                  {headline}
                </Typography>
                {supporting && (
                  <Typography sx={{ opacity: 0.75, fontSize: { xs: '0.95rem', md: '1.1rem' }, maxWidth: 480, mb: 4 }}>{supporting}</Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: supporting ? 0 : 3 }}>
                  <Button component={Link} to={s.link || '/search'} variant="contained" color="secondary" size="large" tabIndex={active ? 0 : -1}>
                    Shop Now
                  </Button>
                  <Button
                    component={Link} to="/search?sort=newest" variant="outlined" size="large" tabIndex={active ? 0 : -1}
                    sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.35)', '&:hover': { borderColor: 'secondary.light', bgcolor: 'rgba(255,255,255,0.04)' } }}
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
                  bgcolor: i === index ? 'secondary.main' : 'rgba(255,255,255,0.3)', transition: 'width 0.3s ease',
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
