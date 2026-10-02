const express = require('express');

const customerController =
    require('../controllers/customerController');

const {
    validateCustomer
} = require('../validators/customerValidator');
const { authenticate, requireTrustedOrigin } =
    require('../middleware/authenticate');

const router = express.Router();

router.post(
    '/',
    requireTrustedOrigin,
    authenticate,
    validateCustomer,
    customerController.create
);

router.get(
    '/',
    authenticate,
    customerController.getAll
);

module.exports = router;