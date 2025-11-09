import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { storage } from '@/lib/storage';

/**
 * DEBUG ENDPOINT: View complete user data with ALL fields
 * This endpoint shows every field stored for a user, including fields that might be null/undefined
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session || !session.userId) {
      return NextResponse.json({
        error: 'No session found - please login first',
      }, { status: 401 });
    }
    
    // Get current user with ALL fields
    const user = await storage.getUser(session.userId);
    
    if (!user) {
      return NextResponse.json({
        error: 'User not found in database',
      }, { status: 404 });
    }
    
    // Return ALL user fields (excluding password for security)
    const { password, ...userData } = user;
    
    return NextResponse.json({
      message: 'User data retrieved successfully',
      userId: session.userId,
      allFields: {
        // Identity
        _id: userData._id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        
        // Contact Information
        address: userData.address || null,
        zipcode: userData.zipcode || null,
        phoneNumber: userData.phoneNumber || null,
        
        // Account Type (NEW system)
        accountType: userData.accountType || null,
        
        // User Role (LEGACY field for backward compatibility)
        userRole: userData.userRole || null,
        
        // Business Information (for COOPs and Private Applicators)
        businessName: userData.businessName || null,
        businessLicense: userData.businessLicense || null,
        businessAddress: userData.businessAddress || null,
        businessZipcode: userData.businessZipcode || null,
        
        // Legacy Business Fields (deprecated)
        companyName: userData.companyName || null,
        serviceType: userData.serviceType || null,
        
        // Admin Status
        isAdmin: userData.isAdmin || false,
        
        // Subscription
        subscriptionStatus: userData.subscriptionStatus || 'inactive',
        subscriptionType: userData.subscriptionType || null,
        stripeCustomerId: userData.stripeCustomerId || null,
        stripeSubscriptionId: userData.stripeSubscriptionId || null,
        
        // External Integrations
        johnDeereAccessToken: userData.johnDeereAccessToken ? '***HIDDEN***' : null,
        johnDeereRefreshToken: userData.johnDeereRefreshToken ? '***HIDDEN***' : null,
        leafAgricultureApiKey: userData.leafAgricultureApiKey ? '***HIDDEN***' : null,
        
        // Legal Compliance
        agreedToTerms: userData.agreedToTerms || false,
        agreedToPrivacyPolicy: userData.agreedToPrivacyPolicy || false,
        agreedAt: userData.agreedAt || null,
        
        // Profile
        profileImageUrl: userData.profileImageUrl || null,
        
        // Timestamps
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      
      // Summary of what's missing/present
      summary: {
        hasAddress: !!userData.address,
        hasZipcode: !!userData.zipcode,
        hasPhoneNumber: !!userData.phoneNumber,
        hasAccountType: !!userData.accountType,
        hasUserRole: !!userData.userRole,
        hasBusinessName: !!userData.businessName,
        hasBusinessAddress: !!userData.businessAddress,
        hasBusinessZipcode: !!userData.businessZipcode,
        isBusinessAccount: userData.accountType === 'coop' || userData.accountType === 'private_applicator',
      }
    });
  } catch (error) {
    console.error('Debug user fields error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve user data',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
