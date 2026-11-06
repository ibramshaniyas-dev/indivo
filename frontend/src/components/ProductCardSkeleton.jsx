import { Card, Box, Skeleton } from '@mui/material';

export default function ProductCardSkeleton() {
  return (
    <Card sx={{ bgcolor: '#fff' }}>
      <Skeleton variant="rectangular" sx={{ aspectRatio: '4 / 5', height: 'auto' }} />
      <Box sx={{ p: 2 }}>
        <Skeleton width="35%" height={14} />
        <Skeleton width="90%" height={20} sx={{ mt: 0.5 }} />
        <Skeleton width="60%" height={14} sx={{ mt: 0.5 }} />
        <Skeleton width="45%" height={24} sx={{ mt: 1.5 }} />
      </Box>
    </Card>
  );
}
