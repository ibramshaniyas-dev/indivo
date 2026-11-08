import { Card, Box, Typography, IconButton, Chip, Tooltip, Button } from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import PriceTag from './PriceTag';
import ProductImage from './ProductImage';
import useHomeDemo from '../hooks/useHomeDemo';

export const OFFER_RED = '#C62828';
const FREE_SHIPPING_FROM = 999; // mirrors checkout.service FREE_SHIPPING_THRESHOLD
const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

/**
 * Product tile. `dense` is the compact marketplace layout used in homepage rails and grids:
 * square image, tighter text, bold offer badge, so many products fit on screen at once.
 */
export default function ProductCard({ product, wishlisted = false, onToggleWishlist, onAddToCart, onQuickView, dense = false }) {
  const {
    slug, name, image, brandName, sellerName, rating, reviewCount, mrp, price, stockStatus,
  } = product;
  const outOfStock = stockStatus === 'OUT_OF_STOCK';
  const homeDemo = useHomeDemo();
  const isDemo = homeDemo.productIds.has(product.id);
  const discount = mrp && price && Number(mrp) > Number(price) ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const floatBtnSx = {
    bgcolor: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 8px rgba(14,13,11,0.08)', width: dense ? 28 : 34, height: dense ? 28 : 34,
    '&:hover': { bgcolor: '#fff', color: 'secondary.dark' },
  };

  return (
    <Card
      sx={{
        position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff',
        borderRadius: dense ? 2 : undefined,
        '&:hover': { borderColor: 'secondary.light', boxShadow: '0 12px 28px rgba(14,13,11,0.10)', transform: 'translateY(-2px)' },
        '&:hover img': { transform: 'scale(1.04)' },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Box component={Link} to={`/product/${slug}`} aria-label={name} sx={{ display: 'block' }}>
          <ProductImage
            src={image} alt={name} ratio={dense ? '1 / 1' : '4 / 5'} fit={dense ? 'cover' : undefined} placeholderLabel={!dense}
            sizes={dense ? '(max-width: 600px) 45vw, 200px' : undefined}
            sx={{ '& img': { transition: 'transform 0.5s ease' } }}
          />
        </Box>

        {discount >= 5 && !outOfStock && (
          <Box
            sx={{
              position: 'absolute', top: dense ? 6 : 10, left: dense ? 6 : 10, px: 0.75, py: 0.25, borderRadius: 1,
              bgcolor: OFFER_RED, color: '#fff', fontSize: dense ? '0.62rem' : '0.68rem', fontWeight: 800, letterSpacing: '0.02em', lineHeight: 1.4,
            }}
          >
            {discount}% OFF
          </Box>
        )}
        {isDemo && (
          <Chip
            icon={<BoltRoundedIcon />}
            label={dense ? `Demo ${homeDemo.zone?.slaMinutes || 60}m` : `Home demo · ${homeDemo.zone?.slaMinutes || 60} min`}
            size="small"
            sx={{ position: 'absolute', bottom: dense ? 6 : 10, left: dense ? 6 : 10, height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#fff', color: 'secondary.dark', border: '1px solid rgba(168,106,0,0.45)', '& .MuiChip-icon': { fontSize: 13, color: 'secondary.dark' }, zIndex: 2 }}
          />
        )}

        <Box sx={{ position: 'absolute', top: dense ? 4 : 8, right: dense ? 4 : 8, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <IconButton size="small" aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => onToggleWishlist?.(product)} sx={floatBtnSx}>
            {wishlisted ? <FavoriteRoundedIcon sx={{ fontSize: dense ? 16 : 20 }} color="error" /> : <FavoriteBorderRoundedIcon sx={{ fontSize: dense ? 16 : 20 }} />}
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

      {dense ? (
        <Box sx={{ px: { xs: 0.75, sm: 1.25 }, pt: { xs: 0.6, sm: 1 }, pb: { xs: 0.75, sm: 1.25 }, display: 'flex', flexDirection: 'column', flexGrow: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          {brandName && (
            <Typography noWrap sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'secondary.dark', fontSize: '0.58rem' }}>
              {brandName}
            </Typography>
          )}
          <Typography
            component={Link}
            to={`/product/${slug}`}
            sx={{
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: { xs: '0.7rem', sm: '0.8rem' },
              color: 'text.primary', textDecoration: 'none', fontWeight: 500, minHeight: '2.5em', lineHeight: 1.25, mt: 0.25,
              '&:hover': { color: 'secondary.dark' },
            }}
          >
            {name}
          </Typography>
          <Box sx={{ mt: 'auto', pt: 0.75 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.82rem', sm: '0.98rem' } }}>{inr(price)}</Typography>
              {discount > 0 && <Typography sx={{ fontSize: { xs: '0.62rem', sm: '0.72rem' }, color: 'text.secondary', textDecoration: 'line-through' }}>{inr(mrp)}</Typography>}
              {discount > 0 && <Typography sx={{ fontSize: { xs: '0.62rem', sm: '0.72rem' }, color: 'success.main', fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>{discount}% off</Typography>}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4, minHeight: 18 }}>
              {Number(reviewCount) > 0 && (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, px: 0.6, borderRadius: 0.75, bgcolor: 'success.main', color: '#fff', fontSize: '0.66rem', fontWeight: 700 }}>
                  {Number(rating).toFixed(1)}<StarRoundedIcon sx={{ fontSize: 11 }} />
                </Box>
              )}
              {Number(price) >= FREE_SHIPPING_FROM && (
                <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, fontSize: '0.66rem', color: 'text.secondary' }}>
                  <LocalShippingOutlinedIcon sx={{ fontSize: 13 }} /> Free delivery
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      ) : (
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
      )}
    </Card>
  );
}
