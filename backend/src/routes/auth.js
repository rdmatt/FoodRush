const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], authController.login);

router.post('/register/restaurant', [
    body('name').trim().isLength({ min: 2 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('phone').trim().notEmpty(),
    body('document').trim().notEmpty(),
    body('address').trim().notEmpty()
], authController.registerRestaurant);

router.post('/register/driver', [
    body('name').trim().isLength({ min: 3 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('phone').trim().notEmpty(),
    body('document').trim().notEmpty(),
    body('vehicle_type').isIn(['motorcycle', 'bicycle', 'car']),
    body('pix_key').trim().notEmpty()
], authController.registerDriver);

module.exports = router;