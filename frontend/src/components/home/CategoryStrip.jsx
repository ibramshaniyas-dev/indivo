import { Box, Typography, Skeleton } from '@mui/material';
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import { Link } from 'react-router-dom';
import { catalogImage } from '../../utils/images';
import { OFFER_RED } from '../ProductCard';

// Representative real product photo per top-level category.
const PHOTO = [
  [/perfume|fragrance/i, 'perfume'], [/fabric/i, 'silk-saree'], [/foot/i, 'indian-juttis'],
  [/access/i, 'leather-wallet'], [/beauty|care/i, 'body-lotion'], [/fashion/i, 'anarkali-dress'],
];
const photoFor = (name) => PHOTO.find(([re]) => re.test(name))?.[1];

function Circle({ to, img, icon, label, sub, highlight }) {
  // In-page anchors ("#...") need a plain <a> so the browser scrolls to them.
  const linkProps = to.startsWith('#') ? { component: 'a', href: to } : { component: Link, to };
  return (
    <Box {...linkProps} sx={{ textDecoration: 'none', color: 'text.primary', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, width: { xs: 74, md: 92 }, flexShrink: 0 }}>
      <Box
        sx={{
          width: { xs: 64, md: 76 }, height: { xs: 64, md: 76 }, borderRadius: '50%', overflow: 'hidden', display: 'grid', placeItems: 'center',
          border: '2px solid', borderColor: highlight ? OFFER_RED : 'rgba(168,106,0,0.45)', bgcolor: highlight ? '#FFF1F0' : '#FBF5E8',
          transition: 'transform 0.2s ease', '&:hover': { transform: 'scale(1.06)' },
        }}
      >
        {img ? <Box component="img" src={img} alt="" loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : icon}
      </Box>
      <Typography sx={{ fontSize: { xs: '0.68rem', md: '0.76rem' }, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>{label}</Typography>
      {sub && <Typography sx={{ fontSize: '0.62rem', color: highlight ? OFFER_RED : 'success.main', fontWeight: 700, lineHeight: 1 }}>{sub}</Typography>}
    </Box>
  );
}

/** Top-of-page category shortcuts with real "up to X% off" per category. */
export default function CategoryStrip({ categories, stats = {}, hasHomeDemo, loading }) {
  return (
    <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', gap: { xs: 1, md: 2.5 }, overflowX: 'auto', px: { xs: 1.5, md: 3 }, py: 1.5, justifyContent: { lg: 'center' }, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        <Circle to="/search?sort=discount" icon={<LocalOfferRoundedIcon sx={{ color: OFFER_RED, fontSize: 32 }} />} label="Top Offers" sub={stats.maxDiscount ? `Up to ${stats.maxDiscount}%` : null} highlight />
        {hasHomeDemo && <Circle to="#home-demo" icon={<BoltRoundedIcon sx={{ color: 'secondary.dark', fontSize: 32 }} />} label="Home Demo" sub="in 1 hour" />}
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="circular" width={76} height={76} sx={{ flexShrink: 0 }} />)
          : categories.map((c) => {
            const s = stats.byCategory?.[c.id];
            const kw = photoFor(c.name);
            return (
              <Circle
                key={c.id}
                to={`/search?category=${c.id}`}
                img={kw ? catalogImage(kw, 480) : null}
                label={c.name.replace(' & ', ' & ')}
                sub={s?.maxDiscount ? `Up to ${s.maxDiscount}% off` : s?.from ? `From ₹${s.from}` : null}
              />
            );
          })}
        <Circle to="/search?maxPrice=999&sort=discount" icon={<Typography sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.95rem' }}>₹999</Typography>} label="Under ₹999" sub="Budget buys" />
      </Box>
    </Box>
  );
}
