const express = require('express');

const invoiceController =
    require('../controllers/invoiceController');
const {
    authenticate,
    requireTrustedOrigin
} =
    require('../middleware/authenticate');

const router = express.Router();

router.post(
    '/',
    requireTrustedOrigin,
    authenticate,
    invoiceController.create
);

router.get(
    '/',
    authenticate,
    invoiceController.getAll
);

router.put(
    '/:id',
    requireTrustedOrigin,
    authenticate,
    invoiceController.update
);

router.get(
    '/:id',
    authenticate,
    invoiceController.getById
);

module.exports = router;