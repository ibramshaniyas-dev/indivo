import { useEffect, useState } from 'react';
import { Box, Alert, Typography, CircularProgress, Grid, Card } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getMySeller } from '../../services/seller.service';
import * as sellerProductService from '../../services/sellerProduct.service';
import BusinessDashboard from '../../components/analytics/BusinessDashboard';
import { getSellerAnalytics } from '../../services/analytics.service';
import { getMyGrowth } from '../../services/growth.service';
import InsightsPanel from '../../components/growth/InsightsPanel';
import Scorecard from '../../components/growth/Scorecard';

const STATUS_MESSAGES = {
  DRAFT: { severity: 'info', text: 'Finish onboarding to submit your application for review.' },
  SUBMITTED: { severity: 'info', text: 'Your application has been submitted and is awaiting admin review.' },
  UNDER_REVIEW: { severity: 'info', text: 'Your application is currently under review by our team.' },
  REJECTED: { severity: 'warning', text: 'Your application was rejected. Please update your onboarding details and resubmit.' },
  SUSPENDED: { severity: 'error', text: 'Your seller account is suspended. Contact support for details.' },
  BLOCKED: { severity: 'error', text: 'Your seller account has been blocked.' },
};

function StatCard({ label, value }) {
  return (
    <Card sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography sx={{ fontFamily: "'Jost', sans-serif", fontSize: '1.5rem', fontWeight: 600, mt: 0.25 }}>{value}</Typography>
    </Card>
  );
}

export default function SellerDashboard() {
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [growth, setGrowth] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMySeller()
      .then((data) => {
        setSeller(data);
        if (['DRAFT', 'REJECTED'].includes(data.status)) {
          navigate('/seller/onboarding');
          return;
        }
        if (data.status === 'APPROVED') {
          sellerProductService.listMyProducts().then(setProducts);
          getMyGrowth().then(setGrowth).catch(() => setGrowth({ insights: [], scorecard: null }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (!seller) return null;

  const statusInfo = STATUS_MESSAGES[seller.status];
  const active = products.filter((p) => p.status === 'ACTIVE').length;
  const pending = products.filter((p) => p.status === 'PENDING_REVIEW').length;
  const drafts = products.filter((p) => p.status === 'DRAFT').length;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>{seller.display_name}</Typography>
      {statusInfo && <Alert severity={statusInfo.severity} sx={{ mb: 3 }}>{statusInfo.text}</Alert>}

      {seller.status === 'APPROVED' && (
        <>
          <InsightsPanel insights={growth?.insights} loading={!growth} />
          {growth?.scorecard && <Scorecard card={growth.scorecard} />}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}><StatCard label="Total Products" value={products.length} /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Live" value={active} /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Pending Review" value={pending} /></Grid>
            <Grid item xs={6} sm={3}><StatCard label="Drafts" value={drafts} /></Grid>
          </Grid>
          <BusinessDashboard
            mode="seller"
            load={getSellerAnalytics}
            ordersPath="/seller/orders"
            productsPath="/seller/products"
          />
        </>
      )}
    </Box>
  );
}
