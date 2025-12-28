const express = require('express');
const router = express.Router();
const {registerUserController, loginUserController, userOrderEntry, userReviewRateProduct, fetchUserOrders, addToCartController, reduceOneQuantity, deleteFromCart} = require('../controllers/user-controllers');
const userAuthMiddleware = require('../middlewares/user-auth-middleware');
const multer = require('multer');
const upload = multer();

router.post('/register',registerUserController);
router.post('/login', loginUserController);
// used upload.none(), because we configured multer which expects an image file while giving our data in by enabling form-data radio button under body tab of request in postman, 
// if we provide data by enabling raw radio button under body tab of request in postman, we dont need to use upload.none()
router.post('/place-order/:id', upload.none(), userAuthMiddleware, userOrderEntry);
router.put('/review-and-rate-product/:id', upload.none(), userAuthMiddleware, userReviewRateProduct);
router.get('/view-user-orders', userAuthMiddleware, fetchUserOrders);
// used upload.none(), because we configured multer which expects an image file while giving our data in by enabling form-data radio button under body tab of request in postman, 
// if we provide data by enabling raw radio button under body tab of request in postman, we dont need to use upload.none()
router.post('/add-to-cart/:id', upload.none(), userAuthMiddleware, addToCartController);
router.put('/reduce-cart/:id', upload.none(), userAuthMiddleware, reduceOneQuantity);
router.delete('/delete-from-cart/:id', upload.none(), userAuthMiddleware, deleteFromCart);
module.exports = router;