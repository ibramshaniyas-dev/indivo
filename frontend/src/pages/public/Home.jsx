import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';

export default function Home() {
  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #121F42 0%, #26355F 100%)',
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
        <EmptyState
          icon={StorefrontRoundedIcon}
          title="Catalog coming soon"
          description="Sellers are onboarding now — trending products will appear here as soon as listings go live."
        />
      </Container>
    </Box>
  );
}
