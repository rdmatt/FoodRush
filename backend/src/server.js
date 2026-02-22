require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const { syncDatabase } = require('./models');
const authRoutes = require('./routes/auth');
const deliveryRoutes = require('./routes/deliveries');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Tornar io disponível nos controllers
app.set('io', io);

// Middlewares
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

// Rotas
app.use('/api', authRoutes);
app.use('/api/deliveries', deliveryRoutes);

// Socket.IO
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join_restaurant', (restaurant_id) => {
        socket.join(`restaurant_${restaurant_id}`);
    });

    socket.on('join_driver', (driver_id) => {
        socket.join(`driver_${driver_id}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Erro interno' });
});

// Inicializar
const PORT = process.env.PORT || 3000;

const start = async () => {
    await syncDatabase();
    server.listen(PORT, () => {
        console.log(`FoodRush API running on port ${PORT}`);
    });
};

start();