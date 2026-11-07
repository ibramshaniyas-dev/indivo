import { Box, Container, Typography, Grid, Chip } from '@mui/material';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import useHomeDemo from '../../hooks/useHomeDemo';
import ProductCard from '../ProductCard';
import SectionHeader from '../SectionHeader';

/** Homepage shelf, shown only when the shopper is inside a home-demo location. */
export default function HomeDemoShelf({ wishlistIds = [], onToggleWishlist }) {
  const { zone, products } = useHomeDemo();
  if (!zone || products.length === 0) return null;
  return (
    <Box sx={{ background: 'linear-gradient(135deg, #FDF8EC 0%, #F6E9C6 100%)', borderBottom: '1px solid rgba(154,114,40,0.2)', py: { xs: 4, md: 6 } }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip icon={<BoltRoundedIcon />} label={`Near you · ${zone.name}`} color="secondary" size="small" />
        </Box>
        <SectionHeader
          eyebrow="Try before you buy"
          title={`Home demo within ${zone.slaMinutes} minutes`}
          subtitle="Our executive brings the piece to your home. Love it? Pay right there."
        />
        <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
          {products.slice(0, 8).map((p) => (
            <Grid item xs={6} sm={4} md={3} key={p.id}>
              <ProductCard product={p} wishlisted={wishlistIds.includes(p.id)} onToggleWishlist={() => onToggleWishlist?.(p)} />
            </Grid>
          ))}
        </Grid>
        {products.length === 0 && <Typography color="text.secondary">Demo pieces are on their way to this area.</Typography>}
      </Container>
    </Box>
  );
}
