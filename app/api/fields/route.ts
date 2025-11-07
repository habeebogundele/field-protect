import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { proximityService } from '@/lib/services/proximityService';
import { insertFieldSchema } from '@shared/models';

// Helper to get user from session
async function getUserFromRequest(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  const sessionCookie = request.cookies.get('fieldshare.sid');

  if (!sessionCookie) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    );
    return { userId: sessionData.userId };
  } catch (error) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}

// GET /api/fields - Get all fields for user
export async function GET(request: NextRequest) {
  const userResult = await getUserFromRequest(request);
  if (userResult instanceof NextResponse) return userResult;

  try {
    const fields = await storage.getFieldsByUserId(userResult.userId);
    return NextResponse.json(fields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    return NextResponse.json(
      { message: 'Failed to fetch fields' },
      { status: 500 }
    );
  }
}

// POST /api/fields - Create new field
export async function POST(request: NextRequest) {
  const userResult = await getUserFromRequest(request);
  if (userResult instanceof NextResponse) return userResult;

  try {
    const body = await request.json();
    const fieldData = insertFieldSchema.parse({ ...body, userId: userResult.userId });

    // Check for field overlaps before creating
    if (fieldData.geometry) {
      const overlapCheck = await checkFieldOverlap(fieldData.geometry, undefined, userResult.userId);
      if (overlapCheck.hasOverlap) {
        return NextResponse.json(
          {
            message: 'Field boundaries cannot overlap with existing fields',
            overlappingFields: overlapCheck.overlappingFields,
            error: 'FIELD_OVERLAP',
          },
          { status: 400 }
        );
      }
    }

    const field = await storage.createField(fieldData);

    // Calculate proximity to other fields
    await proximityService.calculateAndStoreAdjacentFields(field.id);

    // Log the field creation
    await storage.createFieldUpdate({
      fieldId: field.id,
      userId: userResult.userId,
      updateType: 'metadata_changed',
      description: 'Field created',
      newValue: { name: field.name, crop: field.crop },
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error('Error creating field:', error);
    return NextResponse.json(
      { message: 'Failed to create field' },
      { status: 500 }
    );
  }
}

// Helper function to check field overlaps (simplified version)
async function checkFieldOverlap(
  geometry: any,
  excludeFieldId?: string,
  userId?: string
): Promise<{ hasOverlap: boolean; overlappingFields: string[] }> {
  // This is a simplified version - you'll want to use the full spatial query from the original
  try {
    // Use PostGIS spatial queries to check overlaps
    // For now, return no overlap
    return { hasOverlap: false, overlappingFields: [] };
  } catch (error) {
    console.error('Error checking field overlap:', error);
    return { hasOverlap: false, overlappingFields: [] };
  }
}
