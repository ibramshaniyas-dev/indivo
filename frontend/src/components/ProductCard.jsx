import { Card, Box, Typography, IconButton, Chip, Tooltip, Button } from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import PriceTag from './PriceTag';
import ProductImage from './ProductImage';

export default function ProductCard({ product, wishlisted = false, onToggleWishlist, onAddToCart, onQuickView }) {
  const {
    slug, name, image, brandName, sellerName, rating, reviewCount, mrp, price, stockStatus,
  } = product;
  const outOfStock = stockStatus === 'OUT_OF_STOCK';
  const discount = mrp && price && Number(mrp) > Number(price) ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const floatBtnSx = {
    bgcolor: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 8px rgba(14,13,11,0.08)',
    '&:hover': { bgcolor: '#fff', color: 'secondary.dark' },
  };

  return (
    <Card
      sx={{
        position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff',
        '&:hover': { borderColor: 'secondary.light', boxShadow: '0 16px 36px rgba(14,13,11,0.10)', transform: 'translateY(-3px)' },
        '&:hover img': { transform: 'scale(1.04)' },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Box component={Link} to={`/product/${slug}`} aria-label={name} sx={{ display: 'block' }}>
          <ProductImage src={image} alt={name} ratio="4 / 5" sx={{ '& img': { transition: 'transform 0.5s ease' } }} />
        </Box>

        {discount >= 5 && !outOfStock && (
          <Chip
            label={`${discount}% OFF`} size="small"
            sx={{ position: 'absolute', top: 10, left: 10, height: 22, fontSize: '0.65rem', letterSpacing: '0.06em', bgcolor: 'primary.main', color: '#fff' }}
          />
        )}

        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <IconButton size="small" aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => onToggleWishlist?.(product)} sx={floatBtnSx}>
            {wishlisted ? <FavoriteRoundedIcon fontSize="small" color="error" /> : <FavoriteBorderRoundedIcon fontSize="small" />}
          </IconButton>
          {onQuickView && (
            <Tooltip title="Quick view" placement="left">
              <IconButton size="small" aria-label="Quick view" onClick={() => onQuickView(product)} sx={floatBtnSx}>
                <VisibilityRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {outOfStock && (
          <Chip
            label="Out of stock"
            size="small"
            sx={{ position: 'absolute', bottom: 10, left: 10, bgcolor: 'rgba(255,255,255,0.95)', color: 'error.main', border: '1px solid', borderColor: 'error.light', fontWeight: 700 }}
          />
        )}
      </Box>

      <Box sx={{ p: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', flexGrow: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        {brandName && (
          <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'secondary.dark', fontSize: '0.64rem' }}>
            {brandName}
          </Typography>
        )}
        <Typography
          variant="body2"
          component={Link}
          to={`/product/${slug}`}
          sx={{
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            color: 'text.primary', textDecoration: 'none', fontWeight: 500, minHeight: '2.8em', lineHeight: 1.4, mt: 0.25,
            '&:hover': { color: 'secondary.dark' },
          }}
        >
          {name}
        </Typography>
        {sellerName && (
          <Typography variant="caption" color="text.secondary" noWrap>by {sellerName}</Typography>
        )}
        <Box sx={{ mt: 0.75 }}>
          <RatingStars rating={rating} reviewCount={reviewCount} />
        </Box>
        <Box sx={{ mt: 'auto', pt: 1 }}>
          <PriceTag mrp={mrp} price={price} />
        </Box>
        {onAddToCart && (
          <Button
            fullWidth variant="contained" size="small" startIcon={<ShoppingBagOutlinedIcon />}
            onClick={() => onAddToCart(product)} disabled={outOfStock} sx={{ mt: 1.5 }}
          >
            Add to Bag
          </Button>
        )}
      </Box>
    </Card>
  );
}
