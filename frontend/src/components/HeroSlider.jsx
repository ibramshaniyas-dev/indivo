import { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, Button, IconButton } from '@mui/material';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { Link } from 'react-router-dom';

const AUTO_ADVANCE_MS = 5000;

/** Dynamic homepage hero carousel, driven by the `banners` table via /cms/banners — admin can
 *  add/reorder/retire slides without a code change. Falls back to a static message if none exist. */
export default function HeroSlider({ banners }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (banners.length <= 1) return undefined;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % banners.length), AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, [banners.length]);

  const goTo = (next) => {
    clearInterval(timerRef.current);
    setIndex(next);
  };

  if (banners.length === 0) {
    return (
      <Box sx={{ background: 'linear-gradient(135deg, #161513 0%, #332F28 100%)', color: '#fff', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="xl">
          <Typography variant="h3" sx={{ maxWidth: 560, mb: 2 }}>
            Shop from thousands of trusted sellers, all in one place.
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 480, opacity: 0.85, mb: 3 }}>
            INDIVO connects you directly with independent businesses across India.
          </Typography>
          <Button component={Link} to="/search" variant="contained" color="secondary" size="large">Shop Now</Button>
        </Container>
      </Box>
    );
  }

  const banner = banners[index];

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', height: { xs: 320, md: 440 } }}>
      {banners.map((b, i) => (
        <Box
          key={b.id}
          sx={{
            position: 'absolute', inset: 0, opacity: i === index ? 1 : 0, transition: 'opacity 0.6s ease',
            backgroundImage: `linear-gradient(90deg, rgba(22,21,19,0.75) 0%, rgba(22,21,19,0.25) 60%), url(${b.image})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        />
      ))}

      <Container maxWidth="xl" sx={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ color: '#fff', maxWidth: 560 }}>
          <Typography variant="h3" sx={{ mb: 2, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>{banner.title}</Typography>
          <Button component={Link} to={banner.link || '/search'} variant="contained" color="secondary" size="large">
            Shop Now
          </Button>
        </Box>
      </Container>

      {banners.length > 1 && (
        <>
          <IconButton
            onClick={() => goTo((index - 1 + banners.length) % banners.length)}
            sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
          >
            <ArrowBackIosNewRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => goTo((index + 1) % banners.length)}
            sx={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
          >
            <ArrowForwardIosRoundedIcon fontSize="small" />
          </IconButton>
          <Box sx={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 1 }}>
            {banners.map((b, i) => (
              <Box
                key={b.id}
                onClick={() => goTo(i)}
                sx={{
                  width: i === index ? 20 : 8, height: 8, borderRadius: 4, cursor: 'pointer',
                  bgcolor: i === index ? 'secondary.main' : 'rgba(255,255,255,0.5)', transition: 'width 0.2s ease',
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
