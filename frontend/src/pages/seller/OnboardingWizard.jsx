import { useEffect, useState } from 'react';
import {
  Box, Paper, Stepper, Step, StepLabel, TextField, Button, Typography, Alert, Grid,
  FormControlLabel, Checkbox, List, ListItem, ListItemText, Chip, IconButton, MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import * as sellerService from '../../services/seller.service';

const STEPS = ['Business Information', 'Documents', 'Bank Details', 'Agreement', 'Review & Submit'];
const DOC_TYPES = ['GST_CERTIFICATE', 'PAN', 'BUSINESS_REGISTRATION', 'ADDRESS_PROOF', 'OWNER_IDENTITY'];

export default function OnboardingWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [seller, setSeller] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [business, setBusiness] = useState({
    legalName: '', gstNo: '', panNo: '', businessRegNo: '',
    addressLine1: '', addressLine2: '', city: '', district: '', state: '', pincode: '',
  });
  const [bank, setBank] = useState({ accountHolderName: '', bankName: '', accountNumber: '', ifsc: '', branch: '' });
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docFile, setDocFile] = useState(null);
  const [agreementChecked, setAgreementChecked] = useState(false);

  const loadSeller = async () => {
    const data = await sellerService.getMySeller();
    setSeller(data);
    if (data.status !== 'DRAFT' && data.status !== 'REJECTED') {
      navigate('/seller/dashboard');
    }
  };

  useEffect(() => {
    loadSeller().catch((err) => setError(err.response?.data?.message || 'Failed to load seller profile'));
  }, []);

  const runStep = async (fn, successMessage) => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await fn();
      setSuccessMsg(successMessage);
      await loadSeller();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSubmit = async () => {
    const ok = await runStep(() => sellerService.updateBusiness(business), 'Business information saved');
    if (ok) setActiveStep(1);
  };

  const handleDocUpload = async () => {
    if (!docFile) return setError('Choose a file to upload');
    await runStep(() => sellerService.uploadDocument(docType, docFile), 'Document uploaded');
    setDocFile(null);
  };

  const handleDocRemove = async (docId) => {
    await runStep(() => sellerService.removeDocument(docId), 'Document removed');
  };

  const handleBankSubmit = async () => {
    const ok = await runStep(() => sellerService.updateBank(bank), 'Bank details saved');
    if (ok) setActiveStep(3);
  };

  const handleAgreementSubmit = async () => {
    if (!agreementChecked) return setError('You must accept the marketplace agreement to continue');
    const ok = await runStep(() => sellerService.acceptAgreement(), 'Agreement accepted');
    if (ok) setActiveStep(4);
  };

  const handleFinalSubmit = async () => {
    const ok = await runStep(() => sellerService.submitApplication(), 'Application submitted for review!');
    if (ok) setTimeout(() => navigate('/seller/dashboard'), 1500);
  };

  if (!seller) return <Box sx={{ p: 4 }}>Loading…</Box>;

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>Seller Onboarding — {seller.display_name}</Typography>
      {seller.status === 'REJECTED' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your previous application was rejected: {seller.rejection_reason}. Update your details and resubmit.
        </Alert>
      )}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
        {STEPS.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {activeStep === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Legal Company Name" value={business.legalName}
                onChange={(e) => setBusiness({ ...business, legalName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="GST Number" value={business.gstNo}
                onChange={(e) => setBusiness({ ...business, gstNo: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="PAN Number" value={business.panNo}
                onChange={(e) => setBusiness({ ...business, panNo: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Business Registration Number" value={business.businessRegNo}
                onChange={(e) => setBusiness({ ...business, businessRegNo: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address Line 1" value={business.addressLine1} required
                onChange={(e) => setBusiness({ ...business, addressLine1: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address Line 2" value={business.addressLine2}
                onChange={(e) => setBusiness({ ...business, addressLine2: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="City" value={business.city} required
                onChange={(e) => setBusiness({ ...business, city: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="State" value={business.state} required
                onChange={(e) => setBusiness({ ...business, state: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Pincode" value={business.pincode} required
                onChange={(e) => setBusiness({ ...business, pincode: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={handleBusinessSubmit} disabled={loading}>Save & Continue</Button>
            </Grid>
          </Grid>
        )}

        {activeStep === 1 && (
          <Box>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField select fullWidth label="Document Type" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  {DOC_TYPES.map((t) => <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={5}>
                <Button variant="outlined" component="label" fullWidth>
                  {docFile ? docFile.name : 'Choose File'}
                  <input type="file" hidden onChange={(e) => setDocFile(e.target.files[0])} />
                </Button>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button variant="contained" fullWidth onClick={handleDocUpload} disabled={loading}>Upload</Button>
              </Grid>
            </Grid>
            <List sx={{ mt: 2 }}>
              {(seller.documents || []).map((doc) => (
                <ListItem key={doc.id} secondaryAction={
                  doc.status !== 'VERIFIED' && (
                    <IconButton edge="end" onClick={() => handleDocRemove(doc.id)}><DeleteIcon /></IconButton>
                  )
                }>
                  <ListItemText primary={doc.doc_type.replace(/_/g, ' ')} />
                  <Chip size="small" label={doc.status} color={doc.status === 'VERIFIED' ? 'success' : doc.status === 'REJECTED' ? 'error' : 'default'} />
                </ListItem>
              ))}
            </List>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button onClick={() => setActiveStep(0)}>Back</Button>
              <Button variant="contained" onClick={() => setActiveStep(2)} disabled={!(seller.documents || []).length}>
                Continue
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Account Holder Name" value={bank.accountHolderName} required
                onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Bank Name" value={bank.bankName} required
                onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Account Number" value={bank.accountNumber} required
                onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="IFSC Code" value={bank.ifsc} required
                onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Branch" value={bank.branch}
                onChange={(e) => setBank({ ...bank, branch: e.target.value })} />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setActiveStep(1)}>Back</Button>
              <Button variant="contained" onClick={handleBankSubmit} disabled={loading}>Save & Continue</Button>
            </Grid>
          </Grid>
        )}

        {activeStep === 3 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              By continuing, you agree to the INDIVO Marketplace Seller Agreement, including commission terms,
              product listing policies, and settlement schedules.
            </Typography>
            <FormControlLabel
              control={<Checkbox checked={agreementChecked} onChange={(e) => setAgreementChecked(e.target.checked)} />}
              label="I have read and accept the marketplace seller agreement"
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button onClick={() => setActiveStep(2)}>Back</Button>
              <Button variant="contained" onClick={handleAgreementSubmit} disabled={loading}>Continue</Button>
            </Box>
          </Box>
        )}

        {activeStep === 4 && (
          <Box>
            <Typography sx={{ mb: 2 }}>
              Review your details, then submit your application for admin approval.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button onClick={() => setActiveStep(3)}>Back</Button>
              <Button variant="contained" color="primary" onClick={handleFinalSubmit} disabled={loading}>
                Submit Application
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
