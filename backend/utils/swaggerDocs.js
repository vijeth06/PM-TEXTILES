/**
 * Swagger API Documentation Configuration
 * Auto-generates API docs from JSDoc comments
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PM Textiles ERP API',
      version: '1.0.0',
      description: 'Complete Production, Inventory & Order Management System API Documentation',
      contact: {
        name: 'PM Textiles Development Team',
        email: 'dev@pmtextiles.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://pm-textiles-erp.onrender.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '60d5ec49f1b2c8b1f8e4e1a1'
            },
            username: {
              type: 'string',
              example: 'john_doe'
            },
            email: {
              type: 'string',
              example: 'john@example.com'
            },
            fullName: {
              type: 'string',
              example: 'John Doe'
            },
            role: {
              type: 'string',
              enum: ['admin', 'manager', 'user', 'supervisor'],
              example: 'admin'
            },
            isActive: {
              type: 'boolean',
              example: true
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            orderNumber: {
              type: 'string',
              example: 'ORD-2024-001'
            },
            customer: {
              type: 'string',
              description: 'Customer ID'
            },
            orderDate: {
              type: 'string',
              format: 'date-time'
            },
            deliveryDate: {
              type: 'string',
              format: 'date-time'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'in_production', 'completed', 'cancelled'],
              example: 'pending'
            },
            totalAmount: {
              type: 'number',
              example: 150000
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  itemCode: { type: 'string' },
                  description: { type: 'string' },
                  quantity: { type: 'number' },
                  rate: { type: 'number' },
                  amount: { type: 'number' }
                }
              }
            }
          }
        },
        ProductionPlan: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            productionNumber: { type: 'string', example: 'PROD-2024-001' },
            order: { type: 'string', description: 'Order ID' },
            productName: { type: 'string' },
            quantity: { type: 'number' },
            status: {
              type: 'string',
              enum: ['planned', 'in_progress', 'completed', 'on_hold'],
              example: 'planned'
            },
            startDate: { type: 'string', format: 'date-time' },
            targetDate: { type: 'string', format: 'date-time' }
          }
        },
        Inventory: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            itemCode: { type: 'string', example: 'YRN-001' },
            itemName: { type: 'string', example: 'Cotton Yarn 40s' },
            category: {
              type: 'string',
              enum: ['raw_material', 'semi_finished', 'finished_good'],
              example: 'raw_material'
            },
            currentStock: { type: 'number', example: 5000 },
            uom: { type: 'string', example: 'kg' },
            reorderLevel: { type: 'number', example: 1000 },
            location: { type: 'string', example: 'Warehouse A' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Orders', description: 'Order management' },
      { name: 'Production', description: 'Production planning and execution' },
      { name: 'Inventory', description: 'Inventory management' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Suppliers', description: 'Supplier management' },
      { name: 'Reports', description: 'Reports and analytics' },
      { name: 'Finance', description: 'Payments and financial transactions' },
      { name: 'Quality', description: 'Quality control' },
      { name: 'Textile', description: 'Textile-specific operations' },
      { name: 'Dashboard', description: 'Dashboard metrics' }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
