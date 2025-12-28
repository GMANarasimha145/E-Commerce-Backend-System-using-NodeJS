const express = require('express');
const router = express.Router();
const {showProductsController} = require('../controllers/show-products-common-controller');

router.get('/fetch-products', showProductsController);

module.exports = router;