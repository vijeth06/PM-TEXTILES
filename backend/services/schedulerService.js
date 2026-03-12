const schedule = require('node-schedule');
const Inventory = require('../models/Inventory');
const RawMaterial = require('../models/RawMaterial');
const Schedule = require('../models/Schedule');
const Order = require('../models/Order');
const { sendEmail, emailTemplates } = require('./emailService');
const { emitToRole, emitToUser } = require('./socketService');
const User = require('../models/User');
const PurchaseOrder = require('../models/PurchaseOrder');
const AutoReorder = require('../models/AutoReorder');
const { createBackup } = require('./backupService');

// Check for low stock and send alerts
const checkLowStock = schedule.scheduleJob('0 9 * * *', async () => {
  // Runs daily at 9 AM
  try {
    console.log('Running low stock check...');

    const materials = await RawMaterial.find({
      reorderPoint: { $gt: 0 },
      isActive: true
    }).lean();

    const lowStockItems = [];

    for (const material of materials) {
      const stockRecords = await Inventory.find({
        itemCode: material.code,
        status: { $in: ['available', 'reserved'] }
      }).lean();

      const currentStock = stockRecords.reduce((sum, record) => sum + (record.qtyAvailable || 0), 0);

      if (currentStock <= material.reorderPoint) {
        lowStockItems.push({
          code: material.code,
          name: material.name,
          currentStock,
          minLevel: material.reorderPoint,
          uom: material.uom
        });
      }
    }

    if (lowStockItems.length > 0) {
      // Get admin and manager emails
      const admins = await User.find({ 
        role: { $in: ['admin', 'store_manager'] },
        isActive: true 
      });

      const emailList = admins.map(admin => admin.email);
      
      if (emailList.length > 0) {
        const emailContent = emailTemplates.lowStockAlert(lowStockItems);
        
        for (const email of emailList) {
          await sendEmail({
            to: email,
            subject: emailContent.subject,
            html: emailContent.html
          });
        }
      }

      // Send real-time notification
      emitToRole('admin', 'low_stock_alert', {
        count: lowStockItems.length,
        items: lowStockItems
      });
      
      emitToRole('store_manager', 'low_stock_alert', {
        count: lowStockItems.length,
        items: lowStockItems
      });

      console.log(`Low stock alert sent for ${lowStockItems.length} items`);
    }
  } catch (error) {
    console.error('Error in low stock check:', error);
  }
});

// Check for upcoming schedules and send reminders
const checkUpcomingSchedules = schedule.scheduleJob('*/30 * * * *', async () => {
  // Runs every 30 minutes
  try {
    console.log('Checking upcoming schedules...');
    
    const now = new Date();
    const upcomingTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour ahead

    const upcomingSchedules = await Schedule.find({
      scheduledDate: { $gte: now, $lte: upcomingTime },
      status: { $in: ['pending', 'in_progress'] },
      reminderSent: false
    }).populate('assignedTo', 'fullName email');

    for (const scheduleItem of upcomingSchedules) {
      // Send notifications to assigned users
      if (scheduleItem.assignedTo && scheduleItem.assignedTo.length > 0) {
        for (const user of scheduleItem.assignedTo) {
          // Send email reminder
          await sendEmail({
            to: user.email,
            subject: `Reminder: ${scheduleItem.title}`,
            html: `
              <h2>Upcoming Schedule Reminder</h2>
              <p>Hi ${user.fullName || user.username || 'User'},</p>
              <p>This is a reminder for your scheduled task:</p>
              <p><strong>${scheduleItem.title}</strong></p>
              <p>Scheduled for: ${scheduleItem.scheduledDate.toLocaleString()}</p>
              <p>Priority: ${scheduleItem.priority}</p>
              ${scheduleItem.description ? `<p>Description: ${scheduleItem.description}</p>` : ''}
            `
          });

          // Send real-time notification
          emitToUser(user._id, 'schedule_reminder', scheduleItem);
        }
      }

      // Mark reminder as sent
      scheduleItem.reminderSent = true;
      await scheduleItem.save();
    }

    if (upcomingSchedules.length > 0) {
      console.log(`Sent reminders for ${upcomingSchedules.length} schedules`);
    }
  } catch (error) {
    console.error('Error checking upcoming schedules:', error);
  }
});

// Check for overdue orders
const checkOverdueOrders = schedule.scheduleJob('0 10 * * *', async () => {
  // Runs daily at 10 AM
  try {
    console.log('Checking overdue orders...');
    
    const now = new Date();
    const overdueOrders = await Order.find({
      promiseDate: { $lt: now },
      status: { $nin: ['delivered', 'cancelled'] }
    }).populate('customerId', 'name email');

    if (overdueOrders.length > 0) {
      // Notify sales team
      emitToRole('sales_executive', 'overdue_orders', {
        count: overdueOrders.length,
        orders: overdueOrders
      });

      console.log(`Found ${overdueOrders.length} overdue orders`);
    }
  } catch (error) {
    console.error('Error checking overdue orders:', error);
  }
});

// Cleanup old completed schedules (runs weekly)
const cleanupOldSchedules = schedule.scheduleJob('0 0 * * 0', async () => {
  // Runs every Sunday at midnight
  try {
    console.log('Cleaning up old schedules...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Schedule.deleteMany({
      status: 'completed',
      scheduledDate: { $lt: thirtyDaysAgo }
    });

    console.log(`Deleted ${result.deletedCount} old completed schedules`);
  } catch (error) {
    console.error('Error cleaning up schedules:', error);
  }
});

module.exports = {
  checkLowStock,
  checkUpcomingSchedules,
  checkOverdueOrders,
  cleanupOldSchedules
};
  // Automated database backup (daily at 2 AM)
  const automatedBackup = schedule.scheduleJob('0 2 * * *', async () => {
    try {
      console.log('Running automated daily backup...');
      await createBackup();
      console.log('Backup completed successfully');
    } catch (error) {
      console.error('Error in automated backup:', error);
    }
  });

  // Auto-reorder job (checks every hour)
  const autoReorderCheck = schedule.scheduleJob('0 * * * *', async () => {
    // Runs every hour
    try {
      console.log('Checking auto-reorder triggers...');
    
      const autoReorders = await AutoReorder.find({ 
        isActive: true 
      }).populate('materialId').populate('supplierId');

      for (const reorder of autoReorders) {
        const inventory = await Inventory.aggregate([
          {
            $match: {
              itemCode: reorder.materialId.code,
              status: { $in: ['available', 'reserved'] }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$qtyAvailable' }
            }
          }
        ]);

        const currentStock = inventory.length > 0 ? inventory[0].total : 0;

        // Trigger reorder if stock falls below threshold and no active PO exists
        if (currentStock <= reorder.reorderPoint) {
          const existingPO = await PurchaseOrder.findOne({
            'items.materialId': reorder.materialId._id,
            status: { $in: ['draft', 'pending', 'confirmed'] }
          });

          if (!existingPO) {
            // Auto-create purchase order
            const po = await PurchaseOrder.create({
              poNo: `PO-${new Date().getFullYear()}-${Date.now()}`,
              supplierId: reorder.supplierId._id,
              supplierName: reorder.supplierId.name,
              items: [{
                materialId: reorder.materialId._id,
                materialCode: reorder.materialId.code,
                materialName: reorder.materialId.name,
                quantity: reorder.reorderQuantity,
                uom: reorder.materialId.uom,
                unitPrice: reorder.lastUnitPrice || 0,
                notes: 'Auto-generated from auto-reorder rule'
              }],
              status: 'pending',
              autoGenerated: true
            });

            // Notify procurement team
            emitToRole('store_manager', 'auto_reorder_created', {
              poNo: po.poNo,
              material: reorder.materialId.name,
              quantity: reorder.reorderQuantity
            });

            console.log(`Auto-reorder PO created: ${po.poNo}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in auto-reorder check:', error);
    }
  });

  module.exports = {
    checkLowStock,
    checkUpcomingSchedules,
    checkOverdueOrders,
    cleanupOldSchedules,
    automatedBackup,
    autoReorderCheck
  };
