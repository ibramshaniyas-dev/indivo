import { Fragment, useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Collapse, Skeleton, Alert,
  ToggleButtonGroup, ToggleButton, LinearProgress, Grid,
} from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import { getSellerPerformance } from '../../services/growth.service';
import Scorecard, { BandChip, BANDS } from '../../components/growth/Scorecard';
import { Tile } from '../../components/commission/shared';

const pct = (v) => `${Math.round((v || 0) * 100)}%`;
const hours = (h) => (h === null || h === undefined ? '—' : `${h.toFixed(1)}h`);

/** Every seller's scorecard, worst first, with the reasons behind each score. */
export default function SellerPerformance() {
  const [days, setDays] = useState(90);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    setRows(null);
    getSellerPerformance(days).then(setRows).catch((e) => setError(e.response?.data?.message || 'Could not load seller performance'));
  }, [days]);

  const count = (band) => (rows || []).filter((r) => r.band === band).length;

  return (
    <Box sx={{ maxWidth: 1250 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
        <Box>
          <Typography variant="h5">Seller Performance</Typography>
          <Typography variant="body2" color="text.secondary">Who is delivering a great customer experience — and who needs help.</Typography>
        </Box>
        <ToggleButtonGroup size="small" exclusive value={days} onChange={(e, v) => v && setDays(v)} sx={{ bgcolor: '#fff' }}>
          {[30, 90, 180, 365].map((d) => <ToggleButton key={d} value={d} sx={{ textTransform: 'none', px: 1.5 }}>{d === 365 ? '12 months' : `${d} days`}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {['AT_RISK', 'NEEDS_ATTENTION', 'GOOD', 'EXCELLENT', 'NEW'].map((b) => (
          <Grid item xs={6} sm={4} md={2.4} key={b}>
            <Tile label={BANDS[b].label} value={rows ? count(b) : '…'} hint={b === 'NEW' ? 'fewer than 3 orders' : 'sellers'} emphasis={b === 'AT_RISK' && count(b) > 0} />
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 2.5 }}>
        {!rows && !error && <Skeleton variant="rounded" height={300} />}
        {rows && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Seller</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Score</TableCell>
                  <TableCell>Band</TableCell>
                  <TableCell align="right">Orders</TableCell>
                  <TableCell align="right">Confirm</TableCell>
                  <TableCell align="right">Late ship</TableCell>
                  <TableCell align="right">Cancelled</TableCell>
                  <TableCell align="right">RTO</TableCell>
                  <TableCell align="right">Waiting &gt;24h</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <Fragment key={r.sellerId}>
                    <TableRow hover onClick={() => setOpen(open === r.sellerId ? null : r.sellerId)} sx={{ cursor: 'pointer', '& > td': { borderBottom: open === r.sellerId ? 'none' : undefined } }}>
                      <TableCell padding="checkbox">
                        <IconButton size="small" aria-label="Show details">{open === r.sellerId ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}</IconButton>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, width: 28 }}>{r.score}</Typography>
                          <LinearProgress
                            variant="determinate" value={r.score}
                            sx={{ flexGrow: 1, height: 6, borderRadius: 3, bgcolor: '#F0E9DA', '& .MuiLinearProgress-bar': { bgcolor: BANDS[r.band].hex, borderRadius: 3 } }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell><BandChip band={r.band} /></TableCell>
                      <TableCell align="right">{r.orders}</TableCell>
                      <TableCell align="right">{hours(r.avgConfirmHours)}</TableCell>
                      <TableCell align="right">{pct(r.lateShipRate)}</TableCell>
                      <TableCell align="right">{pct(r.cancellationRate)}</TableCell>
                      <TableCell align="right">{pct(r.rtoRate)}</TableCell>
                      <TableCell align="right" sx={{ color: r.pendingConfirm ? 'error.main' : 'inherit', fontWeight: r.pendingConfirm ? 700 : 400 }}>{r.pendingConfirm}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={10} sx={{ py: 0 }}>
                        <Collapse in={open === r.sellerId} unmountOnExit>
                          <Box sx={{ py: 2 }}><Scorecard card={r} /></Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
