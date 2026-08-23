import { Card, Box, Skeleton } from '@mui/material';

export default function ProductCardSkeleton() {
  return (
    <Card>
      <Skeleton variant="rectangular" sx={{ aspectRatio: '1 / 1' }} />
      <Box sx={{ p: 1.5 }}>
        <Skeleton width="40%" height={16} />
        <Skeleton width="90%" height={20} sx={{ mt: 0.5 }} />
        <Skeleton width="60%" height={16} sx={{ mt: 0.5 }} />
        <Skeleton width="50%" height={24} sx={{ mt: 1 }} />
      </Box>
    </Card>
  );
}
