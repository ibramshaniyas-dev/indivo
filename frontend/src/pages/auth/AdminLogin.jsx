import { Box } from '@mui/material';
import PortalLoginForm from '../../components/PortalLoginForm';

export default function AdminLogin() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 2 }}>
      <PortalLoginForm
        title="Admin Login"
        subtitle="SEESHAA Administration"
        portalLabel="Admin Portal"
        identifierLabel="Email"
        isAllowed={(user) => user.userType === 'ADMIN'}
        wrongPortalMessage="This is the admin login. Use the customer or seller login instead."
        redirectTo="/admin/dashboard"
      />
    </Box>
  );
}
