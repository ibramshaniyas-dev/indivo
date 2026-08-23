import { useEffect, useState } from 'react';
import {
  Box, Container, Grid, Typography, Button, Chip, Divider, Tabs, Tab, IconButton, CircularProgress, Alert, Snackbar,
} from '@mui/material';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import RatingStars from '../../components/RatingStars';
import PriceTag from '../../components/PriceTag';
import SectionHeader from '../../components/SectionHeader';
import ProductCard from '../../components/ProductCard';
import { getProductBySlug, listProducts } from '../../services/product.service';
import { addToCart } from '../../services/cart.service';
import { setCart } from '../../store/slices/cartSlice';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [cartError, setCartError] = useState('');
  const [cartMessage, setCartMessage] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState(0);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getProductBySlug(slug).then((data) => {
      setProduct(data);
      setSelectedVariant(data.variants?.[0] || null);
      setActiveImage(0);
      setLoading(false);
      if (data.category_id) {
        listProducts({ category: data.category_id, limit: 8 }).then((res) =>
          setRelated(res.data.filter((p) => p.slug !== slug))
        );
      }
    });
  }, [slug]);

  const handleAddToCart = async (redirectToCart) => {
    if (!isAuthenticated || user?.userType !== 'CUSTOMER') {
      navigate(`/login?redirect=/product/${slug}`);
      return;
    }
    if (!selectedVariant) return;
    setCartError('');
    setAddingToCart(true);
    try {
      const summary = await addToCart(selectedVariant.id, 1);
      dispatch(setCart(summary));
      if (redirectToCart) navigate('/cart');
      else setCartMessage('Added to cart');
    } catch (err) {
      setCartError(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }
  if (!product) return null;

  const price = selectedVariant?.price ?? product.sellingPrice;
  const mrp = selectedVariant?.mrp ?? product.mrp;
  const stock = selectedVariant?.stock ?? 0;
  const images = product.images?.length ? product.images : [{ url: null }];
  const attributeGroups = {};
  (product.variants || []).forEach((v) => v.attributes?.forEach((a) => {
    (attributeGroups[a.name] ||= new Set()).add(a.value);
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Box
            sx={{
              aspectRatio: '1 / 1', bgcolor: 'grey.100', borderRadius: 3, overflow: 'hidden',
              backgroundImage: images[activeImage]?.url ? `url(${images[activeImage].url})` : 'none',
              backgroundSize: 'cover', backgroundPosition: 'center',
            }}
          />
          {images.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, overflowX: 'auto' }}>
              {images.map((img, i) => (
                <Box
                  key={img.id || i}
                  onClick={() => setActiveImage(i)}
                  sx={{
                    width: 64, height: 64, borderRadius: 2, flexShrink: 0, cursor: 'pointer',
                    border: '2px solid', borderColor: i === activeImage ? 'primary.main' : 'divider',
                    backgroundImage: img.url ? `url(${img.url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                  }}
                />
              ))}
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={7}>
          {product.brand_name && (
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
              {product.brand_name}
            </Typography>
          )}
          <Typography variant="h4" sx={{ mt: 0.5, mb: 1 }}>{product.name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <RatingStars rating={product.rating} reviewCount={product.reviewCount} size={18} />
            <Typography variant="body2" color="text.secondary">
              Sold by <Box component={Link} to={`/store/${product.seller_id}`} sx={{ color: 'primary.main', fontWeight: 600 }}>{product.seller_name}</Box>
            </Typography>
          </Box>

          <PriceTag mrp={mrp} price={price} size="large" />

          {Object.entries(attributeGroups).map(([attrName, values]) => (
            <Box key={attrName} sx={{ mt: 2.5 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>{attrName}</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Array.from(values).map((val) => {
                  const variant = product.variants.find((v) => v.attributes?.some((a) => a.name === attrName && a.value === val));
                  const isSelected = selectedVariant?.attributes?.some((a) => a.name === attrName && a.value === val);
                  return (
                    <Chip
                      key={val}
                      label={val}
                      onClick={() => variant && setSelectedVariant(variant)}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                    />
                  );
                })}
              </Box>
            </Box>
          ))}

          <Box sx={{ mt: 2.5, mb: 3 }}>
            {stock > 0 ? (
              <Chip label={stock <= 5 ? `Only ${stock} left` : 'In Stock'} color={stock <= 5 ? 'warning' : 'success'} size="small" />
            ) : (
              <Chip label="Out of Stock" color="error" size="small" />
            )}
          </Box>

          {cartError && <Alert severity="error" sx={{ mb: 2 }}>{cartError}</Alert>}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
            <Button
              variant="contained" size="large" startIcon={<ShoppingCartRoundedIcon />}
              disabled={stock === 0 || addingToCart} sx={{ flexGrow: 1, maxWidth: 240 }}
              onClick={() => handleAddToCart(false)}
            >
              Add to Cart
            </Button>
            <Button
              variant="outlined" size="large" disabled={stock === 0 || addingToCart} sx={{ flexGrow: 1, maxWidth: 200 }}
              onClick={() => handleAddToCart(true)}
            >
              Buy Now
            </Button>
            <IconButton size="large" sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: 2.5 }}>
              <FavoriteBorderRoundedIcon />
            </IconButton>
          </Box>
          <Snackbar open={Boolean(cartMessage)} autoHideDuration={2500} onClose={() => setCartMessage('')} message={cartMessage} />

          <Divider />
          <Grid container spacing={2} sx={{ my: 1 }}>
            {[
              { icon: LocalShippingOutlinedIcon, label: 'Standard delivery available' },
              { icon: ReplayRoundedIcon, label: product.return_policy || '7-day returns' },
              { icon: VerifiedUserOutlinedIcon, label: product.warranty || 'Seller warranty' },
            ].map(({ icon: Icon, label }) => (
              <Grid item xs={12} sm={4} key={label}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                  <Icon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      <Box sx={{ mt: 5 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Description" />
          <Tab label={`Reviews (${product.reviewCount})`} />
        </Tabs>
        <Divider />
        <Box sx={{ py: 3 }}>
          {tab === 0 && (
            <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', maxWidth: 800 }}>
              {product.description || 'No description provided by the seller.'}
            </Typography>
          )}
          {tab === 1 && (
            <Typography variant="body2" color="text.secondary">
              {product.reviewCount > 0 ? `${product.rating} average rating from ${product.reviewCount} reviews.` : 'No reviews yet — be the first to review this product after purchase.'}
            </Typography>
          )}
        </Box>
      </Box>

      {related.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <SectionHeader title="Similar Products" />
          <Grid container spacing={2}>
            {related.slice(0, 4).map((p) => (
              <Grid item xs={6} sm={4} md={3} key={p.id}><ProductCard product={p} /></Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
}
