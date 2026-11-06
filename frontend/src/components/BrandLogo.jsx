import { useId } from 'react';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { BRAND } from '../brand';

/** The ZARKIZ "Z" monogram: two gold bars joined by a gently twisted ribbon, as in the logo. */
export function ZMark({ size = 40, sx }) {
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
      <path d="M8 10 H92 L84 24 H20 Z" fill={`url(#${id}-bar)`} />
      <path d="M70 24 H88 C68 42 46 60 30 76 H12 C30 58 52 40 70 24 Z" fill={`url(#${id}-ribbon)`} />
      <path d="M12 76 H80 L92 90 H8 Z" fill={`url(#${id}-bar)`} />
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
      <ZMark size={dims.mark} />
      <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <Typography
          component="span"
          sx={{
            fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: dims.text, letterSpacing: '0.14em',
            lineHeight: 1, color: tone === 'light' ? '#FFFFFF' : 'primary.main',
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
