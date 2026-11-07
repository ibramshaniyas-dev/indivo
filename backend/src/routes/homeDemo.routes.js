const express = require('express');
const controller = require('../controllers/homeDemo.controller');
const { authenticate, requireUserType, can } = require('../middleware/auth.middleware');
const { checkoutLimiter } = require('../middleware/rateLimit.middleware');

// Public + customer routes, mounted at /home-demo
const publicRouter = express.Router();
publicRouter.get('/availability', controller.availability);
publicRouter.post('/bookings', authenticate, requireUserType('CUSTOMER'), checkoutLimiter, controller.book);
publicRouter.get('/bookings', authenticate, requireUserType('CUSTOMER'), controller.myBookings);
publicRouter.post('/bookings/:id/cancel', authenticate, requireUserType('CUSTOMER'), controller.cancelMine);

// Admin routes, mounted at /admin/home-demo
// Locations & demo pieces are Super Admin territory (settings.*); bookings are handled by order staff (orders.*).
const adminRouter = express.Router();
adminRouter.use(authenticate, requireUserType('ADMIN'));
adminRouter.get('/zones', can('orders', 'view'), controller.listZones);
adminRouter.post('/zones', can('settings', 'edit'), controller.createZone);
adminRouter.put('/zones/:id', can('settings', 'edit'), controller.updateZone);
adminRouter.delete('/zones/:id', can('settings', 'edit'), controller.deleteZone);
adminRouter.get('/zones/:id/products', can('orders', 'view'), controller.zoneProducts);
adminRouter.put('/zones/:id/products/:productId', can('settings', 'edit'), controller.setZoneProduct);
adminRouter.delete('/zones/:id/products/:productId', can('settings', 'edit'), controller.removeZoneProduct);
adminRouter.get('/bookings', can('orders', 'view'), controller.listBookings);
adminRouter.post('/bookings/:id/:action', can('orders', 'edit'), controller.updateBooking);

module.exports = { publicRouter, adminRouter };
