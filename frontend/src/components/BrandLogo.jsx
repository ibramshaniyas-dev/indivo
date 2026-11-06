import { useId } from 'react';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { BRAND } from '../brand';

/**
 * The SEESHAA "S" monogram: two polished-gold bars with rounded outer ends, joined by a gently
 * twisted ribbon — a geometric S in the same gold-ribbon style as the brand artwork.
 */
export function BrandMark({ size = 40, sx }) {
  const id = useId().replace(/:/g, '');
  return (
    <Box component="svg" viewBox="0 0 100 100" role="img" aria-label={BRAND.name} sx={{ width: size, height: size, flexShrink: 0, display: 'block', ...sx }}>
      <defs>
        <linearGradient id={`${id}-bar`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7A5517" />
          <stop offset="0.45" stopColor="#E9C46A" />
          <stop offset="0.7" stopColor="#FBE7A6" />
          <stop offset="1" stopColor="#B8862F" />
        </linearGradient>
        <linearGradient id={`${id}-ribbon`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#B8862F" />
          <stop offset="0.5" stopColor="#F3D98B" />
          <stop offset="1" stopColor="#8A6220" />
        </linearGradient>
      </defs>
      <path d="M92 10 H42 C22 10 10 21 10 38 H32 C32 31 37 26 46 26 H80 Z" fill={`url(#${id}-bar)`} />
      <path d="M10 38 H32 C52 44 72 52 90 62 H68 C50 56 28 48 10 38 Z" fill={`url(#${id}-ribbon)`} />
      <path d="M8 90 H58 C78 90 90 79 90 62 H68 C68 69 63 74 54 74 H20 Z" fill={`url(#${id}-bar)`} />
    </Box>
  );
}

/**
 * Full lockup: monogram + wordmark (+ optional tagline). `tone="light"` is for dark backgrounds.
 * Renders as a home link unless `to={null}`.
 */
export default function BrandLogo({ size = 'medium', tone = 'dark', showTagline = false, to = '/', sx }) {
  const dims = { small: { mark: 28, text: '1.15rem' }, medium: { mark: 36, text: '1.5rem' }, large: { mark: 64, text: '2.4rem' } }[size];
  const content = (
    <>
      <BrandMark size={dims.mark} />
      <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <Typography
          component="span"
          sx={{
            fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: dims.text, letterSpacing: '0.14em',
            lineHeight: 1, color: tone === 'light' ? '#FFFFFF' : '#0E0D0B',
          }}
        >
          {BRAND.name}
        </Typography>
        {showTagline && (
          <Typography
            component="span"
            sx={{
              mt: 0.6, fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.32em', textTransform: 'uppercase',
              color: tone === 'light' ? 'secondary.light' : 'text.secondary', whiteSpace: 'nowrap',
            }}
          >
            {BRAND.tagline}
          </Typography>
        )}
      </Box>
    </>
  );

  const baseSx = { display: 'inline-flex', alignItems: 'center', gap: 1.25, textDecoration: 'none', flexShrink: 0, ...sx };
  if (to === null) return <Box sx={baseSx}>{content}</Box>;
  return <Box component={Link} to={to} aria-label={`${BRAND.name} home`} sx={baseSx}>{content}</Box>;
}
