const settings = require('../../services/settings.service');
const shiprocketClient = require('../../services/shiprocketClient');
const razorpayService = require('../../services/razorpay.service');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const { success } = require('../../utils/response');

async function list(req, res, next) {
  try {
    return success(res, { data: await settings.listForAdmin() });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const updates = Array.isArray(req.body.updates) ? req.body.updates : [];
    if (!updates.length) throw ApiError.badRequest('No changes to save');
    const changed = await settings.update(updates, req.user.id);
    logger.info('Settings updated from dashboard', { userId: req.user.id, groups: changed });
    return success(res, { message: 'Settings saved', data: await settings.listForAdmin() });
  } catch (err) {
    return next(err);
  }
}

/** Verifies saved credentials against the real provider so the admin sees problems immediately. */
async function testIntegration(req, res, next) {
  try {
    const { integration } = req.params;
    if (integration === 'shiprocket') await shiprocketClient.testConnection();
    else if (integration === 'razorpay') await razorpayService.testConnection();
    else throw ApiError.notFound('Unknown integration');
    return success(res, { message: `${integration === 'shiprocket' ? 'Shiprocket' : 'Razorpay'} connection successful` });
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    const providerMessage = err.details?.message || err.error?.description || err.message;
    return next(ApiError.badRequest(`Connection failed: ${providerMessage}`));
  }
}

module.exports = { list, update, testIntegration };
