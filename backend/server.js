const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import socket service
const { initializeSocket } = require('./services/socketService');

// Import scheduler service
require('./services/schedulerService');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productionRoutes = require('./routes/production');
const inventoryRoutes = require('./routes/inventory');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const supplierRoutes = require('./routes/suppliers');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const auditRoutes = require('./routes/audit');
const settingsRoutes = require('./routes/settings');
const paymentRoutes = require('./routes/payments');
const batchRoutes = require('./routes/batches');
const qualityRoutes = require('./routes/quality');
const scheduleRoutes = require('./routes/schedules');
const uploadRoutes = require('./routes/upload');
const exportRoutes = require('./routes/export');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Logging
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Connect to Database
connectDB();

// Initialize WebSocket
const io = initializeSocket(server);

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PM Textiles ERP API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'PM Textiles - Production, Inventory, and Order Management System',
    version: '2.0.0',
    documentation: '/api/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║   PM Textiles ERP - Backend Server v2.0                   ║
  ║   Production, Inventory & Order Management System          ║
  ╠════════════════════════════════════════════════════════════╣
  ║   Server running on: http://localhost:${PORT}                  ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
  ║   Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}                                    ║
  ║   WebSocket: Enabled ✅                                    ║
  ║   Email Service: Configured ✅                             ║
  ║   File Upload: Enabled ✅                                  ║
  ║   Real-time Features: Active ✅                            ║
  ╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server };
