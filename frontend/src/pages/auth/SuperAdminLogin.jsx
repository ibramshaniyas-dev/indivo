import { Box } from '@mui/material';
import PortalLoginForm from '../../components/PortalLoginForm';

export default function SuperAdminLogin() {
  return (
    <Box sx={{ bgcolor: '#0A0908', minHeight: '100vh', pt: 4 }}>
      <PortalLoginForm
        title="Super Admin Control Center"
        subtitle="Complete platform access — restricted"
        identifierLabel="Email"
        isAllowed={(user) => user.isSuperAdmin === true}
        wrongPortalMessage="This account does not have Super Admin access."
        redirectTo="/super-admin/dashboard"
      />
    </Box>
  );
}
