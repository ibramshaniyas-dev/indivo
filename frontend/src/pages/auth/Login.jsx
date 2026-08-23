import { Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import PortalLoginForm from '../../components/PortalLoginForm';

export default function Login() {
  return (
    <PortalLoginForm
      title="Login to INDIVO"
      identifierLabel="Mobile Number"
      isAllowed={(user) => user.userType === 'CUSTOMER'}
      wrongPortalMessage="This is the customer login. Sellers and admins have their own login pages."
      redirectTo="/"
      footer={
        <Box>
          <Typography variant="body2">
            New to INDIVO? <Link to="/register">Create an account</Link>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <Link to="/seller/login">Seller login</Link>
          </Typography>
        </Box>
      }
    />
  );
}
