import { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';
import ProductCard from '../../components/ProductCard';
import ProductCardSkeleton from '../../components/ProductCardSkeleton';
import { listProducts } from '../../services/product.service';

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProducts({ sort: 'newest', limit: 12 })
      .then((res) => setTrending(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #161513 0%, #332F28 100%)',
          color: '#fff', py: { xs: 6, md: 10 },
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="h3" sx={{ maxWidth: 560, mb: 2 }}>
            Shop from thousands of trusted sellers, all in one place.
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 480, opacity: 0.85 }}>
            INDIVO connects you directly with independent businesses across India — fashion,
            electronics, home essentials and more.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 5 }}>
        <SectionHeader title="Shop by Category" subtitle="Explore our most popular categories" />
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Paper
                variant="outlined"
                sx={{
                  aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: 'grey.50', borderRadius: 3,
                }}
              >
                <StorefrontRoundedIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
              </Paper>
            </Grid>
          ))}
        </Grid>

        <SectionHeader title="Trending Products" subtitle="Popular picks from across INDIVO" />
        {loading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={6} sm={4} md={2} key={i}><ProductCardSkeleton /></Grid>
            ))}
          </Grid>
        ) : trending.length === 0 ? (
          <EmptyState
            icon={StorefrontRoundedIcon}
            title="Catalog coming soon"
            description="Sellers are onboarding now — trending products will appear here as soon as listings go live."
          />
        ) : (
          <Grid container spacing={2}>
            {trending.map((p) => (
              <Grid item xs={6} sm={4} md={2} key={p.id}><ProductCard product={p} /></Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
