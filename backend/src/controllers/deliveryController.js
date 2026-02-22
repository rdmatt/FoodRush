const { validationResult } = require('express-validator');
const { Delivery, User, Transaction } = require('../models');
const { Op } = require('sequelize');

const generateCode = () => 'FR' + Math.floor(1000 + Math.random() * 9000);

const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const calculatePrice = (distanceKm) => {
    const basePrice = 8.00;
    const pricePerKm = 1.50;
    const distancePrice = distanceKm * pricePerKm;
    const total = basePrice + distancePrice;
    
    return {
        basePrice: basePrice.toFixed(2),
        distancePrice: distancePrice.toFixed(2),
        total: total.toFixed(2),
        driverEarnings: (total * 0.85).toFixed(2),
        platformFee: (total * 0.15).toFixed(2)
    };
};

exports.createDelivery = async (req, res) => {
    try {
        if (req.user.user_type !== 'restaurant') {
            return res.status(403).json({ success: false, error: 'Apenas restaurantes' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            pickup_address,
            pickup_detail,
            delivery_address,
            delivery_detail,
            delivery_lat,
            delivery_lng,
            customer_name,
            customer_phone,
            description
        } = req.body;

        let distance = 0;
        if (delivery_lat && delivery_lng && req.user.address_lat && req.user.address_lng) {
            distance = calculateDistance(
                req.user.address_lat, req.user.address_lng,
                delivery_lat, delivery_lng
            );
        }

        const pricing = calculatePrice(distance);

        const delivery = await Delivery.create({
            delivery_code: generateCode(),
            restaurant_id: req.user.id,
            restaurant_name: req.user.name,
            restaurant_phone: req.user.phone,
            restaurant_address: req.user.address,
            restaurant_lat: req.user.address_lat,
            restaurant_lng: req.user.address_lng,
            pickup_address: pickup_address || req.user.address,
            pickup_detail,
            delivery_address,
            delivery_detail,
            delivery_lat,
            delivery_lng,
            distance_km: distance.toFixed(2),
            ...pricing,
            customer_name,
            customer_phone,
            description,
            status: 'searching'
        });

        // Notificar via Socket.IO (implementar no server.js)
        req.app.get('io').emit('new_delivery', {
            delivery_id: delivery.id,
            code: delivery.delivery_code,
            restaurant: delivery.restaurant_name,
            distance: delivery.distance_km,
            earnings: delivery.driver_earnings
        });

        res.status(201).json({
            success: true,
            delivery: {
                id: delivery.id,
                code: delivery.delivery_code,
                status: delivery.status,
                total_price: delivery.total_price,
                driver_earnings: delivery.driver_earnings
            }
        });
    } catch (error) {
        console.error('Create delivery error:', error);
        res.status(500).json({ success: false, error: 'Erro interno' });
    }
};

exports.getMyDeliveries = async (req, res) => {
    try {
        const where = req.user.user_type === 'restaurant' 
            ? { restaurant_id: req.user.id }
            : { driver_id: req.user.id };

        const { status } = req.query;
        if (status) where.status = status;

        const deliveries = await Delivery.findAll({
            where,
            order: [['requested_at', 'DESC']],
            limit: 50
        });

        res.json({ success: true, deliveries });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getAvailableDeliveries = async (req, res) => {
    try {
        if (req.user.user_type !== 'driver') {
            return res.status(403).json({ success: false, error: 'Apenas entregadores' });
        }

        const deliveries = await Delivery.findAll({
            where: { status: 'searching' },
            order: [['requested_at', 'ASC']],
            limit: 20
        });

        const driverLat = req.user.current_lat;
        const driverLng = req.user.current_lng;

        const formatted = deliveries.map(d => {
            let distanceToPickup = null;
            if (driverLat && driverLng && d.restaurant_lat && d.restaurant_lng) {
                distanceToPickup = calculateDistance(
                    driverLat, driverLng,
                    d.restaurant_lat, d.restaurant_lng
                );
            }

            return {
                id: d.id,
                code: d.delivery_code,
                restaurant_name: d.restaurant_name,
                restaurant_address: d.restaurant_address,
                pickup_address: d.pickup_address,
                delivery_address: d.delivery_address,
                distance_km: d.distance_km,
                distance_to_pickup: distanceToPickup ? distanceToPickup.toFixed(1) : null,
                driver_earnings: d.driver_earnings,
                description: d.description,
                requested_at: d.requested_at
            };
        });

        if (driverLat && driverLng) {
            formatted.sort((a, b) => (a.distance_to_pickup || 999) - (b.distance_to_pickup || 999));
        }

        res.json({ success: true, deliveries: formatted });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.acceptDelivery = async (req, res) => {
    try {
        if (req.user.user_type !== 'driver') {
            return res.status(403).json({ success: false, error: 'Apenas entregadores' });
        }

        const activeDelivery = await Delivery.findOne({
            where: {
                driver_id: req.user.id,
                status: { [Op.in]: ['accepted', 'picked_up', 'in_transit'] }
            }
        });

        if (activeDelivery) {
            return res.status(400).json({ 
                success: false, 
                error: 'Complete a entrega atual primeiro' 
            });
        }

        const delivery = await Delivery.findOne({
            where: { id: req.params.id, status: 'searching' }
        });

        if (!delivery) {
            return res.status(404).json({ success: false, error: 'Entrega não disponível' });
        }

        delivery.driver_id = req.user.id;
        delivery.driver_name = req.user.name;
        delivery.driver_phone = req.user.phone;
        delivery.status = 'accepted';
        delivery.accepted_at = new Date();
        await delivery.save();

        req.app.get('io').to(`restaurant_${delivery.restaurant_id}`).emit('delivery_accepted', {
            delivery_id: delivery.id,
            code: delivery.delivery_code,
            driver: {
                name: req.user.name,
                phone: req.user.phone,
                rating: req.user.rating
            }
        });

        res.json({
            success: true,
            delivery: {
                id: delivery.id,
                code: delivery.delivery_code,
                status: delivery.status,
                pickup_address: delivery.pickup_address,
                delivery_address: delivery.delivery_address,
                customer_name: delivery.customer_name,
                customer_phone: delivery.customer_phone
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        if (req.user.user_type !== 'driver') {
            return res.status(403).json({ success: false, error: 'Apenas entregadores' });
        }

        const { status } = req.body;
        
        const delivery = await Delivery.findOne({
            where: { id: req.params.id, driver_id: req.user.id }
        });

        if (!delivery) {
            return res.status(404).json({ success: false, error: 'Entrega não encontrada' });
        }

        const validTransitions = {
            'accepted': ['picked_up'],
            'picked_up': ['in_transit', 'delivered'],
            'in_transit': ['delivered']
        };

        if (!validTransitions[delivery.status]?.includes(status)) {
            return res.status(400).json({ success: false, error: 'Transição inválida' });
        }

        delivery.status = status;
        
        if (status === 'picked_up') {
            delivery.picked_up_at = new Date();
        } else if (status === 'delivered') {
            delivery.delivered_at = new Date();
            
            req.user.total_deliveries += 1;
            req.user.balance = parseFloat(req.user.balance) + parseFloat(delivery.driver_earnings);
            await req.user.save();
            
            await Transaction.create({
                user_id: req.user.id,
                delivery_id: delivery.id,
                type: 'delivery_earning',
                amount: delivery.driver_earnings,
                description: `Entrega #${delivery.delivery_code}`,
                status: 'completed',
                processed_at: new Date()
            });
        }

        await delivery.save();

        req.app.get('io').to(`restaurant_${delivery.restaurant_id}`).emit('delivery_updated', {
            delivery_id: delivery.id,
            code: delivery.delivery_code,
            status: status
        });

        res.json({ success: true, delivery });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.cancelDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({
            where: {
                id: req.params.id,
                restaurant_id: req.user.id,
                status: { [Op.in]: ['searching', 'accepted'] }
            }
        });

        if (!delivery) {
            return res.status(404).json({ success: false, error: 'Não pode cancelar' });
        }

        delivery.status = 'cancelled';
        delivery.cancelled_at = new Date();
        delivery.cancel_reason = req.body.reason || 'Cancelado pelo restaurante';
        await delivery.save();

        if (delivery.driver_id) {
            req.app.get('io').to(`driver_${delivery.driver_id}`).emit('delivery_cancelled', {
                delivery_id: delivery.id,
                reason: delivery.cancel_reason
            });
        }

        res.json({ success: true, message: 'Entrega cancelada' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};