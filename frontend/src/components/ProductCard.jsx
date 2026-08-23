import { Card, CardActionArea, Box, Typography, IconButton, Chip, Tooltip } from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import PriceTag from './PriceTag';

export default function ProductCard({ product, wishlisted = false, onToggleWishlist, onAddToCart, onQuickView }) {
  const {
    slug, name, image, brandName, sellerName, rating, reviewCount, mrp, price, stockStatus,
  } = product;
  const outOfStock = stockStatus === 'OUT_OF_STOCK';

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        '&:hover': { boxShadow: '0 8px 24px rgba(18,31,66,0.12)', transform: 'translateY(-2px)' },
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardActionArea component={Link} to={`/product/${slug}`}>
          <Box
            sx={{
              aspectRatio: '1 / 1',
              bgcolor: 'grey.100',
              backgroundImage: image ? `url(${image})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </CardActionArea>

        <IconButton
          size="small"
          onClick={() => onToggleWishlist?.(product)}
          sx={{
            position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)',
            '&:hover': { bgcolor: '#fff' },
          }}
        >
          {wishlisted ? <FavoriteRoundedIcon fontSize="small" color="error" /> : <FavoriteBorderRoundedIcon fontSize="small" />}
        </IconButton>

        {onQuickView && (
          <Tooltip title="Quick view">
            <IconButton
              size="small"
              onClick={() => onQuickView(product)}
              sx={{
                position: 'absolute', top: 8, left: 8, bgcolor: 'rgba(255,255,255,0.9)',
                '&:hover': { bgcolor: '#fff' },
              }}
            >
              <VisibilityRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {outOfStock && (
          <Chip
            label="Out of stock"
            size="small"
            sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: 'rgba(23,26,43,0.85)', color: '#fff', fontWeight: 700 }}
          />
        )}
      </Box>

      <Box sx={{ p: 1.5 }}>
        {brandName && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {brandName}
          </Typography>
        )}
        <Typography
          variant="body2"
          component={Link}
          to={`/product/${slug}`}
          sx={{
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            color: 'text.primary', textDecoration: 'none', fontWeight: 500, minHeight: '2.6em', mt: 0.25,
          }}
        >
          {name}
        </Typography>
        {sellerName && (
          <Typography variant="caption" color="text.secondary">Sold by {sellerName}</Typography>
        )}
        <Box sx={{ mt: 0.5 }}>
          <RatingStars rating={rating} reviewCount={reviewCount} />
        </Box>
        <Box sx={{ mt: 0.75 }}>
          <PriceTag mrp={mrp} price={price} />
        </Box>
      </Box>

      {onAddToCart && (
        <IconButton
          onClick={() => onAddToCart(product)}
          disabled={outOfStock}
          sx={{
            position: 'absolute', bottom: 84, right: 8, bgcolor: 'secondary.main', color: 'primary.main',
            '&:hover': { bgcolor: 'secondary.dark' },
            boxShadow: '0 4px 12px rgba(18,31,66,0.2)',
          }}
          size="small"
        >
          <ShoppingCartRoundedIcon fontSize="small" />
        </IconButton>
      )}
    </Card>
  );
}
