import { Box } from '@mui/material';
import PortalLoginForm from '../../components/PortalLoginForm';

export default function AdminLogin() {
  return (
    <Box sx={{ bgcolor: 'primary.main', minHeight: '100vh', pt: 4 }}>
      <PortalLoginForm
        title="Admin Login"
        subtitle="INDIVO Administration"
        identifierLabel="Email"
        isAllowed={(user) => user.userType === 'ADMIN'}
        wrongPortalMessage="This is the admin login. Use the customer or seller login instead."
        redirectTo="/admin/dashboard"
      />
    </Box>
  );
}
