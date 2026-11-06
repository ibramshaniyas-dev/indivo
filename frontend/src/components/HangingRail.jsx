import { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, IconButton, Skeleton } from '@mui/material';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import { listProducts } from '../services/product.service';
import { goldGradient, headingFont } from '../theme';

const ITEM_W = { xs: 190, md: 250 };

function formatINR(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN')}`;
}

/** Wire hanger + hook, drawn in SVG so it stays crisp; sits on the rail above each product. */
function Hanger() {
  return (
    <Box component="svg" viewBox="0 0 120 60" aria-hidden sx={{ width: '62%', display: 'block', mx: 'auto', overflow: 'visible' }}>
      <path d="M60 2 C52 2 50 10 56 14 C60 17 60 20 60 24" fill="none" stroke="#3A342B" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M60 24 L8 52 Q4 55 9 56 L111 56 Q116 55 112 52 Z" fill="none" stroke="#3A342B" strokeWidth="2.6" strokeLinejoin="round" />
    </Box>
  );
}

/**
 * "On the rail" showcase: products hang from a metal clothes rail with swinging price tags.
 * Drag, swipe or use the arrows to move along the rail; tabs switch category. Product photos
 * are blended (multiply) into the backdrop so white-background shots read as cut-outs.
 */
export default function HangingRail({ tabs, eyebrow = 'New Collection', titleStart = 'Pieces that', titleEnd = 'hang just right.' }) {
  const [active, setActive] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const trackRef = useRef(null);
  const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listProducts({ category: tabs[active].categoryId, sort: 'newest', limit: 14 })
      .then((res) => { if (alive) setItems(res.data || []); })
      .catch(() => { if (alive) setItems([]); })
      .finally(() => { if (alive) setLoading(false); });
    if (trackRef.current) trackRef.current.scrollTo({ left: 0 });
    return () => { alive = false; };
  }, [active, tabs]);

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  };

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  // Mouse drag-to-scroll (touch devices already scroll natively).
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse') return;
    drag.current = { down: true, startX: e.clientX, startScroll: trackRef.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e) => {
    if (!drag.current.down) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    trackRef.current.scrollLeft = drag.current.startScroll - dx;
  };
  const endDrag = () => { drag.current.down = false; };
  const swallowClickAfterDrag = (e) => {
    if (drag.current.moved) { e.preventDefault(); drag.current.moved = false; }
  };

  const navBtnSx = { border: '1px solid', borderColor: 'divider', bgcolor: '#fff', '&:hover': { borderColor: 'secondary.main', bgcolor: '#fff' } };

  return (
    <Box component="section" sx={{ bgcolor: '#F7F5F0', py: { xs: 6, md: 9 }, overflow: 'hidden' }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 5 } }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontSize: '0.64rem' }}>
            {eyebrow} <Box component="span" sx={{ color: 'secondary.dark', mx: 1 }}>|</Box> Curated by ZARKIZ
          </Typography>
          <Typography
            component="h2"
            sx={{ fontFamily: headingFont, fontWeight: 500, fontSize: { xs: '2rem', md: '3.6rem' }, lineHeight: 1.05, letterSpacing: '-0.01em', mt: 1 }}
          >
            {titleStart}{' '}
            <Box component="span" sx={{ color: 'rgba(22,20,15,0.38)' }}>{titleEnd}</Box>
          </Typography>
        </Box>

        <Box role="tablist" aria-label="Rail category" sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 3, md: 4 } }}>
          <Box sx={{ display: 'inline-flex', gap: 0.5, p: 0.5, bgcolor: '#fff', borderRadius: 999, border: '1px solid', borderColor: 'divider', overflowX: 'auto', maxWidth: '100%', scrollbarWidth: 'none' }}>
            {tabs.map((t, i) => (
              <Box
                key={t.label}
                component="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                sx={{
                  border: 0, cursor: 'pointer', borderRadius: 999, px: { xs: 1.75, md: 2.5 }, py: 0.9, flexShrink: 0,
                  font: 'inherit', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.04em',
                  bgcolor: i === active ? 'primary.main' : 'transparent', color: i === active ? 'secondary.light' : 'text.secondary',
                  transition: 'all 0.2s ease', '&:hover': { color: i === active ? 'secondary.light' : 'text.primary' },
                }}
              >
                {t.label}
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      <Box sx={{ position: 'relative' }}>
        {/* The rail itself: brushed-metal bar with gold end caps. */}
        <Box sx={{ position: 'absolute', left: 0, right: 0, top: 10, height: 7, zIndex: 0, background: 'linear-gradient(180deg, #E9E6E0 0%, #B9B3A8 45%, #8E877B 55%, #D7D2C9 100%)', boxShadow: '0 4px 10px rgba(0,0,0,0.12)' }} />

        <Box
          ref={trackRef}
          onScroll={onScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          sx={{
            position: 'relative', zIndex: 1, display: 'flex', gap: { xs: 2, md: 4 }, overflowX: 'auto', scrollSnapType: 'x proximity',
            px: { xs: 2, md: 'max(24px, calc((100vw - 1536px) / 2 + 24px))' }, pb: 2, cursor: 'grab', userSelect: 'none',
            scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, '&:active': { cursor: 'grabbing' },
          }}
        >
          {(loading ? Array.from({ length: 6 }) : items).map((p, i) => (
            <Box key={p?.id || i} sx={{ width: ITEM_W, flexShrink: 0, scrollSnapAlign: 'start' }}>
              {p ? (
                <Box
                  component={Link}
                  to={`/product/${p.slug}`}
                  onClick={swallowClickAfterDrag}
                  draggable={false}
                  aria-label={`${p.name}, ${formatINR(p.price)}`}
                  sx={{
                    display: 'block', textDecoration: 'none', color: 'inherit', transformOrigin: '50% 4px',
                    '@media (prefers-reduced-motion: no-preference)': {
                      '&:hover, &:focus-visible': { animation: 'zkSway 1.6s ease-in-out' },
                    },
                    '@keyframes zkSway': {
                      '0%': { transform: 'rotate(0deg)' }, '20%': { transform: 'rotate(3deg)' }, '45%': { transform: 'rotate(-2.2deg)' },
                      '70%': { transform: 'rotate(1.2deg)' }, '100%': { transform: 'rotate(0deg)' },
                    },
                    '&:hover .zk-name': { color: 'secondary.dark' },
                  }}
                >
                  <Hanger />
                  <Box sx={{ position: 'relative', mt: '-6px' }}>
                    <ProductImage
                      src={p.image} alt={p.name} ratio="3 / 4" placeholderLabel={false}
                      sx={{ bgcolor: 'transparent', backgroundImage: 'none', '& img': { mixBlendMode: 'multiply', p: '2%' } }}
                    />
                    {/* Swing tag */}
                    <Box sx={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                      <Box sx={{ width: '1px', height: 10, bgcolor: '#8E877B' }} />
                      <Box sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: '3px', px: 0.9, py: 0.3, boxShadow: '0 2px 6px rgba(0,0,0,0.08)', transform: 'rotate(-4deg)' }}>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{formatINR(p.price)}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'center', mt: 1.5, px: 1 }}>
                    {p.brandName && <Typography sx={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'text.secondary', fontWeight: 600 }}>{p.brandName}</Typography>}
                    <Typography className="zk-name" noWrap sx={{ fontSize: '0.88rem', fontWeight: 500, transition: 'color 0.2s ease' }}>{p.name}</Typography>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ pt: 3 }}>
                  <Skeleton variant="rounded" sx={{ aspectRatio: '3 / 4', height: 'auto', bgcolor: 'rgba(0,0,0,0.05)' }} />
                </Box>
              )}
            </Box>
          ))}
          {!loading && items.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 10, mx: 'auto' }}>New pieces are on their way.</Typography>
          )}
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 3 }}>
        <IconButton size="small" aria-label="Scroll rail left" onClick={() => scrollBy(-1)} sx={navBtnSx}><ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} /></IconButton>
        <Box sx={{ width: { xs: 120, md: 180 }, height: 2, bgcolor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${Math.max(12, progress * 100)}%`, backgroundImage: goldGradient, transition: 'width 0.15s linear' }} />
        </Box>
        <IconButton size="small" aria-label="Scroll rail right" onClick={() => scrollBy(1)} sx={navBtnSx}><ArrowForwardIosRoundedIcon sx={{ fontSize: 14 }} /></IconButton>
      </Container>
    </Box>
  );
}
