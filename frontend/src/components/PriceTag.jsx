import { Box, Typography } from '@mui/material';

function formatINR(value) {
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function PriceTag({ mrp, price, size = 'medium' }) {
  const discountPct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const priceVariant = size === 'large' ? 'h5' : 'subtitle1';

  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
      <Typography variant={priceVariant} sx={{ fontWeight: 700 }}>
        {formatINR(price)}
      </Typography>
      {discountPct > 0 && (
        <>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textDecoration: 'line-through', textDecorationColor: 'text.secondary' }}
          >
            {formatINR(mrp)}
          </Typography>
          <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>
            {discountPct}% off
          </Typography>
        </>
      )}
    </Box>
  );
}
