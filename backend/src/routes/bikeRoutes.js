const express = require('express');

const bikeController =
    require('../controllers/bikeController');
const { authenticate, requireTrustedOrigin } =
    require('../middleware/authenticate');

const router = express.Router();

router.post(
    '/',
    requireTrustedOrigin,
    authenticate,
    bikeController.create
);

router.get(
    '/number/:bikeNumber',
    authenticate,
    bikeController.getByNumber
);

module.exports = router;