const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Delivery = sequelize.define('Delivery', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    delivery_code: { 
        type: DataTypes.STRING(10), 
        unique: true 
    },
    restaurant_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    restaurant_name: { 
        type: DataTypes.STRING(255) 
    },
    restaurant_phone: { 
        type: DataTypes.STRING(20) 
    },
    restaurant_address: { 
        type: DataTypes.TEXT 
    },
    restaurant_lat: { 
        type: DataTypes.DECIMAL(10, 8) 
    },
    restaurant_lng: { 
        type: DataTypes.DECIMAL(11, 8) 
    },
    driver_id: { 
        type: DataTypes.INTEGER 
    },
    driver_name: { 
        type: DataTypes.STRING(255) 
    },
    driver_phone: { 
        type: DataTypes.STRING(20) 
    },
    pickup_address: { 
        type: DataTypes.TEXT, 
        allowNull: false 
    },
    pickup_detail: { 
        type: DataTypes.STRING(255) 
    },
    delivery_address: { 
        type: DataTypes.TEXT, 
        allowNull: false 
    },
    delivery_detail: { 
        type: DataTypes.STRING(255) 
    },
    delivery_lat: { 
        type: DataTypes.DECIMAL(10, 8) 
    },
    delivery_lng: { 
        type: DataTypes.DECIMAL(11, 8) 
    },
    customer_name: { 
        type: DataTypes.STRING(255) 
    },
    customer_phone: { 
        type: DataTypes.STRING(20) 
    },
    description: { 
        type: DataTypes.TEXT 
    },
    distance_km: { 
        type: DataTypes.DECIMAL(5, 2) 
    },
    base_price: { 
        type: DataTypes.DECIMAL(10, 2), 
        defaultValue: 8.00 
    },
    distance_price: { 
        type: DataTypes.DECIMAL(10, 2), 
        defaultValue: 0.00 
    },
    total_price: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
    },
    driver_earnings: { 
        type: DataTypes.DECIMAL(10, 2) 
    },
    platform_fee: { 
        type: DataTypes.DECIMAL(10, 2) 
    },
    status: {
        type: DataTypes.ENUM(
            'searching',
            'accepted',
            'picked_up',
            'in_transit',
            'delivered',
            'cancelled'
        ),
        defaultValue: 'searching'
    },
    requested_at: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
    },
    accepted_at: { 
        type: DataTypes.DATE 
    },
    picked_up_at: { 
        type: DataTypes.DATE 
    },
    delivered_at: { 
        type: DataTypes.DATE 
    },
    cancelled_at: { 
        type: DataTypes.DATE 
    },
    cancel_reason: { 
        type: DataTypes.TEXT 
    },
    restaurant_rating: { 
        type: DataTypes.INTEGER 
    },
    driver_rating: { 
        type: DataTypes.INTEGER 
    }
}, { 
    tableName: 'deliveries', 
    timestamps: true 
});

module.exports = Delivery;