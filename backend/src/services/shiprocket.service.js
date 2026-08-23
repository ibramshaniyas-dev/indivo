const client = require('./shiprocketClient');
const db = require('../config/database');
const logger = require('../utils/logger');

// Endpoints below are Shiprocket's documented v1 "external" API (base:
// https://apiv2.shiprocket.in/v1/external — see env.shiprocket.baseUrl). If Shiprocket has since
// moved/renamed one of these, the ShiprocketApiError thrown by shiprocketClient will surface the
// exact status/response body in logs rather than failing silently — check that against the
// current docs at https://apidocs.shiprocket.in before assuming the code is wrong.

async function authenticate() {
  // Forces a token fetch (bypassing nothing — getToken() inside the client already caches).
  // Exposed mainly so setup/health-check scripts can verify credentials without a business call.
  return client.get('/orders?per_page=1');
}

/**
 * Builds and submits a Shiprocket "adhoc" order from an existing seller_order. This is order
 * creation + shipment creation combined — Shiprocket's create-adhoc-order endpoint returns both
 * an order_id and a shipment_id in one call.
 */
async function createOrder(sellerOrderId) {
  const sellerOrder = await db.queryOne(
    `SELECT so.id, so.sub_order_number, so.subtotal, so.tax, so.shipping_charge, s.id AS seller_id,
            o.shipping_name, o.shipping_mobile, o.shipping_address1, o.shipping_address2,
            o.shipping_city, o.shipping_state, o.shipping_pincode, o.payment_method,
            c.email AS customer_email
     FROM seller_orders so
     JOIN orders o ON o.id = so.order_id
     JOIN customers cust ON cust.id = o.customer_id
     JOIN users c ON c.id = cust.user_id
     JOIN sellers s ON s.id = so.seller_id
     WHERE so.id = :sellerOrderId`,
    { sellerOrderId }
  );
  if (!sellerOrder) throw new Error(`seller_order ${sellerOrderId} not found`);

  const warehouse = await db.queryOne(
    "SELECT name, address_line1, city, state, pincode FROM warehouses WHERE seller_id = :sellerId AND is_default = 1 LIMIT 1",
    { sellerId: sellerOrder.seller_id }
  );
  if (!warehouse) {
    throw new Error('Seller has no default warehouse/pickup location configured in Shiprocket-compatible form');
  }

  const items = await db.query(
    'SELECT product_name, sku, quantity, price FROM order_items WHERE seller_order_id = :id',
    { id: sellerOrderId }
  );

  const nameParts = sellerOrder.shipping_name.split(' ');
  const firstName = nameParts[0] || sellerOrder.shipping_name;
  const lastName = nameParts.slice(1).join(' ') || '.';

  const payload = {
    order_id: sellerOrder.sub_order_number,
    order_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
    pickup_location: warehouse.name,
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: sellerOrder.shipping_address1,
    billing_address_2: sellerOrder.shipping_address2 || '',
    billing_city: sellerOrder.shipping_city,
    billing_pincode: sellerOrder.shipping_pincode,
    billing_state: sellerOrder.shipping_state,
    billing_country: 'India',
    billing_email: sellerOrder.customer_email || 'no-reply@indivo.iharogroups.com',
    billing_phone: sellerOrder.shipping_mobile,
    shipping_is_billing: true,
    order_items: items.map((item) => ({
      name: item.product_name,
      sku: item.sku,
      units: item.quantity,
      selling_price: item.price,
    })),
    payment_method: sellerOrder.payment_method === 'COD' ? 'COD' : 'Prepaid',
    sub_total: Number(sellerOrder.subtotal),
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
  };

  const result = await client.post('/orders/create/adhoc', payload);

  await db.query(
    `INSERT INTO shipments (seller_order_id, shiprocket_order_id, shiprocket_shipment_id, status)
     VALUES (:sellerOrderId, :shiprocketOrderId, :shipmentId, 'SHIPMENT_CREATED')
     ON DUPLICATE KEY UPDATE shiprocket_order_id = VALUES(shiprocket_order_id),
       shiprocket_shipment_id = VALUES(shiprocket_shipment_id), status = 'SHIPMENT_CREATED'`,
    { sellerOrderId, shiprocketOrderId: result.order_id, shipmentId: result.shipment_id }
  );
  await db.query(
    `INSERT INTO order_status_history (seller_order_id, status, note) VALUES (:id, 'SHIPMENT_CREATED', 'Shiprocket order created')`,
    { id: sellerOrderId }
  );

  logger.info('Shiprocket: order created', { sellerOrderId, shiprocketOrderId: result.order_id });
  return result;
}

async function getAvailableCouriers({ pickupPincode, deliveryPincode, weight, cod, declaredValue }) {
  return client.get('/courier/serviceability/', {
    pickup_postcode: pickupPincode,
    delivery_postcode: deliveryPincode,
    weight,
    cod: cod ? 1 : 0,
    declared_value: declaredValue,
  });
}

async function generateAWB(shipmentId, courierId) {
  const result = await client.post('/courier/assign/awb', { shipment_id: shipmentId, courier_id: courierId });
  const awb = result?.response?.data;
  if (awb) {
    await db.query(
      `UPDATE shipments SET tracking_number = :awb, courier_id = :courierId, courier_name = :courierName, status = 'AWB_ASSIGNED'
       WHERE shiprocket_shipment_id = :shipmentId`,
      { awb: awb.awb_code, courierId, courierName: awb.courier_name, shipmentId }
    );
  }
  return result;
}

async function requestPickup(shipmentId) {
  const result = await client.post('/courier/generate/pickup', { shipment_id: [shipmentId] });
  await db.query(
    "UPDATE shipments SET status = 'PICKUP_REQUESTED', pickup_date = CURDATE() WHERE shiprocket_shipment_id = :shipmentId",
    { shipmentId }
  );
  return result;
}

async function generateLabel(shipmentId) {
  const result = await client.post('/courier/generate/label', { shipment_id: [shipmentId] });
  if (result?.label_url) {
    await db.query('UPDATE shipments SET label_url = :url WHERE shiprocket_shipment_id = :shipmentId', {
      url: result.label_url, shipmentId,
    });
  }
  return result;
}

async function trackShipment(awbCode) {
  return client.get(`/courier/track/awb/${awbCode}`);
}

async function cancelShipment(shiprocketOrderId) {
  const result = await client.post('/orders/cancel', { ids: [shiprocketOrderId] });
  await db.query("UPDATE shipments SET status = 'CANCELLED' WHERE shiprocket_order_id = :id", { id: shiprocketOrderId });
  return result;
}

async function getShipmentDetails(shiprocketOrderId) {
  return client.get(`/orders/show/${shiprocketOrderId}`);
}

async function getShippingRates(params) {
  return getAvailableCouriers(params);
}

/** Polls Shiprocket for the latest status of a shipment and mirrors it into our shipments/tracking tables. */
async function syncShipmentStatus(sellerOrderId) {
  const shipment = await db.queryOne('SELECT * FROM shipments WHERE seller_order_id = :id', { id: sellerOrderId });
  if (!shipment?.tracking_number) return null;

  const tracking = await trackShipment(shipment.tracking_number);
  const activities = tracking?.tracking_data?.shipment_track_activities || [];
  for (const activity of activities) {
    await db.query(
      `INSERT INTO shipment_tracking (shipment_id, status, location, note, tracked_at)
       VALUES (:shipmentId, :status, :location, :note, :trackedAt)`,
      {
        shipmentId: shipment.id, status: activity.status || 'UPDATE', location: activity.location || null,
        note: activity['sr-status-label'] || null, trackedAt: activity.date || new Date(),
      }
    );
  }
  return tracking;
}

async function getCODRemittance(params) {
  return client.get('/orders/cod-remittance', params);
}

async function reconcileCOD() {
  // Placeholder for the settlement-matching pass (Phase 6 — COD Reconciliation dashboard):
  // pulls getCODRemittance(), matches against cod_transactions by AWB, records cod_remittances.
  throw new Error('reconcileCOD is implemented in Phase 6 (COD Reconciliation)');
}

module.exports = {
  authenticate, createOrder, getAvailableCouriers, generateAWB, requestPickup, generateLabel,
  trackShipment, cancelShipment, getShipmentDetails, getShippingRates, syncShipmentStatus,
  getCODRemittance, reconcileCOD,
};
