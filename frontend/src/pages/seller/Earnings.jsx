import { useEffect, useState } from 'react';
import {
  Box, Grid, Paper, Typography, Alert, Table, TableHead, TableRow, TableCell, TableBody, Skeleton, TablePagination, Chip,
} from '@mui/material';
import PercentRoundedIcon from '@mui/icons-material/PercentRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Link } from 'react-router-dom';
import { getMyEarnings } from '../../services/commission.service';
import { getMySettlements } from '../../services/growth.service';
import { inr, fmtDate, rateLabel, RangeToggle, StageChip, Tile, SectionTitle, noCommission } from '../../components/commission/shared';

/** Seller's commission rate, earnings summary and per-order commission statement. */
export default function SellerEarnings() {
  const [range, setRange] = useState('30d');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [payouts, setPayouts] = useState(null);

  useEffect(() => { getMySettlements({ limit: 20 }).then(setPayouts).catch(() => setPayouts({ rows: [], totalPaid: 0 })); }, []);

  useEffect(() => {
    getMyEarnings({ range, page: page + 1, limit: 15 })
      .then(setData)
      .catch((e) => setError(e.response?.data?.message || 'Could not load earnings'));
  }, [range, page]);

  return (
    <Box sx={{ maxWidth: 1150 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
        <Box>
          <Typography variant="h5">Earnings & Commission</Typography>
          <Typography variant="body2" color="text.secondary">What you earn on every order after marketplace commission.</Typography>
        </Box>
        <RangeToggle value={range} onChange={(v) => { setRange(v); setPage(0); }} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!data && !error && <Skeleton variant="rounded" height={420} />}

      {data && (
        <>
          <Paper sx={{ p: 2.5, mb: 2.5, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', background: 'linear-gradient(135deg, #FDF8EC 0%, #F6E9C6 100%)' }}>
            <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: '#fff', display: 'grid', placeItems: 'center', color: 'primary.main', border: '1px solid', borderColor: 'divider' }}>
              <PercentRoundedIcon />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary">Your commission rate</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontFamily: "'Jost', sans-serif", fontSize: '1.8rem', fontWeight: 600, lineHeight: 1.2 }}>{rateLabel(data.rate)}</Typography>
                <Chip size="small" variant="outlined" color={data.rate.source === 'SELLER' ? 'secondary' : 'default'} label={data.rate.source === 'SELLER' ? 'Special rate for your store' : 'Marketplace standard'} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {data.rate.type === 'PERCENTAGE'
                  ? `On a ₹1,000 sale you pay ${inr(10 * data.rate.value)} commission and earn ${inr(1000 - 10 * data.rate.value)}.`
                  : `A flat ${inr(data.rate.value)} is deducted per order.`}
              </Typography>
            </Box>
          </Paper>

          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={6} md={2}><Tile label="Sales" value={inr(data.totals.sales)} hint={`${data.totals.orders} orders`} /></Grid>
            <Grid item xs={6} md={2}><Tile label="Commission" value={inr(data.totals.commission)} hint={`${(data.totals.effectiveRate * 100).toFixed(1)}% of sales`} /></Grid>
            <Grid item xs={6} md={2}><Tile label="Your earnings" value={inr(data.totals.payable)} hint="sales + shipping − commission" emphasis /></Grid>
            <Grid item xs={6} md={2}><Tile label="Paid out" value={inr(data.totals.paidOut)} hint="already in your bank" /></Grid>
            <Grid item xs={6} md={2}><Tile label="Ready for payout" value={inr(data.totals.readyForPayout)} hint="delivered, being paid" /></Grid>
            <Grid item xs={6} md={2}><Tile label="In progress" value={inr(data.totals.inProgressPayable)} hint="earned once delivered" /></Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2.5, color: 'text.secondary' }}>
            <InfoOutlinedIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption">
              Earnings move to <b>Ready for payout</b> once the order is delivered. Cancelled and returned orders have no commission.
            </Typography>
          </Box>

          <Paper sx={{ p: 2.5 }}>
            <SectionTitle title="Commission statement" subtitle="Every order with the commission deducted" />
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell align="right">Sales</TableCell>
                    <TableCell align="right">Shipping</TableCell>
                    <TableCell align="right">Commission</TableCell>
                    <TableCell align="right">You earn</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.ledger.rows.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Box component={Link} to={`/seller/orders/${r.id}`} sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}>{r.orderNumber}</Box>
                      </TableCell>
                      <TableCell>{r.paymentMethod === 'COD' ? 'COD' : 'Online'}</TableCell>
                      <TableCell align="right">{inr(r.sales)}</TableCell>
                      <TableCell align="right">{inr(r.shipping)}</TableCell>
                      <TableCell align="right" sx={{ color: noCommission(r) ? 'text.secondary' : 'error.main' }}>
                        {noCommission(r) ? '—' : <>− {inr(r.commission)} <Typography component="span" variant="caption" color="text.secondary">({r.ratePercent.toFixed(1)}%)</Typography></>}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{noCommission(r) ? '—' : inr(r.payable)}</TableCell>
                      <TableCell><StageChip stage={r.stage} /></TableCell>
                    </TableRow>
                  ))}
                  {data.ledger.rows.length === 0 && (
                    <TableRow><TableCell colSpan={8}><Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No orders in this period.</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
            {data.ledger.total > data.ledger.limit && (
              <TablePagination component="div" count={data.ledger.total} page={page} rowsPerPage={data.ledger.limit} rowsPerPageOptions={[]} onPageChange={(e, p) => setPage(p)} />
            )}
          </Paper>

          <Paper sx={{ p: 2.5, mt: 2.5 }}>
            <SectionTitle title="Payouts received" subtitle={payouts ? `${inr(payouts.totalPaid)} paid to your bank account in total` : ''} />
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Paid on</TableCell>
                    <TableCell>For orders from</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Commission</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>UTR / reference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payouts?.rows.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(p.paidAt)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}</TableCell>
                      <TableCell align="right">{p.orders}</TableCell>
                      <TableCell align="right">{inr(p.commission)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{inr(p.amount)}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{p.referenceNo}</TableCell>
                    </TableRow>
                  ))}
                  {payouts && payouts.rows.length === 0 && (
                    <TableRow><TableCell colSpan={6}><Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No payouts yet — delivered orders are paid out by the SEESHAA team.</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
