import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { storage } from '@/lib/storage';
import { z } from 'zod';

const signupSchema = z.object({
  accountType: z.enum(['farmer', 'coop', 'private_applicator']),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().min(1, 'Address is required'),
  zipcode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format (e.g., 55401 or 55401-1234)'),
  phoneNumber: z.string().optional(),
  // Business fields (required for COOPs and private applicators)
  businessName: z.string().optional(),
  businessLicense: z.string().optional(),
  businessAddress: z.string().optional(),
  businessZipcode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid business ZIP code').optional().or(z.literal('')),
  // Legal compliance
  agreedToTerms: z.boolean().refine(val => val === true, 'You must agree to Terms of Service'),
  agreedToPrivacyPolicy: z.boolean().refine(val => val === true, 'You must agree to Privacy Policy'),
  agreedAt: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = signupSchema.parse(body);
    
    // Additional validation for business accounts
    const isBusinessAccount = validatedData.accountType === 'coop' || validatedData.accountType === 'private_applicator';
    if (isBusinessAccount) {
      if (!validatedData.businessName) {
        return NextResponse.json(
          { error: 'Business name is required for COOPs and service providers' },
          { status: 400 }
        );
      }
      if (!validatedData.businessZipcode) {
        return NextResponse.json(
          { error: 'Business ZIP code is required for business accounts' },
          { status: 400 }
        );
      }
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
    
    // Create user
    const user = await storage.createUser({
      accountType: validatedData.accountType,
      email: validatedData.email,
      password: hashedPassword,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      address: validatedData.address,
      zipcode: validatedData.zipcode,
      phoneNumber: validatedData.phoneNumber,
      // Business fields
      businessName: validatedData.businessName,
      businessLicense: validatedData.businessLicense,
      businessAddress: validatedData.businessAddress,
      businessZipcode: validatedData.businessZipcode,
      // Set backward compatible fields
      userRole: validatedData.accountType === 'farmer' ? 'farmer' : 'service_provider',
      // Legal compliance
      agreedToTerms: validatedData.agreedToTerms,
      agreedToPrivacyPolicy: validatedData.agreedToPrivacyPolicy,
      agreedAt: validatedData.agreedAt ? new Date(validatedData.agreedAt) : new Date(),
      // Defaults
      subscriptionStatus: 'inactive',
      isAdmin: false,
    });
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json(
      {
        message: 'User created successfully',
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
    
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
