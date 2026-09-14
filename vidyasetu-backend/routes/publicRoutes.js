const express = require('express');

const publicController = require('../controllers/publicController');

const router = express.Router();

router.get('/catalogs', publicController.listCatalogs);
router.get('/catalogs/:slug', publicController.getCatalogBySlug);

module.exports = router;
