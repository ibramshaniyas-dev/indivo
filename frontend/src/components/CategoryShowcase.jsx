import { Box, Typography } from '@mui/material';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import { Link } from 'react-router-dom';
import { catalogImage } from '../utils/images';
import { headingFont } from '../theme';

// Editorial bento tiles. Photos are real product/material shots from our curated catalogue.
const PHOTO_FOR = [
  [/perfume|fragrance/i, 'perfume', 'Royal ouds to fresh colognes'],
  [/fabric/i, 'silk-saree', 'Silk, cotton, linen & more'],
  [/foot/i, 'indian-juttis', 'Juttis, heels & everyday pairs'],
  [/access/i, 'leather-wallet', 'Wallets, belts, watches'],
  [/beauty|care/i, 'body-lotion', 'Skin & hair rituals'],
  [/fashion/i, 'anarkali-dress', 'Ethnic & contemporary wear'],
];

function tileFor(name) {
  const hit = PHOTO_FOR.find(([re]) => re.test(name));
  return hit
    ? { img: catalogImage(hit[1], 960), srcSet: `${catalogImage(hit[1], 480)} 480w, ${catalogImage(hit[1], 960)} 960w`, tagline: hit[2] }
    : { img: null, tagline: 'Explore the collection' };
}

// Grid placement for up to 6 tiles: one hero tile + supporting tiles.
const AREAS = ['a', 'b', 'c', 'd', 'e', 'f'];

export default function CategoryShowcase({ categories }) {
  // Put Fashion first (largest tile) when present.
  const ordered = [...categories].sort((x, y) => (/fashion/i.test(y.name) ? 1 : 0) - (/fashion/i.test(x.name) ? 1 : 0)).slice(0, 6);

  return (
    <Box
      sx={{
        display: 'grid', gap: { xs: 1.5, md: 2 },
        gridTemplateColumns: { xs: '1fr 1fr', md: '1.3fr 1fr 1fr' },
        gridTemplateRows: { xs: 'repeat(4, 180px)', md: 'repeat(2, 260px)' },
        gridTemplateAreas: {
          xs: '"a a" "b c" "d e" "f f"',
          md: '"a b c" "a d e"',
        },
        // The 6th tile only fits on mobile layout; on desktop it is hidden to keep the bento clean.
        '& > :nth-of-type(6)': { display: { xs: 'block', md: 'none' } },
      }}
    >
      {ordered.map((c, i) => {
        const { img, srcSet, tagline } = tileFor(c.name);
        return (
          <Box
            key={c.id}
            component={Link}
            to={`/search?category=${c.id}`}
            sx={{
              gridArea: AREAS[i], position: 'relative', overflow: 'hidden', borderRadius: 3, textDecoration: 'none', color: '#fff',
              bgcolor: 'primary.main', isolation: 'isolate',
              '& .zk-photo': { transition: 'transform 1.2s cubic-bezier(.22,.8,.24,1)' },
              '&:hover .zk-photo': { transform: 'scale(1.07)' },
              '& .zk-arrow': { transition: 'all 0.35s ease' },
              '&:hover .zk-arrow': { bgcolor: 'secondary.main', color: 'primary.main', transform: 'rotate(45deg)' },
            }}
          >
            {img && (
              <Box className="zk-photo" component="img" src={img} srcSet={srcSet} sizes={i === 0 ? '(max-width: 900px) 100vw, 40vw' : '(max-width: 900px) 50vw, 25vw'} alt="" loading="lazy" decoding="async" sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -2 }} />
            )}
            <Box sx={{ position: 'absolute', inset: 0, zIndex: -1, background: 'linear-gradient(180deg, rgba(14,13,11,0) 35%, rgba(14,13,11,0.82) 100%)' }} />
            <Box sx={{ position: 'absolute', left: { xs: 14, md: 22 }, right: { xs: 14, md: 22 }, bottom: { xs: 14, md: 20 }, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1 }}>
              <Box>
                <Typography sx={{ fontSize: '0.6rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'secondary.light', fontWeight: 600, display: { xs: i === 0 ? 'block' : 'none', md: 'block' } }}>
                  {tagline}
                </Typography>
                <Typography sx={{ fontFamily: headingFont, fontSize: { xs: i === 0 ? '1.6rem' : '1.05rem', md: i === 0 ? '2.4rem' : '1.4rem' }, lineHeight: 1.1, mt: 0.5 }}>
                  {c.name}
                </Typography>
              </Box>
              <Box className="zk-arrow" sx={{ width: 36, height: 36, flexShrink: 0, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.5)', display: 'grid', placeItems: 'center' }}>
                <ArrowOutwardRoundedIcon sx={{ fontSize: 18 }} />
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
