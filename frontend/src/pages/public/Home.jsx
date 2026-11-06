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
import CategoryIcon from '../../components/CategoryIcon';
import { listProducts } from '../../services/product.service';
import useWishlistToggle from '../../hooks/useWishlistToggle';
import api from '../../services/api';
import { BRAND } from '../../brand';

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
      <HeroSlider banners={banners} />

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

      <RampSlide products={trending} loading={loading} />

      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 8 } }}>
        <SectionHeader eyebrow="Explore" title="Shop by Category" />
        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          {(loading ? Array.from({ length: 6 }) : categories.slice(0, 12)).map((category, i) => (
            <Grid item xs={4} sm={3} md={2} key={category?.id || i}>
              {category ? (
                <Box
                  component={Link}
                  to={`/search?category=${category.id}`}
                  sx={{
                    aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 1.25, bgcolor: '#fff', borderRadius: 3, textDecoration: 'none', color: 'text.primary', px: 1,
                    border: '1px solid', borderColor: 'divider', transition: 'all 0.25s ease',
                    '& .cat-icon': { transition: 'all 0.25s ease' },
                    '&:hover': { borderColor: 'secondary.main', bgcolor: 'primary.main', color: '#fff', transform: 'translateY(-3px)' },
                    '&:hover .cat-icon': { color: 'secondary.light', borderColor: 'rgba(243,217,139,0.5)' },
                  }}
                >
                  <Box className="cat-icon" sx={{ width: { xs: 44, md: 56 }, height: { xs: 44, md: 56 }, borderRadius: '50%', border: '1px solid', borderColor: 'divider', display: 'grid', placeItems: 'center', color: 'secondary.dark' }}>
                    <CategoryIcon name={category.name} sx={{ fontSize: { xs: 22, md: 26 } }} />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center', letterSpacing: '0.04em', lineHeight: 1.3 }}>
                    {category.name}
                  </Typography>
                </Box>
              ) : (
                <Skeleton variant="rounded" sx={{ aspectRatio: '1 / 1', height: 'auto', borderRadius: 3 }} />
              )}
            </Grid>
          ))}
        </Grid>

      </Container>

      <HangingRail tabs={RAIL_TABS} />

      <Box sx={{ bgcolor: 'primary.main', color: '#fff', py: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="overline" sx={{ color: 'secondary.light', fontSize: '0.7rem' }}>Sell on {BRAND.name}</Typography>
          <Typography variant="h3" sx={{ fontSize: { xs: '1.8rem', md: '2.6rem' }, my: 1.5 }}>Bring your craft to customers across India</Typography>
          <Typography sx={{ opacity: 0.7, mb: 3.5, maxWidth: 520, mx: 'auto' }}>
            List your products, manage orders and ship with integrated tracking — all from one seller dashboard.
          </Typography>
          <Button component={Link} to="/sell" variant="contained" color="secondary" size="large">Become a Seller</Button>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 8 } }}>
        <SectionHeader eyebrow="Customer Favourites" title="Best Rated" subtitle={`Highest-rated products on ${BRAND.name}`} actionLabel="View All" actionHref="/search?sort=rating" />
        <ProductGrid
          loading={loading} products={bestsellers} wishlistIds={wishlistIds} onToggleWishlist={toggle}
          emptyDescription="Ratings will appear here once customers start reviewing products."
        />
      </Container>
    </Box>
  );
}
