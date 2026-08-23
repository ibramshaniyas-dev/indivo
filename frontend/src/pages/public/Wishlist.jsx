import { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, CircularProgress } from '@mui/material';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import { getWishlist, removeFromWishlist } from '../../services/wishlist.service';
import { setWishlist, toggleWishlistId } from '../../store/slices/wishlistSlice';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    getWishlist()
      .then((data) => {
        setItems(data);
        dispatch(setWishlist(data));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (product) => {
    setItems((prev) => prev.filter((p) => p.id !== product.id));
    dispatch(toggleWishlistId(product.id));
    await removeFromWishlist(product.id);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>My Wishlist</Typography>
      {items.length === 0 ? (
        <EmptyState
          icon={FavoriteBorderRoundedIcon}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here for later."
          actionLabel="Browse Products"
          onAction={() => navigate('/search')}
        />
      ) : (
        <Grid container spacing={2}>
          {items.map((p) => (
            <Grid item xs={6} sm={4} md={2} key={p.id}>
              <ProductCard product={p} wishlisted onToggleWishlist={() => handleRemove(p)} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
