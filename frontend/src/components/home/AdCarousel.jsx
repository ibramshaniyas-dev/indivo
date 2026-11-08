import { useEffect, useRef, useState } from 'react';
import { Box, Typography, IconButton, Skeleton } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Link } from 'react-router-dom';
import { inr, pct } from './adUtils';

const AUTO_MS = 4500;

/**
 * Full-colour advertising carousel. Every slide is built from live catalogue data: its photos are
 * real products and its "X% OFF" / "From ₹Y" numbers are computed, never invented.
 * slide = { key, eyebrow, title, big, sub, cta, href, theme, photos: [product with src/srcSet] }
 */
export default function AdCarousel({ slides, loading }) {
  const [i, setI] = useState(0);
  const timer = useRef(null);
  const touch = useRef(null);
  const n = slides.length;

  const restart = () => {
    clearInterval(timer.current);
    if (n > 1) timer.current = setInterval(() => setI((x) => (x + 1) % n), AUTO_MS);
  };
  useEffect(() => { restart(); return () => clearInterval(timer.current); }, [n]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (i >= n) setI(0); }, [n, i]);
  const go = (d) => { setI((x) => (x + d + n) % n); restart(); };

  const height = { xs: 200, sm: 250, md: 320 };
  if (loading || !n) return <Skeleton variant="rounded" sx={{ height, borderRadius: 3 }} />;

  return (
    <Box
      sx={{ position: 'relative', height, borderRadius: 3, overflow: 'hidden', boxShadow: '0 10px 30px rgba(14,13,11,0.18)' }}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      {slides.map((s, idx) => (
        <Slide key={s.key} s={s} active={idx === i} eager={idx === 0} />
      ))}

      {n > 1 && (
        <>
          <IconButton aria-label="Previous offer" onClick={() => go(-1)} sx={{ ...navSx, left: 8 }}><ChevronLeftRoundedIcon /></IconButton>
          <IconButton aria-label="Next offer" onClick={() => go(1)} sx={{ ...navSx, right: 8 }}><ChevronRightRoundedIcon /></IconButton>
          <Box sx={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 0.75, zIndex: 3 }}>
            {slides.map((s, idx) => (
              <Box
                key={s.key} component="button" aria-label={`Show offer ${idx + 1}`} onClick={() => { setI(idx); restart(); }}
                sx={{ width: idx === i ? 22 : 7, height: 7, borderRadius: 4, border: 0, p: 0, cursor: 'pointer', bgcolor: idx === i ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.3s' }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

const navSx = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)', zIndex: 3, color: '#fff', bgcolor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)',
  display: { xs: 'none', md: 'inline-flex' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.32)' },
};

function Slide({ s, active, eager }) {
  const t = s.theme;
  const photos = s.photos.slice(0, 3);
  return (
    <Box
      component={Link} to={s.href} aria-hidden={!active} tabIndex={active ? 0 : -1}
      sx={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', textDecoration: 'none', color: t.ink, background: t.bg,
        opacity: active ? 1 : 0, visibility: active ? 'visible' : 'hidden', transition: 'opacity 0.6s ease, visibility 0.6s', zIndex: active ? 1 : 0,
      }}
    >
      {/* decorative light rings */}
      <Box sx={{ position: 'absolute', right: '-8%', top: '-40%', width: { xs: 260, md: 520 }, height: { xs: 260, md: 520 }, borderRadius: '50%', border: '40px solid rgba(255,255,255,0.07)' }} />
      <Box sx={{ position: 'absolute', left: '-6%', bottom: '-55%', width: { xs: 200, md: 380 }, height: { xs: 200, md: 380 }, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />

      <Box sx={{ position: 'relative', zIndex: 1, pl: { xs: 2, sm: 4, md: 7 }, pr: 1, width: { xs: '56%', sm: '50%', md: '46%' } }}>
        {s.eyebrow && (
          <Box sx={{ display: 'inline-block', px: 1, py: 0.25, mb: { xs: 0.75, md: 1.25 }, borderRadius: 1, bgcolor: t.accent, color: '#3A1A00', fontSize: { xs: '0.58rem', md: '0.72rem' }, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {s.eyebrow}
          </Box>
        )}
        <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.3rem', md: '1.7rem' }, lineHeight: 1.15 }}>{s.title}</Typography>
        {s.big && (
          <Typography sx={{ fontWeight: 900, color: t.accent, fontSize: { xs: '1.9rem', sm: '2.6rem', md: '3.6rem' }, lineHeight: 1, my: { xs: 0.5, md: 1 }, letterSpacing: '-0.02em', textShadow: '0 3px 14px rgba(0,0,0,0.25)' }}>
            {s.big}
          </Typography>
        )}
        {s.sub && <Typography sx={{ fontSize: { xs: '0.68rem', md: '0.92rem' }, opacity: 0.92, mb: { xs: 1, md: 1.75 } }}>{s.sub}</Typography>}
        <Box sx={{ display: 'inline-flex', alignItems: 'center', px: { xs: 1.5, md: 2.5 }, py: { xs: 0.5, md: 0.9 }, borderRadius: 5, bgcolor: '#fff', color: '#7A0F1C', fontWeight: 800, fontSize: { xs: '0.7rem', md: '0.88rem' }, boxShadow: '0 6px 18px rgba(0,0,0,0.2)' }}>
          {s.cta} ›
        </Box>
      </Box>

      {/* product photo fan */}
      <Box sx={{ position: 'absolute', right: { xs: 8, sm: 24, md: 56 }, top: 0, bottom: 0, width: { xs: '44%', sm: '48%', md: '50%' }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {photos.map((p, k) => {
          const mid = k === 1 || photos.length === 1;
          const pos = photos.length === 1 ? 0 : (k - 1);
          return (
            <Box
              key={p.id}
              sx={{
                position: 'absolute', width: { xs: mid ? 108 : 86, sm: mid ? 150 : 120, md: mid ? 210 : 170 },
                transform: { xs: `translateX(${pos * 52}px) rotate(${pos * 7}deg)`, sm: `translateX(${pos * 88}px) rotate(${pos * 7}deg)`, md: `translateX(${pos * 150}px) rotate(${pos * 6}deg)` },
                zIndex: mid ? 2 : 1, bgcolor: '#fff', p: { xs: 0.5, md: 0.75 }, borderRadius: 2, boxShadow: '0 14px 30px rgba(0,0,0,0.35)',
              }}
            >
              <Box
                component="img" src={p.src} srcSet={p.srcSet} sizes="(max-width: 600px) 120px, 220px" alt="" loading={eager ? 'eager' : 'lazy'} decoding="async"
                sx={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 1.5, display: 'block' }}
              />
              {pct(p) > 0 && (
                <Box sx={{ position: 'absolute', top: -8, right: -8, width: { xs: 34, md: 48 }, height: { xs: 34, md: 48 }, borderRadius: '50%', bgcolor: t.accent, color: '#7A0F1C', display: 'grid', placeItems: 'center', textAlign: 'center', fontWeight: 900, fontSize: { xs: '0.55rem', md: '0.72rem' }, lineHeight: 1, boxShadow: '0 4px 10px rgba(0,0,0,0.25)' }}>
                  {pct(p)}%<br />OFF
                </Box>
              )}
              {mid && (
                <Typography sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'center', color: '#1a1a1a', fontWeight: 800, fontSize: '0.85rem', pt: 0.5 }}>{inr(p.price)}</Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
