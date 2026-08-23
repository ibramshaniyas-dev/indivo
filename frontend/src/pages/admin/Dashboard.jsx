import { useEffect, useState } from 'react';
import { Box, Grid, Card, Typography, CircularProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import api from '../../services/api';

function StatCard({ label, value, loading }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      {loading ? (
        <CircularProgress size={20} sx={{ mt: 1 }} />
      ) : (
        <Typography variant="h4" sx={{ mt: 0.5 }}>{value}</Typography>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/admin/sellers', { params: { status: 'SUBMITTED' } }).catch(() => null),
      api.get('/admin/sellers').catch(() => null),
      api.get('/admin/products', { params: { status: 'PENDING_REVIEW' } }).catch(() => null),
      api.get('/admin/products').catch(() => null),
    ]).then(([pendingSellers, allSellers, pendingProducts, allProducts]) => {
      setStats({
        pendingSellers: pendingSellers?.data.meta?.total ?? 0,
        totalSellers: allSellers?.data.meta?.total ?? 0,
        pendingProducts: pendingProducts?.data.meta?.total ?? 0,
        totalProducts: allProducts?.data.meta?.total ?? 0,
      });
    });
  }, []);

  const cards = [
    { label: 'Total Sellers', value: stats?.totalSellers, permission: 'sellers.view' },
    { label: 'Pending Seller Approvals', value: stats?.pendingSellers, permission: 'sellers.approve' },
    { label: 'Total Products', value: stats?.totalProducts, permission: 'products.view' },
    { label: 'Pending Product Approvals', value: stats?.pendingProducts, permission: 'products.approve' },
  ].filter((c) => user?.isSuperAdmin || user?.permissions?.includes(c.permission));

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Welcome back{user?.name ? `, ${user.name}` : ''}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {user?.isSuperAdmin ? 'Complete platform overview' : `Showing what's relevant to your role: ${user?.roles?.join(', ')}`}
      </Typography>

      <Grid container spacing={2}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} md={3} key={c.label}>
            <StatCard label={c.label} value={c.value} loading={!stats} />
          </Grid>
        ))}
        {cards.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary">No dashboard widgets are enabled for your role yet.</Typography>
          </Grid>
        )}
      </Grid>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
        Revenue, order, and commission analytics will appear here once the checkout and payments modules ship.
      </Typography>
    </Box>
  );
}
