import { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Chip, CircularProgress } from '@mui/material';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import { useParams } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import ProductCardSkeleton from '../../components/ProductCardSkeleton';
import EmptyState from '../../components/EmptyState';
import RatingStars from '../../components/RatingStars';
import { getSellerStore } from '../../services/sellerStore.service';
import { listProducts } from '../../services/product.service';
import useWishlistToggle from '../../hooks/useWishlistToggle';

export default function SellerStore() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { wishlistIds, toggle } = useWishlistToggle();

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    Promise.all([getSellerStore(id), listProducts({ seller: id, limit: 60 })])
      .then(([sellerData, productRes]) => {
        setSeller(sellerData);
        setProducts(productRes.data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  if (notFound || !seller) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <EmptyState icon={StorefrontRoundedIcon} title="Store not found" description="This seller isn't available right now." />
      </Container>
    );
  }

  return (
    <Box>
      <Box sx={{ background: 'linear-gradient(135deg, #161513 0%, #332F28 100%)', color: '#fff', py: 5 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <StorefrontRoundedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4">{seller.display_name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                {seller.business_category && <Chip size="small" label={seller.business_category} sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />}
                {seller.city && (
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.85 }}>
                    <PlaceRoundedIcon fontSize="small" /> {seller.city}, {seller.state}
                  </Typography>
                )}
                <RatingStars rating={seller.rating} reviewCount={undefined} showCount={false} />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{seller.productCount} Products</Typography>
        {loading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => <Grid item xs={6} sm={4} md={2} key={i}><ProductCardSkeleton /></Grid>)}
          </Grid>
        ) : products.length === 0 ? (
          <EmptyState icon={StorefrontRoundedIcon} title="No products yet" description="This seller hasn't listed any products yet." />
        ) : (
          <Grid container spacing={2}>
            {products.map((p) => (
              <Grid item xs={6} sm={4} md={2} key={p.id}>
                <ProductCard product={p} wishlisted={wishlistIds.includes(p.id)} onToggleWishlist={() => toggle(p)} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
