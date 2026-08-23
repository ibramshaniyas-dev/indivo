import { Box, Container, Typography, Paper, Grid } from '@mui/material';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';

const CONTACT_ITEMS = [
  { icon: EmailRoundedIcon, label: 'Email', value: 'support@indivo.iharogroups.com' },
  { icon: PhoneRoundedIcon, label: 'Phone', value: '+91 90000 00000' },
  { icon: LocationOnRoundedIcon, label: 'Address', value: 'Coimbatore, Tamil Nadu, India' },
];

export default function Contact() {
  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Typography variant="h4" gutterBottom>Contact Us</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Have a question about an order, a seller account, or anything else? Reach out.
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          {CONTACT_ITEMS.map((item) => (
            <Grid item xs={12} key={item.label}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <item.icon color="secondary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body1">{item.value}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
}
