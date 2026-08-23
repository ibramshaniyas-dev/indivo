import { Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import PortalLoginForm from '../../components/PortalLoginForm';

export default function SellerLogin() {
  return (
    <PortalLoginForm
      title="Seller Login"
      subtitle="Manage your INDIVO store"
      identifierLabel="Mobile Number or Email"
      isAllowed={(user) => user.userType === 'SELLER_STAFF'}
      wrongPortalMessage="This is the seller login. Use the customer or admin login instead."
      redirectTo="/seller/dashboard"
      footer={
        <Box>
          <Typography variant="body2">
            New seller? <Link to="/sell">Register your business</Link>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <Link to="/login">Customer login</Link>
          </Typography>
        </Box>
      }
    />
  );
}
