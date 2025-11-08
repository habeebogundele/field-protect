/**
 * Admin Account Diagnostic Script
 * 
 * Usage:
 * 1. npx ts-node scripts/check-admin.ts your-email@example.com
 * 2. Or run directly: npm run check-admin your-email@example.com
 */

import { storage } from '../app/lib/storage';
import connectDB from '../app/lib/mongodb';

async function checkAdminAccount(email: string) {
  try {
    console.log('🔍 Checking admin account for:', email);
    console.log('-----------------------------------\n');

    await connectDB();
    
    // Get user
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      console.log('❌ ERROR: No user found with email:', email);
      console.log('\nTroubleshooting:');
      console.log('1. Double-check the email address');
      console.log('2. Verify the account was created successfully');
      console.log('3. Check if there were any signup errors\n');
      return;
    }
    
    console.log('✅ User found!');
    console.log('-----------------------------------');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.firstName, user.lastName);
    console.log('🆔 User ID:', user._id?.toString());
    console.log('🔐 Account Type:', user.accountType);
    console.log('👑 isAdmin:', user.isAdmin);
    console.log('📅 Created:', user.createdAt);
    console.log('-----------------------------------\n');
    
    // Check admin status
    if (user.isAdmin) {
      console.log('✅ GOOD: This account has admin privileges!');
      console.log('\n✨ Your account is correctly set up as admin.');
      console.log('\nTroubleshooting steps:');
      console.log('1. Try logging out completely');
      console.log('2. Clear your browser cache/cookies');
      console.log('3. Login again at /admin/login');
      console.log('4. Try accessing /admin in a private/incognito window\n');
    } else {
      console.log('❌ PROBLEM: This account does NOT have admin privileges!');
      console.log('\n🔧 Would you like to fix this? Run:');
      console.log(`   npx ts-node scripts/fix-admin.ts ${email}\n`);
    }
    
  } catch (error) {
    console.error('❌ Error checking admin account:', error);
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
  console.log('  npx ts-node scripts/check-admin.ts your-email@example.com');
  process.exit(1);
}

checkAdminAccount(email);
