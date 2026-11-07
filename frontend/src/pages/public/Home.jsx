import { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Skeleton, Button } from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import { Link } from 'react-router-dom';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';
import ProductCard from '../../components/ProductCard';
import ProductCardSkeleton from '../../components/ProductCardSkeleton';
import HeroSlider from '../../components/HeroSlider';
import RampSlide from '../../components/RampSlide';
import HangingRail from '../../components/HangingRail';
import CategoryShowcase from '../../components/CategoryShowcase';
import Marquee from '../../components/Marquee';
import HomeDemoShelf from '../../components/homeDemo/HomeDemoShelf';
import Reveal from '../../components/Reveal';

const TICKER = ['Pure Silk', 'Handloom Cotton', 'Royal Oud', 'Embroidered Juttis', 'Linen', 'Attar', 'Verified Sellers', 'Pan-India Delivery'];
import { listProducts } from '../../services/product.service';
import useWishlistToggle from '../../hooks/useWishlistToggle';
import api from '../../services/api';
import { BRAND } from '../../brand';
import { champagne } from '../../theme';

// Top-level category ids from /categories (the API filter includes subcategories).
// Defined at module level so the rail doesn't refetch on every render.
const RAIL_TABS = [
  { label: 'Fashion', categoryId: 1 },
  { label: 'Fabrics', categoryId: 2 },
  { label: 'Accessories', categoryId: 5 },
  { label: 'Footwear', categoryId: 6 },
];

const PROMISES = [
  { icon: VerifiedOutlinedIcon, title: 'Verified Sellers', text: 'Every seller is reviewed before listing' },
  { icon: LocalShippingOutlinedIcon, title: 'Tracked Delivery', text: 'Live shipment status on every order' },
  { icon: LockOutlinedIcon, title: 'Secure Payments', text: 'Protected checkout, every time' },
  { icon: ReplayRoundedIcon, title: 'Easy Returns', text: 'Simple returns on eligible items' },
];

function ProductGrid({ loading, products, wishlistIds, onToggleWishlist, emptyDescription }) {
  if (loading) {
    return (
      <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Grid item xs={6} sm={4} md={3} key={i}><ProductCardSkeleton /></Grid>
        ))}
      </Grid>
    );
  }
  if (products.length === 0) {
    return <EmptyState icon={StorefrontRoundedIcon} title="Nothing here yet" description={emptyDescription} />;
  }
  return (
    <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
      {products.map((p) => (
        <Grid item xs={6} sm={4} md={3} key={p.id}>
          <ProductCard product={p} wishlisted={wishlistIds.includes(p.id)} onToggleWishlist={() => onToggleWishlist(p)} />
        </Grid>
      ))}
    </Grid>
  );
}

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { wishlistIds, toggle } = useWishlistToggle();

  useEffect(() => {
    Promise.all([
      api.get('/categories', { params: { parentId: 'null' } }),
      listProducts({ sort: 'newest', limit: 10 }),
      listProducts({ sort: 'rating', limit: 8 }),
      api.get('/cms/banners'),
    ])
      .then(([categoryRes, trendingRes, bestsellerRes, bannerRes]) => {
        setCategories(categoryRes.data.data);
        setTrending(trendingRes.data);
        setBestsellers(bestsellerRes.data);
        setBanners(bannerRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <HeroSlider banners={banners} products={trending} />

      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: { xs: 2, md: 3 }, py: 3 }}>
            {PROMISES.map(({ icon: Icon, title, text }) => (
              <Box key={title} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid', borderColor: 'secondary.main', display: 'grid', placeItems: 'center', color: 'secondary.dark', flexShrink: 0 }}>
                  <Icon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ lineHeight: 1.3 }}>{title}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{text}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Marquee items={TICKER} />

      <HomeDemoShelf wishlistIds={wishlistIds} onToggleWishlist={toggle} />

      <Reveal><RampSlide products={trending} loading={loading} /></Reveal>

      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 9 } }}>
        <Reveal>
          <SectionHeader eyebrow="Explore" title="Shop by Category" actionLabel="View All" actionHref="/search" />
          {loading ? (
            <Skeleton variant="rounded" sx={{ height: { xs: 760, md: 536 }, borderRadius: 3 }} />
          ) : (
            <CategoryShowcase categories={categories} />
          )}
        </Reveal>
      </Container>

      <Reveal><HangingRail tabs={RAIL_TABS} /></Reveal>

      <Box sx={{ background: champagne, color: 'text.primary', py: { xs: 6, md: 8 }, textAlign: 'center', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'rgba(154,114,40,0.2)' }}>
        <Container maxWidth="md" component={Reveal}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontSize: '0.7rem' }}>Sell on {BRAND.name}</Typography>
          <Typography variant="h3" sx={{ fontSize: { xs: '1.8rem', md: '2.6rem' }, my: 1.5 }}>Bring your craft to customers across India</Typography>
          <Typography sx={{ color: 'text.secondary', mb: 3.5, maxWidth: 520, mx: 'auto' }}>
            List your products, manage orders and ship with integrated tracking — all from one seller dashboard.
          </Typography>
          <Button component={Link} to="/sell" variant="contained" size="large">Become a Seller</Button>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 8 } }} component={Reveal}>
        <SectionHeader eyebrow="Customer Favourites" title="Best Rated" subtitle={`Highest-rated products on ${BRAND.name}`} actionLabel="View All" actionHref="/search?sort=rating" />
        <ProductGrid
          loading={loading} products={bestsellers} wishlistIds={wishlistIds} onToggleWishlist={toggle}
          emptyDescription="Ratings will appear here once customers start reviewing products."
        />
      </Container>
    </Box>
  );
}
