const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const { success } = require('../../utils/response');
const shiprocket = require('../../services/shiprocket.service');

async function loadSellerOrder(sellerOrderId) {
  const sellerOrder = await db.queryOne(
    `SELECT so.id, so.seller_id, so.subtotal, o.payment_method, o.shipping_pincode
     FROM seller_orders so JOIN orders o ON o.id = so.order_id WHERE so.id = :id`,
    { id: sellerOrderId }
  );
  if (!sellerOrder) throw ApiError.notFound('Order not found');
  return sellerOrder;
}

// Mirrors Shiprocket's own seller-panel tabs (New / Ready To Ship / Pickup / In Transit /
// Delivered / RTO / All Orders) so the admin Shipments page reads the same way. NOT_CREATED is a
// virtual status (sh.id IS NULL, no shipments row yet) folded into "New" alongside
// SHIPMENT_CREATED, since both mean "needs a shipping action next."
const STATUS_BUCKETS = {
  NEW: ['NOT_CREATED', 'SHIPMENT_CREATED'],
  READY_TO_SHIP: ['AWB_ASSIGNED'],
  PICKUP: ['PICKUP_REQUESTED'],
  IN_TRANSIT: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'],
  DELIVERED: ['DELIVERED'],
  RTO: ['RTO_INITIATED', 'RTO_IN_TRANSIT', 'RTO_DELIVERED'],
};

/**
 * Builds the SQL condition (and binds params) for a bucket key; returns null for 'ALL'/unknown.
 * A cancelled seller_order is excluded from every actionable bucket — there's no shipping action
 * left to take on it, so it shouldn't sit in "New" looking like it's still awaiting one. It's
 * still visible (with its CANCELLED order status) under "All Orders".
 */
function bucketCondition(bucket, params) {
  const statuses = STATUS_BUCKETS[bucket];
  if (!statuses) return null;
  const parts = [];
  if (statuses.includes('NOT_CREATED')) parts.push('sh.id IS NULL');
  const realStatuses = statuses.filter((s) => s !== 'NOT_CREATED');
  if (realStatuses.length) {
    parts.push('sh.status IN (:bucketStatuses)');
    params.bucketStatuses = realStatuses;
  }
  return `((${parts.join(' OR ')}) AND so.status != 'CANCELLED')`;
}

/**
 * Every seller_order, LEFT JOINed to its shipment — so orders that never had a shipment created
 * yet still show up (as NOT_CREATED) instead of only surfacing ones an admin already acted on.
 * This is the "overall tracking" view; drilling into an order (existing getShipment + the
 * order-detail ShipmentPanel) is still where the create/AWB/pickup/track actions live.
 */
async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = {};
    const bucketWhere = req.query.bucket === 'CANCELLED' ? "so.status = 'CANCELLED'" : req.query.bucket ? bucketCondition(req.query.bucket, params) : null;
    if (bucketWhere) {
      conditions.push(bucketWhere);
    } else if (req.query.status === 'NOT_CREATED') {
      conditions.push('sh.id IS NULL');
    } else if (req.query.status) {
      conditions.push('sh.status = :status');
      params.status = req.query.status;
    }
    if (req.query.search) {
      conditions.push('(o.order_number LIKE :search OR so.sub_order_number LIKE :search OR c.name LIKE :search OR sh.tracking_number LIKE :search OR s.display_name LIKE :search)');
      params.search = `%${req.query.search}%`;
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = await db.query(
      `SELECT so.id AS seller_order_id, so.sub_order_number, so.status AS order_status,
              s.id AS seller_id, s.display_name AS seller_name,
              o.id AS order_id, o.order_number, o.payment_method, o.placed_at,
              c.name AS customer_name,
              sh.id AS shipment_id, sh.status AS shipment_status, sh.courier_name,
              sh.tracking_number, sh.tracking_url, sh.updated_at AS shipment_updated_at
       FROM seller_orders so
       JOIN sellers s ON s.id = so.seller_id
       JOIN orders o ON o.id = so.order_id
       JOIN customers c ON c.id = o.customer_id
       LEFT JOIN shipments sh ON sh.seller_order_id = so.id
       ${where}
       ORDER BY o.placed_at DESC
       LIMIT :limit OFFSET :offset`,
      { ...params, limit, offset }
    );
    const [{ total }] = await db.query(
      `SELECT COUNT(*) AS total
       FROM seller_orders so
       JOIN sellers s ON s.id = so.seller_id
       JOIN orders o ON o.id = so.order_id
       JOIN customers c ON c.id = o.customer_id
       LEFT JOIN shipments sh ON sh.seller_order_id = so.id
       ${where}`,
      params
    );

    return success(res, { data: rows, meta: { page, limit, total: Number(total) } });
  } catch (err) {
    return next(err);
  }
}

/** Counts per tab bucket, for the tab-header badges — independent of the current page/search. */
async function counts(req, res, next) {
  try {
    const [row] = await db.query(
      `SELECT
         SUM(CASE WHEN (sh.id IS NULL OR sh.status = 'SHIPMENT_CREATED') AND so.status != 'CANCELLED' THEN 1 ELSE 0 END) AS NEW,
         SUM(CASE WHEN sh.status = 'AWB_ASSIGNED' AND so.status != 'CANCELLED' THEN 1 ELSE 0 END) AS READY_TO_SHIP,
         SUM(CASE WHEN sh.status = 'PICKUP_REQUESTED' AND so.status != 'CANCELLED' THEN 1 ELSE 0 END) AS PICKUP,
         SUM(CASE WHEN sh.status IN ('PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY') AND so.status != 'CANCELLED' THEN 1 ELSE 0 END) AS IN_TRANSIT,
         SUM(CASE WHEN sh.status = 'DELIVERED' THEN 1 ELSE 0 END) AS DELIVERED,
         SUM(CASE WHEN sh.status IN ('RTO_INITIATED','RTO_IN_TRANSIT','RTO_DELIVERED') THEN 1 ELSE 0 END) AS RTO,
         SUM(CASE WHEN so.status = 'CANCELLED' THEN 1 ELSE 0 END) AS CANCELLED,
         COUNT(*) AS ALL_ORDERS
       FROM seller_orders so
       LEFT JOIN shipments sh ON sh.seller_order_id = so.id`
    );
    return success(res, {
      data: {
        NEW: Number(row.NEW), READY_TO_SHIP: Number(row.READY_TO_SHIP), PICKUP: Number(row.PICKUP),
        IN_TRANSIT: Number(row.IN_TRANSIT), DELIVERED: Number(row.DELIVERED), RTO: Number(row.RTO),
        CANCELLED: Number(row.CANCELLED), ALL: Number(row.ALL_ORDERS),
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function getShipment(req, res, next) {
  try {
    const shipment = await db.queryOne('SELECT * FROM shipments WHERE seller_order_id = :id', { id: req.params.sellerOrderId });
    const tracking = shipment
      ? await db.query('SELECT status, location, note, tracked_at FROM shipment_tracking WHERE shipment_id = :id ORDER BY tracked_at ASC', { id: shipment.id })
      : [];
    return success(res, { data: { shipment, tracking } });
  } catch (err) {
    return next(err);
  }
}

async function createShipment(req, res, next) {
  try {
    await loadSellerOrder(req.params.sellerOrderId);
    const result = await shiprocket.createOrder(req.params.sellerOrderId);
    return success(res, { status: 201, message: 'Shiprocket shipment created', data: result });
  } catch (err) {
    return next(err);
  }
}

async function getCouriers(req, res, next) {
  try {
    const sellerOrder = await loadSellerOrder(req.params.sellerOrderId);
    const address = await db.queryOne(
      "SELECT pincode FROM seller_addresses WHERE seller_id = :id AND type = 'REGISTERED' LIMIT 1",
      { id: sellerOrder.seller_id }
    );
    if (!address) throw ApiError.badRequest("Seller has no registered pickup address");

    const result = await shiprocket.getAvailableCouriers({
      pickupPincode: address.pincode,
      deliveryPincode: sellerOrder.shipping_pincode,
      weight: 0.5,
      cod: sellerOrder.payment_method === 'COD',
      declaredValue: Number(sellerOrder.subtotal),
    });
    const couriers = result?.data?.available_courier_companies || [];
    return success(res, {
      data: couriers.map((c) => ({
        courierId: c.courier_company_id,
        courierName: c.courier_name,
        rate: Number(c.rate),
        codCharges: Number(c.cod_charges || 0),
        etd: c.etd,
        ratingOutOf5: c.rating,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function generateAWB(req, res, next) {
  try {
    const shipment = await db.queryOne('SELECT shiprocket_shipment_id FROM shipments WHERE seller_order_id = :id', { id: req.params.sellerOrderId });
    if (!shipment?.shiprocket_shipment_id) throw ApiError.conflict('Create the Shiprocket shipment before generating an AWB');
    const result = await shiprocket.generateAWB(shipment.shiprocket_shipment_id, req.body.courierId);
    if (result?.awb_assign_status !== 1) {
      throw ApiError.conflict(result?.response?.data?.awb_code ? 'AWB already assigned' : 'AWB generation failed — courier may be unserviceable');
    }
    await db.query(
      `INSERT INTO order_status_history (seller_order_id, status, note) VALUES (:id, 'AWB_ASSIGNED', :note)`,
      { id: req.params.sellerOrderId, note: `AWB ${result.response.data.awb_code} assigned via ${result.response.data.courier_name}` }
    );
    return success(res, { message: 'AWB generated', data: result });
  } catch (err) {
    return next(err);
  }
}

async function requestPickup(req, res, next) {
  try {
    const shipment = await db.queryOne('SELECT shiprocket_shipment_id FROM shipments WHERE seller_order_id = :id', { id: req.params.sellerOrderId });
    if (!shipment?.shiprocket_shipment_id) throw ApiError.conflict('No Shiprocket shipment found for this order');
    const result = await shiprocket.requestPickup(shipment.shiprocket_shipment_id);
    await db.query(
      `INSERT INTO order_status_history (seller_order_id, status, note) VALUES (:id, 'PICKUP_REQUESTED', 'Pickup requested from Shiprocket')`,
      { id: req.params.sellerOrderId }
    );
    return success(res, { message: 'Pickup requested', data: result });
  } catch (err) {
    return next(err);
  }
}

async function generateLabel(req, res, next) {
  try {
    const shipment = await db.queryOne('SELECT shiprocket_shipment_id FROM shipments WHERE seller_order_id = :id', { id: req.params.sellerOrderId });
    if (!shipment?.shiprocket_shipment_id) throw ApiError.conflict('No Shiprocket shipment found for this order');
    const result = await shiprocket.generateLabel(shipment.shiprocket_shipment_id);
    return success(res, { message: 'Label generated', data: result });
  } catch (err) {
    return next(err);
  }
}

async function trackShipment(req, res, next) {
  try {
    await shiprocket.syncShipmentStatus(req.params.sellerOrderId);
    const shipment = await db.queryOne('SELECT * FROM shipments WHERE seller_order_id = :id', { id: req.params.sellerOrderId });
    const tracking = shipment
      ? await db.query('SELECT status, location, note, tracked_at FROM shipment_tracking WHERE shipment_id = :id ORDER BY tracked_at ASC', { id: shipment.id })
      : [];
    return success(res, { data: { shipment, tracking } });
  } catch (err) {
    return next(err);
  }
}

async function cancelShipment(req, res, next) {
  try {
    const shipment = await db.queryOne('SELECT shiprocket_order_id FROM shipments WHERE seller_order_id = :id', { id: req.params.sellerOrderId });
    if (!shipment?.shiprocket_order_id) throw ApiError.conflict('No Shiprocket order found for this order');
    const result = await shiprocket.cancelShipment(shipment.shiprocket_order_id);
    await db.query(
      `INSERT INTO order_status_history (seller_order_id, status, note) VALUES (:id, 'CANCELLED', 'Shipment cancelled via Shiprocket')`,
      { id: req.params.sellerOrderId }
    );
    return success(res, { message: 'Shipment cancelled', data: result });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, counts, getShipment, createShipment, getCouriers, generateAWB, requestPickup, generateLabel, trackShipment, cancelShipment };
