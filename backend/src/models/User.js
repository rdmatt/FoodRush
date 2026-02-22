const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    email: { 
        type: DataTypes.STRING(255), 
        unique: true, 
        allowNull: false 
    },
    password: { 
        type: DataTypes.STRING(255), 
        allowNull: false 
    },
    user_type: { 
        type: DataTypes.ENUM('restaurant', 'driver'), 
        allowNull: false 
    },
    name: { 
        type: DataTypes.STRING(255), 
        allowNull: false 
    },
    phone: { 
        type: DataTypes.STRING(20) 
    },
    document: { 
        type: DataTypes.STRING(20) 
    },
    address: { 
        type: DataTypes.TEXT 
    },
    address_lat: { 
        type: DataTypes.DECIMAL(10, 8) 
    },
    address_lng: { 
        type: DataTypes.DECIMAL(11, 8) 
    },
    vehicle_type: { 
        type: DataTypes.ENUM('motorcycle', 'bicycle', 'car') 
    },
    vehicle_plate: { 
        type: DataTypes.STRING(10) 
    },
    pix_key: { 
        type: DataTypes.STRING(255) 
    },
    is_online: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },
    is_active: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: true 
    },
    current_lat: { 
        type: DataTypes.DECIMAL(10, 8) 
    },
    current_lng: { 
        type: DataTypes.DECIMAL(11, 8) 
    },
    last_location_at: { 
        type: DataTypes.DATE 
    },
    rating: { 
        type: DataTypes.DECIMAL(2, 1), 
        defaultValue: 5.0 
    },
    total_deliveries: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
    },
    balance: { 
        type: DataTypes.DECIMAL(10, 2), 
        defaultValue: 0.00 
    },
    last_login: { 
        type: DataTypes.DATE 
    }
}, { 
    tableName: 'users', 
    timestamps: true 
});

module.exports = User;