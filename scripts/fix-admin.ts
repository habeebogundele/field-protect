/**
 * Admin Account Fix Script
 * 
 * This script will add admin privileges to an existing account
 * 
 * Usage:
 * npx ts-node scripts/fix-admin.ts your-email@example.com
 */

import connectDB from '../app/lib/mongodb';
import { User } from '../shared/models';

async function fixAdminAccount(email: string) {
  try {
    console.log('🔧 Attempting to fix admin account for:', email);
    console.log('-----------------------------------\n');

    await connectDB();
    
    // Get user
    const user = await User.findOne({ email }).lean();
    
    if (!user) {
      console.log('❌ ERROR: No user found with email:', email);
      console.log('\nPlease create the account first at /admin/signup\n');
      return;
    }
    
    console.log('✅ User found!');
    console.log('Current status:');
    console.log('  - isAdmin:', user.isAdmin);
    console.log('  - accountType:', user.accountType);
    console.log('\n🔄 Updating account to admin...\n');
    
    // Update user to admin
    await User.findByIdAndUpdate(user._id, {
      isAdmin: true,
      accountType: 'admin',
      subscriptionStatus: 'active',
      updatedAt: new Date(),
    });
    
    console.log('✅ SUCCESS! Account updated to admin!');
    console.log('-----------------------------------');
    console.log('New status:');
    console.log('  - isAdmin: true');
    console.log('  - accountType: admin');
    console.log('-----------------------------------\n');
    
    console.log('🎉 You can now:');
    console.log('1. Login at /admin/login');
    console.log('2. Access the admin dashboard at /admin');
    console.log('3. Manage all users\n');
    
    console.log('⚠️  Note: You may need to:');
    console.log('- Clear browser cache/cookies');
    console.log('- Login again for changes to take effect\n');
    
  } catch (error) {
    console.error('❌ Error fixing admin account:', error);
    if (error instanceof Error) {
      console.error('Details:', error.message);
    }
  } finally {
    process.exit(0);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('❌ Error: Please provide an email address');
  console.log('\nUsage:');
  console.log('  npx ts-node scripts/fix-admin.ts your-email@example.com');
  console.log('\nExample:');
  console.log('  npx ts-node scripts/fix-admin.ts admin@example.com\n');
  process.exit(1);
}

fixAdminAccount(email);
