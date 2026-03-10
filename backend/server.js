const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const fileUpload = require('express-fileupload');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import database connection
const connectDB = require('./config/database');

// Import socket service
const { initializeSocket } = require('./services/socketService');

// Import scheduler service
const startScheduler = () => require('./services/schedulerService');

// Import Redis caching service
const { initRedis, cacheService } = require('./services/redisService');

// Import email service
const { initEmailService } = require('./services/emailService');

// Import Swagger documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swaggerDocs');

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
const itemMasterRoutes = require('./routes/items');

// New Feature Routes
const forecastRoutes = require('./routes/forecasts');
const kpiRoutes = require('./routes/kpis');
const analyticsRoutes = require('./routes/analytics');
const autoReorderRoutes = require('./routes/autoReorder');
const rfqRoutes = require('./routes/rfq');
const employeeRoutes = require('./routes/employees');
const maintenanceRoutes = require('./routes/maintenance');
const leadRoutes = require('./routes/leads');
const quotationRoutes = require('./routes/quotations');
const documentRoutes = require('./routes/documents');

// Textile-specific Routes
const loomProductionRoutes = require('./routes/loomProduction');
const dyeingRoutes = require('./routes/dyeing');
const colorLabRoutes = require('./routes/colorLab');

// Admin Routes (new features)
const backupRoutes = require('./routes/backups');
const cacheRoutes = require('./routes/cache');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const auditLogger = require('./middleware/auditLogger');
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
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  abortOnLimit: true,
  useTempFiles: false
}));

// Centralized audit logging for successful mutating API calls.
app.use(auditLogger);

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

let io;

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
app.use('/api/items', itemMasterRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);

// New Feature Routes
app.use('/api/analytics/forecasts', forecastRoutes);
app.use('/api/analytics/kpis', kpiRoutes);
app.use('/api/analytics/cost-analysis', analyticsRoutes);
app.use('/api/procurement/auto-reorder', autoReorderRoutes);
app.use('/api/procurement/rfq', rfqRoutes);
app.use('/api/hr/employees', employeeRoutes);
app.use('/api/maintenance/schedules', maintenanceRoutes);
app.use('/api/crm/leads', leadRoutes);
app.use('/api/sales/quotations', quotationRoutes);
app.use('/api/documents', documentRoutes);

// Textile-specific Routes
app.use('/api/textile/loom-production', loomProductionRoutes);
app.use('/api/textile/dyeing', dyeingRoutes);
app.use('/api/textile/color-lab', colorLabRoutes);

// Admin Routes (System Management)
app.use('/api/admin/backups', backupRoutes);
app.use('/api/admin/cache', cacheRoutes);

// API Documentation (Swagger)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'PM Textiles ERP API Documentation'
}));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PM Textiles ERP API is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Root route - serve React app in production
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  } else {
    res.json({
      message: 'PM Textiles - Production, Inventory, and Order Management System',
      version: '3.0.0',
      documentation: '/api/health',
      features: {
        analytics: ['Forecasting', 'KPIs', 'Cost Analysis'],
        automation: ['Auto-Reorder', 'Smart Scheduling'],
        procurement: ['RFQ Management', 'Supplier Performance'],
        hr: ['Employee Management', 'Attendance', 'Training'],
        maintenance: ['Preventive Maintenance', 'Asset Management'],
        crm: ['Lead Management', 'Quotations', 'Customer Portal'],
        documents: ['DMS', 'Version Control', 'Approvals'],
        production: ['Recipe Management', 'Batch Traceability', 'Energy Tracking'],
        textile: ['Loom Production', 'Dyeing Process', 'Color Lab', 'Shade Matching']
      }
    });
  }
});

// 404 handler
app.use((req, res) => {
  // In production, serve React app for all unmatched routes
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  } else {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// Start server (after DB connect)
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await connectDB();

  // Initialize Redis caching (optional - app works without it)
  const redis = initRedis();
  
  // Initialize Email service (optional - app works without it)
  initEmailService();

  // Initialize WebSocket
  io = initializeSocket(server);
  app.set('io', io);

  // Make cache service available globally
  app.set('cache', cacheService);

  // Start scheduler jobs after DB is available
  startScheduler();

  server.once('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use (or reserved). Set a different PORT in backend/.env and restart.`);
      process.exit(1);
    }
    logger.error(`Server error: ${err?.message || err}`);
    process.exit(1);
  });

  server.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
    console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║   PM Textiles ERP - Backend Server v2.0                   ║
  ║   Production, Inventory & Order Management System          ║
  ╠════════════════════════════════════════════════════════════╣
  ║   Server:       http://localhost:${PORT}                       ║
  ║   API Docs:     http://localhost:${PORT}/api-docs              ║
  ║   Environment:  ${process.env.NODE_ENV || 'development'}                              ║
  ║   Database:     ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌'}                            ║
  ║   WebSocket:    Enabled ✅                                    ║
  ║   Email:        ${process.env.EMAIL_USER ? 'Configured ✅' : 'Not configured ⚠️'}                         ║
  ║   Redis Cache:  ${redis ? 'Enabled ✅' : 'Disabled (optional) ⚠️'}                      ║
  ║   File Upload:  Enabled ✅                                    ║
  ║   Security:     Helmet, CORS, Rate Limiting ✅               ║
  ╚════════════════════════════════════════════════════════════╝
  `);
  });
};

startServer();

module.exports = { app, server };
