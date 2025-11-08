/**
 * Update Account Type to "admin"
 * 
 * This ensures accountType matches isAdmin status
 * 
 * Usage:
 * npx ts-node scripts/update-account-type.ts your-email@example.com
 */

import connectDB from '../app/lib/mongodb';
import { User } from '../shared/models';

async function updateAccountType(email: string) {
  try {
    console.log('🔧 Updating account type for:', email);
    console.log('-----------------------------------\n');

    await connectDB();
    
    // Get user
    const user = await User.findOne({ email }).lean();
    
    if (!user) {
      console.log('❌ ERROR: No user found with email:', email);
      return;
    }
    
    console.log('Current status:');
    console.log('  - isAdmin:', user.isAdmin);
    console.log('  - accountType:', user.accountType);
    console.log('  - userRole:', user.userRole);
    console.log('\n🔄 Updating...\n');
    
    // Update to ensure consistency
    await User.findByIdAndUpdate(user._id, {
      accountType: 'admin',
      isAdmin: true,
      subscriptionStatus: 'active',
      updatedAt: new Date(),
    });
    
    console.log('✅ SUCCESS! Updated to:');
    console.log('  - isAdmin: true ✅');
    console.log('  - accountType: admin ✅');
    console.log('  - subscriptionStatus: active ✅');
    console.log('\n⚠️  Remember to logout and login again!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

const email = process.argv[2];

if (!email) {
  console.log('❌ Error: Please provide an email address');
  console.log('\nUsage:');
  console.log('  npx ts-node scripts/update-account-type.ts your-email@example.com\n');
  process.exit(1);
}

updateAccountType(email);
