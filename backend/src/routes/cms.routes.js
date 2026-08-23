const express = require('express');
const controller = require('../controllers/cms.controller');

const router = express.Router();

router.get('/banners', controller.getBanners);
router.get('/pages/:slug', controller.getPage);

module.exports = router;
