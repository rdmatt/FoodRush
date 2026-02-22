const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User } = require('../models');

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, type: user.user_type },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || '24h' }
    );
};

exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;
        
        const user = await User.findOne({ where: { email, is_active: true } });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
        }

        user.last_login = new Date();
        await user.save();

        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                user_type: user.user_type,
                name: user.name,
                phone: user.phone,
                address: user.address,
                rating: user.rating,
                balance: user.balance,
                total_deliveries: user.total_deliveries,
                is_online: user.is_online,
                vehicle_type: user.vehicle_type
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Erro interno' });
    }
};

exports.registerRestaurant = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password, phone, document, address } = req.body;

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Email já cadastrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const restaurant = await User.create({
            email,
            password: hashedPassword,
            user_type: 'restaurant',
            name,
            phone,
            document,
            address
        });

        res.status(201).json({
            success: true,
            message: 'Restaurante cadastrado com sucesso!',
            user: {
                id: restaurant.id,
                name: restaurant.name,
                email: restaurant.email
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: 'Erro interno' });
    }
};

exports.registerDriver = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password, phone, document, vehicle_type, vehicle_plate, pix_key } = req.body;

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Email já cadastrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const driver = await User.create({
            email,
            password: hashedPassword,
            user_type: 'driver',
            name,
            phone,
            document,
            vehicle_type,
            vehicle_plate: vehicle_plate?.toUpperCase(),
            pix_key
        });

        res.status(201).json({
            success: true,
            message: 'Entregador cadastrado com sucesso!',
            user: {
                id: driver.id,
                name: driver.name,
                email: driver.email
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: 'Erro interno' });
    }
};