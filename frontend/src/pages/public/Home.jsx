import { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import { Link } from 'react-router-dom';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';
import ProductCard from '../../components/ProductCard';
import ProductCardSkeleton from '../../components/ProductCardSkeleton';
import HeroSlider from '../../components/HeroSlider';
import { listProducts } from '../../services/product.service';
import useWishlistToggle from '../../hooks/useWishlistToggle';
import api from '../../services/api';

function ProductGrid({ loading, products, wishlistIds, onToggleWishlist, emptyDescription }) {
  if (loading) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid item xs={6} sm={4} md={2} key={i}><ProductCardSkeleton /></Grid>
        ))}
      </Grid>
    );
  }
  if (products.length === 0) {
    return <EmptyState icon={StorefrontRoundedIcon} title="Nothing here yet" description={emptyDescription} />;
  }
  return (
    <Grid container spacing={2}>
      {products.map((p) => (
        <Grid item xs={6} sm={4} md={2} key={p.id}>
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
      listProducts({ sort: 'newest', limit: 12 }),
      listProducts({ sort: 'rating', limit: 6 }),
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

      <Container maxWidth="xl" sx={{ py: 5 }}>
        <SectionHeader title="Shop by Category" subtitle="Explore our most popular categories" />
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {(loading ? Array.from({ length: 6 }) : categories.slice(0, 12)).map((category, i) => (
            <Grid item xs={6} sm={4} md={2} key={category?.id || i}>
              {category ? (
                <Box
                  component={Link}
                  to={`/search?category=${category.id}`}
                  sx={{
                    aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 1, bgcolor: 'grey.50', borderRadius: 3, textDecoration: 'none',
                    border: '1px solid', borderColor: 'divider', transition: 'all 0.2s ease',
                    backgroundImage: category.image ? `url(${category.image})` : 'none',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    '&:hover': { borderColor: 'secondary.main', boxShadow: '0 8px 24px rgba(22,21,19,0.12)' },
                  }}
                >
                  {!category.image && <StorefrontRoundedIcon sx={{ fontSize: 28, color: 'text.secondary' }} />}
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700, textAlign: 'center', px: 1,
                      color: category.image ? '#fff' : 'text.primary',
                      textShadow: category.image ? '0 1px 4px rgba(0,0,0,0.6)' : 'none',
                    }}
                  >
                    {category.name}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ aspectRatio: '1 / 1', bgcolor: 'grey.100', borderRadius: 3 }} />
              )}
            </Grid>
          ))}
        </Grid>

        <SectionHeader title="Trending Products" subtitle="Popular picks from across INDIVO" actionLabel="View All" actionHref="/search?sort=newest" />
        <Box sx={{ mb: 6 }}>
          <ProductGrid
            loading={loading} products={trending} wishlistIds={wishlistIds} onToggleWishlist={toggle}
            emptyDescription="Sellers are onboarding now — trending products will appear here as soon as listings go live."
          />
        </Box>

        <SectionHeader title="Best Rated" subtitle="Highest-rated products on INDIVO" actionLabel="View All" actionHref="/search?sort=rating" />
        <ProductGrid
          loading={loading} products={bestsellers} wishlistIds={wishlistIds} onToggleWishlist={toggle}
          emptyDescription="Ratings will appear here once customers start reviewing products."
        />
      </Container>
    </Box>
  );
}
