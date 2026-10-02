const express = require('express');

const productController =
    require('../controllers/productController');
const { authenticate, requireTrustedOrigin } =
    require('../middleware/authenticate');

const router = express.Router();

router.post(
    '/',
    requireTrustedOrigin,
    authenticate,
    productController.create
);

router.get(
    '/',
    authenticate,
    productController.getAll
);

router.put(
    '/:id',
    requireTrustedOrigin,
    authenticate,
    productController.update
);

router.delete(
    '/:id',
    requireTrustedOrigin,
    authenticate,
    productController.delete
);

router.patch(
    '/:id/stock',
    requireTrustedOrigin,
    authenticate,
    productController.addStock
);

module.exports = router;