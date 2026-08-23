import { useEffect, useState } from 'react';
import { Box, Alert, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getMySeller } from '../../services/seller.service';

const STATUS_MESSAGES = {
  DRAFT: { severity: 'info', text: 'Finish onboarding to submit your application for review.' },
  SUBMITTED: { severity: 'info', text: 'Your application has been submitted and is awaiting admin review.' },
  UNDER_REVIEW: { severity: 'info', text: 'Your application is currently under review by our team.' },
  REJECTED: { severity: 'warning', text: 'Your application was rejected. Please update your onboarding details and resubmit.' },
  SUSPENDED: { severity: 'error', text: 'Your seller account is suspended. Contact support for details.' },
  BLOCKED: { severity: 'error', text: 'Your seller account has been blocked.' },
};

export default function SellerDashboard() {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMySeller()
      .then((data) => {
        setSeller(data);
        if (['DRAFT', 'REJECTED'].includes(data.status)) navigate('/seller/onboarding');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (!seller) return null;

  const statusInfo = STATUS_MESSAGES[seller.status];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>{seller.display_name}</Typography>
      {statusInfo && <Alert severity={statusInfo.severity} sx={{ mb: 3 }}>{statusInfo.text}</Alert>}
      {seller.status === 'APPROVED' && (
        <Typography color="text.secondary">
          You're approved! Product management, inventory, and order tools are coming in the next build.
        </Typography>
      )}
    </Box>
  );
}
