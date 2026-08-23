const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const { getCommissionRate, computeCommissionAmount } = require('./commission.service');

const FREE_SHIPPING_THRESHOLD = 999;
const FLAT_SHIPPING_CHARGE = 49;

function nextNumber(prefix) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

/**
 * Places an order from the customer's current cart, inside one transaction:
 *  1. Idempotency check — same key returns the already-created order instead of duplicating it.
 *  2. Locks every cart line's inventory row (SELECT ... FOR UPDATE) and re-validates price/stock
 *     live — never trusts the cart's cached price_snapshot or the client.
 *  3. Splits the cart into a parent order + one seller_order per seller, with commission computed
 *     per line item (product > seller > category > global priority).
 *  4. Deducts stock immediately (COD has no separate payment-confirmation step to defer to) and
 *     records an inventory_transaction per variant.
 *  5. Clears the ordered cart items.
 */
async function placeOrder({ customerId, address, paymentMethod, idempotencyKey }) {
  const existingOrder = await db.queryOne('SELECT id, public_id FROM orders WHERE idempotency_key = :key', {
    key: idempotencyKey,
  });
  if (existingOrder) {
    return { orderId: existingOrder.id, publicId: existingOrder.public_id, duplicate: true };
  }

  const cart = await db.queryOne('SELECT id FROM carts WHERE customer_id = :customerId', { customerId });
  if (!cart) throw ApiError.badRequest('Your cart is empty');

  return db.transaction(async (tx) => {
    const cartItems = await tx.query(
      `SELECT ci.id AS cart_item_id, ci.product_variant_id, ci.quantity, ci.seller_id,
              p.id AS product_id, p.name AS product_name, p.sku, p.status AS product_status,
              p.category_id, p.tax_rate, s.status AS seller_status
       FROM cart_items ci
       JOIN product_variants v ON v.id = ci.product_variant_id
       JOIN products p ON p.id = v.product_id
       JOIN sellers s ON s.id = ci.seller_id
       WHERE ci.cart_id = :cartId
       FOR UPDATE`,
      { cartId: cart.id }
    );
    if (cartItems.length === 0) throw ApiError.badRequest('Your cart is empty');

    // Lock inventory rows for every variant in the cart so concurrent checkouts can't oversell.
    const variantIds = cartItems.map((i) => i.product_variant_id);
    const inventories = await tx.query(
      `SELECT id, product_variant_id, available_stock, reserved_stock
       FROM inventories WHERE product_variant_id IN (:variantIds) FOR UPDATE`,
      { variantIds }
    );
    // Live price/status comes from product_variants — locked separately, same transaction.
    const variants = await tx.query(
      `SELECT id, price, mrp, status FROM product_variants WHERE id IN (:variantIds) FOR UPDATE`,
      { variantIds }
    );
    const variantById = Object.fromEntries(variants.map((v) => [v.id, v]));
    const stockByVariant = variantIds.reduce((acc, vId) => {
      acc[vId] = inventories.filter((i) => i.product_variant_id === vId)
        .reduce((sum, i) => sum + (i.available_stock - i.reserved_stock), 0);
      return acc;
    }, {});
    const inventoryRowsByVariant = variantIds.reduce((acc, vId) => {
      acc[vId] = inventories.filter((i) => i.product_variant_id === vId);
      return acc;
    }, {});

    const unavailable = [];
    for (const item of cartItems) {
      const variant = variantById[item.product_variant_id];
      const available = stockByVariant[item.product_variant_id] || 0;
      if (item.product_status !== 'ACTIVE' || item.seller_status !== 'APPROVED' || variant?.status !== 'ACTIVE') {
        unavailable.push(`${item.product_name} is no longer available`);
      } else if (available < item.quantity) {
        unavailable.push(`${item.product_name}: only ${available} left in stock`);
      }
    }
    if (unavailable.length) throw ApiError.conflict(unavailable.join('; '));

    const sellerGroups = cartItems.reduce((acc, item) => {
      (acc[item.seller_id] ||= []).push(item);
      return acc;
    }, {});

    let orderSubtotal = 0;
    let orderTax = 0;
    let orderShipping = 0;
    const sellerOrderPayloads = [];

    for (const [sellerId, items] of Object.entries(sellerGroups)) {
      let sellerSubtotal = 0;
      let sellerTax = 0;
      const lineItems = [];

      for (const item of items) {
        const variant = variantById[item.product_variant_id];
        const price = Number(variant.price);
        const lineTotal = price * item.quantity;
        const taxAmount = Math.round(((lineTotal * Number(item.tax_rate)) / 100) * 100) / 100;
        sellerSubtotal += lineTotal;
        sellerTax += taxAmount;
        lineItems.push({
          productId: item.product_id,
          variantId: item.product_variant_id,
          name: item.product_name,
          sku: item.sku,
          price,
          mrp: Number(variant.mrp),
          quantity: item.quantity,
          taxAmount,
          total: lineTotal + taxAmount,
          categoryId: item.category_id,
        });
      }

      const sellerShipping = sellerSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_CHARGE;
      const rate = await getCommissionRate({ sellerId, categoryId: lineItems[0]?.categoryId, productId: null }, tx);
      const commissionAmount = computeCommissionAmount(rate, sellerSubtotal);

      orderSubtotal += sellerSubtotal;
      orderTax += sellerTax;
      orderShipping += sellerShipping;

      sellerOrderPayloads.push({
        sellerId, lineItems, sellerSubtotal, sellerTax, sellerShipping, commissionAmount,
      });
    }

    const grandTotal = orderSubtotal + orderTax + orderShipping;
    const orderPublicId = uuidv4();
    const orderNumber = nextNumber('IND-ORD');

    // COD is payable-on-delivery, so its transaction sits PENDING until the courier collects it.
    // ONLINE starts CREATED — no Razorpay order exists yet; POST /payments/create makes one next.
    const initialPaymentStatus = paymentMethod === 'ONLINE' ? 'CREATED' : 'PENDING';

    const orderResult = await tx.query(
      `INSERT INTO orders (public_id, order_number, customer_id, payment_method, shipping_name, shipping_mobile,
         shipping_address1, shipping_address2, shipping_city, shipping_state, shipping_pincode,
         subtotal, discount, tax, shipping_charge, grand_total, payment_status, status, idempotency_key, placed_at)
       VALUES (:publicId, :orderNumber, :customerId, :paymentMethod, :name, :mobile, :address1, :address2, :city, :state, :pincode,
         :subtotal, 0, :tax, :shipping, :grandTotal, :paymentStatus, 'PLACED', :idempotencyKey, NOW())`,
      {
        publicId: orderPublicId, orderNumber, customerId, paymentMethod, name: address.name, mobile: address.mobile,
        address1: address.addressLine1, address2: address.addressLine2 || null, city: address.city,
        state: address.state, pincode: address.pincode, subtotal: orderSubtotal, tax: orderTax,
        shipping: orderShipping, grandTotal, paymentStatus: initialPaymentStatus,
        idempotencyKey,
      }
    );
    const orderId = orderResult.insertId;

    await tx.query(
      `INSERT INTO payment_transactions (order_id, method, amount, status, idempotency_key)
       VALUES (:orderId, :method, :amount, :status, :idempotencyKey)`,
      {
        orderId, method: paymentMethod, amount: grandTotal,
        status: initialPaymentStatus, idempotencyKey: `${idempotencyKey}-payment`,
      }
    );

    for (const sellerOrder of sellerOrderPayloads) {
      const subOrderNumber = nextNumber('IND-SO');
      const sellerPayable = sellerOrder.sellerSubtotal + sellerOrder.sellerShipping - sellerOrder.commissionAmount;

      const soResult = await tx.query(
        `INSERT INTO seller_orders (order_id, seller_id, sub_order_number, subtotal, discount, tax, shipping_charge,
           commission_amount, seller_payable, status)
         VALUES (:orderId, :sellerId, :subOrderNumber, :subtotal, 0, :tax, :shipping, :commission, :payable, 'PLACED')`,
        {
          orderId, sellerId: sellerOrder.sellerId, subOrderNumber, subtotal: sellerOrder.sellerSubtotal,
          tax: sellerOrder.sellerTax, shipping: sellerOrder.sellerShipping, commission: sellerOrder.commissionAmount,
          payable: sellerPayable,
        }
      );
      const sellerOrderId = soResult.insertId;

      await tx.query(
        `INSERT INTO order_status_history (seller_order_id, status, note) VALUES (:id, 'PLACED', 'Order placed by customer')`,
        { id: sellerOrderId }
      );

      for (const item of sellerOrder.lineItems) {
        await tx.query(
          `INSERT INTO order_items (seller_order_id, product_id, product_variant_id, product_name, sku,
             price, mrp, quantity, tax_amount, discount_amount, total, status)
           VALUES (:sellerOrderId, :productId, :variantId, :name, :sku, :price, :mrp, :quantity, :taxAmount, 0, :total, 'ACTIVE')`,
          {
            sellerOrderId, productId: item.productId, variantId: item.variantId, name: item.name, sku: item.sku,
            price: item.price, mrp: item.mrp, quantity: item.quantity, taxAmount: item.taxAmount, total: item.total,
          }
        );

        // Deduct stock now — COD has no async payment-confirmation step to defer to, so the
        // reservation and the deduction happen together in this same locked transaction.
        for (const invRow of inventoryRowsByVariant[item.variantId] || []) {
          if (item.quantity <= 0) break;
          const deduct = Math.min(item.quantity, invRow.available_stock);
          if (deduct <= 0) continue;
          await tx.query('UPDATE inventories SET available_stock = available_stock - :deduct WHERE id = :id', {
            id: invRow.id, deduct,
          });
          await tx.query(
            `INSERT INTO inventory_transactions (inventory_id, type, quantity, reference_type, reference_id)
             VALUES (:inventoryId, 'SALE', :quantity, 'ORDER', :orderId)`,
            { inventoryId: invRow.id, quantity: -deduct, orderId }
          );
          item.quantity -= deduct;
        }
      }
    }

    await tx.query('DELETE FROM cart_items WHERE cart_id = :cartId', { cartId: cart.id });

    return { orderId, publicId: orderPublicId, orderNumber, grandTotal, duplicate: false };
  });
}

module.exports = { placeOrder };
