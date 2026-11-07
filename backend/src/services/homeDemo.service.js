const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { getCommissionRate, computeCommissionAmount } = require('./commission.service');

/**
 * Home demo — "try at home within 1 hour".
 *  - Super Admin defines demo zones (map pin + radius) and assigns demo pieces (products) to them.
 *  - A customer whose location falls inside a zone can book a SEESHAA executive to bring the piece.
 *  - Lifecycle: REQUESTED → CONFIRMED (agent assigned) → ON_THE_WAY → PURCHASED | NOT_PURCHASED,
 *    or CANCELLED at any point before completion.
 *  - PURCHASED hands the piece over on the spot: a normal order is created already DELIVERED and
 *    PAID (no courier), so it flows into dashboards, commission, seller earnings and payouts.
 */

const ACTIVE_BOOKING = "'REQUESTED','CONFIRMED','ON_THE_WAY'";

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function validCoords(lat, lng) {
  const la = Number(lat); const lo = Number(lng);
  return Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180 ? { lat: la, lng: lo } : null;
}

const nextNumber = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// ------------------------------------------------------------------ zones (admin)

async function listZones() {
  const rows = await db.query(
    `SELECT z.*,
            (SELECT COUNT(*) FROM demo_zone_products zp WHERE zp.zone_id = z.id) AS productCount,
            (SELECT COUNT(*) FROM demo_bookings b WHERE b.zone_id = z.id AND b.status IN (${ACTIVE_BOOKING})) AS activeBookings,
            (SELECT COUNT(*) FROM demo_bookings b WHERE b.zone_id = z.id AND b.status = 'PURCHASED') AS purchases
       FROM demo_zones z ORDER BY z.is_active DESC, z.name`
  );
  return rows.map((z) => ({
    id: z.id, name: z.name, city: z.city, latitude: Number(z.latitude), longitude: Number(z.longitude),
    radiusKm: Number(z.radius_km), slaMinutes: z.sla_minutes, isActive: Boolean(z.is_active),
    productCount: Number(z.productCount), activeBookings: Number(z.activeBookings), purchases: Number(z.purchases),
  }));
}

function zonePayload(body) {
  const coords = validCoords(body.latitude, body.longitude);
  if (!coords) throw ApiError.badRequest('Drop a pin on the map to set the location');
  const name = String(body.name || '').trim();
  if (!name) throw ApiError.badRequest('Give this location a name');
  const radiusKm = Number(body.radiusKm);
  if (!Number.isFinite(radiusKm) || radiusKm < 0.5 || radiusKm > 50) throw ApiError.badRequest('Radius must be between 0.5 and 50 km');
  const slaMinutes = Number(body.slaMinutes || 60);
  if (!Number.isInteger(slaMinutes) || slaMinutes < 15 || slaMinutes > 480) throw ApiError.badRequest('Visit time must be between 15 and 480 minutes');
  return {
    name: name.slice(0, 120), city: String(body.city || '').trim().slice(0, 100) || null,
    latitude: coords.lat, longitude: coords.lng, radiusKm, slaMinutes, isActive: body.isActive === false ? 0 : 1,
  };
}

async function createZone(body) {
  const z = zonePayload(body);
  const r = await db.query(
    `INSERT INTO demo_zones (name, city, latitude, longitude, radius_km, sla_minutes, is_active)
     VALUES (:name, :city, :latitude, :longitude, :radiusKm, :slaMinutes, :isActive)`,
    z
  );
  return r.insertId;
}

async function updateZone(id, body) {
  const z = zonePayload(body);
  const r = await db.query(
    `UPDATE demo_zones SET name = :name, city = :city, latitude = :latitude, longitude = :longitude,
            radius_km = :radiusKm, sla_minutes = :slaMinutes, is_active = :isActive WHERE id = :id`,
    { ...z, id }
  );
  if (!r.affectedRows) throw ApiError.notFound('Location not found');
}

/** Deletes a zone with no booking history; otherwise it is deactivated to keep records intact. */
async function deleteZone(id) {
  const used = await db.queryOne('SELECT COUNT(*) AS n FROM demo_bookings WHERE zone_id = :id', { id });
  if (Number(used.n) > 0) {
    await db.query('UPDATE demo_zones SET is_active = 0 WHERE id = :id', { id });
    return { deactivated: true };
  }
  await db.query('DELETE FROM demo_zones WHERE id = :id', { id });
  return { deleted: true };
}

async function zoneProducts(zoneId) {
  const rows = await db.query(
    `SELECT zp.product_id AS productId, zp.pieces, p.name, p.slug, p.status, s.display_name AS sellerName,
            (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.status = 'ACTIVE') AS price,
            (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order LIMIT 1) AS image,
            (SELECT COUNT(*) FROM demo_bookings b WHERE b.zone_id = zp.zone_id AND b.product_id = p.id AND b.status IN (${ACTIVE_BOOKING})) AS inUse
       FROM demo_zone_products zp
       JOIN products p ON p.id = zp.product_id
       JOIN sellers s ON s.id = p.seller_id
      WHERE zp.zone_id = :zoneId
      ORDER BY p.name`,
    { zoneId }
  );
  return rows.map((r) => ({ ...r, pieces: Number(r.pieces), inUse: Number(r.inUse), price: Number(r.price || 0) }));
}

async function setZoneProduct(zoneId, productId, pieces) {
  const n = Number(pieces);
  if (!Number.isInteger(n) || n < 0 || n > 100) throw ApiError.badRequest('Pieces must be a whole number from 0 to 100');
  const product = await db.queryOne("SELECT id FROM products WHERE id = :productId AND status = 'ACTIVE'", { productId });
  if (!product) throw ApiError.badRequest('Only live (active) products can be used as demo pieces');
  await db.query(
    `INSERT INTO demo_zone_products (zone_id, product_id, pieces) VALUES (:zoneId, :productId, :pieces)
     ON DUPLICATE KEY UPDATE pieces = VALUES(pieces)`,
    { zoneId, productId, pieces: n }
  );
}

async function removeZoneProduct(zoneId, productId) {
  await db.query('DELETE FROM demo_zone_products WHERE zone_id = :zoneId AND product_id = :productId', { zoneId, productId });
}

// ------------------------------------------------------------------ availability (customer)

/** Nearest active zone covering the point, or null. */
async function zoneAt(lat, lng) {
  const zones = await db.query('SELECT * FROM demo_zones WHERE is_active = 1');
  let best = null;
  for (const z of zones) {
    const d = haversineKm(lat, lng, Number(z.latitude), Number(z.longitude));
    if (d <= Number(z.radius_km) && (!best || d < best.distanceKm)) {
      best = { id: z.id, name: z.name, city: z.city, slaMinutes: z.sla_minutes, distanceKm: Math.round(d * 100) / 100 };
    }
  }
  return best;
}

/** Demo-eligible products near the customer (product-card shape), with a free piece available. */
async function availability(lat, lng) {
  const coords = validCoords(lat, lng);
  if (!coords) return { zone: null, products: [] };
  const zone = await zoneAt(coords.lat, coords.lng);
  if (!zone) return { zone: null, products: [] };
  const rows = await db.query(
    `SELECT p.id, p.slug, p.name, b.name AS brandName, s.display_name AS sellerName, s.id AS sellerId,
            (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.status = 'ACTIVE') AS price,
            (SELECT MIN(pv.mrp) FROM product_variants pv WHERE pv.product_id = p.id AND pv.status = 'ACTIVE') AS mrp,
            (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order LIMIT 1) AS image,
            zp.pieces - (SELECT COUNT(*) FROM demo_bookings bk WHERE bk.zone_id = zp.zone_id AND bk.product_id = p.id AND bk.status IN (${ACTIVE_BOOKING})) AS freePieces
       FROM demo_zone_products zp
       JOIN products p ON p.id = zp.product_id
       JOIN sellers s ON s.id = p.seller_id
       LEFT JOIN brands b ON b.id = p.brand_id
      WHERE zp.zone_id = :zoneId AND p.status = 'ACTIVE' AND s.status = 'APPROVED'
      HAVING freePieces > 0
      ORDER BY p.name`,
    { zoneId: zone.id }
  );
  return {
    zone,
    products: rows.map((r) => ({ ...r, price: Number(r.price || 0), mrp: Number(r.mrp || 0), freePieces: Number(r.freePieces), rating: 0, reviewCount: 0, stockStatus: 'IN_STOCK' })),
  };
}

// ------------------------------------------------------------------ bookings

async function createBooking(customerId, body) {
  const coords = validCoords(body.latitude, body.longitude);
  if (!coords) throw ApiError.badRequest('We need your current location to check home-demo availability');
  const required = ['name', 'mobile', 'addressLine1', 'city', 'state', 'pincode'];
  for (const k of required) if (!String(body[k] || '').trim()) throw ApiError.badRequest('Please fill in your name, mobile and full address');
  if (!/^[6-9]\d{9}$/.test(String(body.mobile).trim())) throw ApiError.badRequest('Enter a valid 10-digit mobile number');

  const productId = Number(body.productId);
  const variantId = Number(body.variantId);
  const zone = await zoneAt(coords.lat, coords.lng);
  if (!zone) throw ApiError.badRequest('Home demo is not available at your location yet');

  return db.transaction(async (tx) => {
    const zp = await tx.queryOne(
      'SELECT pieces FROM demo_zone_products WHERE zone_id = :zoneId AND product_id = :productId FOR UPDATE',
      { zoneId: zone.id, productId }
    );
    if (!zp) throw ApiError.badRequest('This product is not available for home demo in your area');
    const inUse = await tx.queryOne(
      `SELECT COUNT(*) AS n FROM demo_bookings WHERE zone_id = :zoneId AND product_id = :productId AND status IN (${ACTIVE_BOOKING})`,
      { zoneId: zone.id, productId }
    );
    if (Number(zp.pieces) - Number(inUse.n) <= 0) throw ApiError.conflict('All demo pieces of this product are busy right now — please try again a little later');

    const variant = await tx.queryOne(
      `SELECT pv.id FROM product_variants pv JOIN products p ON p.id = pv.product_id
        WHERE pv.id = :variantId AND pv.product_id = :productId AND pv.status = 'ACTIVE' AND p.status = 'ACTIVE'`,
      { variantId, productId }
    );
    if (!variant) throw ApiError.badRequest('Please choose an available option (size / colour)');

    const already = await tx.queryOne(
      `SELECT id FROM demo_bookings WHERE customer_id = :customerId AND product_id = :productId AND status IN (${ACTIVE_BOOKING})`,
      { customerId, productId }
    );
    if (already) throw ApiError.conflict('You already have a home demo booked for this product');

    const bookingNumber = nextNumber('DEMO');
    const r = await tx.query(
      `INSERT INTO demo_bookings (booking_number, customer_id, zone_id, product_id, product_variant_id, name, mobile,
         address_line1, address_line2, city, state, pincode, latitude, longitude, distance_km, notes)
       VALUES (:bookingNumber, :customerId, :zoneId, :productId, :variantId, :name, :mobile, :address1, :address2,
         :city, :state, :pincode, :lat, :lng, :distance, :notes)`,
      {
        bookingNumber, customerId, zoneId: zone.id, productId, variantId,
        name: String(body.name).trim().slice(0, 150), mobile: String(body.mobile).trim(),
        address1: String(body.addressLine1).trim().slice(0, 255), address2: String(body.addressLine2 || '').trim().slice(0, 255) || null,
        city: String(body.city).trim().slice(0, 100), state: String(body.state).trim().slice(0, 100), pincode: String(body.pincode).trim().slice(0, 10),
        lat: coords.lat, lng: coords.lng, distance: zone.distanceKm, notes: String(body.notes || '').trim().slice(0, 255) || null,
      }
    );
    return { id: r.insertId, bookingNumber, zone };
  });
}

const BOOKING_SELECT = `
  SELECT b.*, z.name AS zoneName, z.sla_minutes AS slaMinutes, p.name AS productName, p.slug AS productSlug,
         s.display_name AS sellerName, pv.sku AS variantSku, pv.price AS price,
         (SELECT GROUP_CONCAT(CONCAT(a.name, ': ', av.value) SEPARATOR ', ')
            FROM product_variant_attributes pva
            JOIN attributes a ON a.id = pva.attribute_id
            JOIN attribute_values av ON av.id = pva.attribute_value_id
           WHERE pva.variant_id = pv.id) AS variantLabel,
         (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order LIMIT 1) AS image,
         o.order_number AS orderNumber,
         TIMESTAMPDIFF(MINUTE, b.created_at, NOW()) AS minutesSince
    FROM demo_bookings b
    JOIN demo_zones z ON z.id = b.zone_id
    JOIN products p ON p.id = b.product_id
    JOIN sellers s ON s.id = p.seller_id
    JOIN product_variants pv ON pv.id = b.product_variant_id
    LEFT JOIN orders o ON o.id = b.order_id`;

function shapeBooking(b) {
  const active = ['REQUESTED', 'CONFIRMED', 'ON_THE_WAY'].includes(b.status);
  return {
    ...b,
    price: Number(b.price),
    distanceKm: Number(b.distance_km),
    minutesSince: Number(b.minutesSince),
    late: active && Number(b.minutesSince) > Number(b.slaMinutes),
    dueAt: new Date(new Date(String(b.created_at).replace(' ', 'T') + 'Z').getTime() + Number(b.slaMinutes) * 60000).toISOString(),
  };
}

async function customerBookings(customerId) {
  const rows = await db.query(`${BOOKING_SELECT} WHERE b.customer_id = :customerId ORDER BY b.created_at DESC LIMIT 50`, { customerId });
  return rows.map(shapeBooking);
}

async function adminBookings({ status, zoneId, page = 1, limit = 25 }) {
  const where = ['1 = 1'];
  if (status === 'ACTIVE') where.push(`b.status IN (${ACTIVE_BOOKING})`);
  else if (status) where.push('b.status = :status');
  if (zoneId) where.push('b.zone_id = :zoneId');
  const offset = (Math.max(1, page) - 1) * limit;
  const rows = await db.query(
    `${BOOKING_SELECT} WHERE ${where.join(' AND ')}
     ORDER BY FIELD(b.status, 'REQUESTED','CONFIRMED','ON_THE_WAY') DESC, b.created_at DESC
     LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
    { status, zoneId }
  );
  const counts = await db.query('SELECT status, COUNT(*) AS n FROM demo_bookings GROUP BY status');
  const [{ total }] = await db.query(`SELECT COUNT(*) AS total FROM demo_bookings b WHERE ${where.join(' AND ')}`, { status, zoneId });
  return {
    rows: rows.map(shapeBooking),
    total: Number(total),
    page: Math.max(1, page),
    limit,
    counts: Object.fromEntries(counts.map((c) => [c.status, Number(c.n)])),
  };
}

/**
 * Hands the demo piece over: creates a normal order (one item) already DELIVERED and PAID, with
 * commission and seller payout computed exactly like checkout, and deducts the seller's stock.
 */
async function createDemoOrder(tx, booking, paymentMode, userId) {
  const item = await tx.queryOne(
    `SELECT pv.id AS variantId, pv.price, pv.mrp, pv.status AS variantStatus, p.id AS productId, p.name, p.sku,
            p.status AS productStatus, p.category_id AS categoryId, p.tax_rate AS taxRate, p.seller_id AS sellerId,
            s.status AS sellerStatus
       FROM product_variants pv JOIN products p ON p.id = pv.product_id JOIN sellers s ON s.id = p.seller_id
      WHERE pv.id = :variantId FOR UPDATE`,
    { variantId: booking.product_variant_id }
  );
  if (!item || item.productStatus !== 'ACTIVE' || item.variantStatus !== 'ACTIVE' || item.sellerStatus !== 'APPROVED') {
    throw ApiError.conflict('This product is no longer available for sale');
  }
  const inventories = await tx.query(
    'SELECT id, available_stock FROM inventories WHERE product_variant_id = :variantId AND available_stock > 0 FOR UPDATE',
    { variantId: item.variantId }
  );
  if (!inventories.length) throw ApiError.conflict('The seller has no stock left for this option — the sale cannot be recorded');

  const price = Number(item.price);
  const tax = Math.round(((price * Number(item.taxRate)) / 100) * 100) / 100;
  const total = price + tax;
  const rate = await getCommissionRate({ sellerId: item.sellerId, categoryId: item.categoryId, productId: item.productId }, tx);
  const commission = computeCommissionAmount(rate, price);
  const payable = price - commission;
  const key = `home-demo-${booking.id}`;

  const order = await tx.query(
    `INSERT INTO orders (public_id, order_number, customer_id, payment_method, shipping_name, shipping_mobile,
       shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_pincode,
       subtotal, discount, tax, shipping_charge, grand_total, payment_status, status, idempotency_key, placed_at)
     VALUES (:publicId, :orderNumber, :customerId, 'COD', :name, :mobile, :a1, :a2, :city, :state, :pincode,
       :subtotal, 0, :tax, 0, :total, 'PAID', 'COMPLETED', :key, NOW())`,
    {
      publicId: uuidv4(), orderNumber: nextNumber('IND-ORD'), customerId: booking.customer_id, name: booking.name, mobile: booking.mobile,
      a1: booking.address_line1, a2: booking.address_line2, city: booking.city, state: booking.state, pincode: booking.pincode,
      subtotal: price, tax, total, key,
    }
  );
  const orderId = order.insertId;
  await tx.query(
    `INSERT INTO payment_transactions (order_id, method, amount, status, idempotency_key, gateway_txn_id)
     VALUES (:orderId, 'COD', :amount, 'PAID', :key, :ref)`,
    { orderId, amount: total, key: `${key}-payment`, ref: `HOME-DEMO-${paymentMode}` }
  );
  const so = await tx.query(
    `INSERT INTO seller_orders (order_id, seller_id, sub_order_number, subtotal, discount, tax, shipping_charge,
       commission_amount, seller_payable, status)
     VALUES (:orderId, :sellerId, :number, :subtotal, 0, :tax, 0, :commission, :payable, 'DELIVERED')`,
    { orderId, sellerId: item.sellerId, number: nextNumber('IND-SO'), subtotal: price, tax, commission, payable }
  );
  const note = `Home demo ${booking.booking_number} — handed over by SEESHAA executive${booking.agent_name ? ` (${booking.agent_name})` : ''}, paid by ${paymentMode}`;
  await tx.query(
    `INSERT INTO order_status_history (seller_order_id, status, note, changed_by) VALUES
       (:id, 'PLACED', 'Ordered during home demo', :userId), (:id, 'DELIVERED', :note, :userId)`,
    { id: so.insertId, note, userId }
  );
  await tx.query(
    `INSERT INTO order_items (seller_order_id, product_id, product_variant_id, product_name, sku, price, mrp, quantity,
       tax_amount, discount_amount, total, status)
     VALUES (:soId, :productId, :variantId, :name, :sku, :price, :mrp, 1, :tax, 0, :total, 'ACTIVE')`,
    { soId: so.insertId, productId: item.productId, variantId: item.variantId, name: item.name, sku: item.sku, price, mrp: Number(item.mrp), tax, total }
  );
  await tx.query('UPDATE inventories SET available_stock = available_stock - 1 WHERE id = :id', { id: inventories[0].id });
  await tx.query(
    `INSERT INTO inventory_transactions (inventory_id, type, quantity, reference_type, reference_id)
     VALUES (:inventoryId, 'SALE', -1, 'ORDER', :orderId)`,
    { inventoryId: inventories[0].id, orderId }
  );
  return orderId;
}

const TRANSITIONS = {
  confirm: { from: ['REQUESTED'], to: 'CONFIRMED' },
  dispatch: { from: ['CONFIRMED'], to: 'ON_THE_WAY' },
  purchased: { from: ['CONFIRMED', 'ON_THE_WAY'], to: 'PURCHASED' },
  not_purchased: { from: ['CONFIRMED', 'ON_THE_WAY'], to: 'NOT_PURCHASED' },
  cancel: { from: ['REQUESTED', 'CONFIRMED', 'ON_THE_WAY'], to: 'CANCELLED' },
};

async function updateBooking(id, action, body, userId) {
  const t = TRANSITIONS[action];
  if (!t) throw ApiError.badRequest('Unknown action');
  return db.transaction(async (tx) => {
    const b = await tx.queryOne('SELECT * FROM demo_bookings WHERE id = :id FOR UPDATE', { id });
    if (!b) throw ApiError.notFound('Booking not found');
    if (!t.from.includes(b.status)) throw ApiError.conflict(`This booking is ${b.status.replace('_', ' ').toLowerCase()} — it can't be changed that way`);

    const set = { status: t.to };
    if (action === 'confirm') {
      const agentName = String(body.agentName || '').trim();
      const agentPhone = String(body.agentPhone || '').trim();
      if (!agentName || !/^[6-9]\d{9}$/.test(agentPhone)) throw ApiError.badRequest('Assign an executive: name and a valid 10-digit mobile');
      Object.assign(set, { agent_name: agentName.slice(0, 120), agent_phone: agentPhone });
    }
    if (action === 'purchased') {
      const mode = String(body.paymentMode || '').toUpperCase();
      if (!['CASH', 'UPI', 'CARD'].includes(mode)) throw ApiError.badRequest('Choose how the customer paid: cash, UPI or card');
      set.payment_mode = mode;
      set.order_id = await createDemoOrder(tx, b, mode, userId);
      // The demo piece left with the customer.
      await tx.query('UPDATE demo_zone_products SET pieces = GREATEST(pieces - 1, 0) WHERE zone_id = :zoneId AND product_id = :productId', { zoneId: b.zone_id, productId: b.product_id });
    }
    if (action === 'cancel') set.cancel_reason = String(body.reason || '').trim().slice(0, 255) || null;

    const timeCol = { confirm: 'confirmed_at', dispatch: 'dispatched_at', purchased: 'completed_at', not_purchased: 'completed_at' }[action];
    const cols = Object.keys(set).map((k) => `${k} = :${k}`);
    if (timeCol) cols.push(`${timeCol} = NOW()`);
    await tx.query(`UPDATE demo_bookings SET ${cols.join(', ')} WHERE id = :id`, { ...set, id });
    return { status: t.to, orderId: set.order_id || null };
  });
}

async function cancelByCustomer(id, customerId, reason) {
  const b = await db.queryOne('SELECT id, status FROM demo_bookings WHERE id = :id AND customer_id = :customerId', { id, customerId });
  if (!b) throw ApiError.notFound('Booking not found');
  if (!['REQUESTED', 'CONFIRMED'].includes(b.status)) throw ApiError.conflict('The executive is already on the way — please call them to cancel');
  return updateBooking(id, 'cancel', { reason: reason || 'Cancelled by customer' }, null);
}

module.exports = {
  haversineKm, listZones, createZone, updateZone, deleteZone, zoneProducts, setZoneProduct, removeZoneProduct,
  availability, createBooking, customerBookings, adminBookings, updateBooking, cancelByCustomer,
};
