import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { storage } from '@/lib/storage';
import { z } from 'zod';

const adminSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().optional(),
  zipcode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  adminCode: z.string().min(1, 'Admin authorization code is required'),
  // Legal compliance
  agreedToTerms: z.boolean().refine(val => val === true, 'You must agree to Terms of Service'),
  agreedToPrivacyPolicy: z.boolean().refine(val => val === true, 'You must agree to Privacy Policy'),
  agreedAt: z.string().optional(),
});

// IMPORTANT: Change this to a secure secret code in production
// Store this in .env as ADMIN_SIGNUP_CODE
const ADMIN_SIGNUP_CODE = process.env.ADMIN_SIGNUP_CODE || 'CHANGE_ME_IN_PRODUCTION_123';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = adminSignupSchema.parse(body);
    
    // Verify admin code
    if (validatedData.adminCode !== ADMIN_SIGNUP_CODE) {
      // Log unauthorized attempts (in production, this should go to a security log)
      console.warn(`Unauthorized admin signup attempt from email: ${validatedData.email}`);
      
      return NextResponse.json(
        { error: 'Invalid authorization code. Please contact your system administrator.' },
        { status: 403 }
      );
    }
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create admin user
    const user = await storage.createUser({
      accountType: 'admin',
      email: validatedData.email,
      password: hashedPassword,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      address: validatedData.address,
      zipcode: validatedData.zipcode,
      phoneNumber: validatedData.phoneNumber,
      // Admin-specific settings
      isAdmin: true,
      userRole: 'admin', // Set userRole for backward compatibility
      // Legal compliance
      agreedToTerms: validatedData.agreedToTerms,
      agreedToPrivacyPolicy: validatedData.agreedToPrivacyPolicy,
      agreedAt: validatedData.agreedAt ? new Date(validatedData.agreedAt) : new Date(),
      // Defaults
      subscriptionStatus: 'active', // Admins have full access
    });
    
    // Log admin creation (in production, this should go to an audit log)
    console.log(`New admin account created: ${user.email} (ID: ${user._id})`);
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json(
      {
        message: 'Admin account created successfully',
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Admin signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create admin account', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
