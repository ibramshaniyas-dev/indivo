import { useEffect, useState } from 'react';
import {
  Box, Grid, Paper, Typography, ToggleButtonGroup, ToggleButton, Skeleton, Alert, Chip, Table, TableHead,
  TableRow, TableCell, TableBody, Button, Avatar, Tooltip,
} from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import FiberNewRoundedIcon from '@mui/icons-material/FiberNewRounded';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { Link, useNavigate } from 'react-router-dom';
import { TrendChart, BarList, SplitBar, inr, SERIES_GOLD, SERIES_BLUE } from './charts';
import ProductImage from '../ProductImage';

const RANGES = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: '365d', label: '12 months' },
];

const ORDER_STATUS_LABEL = {
  PLACED: 'New', CONFIRMED: 'Confirmed', PROCESSING: 'Processing', PACKED: 'Packed', SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', RETURN_REQUESTED: 'Return requested',
  RETURN_APPROVED: 'Return approved', RETURNED: 'Returned', REFUND_REQUESTED: 'Refund requested', REFUNDED: 'Refunded',
};
const SHIPMENT_STATUS_LABEL = {
  PENDING: 'Pending', SHIPMENT_CREATED: 'Shipment created', AWB_ASSIGNED: 'AWB assigned', PICKUP_REQUESTED: 'Pickup requested',
  PICKED_UP: 'Picked up', SHIPPED: 'Shipped', IN_TRANSIT: 'In transit', OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled', FAILED: 'Failed', RTO_INITIATED: 'RTO initiated', RTO_IN_TRANSIT: 'RTO in transit', RTO_DELIVERED: 'RTO delivered',
};
// Status chips always pair colour with a text label.
const ORDER_STATUS_COLOR = { DELIVERED: 'success', CANCELLED: 'error', PLACED: 'warning', RETURN_REQUESTED: 'error', REFUND_REQUESTED: 'error' };

const pct = (v) => `${(v * 100).toFixed(v > 0 && v < 0.1 ? 1 : 0)}%`;
const fmtDate = (d) => new Date(String(d).replace(' ', 'T')).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

function Card({ title, subtitle, action, children, sx }) {
  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 }, height: '100%', ...sx }}>
      {(title || action) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          {action}
        </Box>
      )}
      {children}
    </Paper>
  );
}

function Delta({ value, inverse = false }) {
  if (value === null || value === undefined) {
    return <Chip size="small" icon={<FiberNewRoundedIcon />} label="New" sx={{ height: 22, fontSize: '0.7rem' }} />;
  }
  if (value === 0) return <Typography variant="caption" color="text.secondary">No change</Typography>;
  const up = value > 0;
  const good = inverse ? !up : up;
  const Icon = up ? TrendingUpRoundedIcon : TrendingDownRoundedIcon;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, color: good ? 'success.main' : 'error.main' }}>
      <Icon sx={{ fontSize: 16 }} />
      <Typography variant="caption" sx={{ fontWeight: 700 }}>{up ? '+' : ''}{pct(value)}</Typography>
    </Box>
  );
}

function Kpi({ label, value, delta, hint, inverse }) {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
      <Typography sx={{ fontFamily: "'Jost', sans-serif", fontSize: { xs: '1.45rem', md: '1.7rem' }, fontWeight: 600, lineHeight: 1.25, mt: 0.5 }}>{value}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, minHeight: 22 }}>
        {delta !== false && <Delta value={delta} inverse={inverse} />}
        {hint && <Typography variant="caption" color="text.secondary" noWrap>{hint}</Typography>}
      </Box>
    </Paper>
  );
}

function ActionTile({ icon: Icon, label, count, to, tone = 'primary' }) {
  const active = count > 0;
  return (
    <Box
      component={to ? Link : 'div'}
      to={to}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, textDecoration: 'none', color: 'inherit',
        border: '1px solid', borderColor: active ? (tone === 'error' ? 'error.light' : 'rgba(168,106,0,0.35)') : 'divider',
        bgcolor: active ? (tone === 'error' ? '#FDF3F2' : '#FBF5E8') : '#fff', transition: 'transform 0.15s ease',
        '&:hover': to ? { transform: 'translateY(-1px)' } : undefined,
      }}
    >
      <Box sx={{ width: 38, height: 38, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: '#fff', color: tone === 'error' && active ? 'error.main' : 'primary.main', border: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.1 }}>{count}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{label}</Typography>
      </Box>
    </Box>
  );
}

/**
 * Business dashboard for a seller (scoped) or the whole marketplace (mode="admin").
 * `load(range)` returns the /analytics payload.
 */
export default function BusinessDashboard({ load, mode = 'seller', ordersPath, productsPath, shipmentsPath }) {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    load(range)
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e.response?.data?.message || 'Could not load business data'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [range]);

  const isAdmin = mode === 'admin';
  const rangeLabel = RANGES.find((r) => r.key === range)?.label;

  return (
    <Box>
      {/* Filter row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
        <Typography variant="body2" color="text.secondary">
          {isAdmin ? 'Marketplace performance' : 'Your business performance'} · last {rangeLabel}, compared with the previous {rangeLabel}
        </Typography>
        <ToggleButtonGroup size="small" exclusive value={range} onChange={(e, v) => v && setRange(v)} sx={{ bgcolor: '#fff' }}>
          {RANGES.map((r) => <ToggleButton key={r.key} value={r.key} sx={{ px: 1.75, textTransform: 'none' }}>{r.label}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!data && loading && (
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, i) => <Grid item xs={6} md={3} key={i}><Skeleton variant="rounded" height={112} /></Grid>)}
          <Grid item xs={12}><Skeleton variant="rounded" height={300} /></Grid>
        </Grid>
      )}

      {data && (
        <Box sx={{ opacity: loading ? 0.55 : 1, transition: 'opacity 0.2s ease' }}>
          {/* KPIs */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} md={3}>
              <Kpi label="Sales" value={inr(data.kpis.sales)} delta={data.change.sales} />
            </Grid>
            <Grid item xs={6} md={3}>
              {isAdmin
                ? <Kpi label="Commission earned" value={inr(data.kpis.commission)} delta={data.change.commission} />
                : <Kpi label="Your earnings" value={inr(data.kpis.earnings)} delta={data.change.earnings} hint={`after ${inr(data.kpis.commission)} commission`} />}
            </Grid>
            <Grid item xs={6} md={3}>
              <Kpi label="Orders" value={data.kpis.orders.toLocaleString('en-IN')} delta={data.change.orders} hint={`${data.kpis.units} units`} />
            </Grid>
            <Grid item xs={6} md={3}>
              <Kpi label="Avg. order value" value={inr(data.kpis.avgOrderValue)} delta={data.change.avgOrderValue} />
            </Grid>
            <Grid item xs={6} md={3}>
              <Kpi label="Customers" value={data.kpis.customers} delta={data.change.customers} hint={isAdmin ? `${data.platform.newCustomers} new sign-ups` : undefined} />
            </Grid>
            <Grid item xs={6} md={3}>
              <Kpi label="Cancellation rate" value={pct(data.kpis.cancellationRate)} delta={false} hint={`${data.kpis.cancelled} cancelled`} />
            </Grid>
            <Grid item xs={6} md={3}>
              <Kpi label="Returns" value={data.kpis.returns} delta={false} hint="return / refund requests" />
            </Grid>
            <Grid item xs={6} md={3}>
              <Kpi
                label="Rating"
                value={data.reviews.average ? <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>{data.reviews.average.toFixed(1)}<StarRoundedIcon sx={{ color: SERIES_GOLD }} /></Box> : '—'}
                delta={false}
                hint={`${data.reviews.count} review${data.reviews.count === 1 ? '' : 's'}`}
              />
            </Grid>
          </Grid>

          {/* Needs attention */}
          <Card title="Needs your attention" subtitle="Live work queue — not limited to the selected period" sx={{ mb: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 1.25 }}>
              <ActionTile icon={AssignmentTurnedInOutlinedIcon} label="New — to confirm" count={data.actions.toConfirm} to={ordersPath && `${ordersPath}?status=PLACED`} />
              <ActionTile icon={Inventory2OutlinedIcon} label="To pack" count={data.actions.toPack} to={ordersPath && `${ordersPath}?status=CONFIRMED`} />
              <ActionTile icon={MoveToInboxOutlinedIcon} label="Ready to ship" count={data.actions.readyToShip} to={ordersPath && `${ordersPath}?status=PACKED`} />
              <ActionTile icon={LocalShippingOutlinedIcon} label="Awaiting pickup" count={data.actions.awaitingPickup} to={shipmentsPath || ordersPath} />
              <ActionTile icon={AssignmentReturnOutlinedIcon} label="Return requests" count={data.actions.returnRequests} to={ordersPath && `${ordersPath}?status=RETURN_REQUESTED`} tone="error" />
              <ActionTile icon={ReportProblemOutlinedIcon} label="RTO / failed" count={data.actions.rto + data.actions.failedShipments} to={shipmentsPath || ordersPath} tone="error" />
            </Box>
          </Card>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} lg={8}>
              <Card title="Sales" subtitle={`${data.trend.granularity === 'month' ? 'Monthly' : 'Daily'} sales · hover for orders`}>
                <TrendChart points={data.trend.points} granularity={data.trend.granularity} />
              </Card>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Card title="Orders by status" subtitle={`Last ${rangeLabel}`}>
                <BarList rows={data.orderStatus.map((s) => ({ label: ORDER_STATUS_LABEL[s.status] || s.status, value: s.count }))} />
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6} lg={4}>
              <Card title="Payments" subtitle="Share of sales by payment method">
                <SplitBar
                  parts={data.payments.methods.map((m) => ({
                    label: m.method === 'COD' ? 'Cash on Delivery' : 'Online',
                    value: m.sales,
                    color: m.method === 'COD' ? SERIES_GOLD : SERIES_BLUE,
                    display: `${inr(m.sales)} · ${m.orders} orders`,
                  }))}
                />
                <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: '#FBF5E8', display: 'flex', gap: 1, alignItems: 'center' }}>
                  <WarningAmberRoundedIcon sx={{ color: 'warning.main' }} fontSize="small" />
                  <Typography variant="body2"><b>{inr(data.payments.codPendingAmount)}</b> COD still to be collected ({data.payments.codPendingOrders} orders)</Typography>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <Card title="Shipping" subtitle={`Shipments created in the last ${rangeLabel}`}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 2 }}>
                  {[
                    ['Delivered', data.shipping.delivered],
                    ['In transit', data.shipping.inTransit],
                    ['RTO rate', pct(data.shipping.rtoRate)],
                  ].map(([l, v]) => (
                    <Box key={l} sx={{ textAlign: 'center', p: 1, borderRadius: 2, bgcolor: 'background.default' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{v}</Typography>
                      <Typography variant="caption" color="text.secondary">{l}</Typography>
                    </Box>
                  ))}
                </Box>
                <BarList
                  rows={data.shipping.byStatus.map((s) => ({ label: SHIPMENT_STATUS_LABEL[s.status] || s.status, value: s.count }))}
                  emptyText="No shipments in this period"
                />
                {data.shipping.avgDeliveryDays !== null && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                    Average delivery time: <b>{data.shipping.avgDeliveryDays.toFixed(1)} days</b>
                  </Typography>
                )}
              </Card>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Card title="Top locations" subtitle="Where orders are going">
                <BarList
                  rows={data.topLocations.map((l) => ({ label: `${l.city}, ${l.state}`, value: l.orders }))}
                  format={(v) => `${v} order${v === 1 ? '' : 's'}`}
                />
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} lg={isAdmin ? 6 : 7}>
              <Card title="Top products" subtitle={`By sales, last ${rangeLabel}`} action={productsPath && <Button size="small" component={Link} to={productsPath}>All products</Button>}>
                {data.topProducts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No sales in this period yet.</Typography>
                ) : data.topProducts.map((p, i) => (
                  <Box key={p.productId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderTop: i ? '1px solid' : 'none', borderColor: 'divider' }}>
                    <Typography sx={{ width: 18, color: 'text.secondary', fontWeight: 700 }}>{i + 1}</Typography>
                    <Box sx={{ width: 44, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                      <ProductImage src={p.image} alt={p.name} placeholderLabel={false} sizes="44px" />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.units} sold</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700 }}>{inr(p.sales)}</Typography>
                  </Box>
                ))}
              </Card>
            </Grid>
            {isAdmin ? (
              <Grid item xs={12} lg={6}>
                <Card title="Top sellers" subtitle={`By sales, last ${rangeLabel}`}>
                  <BarList rows={data.platform.topSellers.map((s) => ({ label: s.name, value: s.sales }))} format={inr} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mt: 2 }}>
                    {[
                      ['Active sellers', data.platform.activeSellers, '/sellers'],
                      ['Sellers to approve', data.platform.pendingSellers, '/sellers'],
                      ['Products to approve', data.platform.pendingProducts, '/products?status=PENDING_REVIEW'],
                    ].map(([l, v, to]) => (
                      <Box key={l} component={Link} to={`${ordersPath?.startsWith('/super-admin') ? '/super-admin' : '/admin'}${to}`} sx={{ textDecoration: 'none', color: 'inherit', textAlign: 'center', p: 1, borderRadius: 2, bgcolor: v && l !== 'Active sellers' ? '#FBF5E8' : 'background.default' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{v}</Typography>
                        <Typography variant="caption" color="text.secondary">{l}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Card>
              </Grid>
            ) : (
              <Grid item xs={12} lg={5}>
                <Card title="Stock health" subtitle={`${data.inventory.liveProducts} live products · ${data.inventory.unitsInStock.toLocaleString('en-IN')} units in stock`}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                    <Chip size="small" color={data.inventory.outOfStockVariants ? 'error' : 'default'} label={`${data.inventory.outOfStockVariants} out of stock`} />
                    <Chip size="small" color={data.inventory.lowStockVariants ? 'warning' : 'default'} label={`${data.inventory.lowStockVariants} running low`} />
                  </Box>
                  {data.inventory.lowStock.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">All good — nothing is running low.</Typography>
                  ) : data.inventory.lowStock.map((s) => (
                    <Box key={`${s.productId}-${s.sku}`} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap>{s.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.sku}</Typography>
                      </Box>
                      <Chip size="small" variant="outlined" color={s.stock <= 0 ? 'error' : 'warning'} label={s.stock <= 0 ? 'Out of stock' : `${s.stock} left`} />
                    </Box>
                  ))}
                </Card>
              </Grid>
            )}
          </Grid>

          {isAdmin && (
            <Card title="Stock health" subtitle={`${data.inventory.liveProducts} live products across all sellers`} sx={{ mb: 2, height: 'auto' }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip size="small" color={data.inventory.outOfStockVariants ? 'error' : 'default'} label={`${data.inventory.outOfStockVariants} variants out of stock`} />
                <Chip size="small" color={data.inventory.lowStockVariants ? 'warning' : 'default'} label={`${data.inventory.lowStockVariants} running low`} />
                <Chip size="small" label={`${data.inventory.unitsInStock.toLocaleString('en-IN')} units in stock`} />
              </Box>
            </Card>
          )}

          <Card
            title="Recent orders"
            action={ordersPath && <Button size="small" component={Link} to={ordersPath}>View all</Button>}
            sx={{ height: 'auto' }}
          >
            {data.recentOrders.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No orders yet.</Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      {isAdmin && <TableCell>Seller</TableCell>}
                      <TableCell>Payment</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Shipment</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recentOrders.map((o) => (
                      <TableRow
                        key={o.id}
                        hover
                        onClick={ordersPath ? () => navigate(`${ordersPath}/${isAdmin ? o.orderId : o.id}`) : undefined}
                        sx={{ cursor: ordersPath ? 'pointer' : 'default' }}
                      >
                        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{o.orderNumber}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(o.createdAt)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'rgba(168,106,0,0.15)', color: 'primary.main' }}>{(o.customerName || '?')[0]}</Avatar>
                            <Box>
                              <Typography variant="body2" noWrap>{o.customerName}</Typography>
                              <Typography variant="caption" color="text.secondary">{o.city}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        {isAdmin && <TableCell>{o.sellerName}</TableCell>}
                        <TableCell>{o.paymentMethod === 'COD' ? 'COD' : 'Online'}</TableCell>
                        <TableCell><Chip size="small" variant="outlined" color={ORDER_STATUS_COLOR[o.status] || 'default'} label={ORDER_STATUS_LABEL[o.status] || o.status} /></TableCell>
                        <TableCell>
                          <Tooltip title={o.shipmentStatus ? 'Courier status' : 'No shipment yet'}>
                            <Typography variant="body2" color={o.shipmentStatus ? 'text.primary' : 'text.secondary'}>{SHIPMENT_STATUS_LABEL[o.shipmentStatus] || '—'}</Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{inr(o.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Card>
        </Box>
      )}
    </Box>
  );
}
