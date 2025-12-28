const express = require('express');
const router = express.Router();
const {showProductsController} = require('../controllers/show-products-common-controller');

router.get('/fetch-products', showProductsController);
router.get('/test-hello', async(req, res)=>{
    return res.status(200).json({
        success : true,
        message : "Hello this is madhu"
    });
});

module.exports = router;