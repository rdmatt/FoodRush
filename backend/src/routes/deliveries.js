const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const deliveryController = require('../controllers/deliveryController');

const router = express.Router();

router.post('/', authenticate, [
    body('delivery_address').trim().notEmpty(),
    body('customer_name').trim().notEmpty(),
    body('customer_phone').trim().notEmpty()
], deliveryController.createDelivery);

router.get('/my', authenticate, deliveryController.getMyDeliveries);
router.get('/available', authenticate, deliveryController.getAvailableDeliveries);
router.post('/:id/accept', authenticate, deliveryController.acceptDelivery);
router.patch('/:id/status', authenticate, deliveryController.updateStatus);
router.patch('/:id/cancel', authenticate, deliveryController.cancelDelivery);

module.exports = router;