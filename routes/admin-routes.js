const express = require('express');
const { registerAdminController, loginAdminController, adminProductUploadController, adminProductDeleteController, adminProductUpdateController } = require('../controllers/admin-controllers');
const adminImageUploadMiddleware = require('../middlewares/admin-image-upload-middleware');
const adminAuthMiddleware = require('../middlewares/admin-auth-middleware');
const router = express.Router();

router.post('/register', registerAdminController);
router.post('/login', loginAdminController);
// used image upload middleware before calling the controller so that multer is used to enture local storage, and file filter
router.post('/upload-product', adminAuthMiddleware, adminImageUploadMiddleware.single('image'), adminProductUploadController);
router.delete('/delete-product/:id',adminAuthMiddleware, adminProductDeleteController);
// used image upload middleware before calling the controller so that multer is used to enture local storage, and file filter
router.put('/update-product/:id', adminAuthMiddleware, adminImageUploadMiddleware.single('image'), adminProductUpdateController);

module.exports = router;