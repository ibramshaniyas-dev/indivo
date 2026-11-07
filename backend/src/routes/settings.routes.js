const express = require('express');
const settings = require('../services/settings.service');
const { success } = require('../utils/response');

// Public, non-secret store settings (name, support contact, COD availability) for the storefront.
const router = express.Router();

router.get('/public', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'public, max-age=60');
    return success(res, { data: await settings.listPublic() });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
