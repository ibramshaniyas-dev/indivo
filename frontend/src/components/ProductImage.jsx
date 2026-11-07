import { useLayoutEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { getCategoryIcon } from './CategoryIcon';
import { realImage, responsiveImage } from '../utils/images';

/**
 * Shows a real product photo sharp and uncropped: rendered as an <img> (not a CSS background, so
 * the browser picks proper resampling) with object-fit: contain on a soft neutral stage, so the
 * whole item is visible regardless of the photo's aspect ratio.
 *
 * If there is no real photo (or it fails to load) it shows a designed placeholder: a gold icon
 * matching the product type (shirt, perfume, watch, fabric…), derived from `alt`/`kind`, so a
 * catalogue without photos still reads clearly instead of a wall of identical tiles.
 */
export default function ProductImage({
  src, alt = '', kind, ratio = '1 / 1', fit = 'contain', rounded = 0, placeholderLabel = true, eager = false, sx, imgSx,
  sizes = '(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 320px',
}) {
  const url = realImage(src);
  // Load/error state is keyed by URL (no reset effect): a reset that runs after a cached image
  // has already fired `load` would otherwise leave the photo stuck behind the blur preview.
  const [loadedSrc, setLoadedSrc] = useState(null);
  const [fallbackFor, setFallbackFor] = useState(null);
  const [failedFor, setFailedFor] = useState(null);
  const imgRef = useRef(null);

  const responsive = responsiveImage(url);
  const useFallback = fallbackFor === url;
  const failed = failedFor === url;
  const showImage = url && !failed;
  const imgSrc = useFallback ? responsive.fallback : responsive.src;
  const imgSrcSet = useFallback ? undefined : responsive.srcSet;
  const loaded = loadedSrc === imgSrc;

  // If a WebP variant is missing, fall back once to the original JPEG before giving up.
  const handleError = () => (responsive.fallback && !useFallback ? setFallbackFor(url) : setFailedFor(url));

  // Cached images can finish before React attaches onLoad — detect that directly.
  useLayoutEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoadedSrc(imgSrc);
  }, [imgSrc]);
  const Icon = getCategoryIcon(`${kind || ''} ${alt || ''}`);

  return (
    <Box
      sx={{
        position: 'relative', aspectRatio: ratio, width: '100%', overflow: 'hidden', borderRadius: rounded,
        bgcolor: '#FFFFFF', backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #F6F1E5 100%)', ...sx,
      }}
    >
      {showImage && responsive.placeholder && !loaded && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute', inset: '-6%', backgroundImage: `url(${responsive.placeholder})`,
            backgroundSize: fit === 'cover' ? 'cover' : 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
            filter: 'blur(14px) saturate(1.1)', transform: 'scale(1.04)',
          }}
        />
      )}
      {showImage ? (
        <Box
          component="img"
          ref={imgRef}
          key={imgSrc}
          src={imgSrc}
          srcSet={imgSrcSet}
          sizes={sizes}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          fetchpriority={eager ? 'high' : undefined}
          decoding="async"
          onLoad={() => setLoadedSrc(imgSrc)}
          onError={handleError}
          sx={{
            // Always visible and above the blur preview, so the photo can never stay hidden;
            // the preview is simply removed once the photo has loaded.
            position: 'absolute', inset: 0, zIndex: 1, width: '100%', height: '100%', objectFit: fit,
            p: fit === 'contain' ? '5%' : 0,
            ...imgSx,
          }}
        />
      ) : (
        <Box
          sx={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6%',
            backgroundImage: 'radial-gradient(circle at 50% 42%, rgba(201,160,74,0.16) 0%, rgba(201,160,74,0) 58%)',
          }}
        >
          <Box
            sx={{
              width: '42%', aspectRatio: '1 / 1', borderRadius: '50%', display: 'grid', placeItems: 'center',
              border: '1px solid rgba(201,160,74,0.45)', bgcolor: 'rgba(255,255,255,0.7)',
              boxShadow: 'inset 0 0 0 6px rgba(255,255,255,0.9), 0 10px 24px rgba(154,114,40,0.10)',
            }}
          >
            <Icon sx={{ width: '52%', height: '52%', color: 'secondary.dark' }} />
          </Box>
          {placeholderLabel && (
            <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.22em', textTransform: 'uppercase', fontSize: '0.58rem', fontWeight: 600 }}>
              Photo coming soon
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
