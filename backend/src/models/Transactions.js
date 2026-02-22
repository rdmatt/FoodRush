const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    user_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false 
    },
    delivery_id: { 
        type: DataTypes.INTEGER 
    },
    type: { 
        type: DataTypes.ENUM('delivery_earning', 'withdrawal', 'bonus', 'penalty'), 
        allowNull: false 
    },
    amount: { 
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false 
    },
    description: { 
        type: DataTypes.TEXT 
    },
    status: { 
        type: DataTypes.ENUM('pending', 'completed', 'failed'), 
        defaultValue: 'pending' 
    },
    processed_at: { 
        type: DataTypes.DATE 
    }
}, { 
    tableName: 'transactions', 
    timestamps: true 
});

module.exports = Transaction;