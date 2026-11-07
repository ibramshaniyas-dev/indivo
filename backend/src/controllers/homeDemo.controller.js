const demo = require('../services/homeDemo.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { success } = require('../utils/response');

const wrap = (fn) => async (req, res, next) => {
  try { return await fn(req, res); } catch (err) { return next(err); }
};
const id = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw ApiError.badRequest('Invalid id');
  return n;
};

// ---------------- Public / customer ----------------

const availability = wrap(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  return success(res, { data: await demo.availability(req.query.lat, req.query.lng) });
});

const book = wrap(async (req, res) => {
  const result = await demo.createBooking(req.user.customerId, req.body);
  logger.info('Home demo booked', { customerId: req.user.customerId, bookingId: result.id, zoneId: result.zone.id });
  return success(res, {
    status: 201,
    message: `Home demo booked — a SEESHAA executive will visit within ${result.zone.slaMinutes} minutes`,
    data: result,
  });
});

const myBookings = wrap(async (req, res) => success(res, { data: await demo.customerBookings(req.user.customerId) }));

const cancelMine = wrap(async (req, res) => {
  await demo.cancelByCustomer(id(req.params.id), req.user.customerId, req.body?.reason);
  return success(res, { message: 'Home demo cancelled' });
});

// ---------------- Admin ----------------

const listZones = wrap(async (req, res) => success(res, { data: await demo.listZones() }));
const createZone = wrap(async (req, res) => success(res, { status: 201, message: 'Demo location created', data: { id: await demo.createZone(req.body) } }));
const updateZone = wrap(async (req, res) => {
  await demo.updateZone(id(req.params.id), req.body);
  return success(res, { message: 'Demo location updated' });
});
const deleteZone = wrap(async (req, res) => {
  const r = await demo.deleteZone(id(req.params.id));
  return success(res, { message: r.deactivated ? 'Location has booking history, so it was switched off instead of deleted' : 'Demo location deleted' });
});
const zoneProducts = wrap(async (req, res) => success(res, { data: await demo.zoneProducts(id(req.params.id)) }));
const setZoneProduct = wrap(async (req, res) => {
  await demo.setZoneProduct(id(req.params.id), id(req.params.productId), req.body.pieces ?? 1);
  return success(res, { message: 'Demo piece saved' });
});
const removeZoneProduct = wrap(async (req, res) => {
  await demo.removeZoneProduct(id(req.params.id), id(req.params.productId));
  return success(res, { message: 'Removed from this location' });
});

const listBookings = wrap(async (req, res) => success(res, {
  data: await demo.adminBookings({
    status: req.query.status || '',
    zoneId: req.query.zoneId ? id(req.query.zoneId) : null,
    page: Number(req.query.page) || 1,
    limit: Math.min(100, Number(req.query.limit) || 25),
  }),
}));

const MESSAGES = {
  confirm: 'Booking confirmed and executive assigned',
  dispatch: 'Marked as on the way',
  purchased: 'Sale recorded — order created as delivered and paid',
  not_purchased: 'Marked as not purchased',
  cancel: 'Booking cancelled',
};
const updateBooking = wrap(async (req, res) => {
  const { action } = req.params;
  const result = await demo.updateBooking(id(req.params.id), action, req.body || {}, req.user.id);
  logger.info('Home demo booking updated', { userId: req.user.id, bookingId: req.params.id, action, orderId: result.orderId });
  return success(res, { message: MESSAGES[action] || 'Updated', data: result });
});

module.exports = {
  availability, book, myBookings, cancelMine,
  listZones, createZone, updateZone, deleteZone, zoneProducts, setZoneProduct, removeZoneProduct, listBookings, updateBooking,
};
