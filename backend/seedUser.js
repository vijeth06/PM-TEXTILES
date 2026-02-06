const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@pmtextiles.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    const shouldResetPassword = String(process.env.SEED_ADMIN_RESET || '').toLowerCase() === 'true';

    const hashPassword = async (plainPassword) => {
      const salt = await bcrypt.genSalt(10);
      return bcrypt.hash(plainPassword, salt);
    };

    // Check if admin exists
    const adminExists = await User.findOne({ 
      $or: [{ email: adminEmail }, { username: adminUsername }] 
    });
    
    if (adminExists) {
      const passwordLooksBcrypt = /^\$2[aby]\$/.test(String(adminExists.password || ''));

      if (shouldResetPassword) {
        adminExists.password = await hashPassword(adminPassword);
        await adminExists.save();
        console.log('✅ Admin password has been reset.');
        console.log('-----------------------------------');
        console.log(`Username: ${adminUsername}`);
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log('-----------------------------------');
        process.exit(0);
      }

      // If the admin password is stored as plaintext from an older seed run,
      // migrate it to bcrypt so login works.
      if (!passwordLooksBcrypt && adminExists.password) {
        const oldPlain = String(adminExists.password);
        adminExists.password = await hashPassword(oldPlain);
        await adminExists.save();
        console.log('✅ Admin password was stored as plaintext and has been migrated to bcrypt.');
      }

      console.log('Admin user already exists. No changes applied.');
      console.log(`Username: ${adminUsername}`);
      console.log(`Email: ${adminEmail}`);
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await hashPassword(adminPassword);

    const admin = await User.create({
      username: adminUsername,
      fullName: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      department: 'Management',
      isActive: true,
      permissions: ['system_admin']
    });

    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log(`Username: ${adminUsername}`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Role: admin');
    console.log('-----------------------------------');
    console.log('You can now log in to the system!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
