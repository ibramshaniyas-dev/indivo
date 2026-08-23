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

module.exports = { getShipment, createShipment, getCouriers, generateAWB, requestPickup, generateLabel, trackShipment, cancelShipment };
