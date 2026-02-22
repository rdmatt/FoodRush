const sequelize = require('../config/database');
const User = require('./User');
const Delivery = require('./Delivery');
const Transaction = require('./Transaction');

// Relacionamentos
User.hasMany(Delivery, { foreignKey: 'restaurant_id', as: 'RequestedDeliveries' });
User.hasMany(Delivery, { foreignKey: 'driver_id', as: 'CompletedDeliveries' });
Delivery.belongsTo(User, { foreignKey: 'restaurant_id', as: 'Restaurant' });
Delivery.belongsTo(User, { foreignKey: 'driver_id', as: 'Driver' });

const syncDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');
        
        // Em produção, use migrations em vez de sync
        await sequelize.sync({ alter: true });
        console.log('Models synchronized.');
        
        // Criar usuários de teste em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            await createTestUsers();
        }
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

const createTestUsers = async () => {
    const bcrypt = require('bcryptjs');
    
    const testRestaurant = await User.findOne({ where: { email: 'restaurante@teste.com' } });
    if (!testRestaurant) {
        await User.create({
            email: 'restaurante@teste.com',
            password: await bcrypt.hash('123456', 10),
            user_type: 'restaurant',
            name: 'Pizzaria Teste',
            phone: '(11) 99999-9999',
            document: '12.345.678/0001-90',
            address: 'Rua Augusta, 500 - São Paulo, SP',
            is_active: true
        });
        console.log('Test restaurant: restaurante@teste.com / 123456');
    }

    const testDriver = await User.findOne({ where: { email: 'entregador@teste.com' } });
    if (!testDriver) {
        await User.create({
            email: 'entregador@teste.com',
            password: await bcrypt.hash('123456', 10),
            user_type: 'driver',
            name: 'João Entregador',
            phone: '(11) 98888-7777',
            document: '123.456.789-00',
            vehicle_type: 'motorcycle',
            pix_key: '11988887777',
            is_active: true
        });
        console.log('Test driver: entregador@teste.com / 123456');
    }
};

module.exports = {
    sequelize,
    User,
    Delivery,
    Transaction,
    syncDatabase
};