import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getUserFromRequest } from '../../lib/auth';
import { Field, FieldWithAccess } from '@shared/schema';

export async function GET(request: NextRequest) {
  const authResult = await getUserFromRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Add cache-busting headers
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    console.log(`🗺️ Fetching all nearby fields for user: ${authResult.userId}`);

    // Get user's own fields
    const ownFields = await storage.getFieldsByUserId(authResult.userId);
    console.log(`📍 Found ${ownFields.length} own fields`);

    // Get all adjacent fields
    const allAdjacentFields = await storage.getAllAdjacentFieldsForUser(authResult.userId);
    console.log(`🏘️ Found ${allAdjacentFields.length} adjacent fields`);

    // Add access status to each field
    const fieldsWithAccess: FieldWithAccess[] = await Promise.all([
      ...ownFields.map(async (field: Field): Promise<FieldWithAccess> => ({
        ...field,
        accessLevel: 'owner' as const,
      })),
      ...allAdjacentFields.map(async (field: Field): Promise<FieldWithAccess> => {
        const hasPermission = await storage.canViewField(authResult.userId, field.id);

        if (hasPermission) {
          // Approved fields
          const { notes, ...publicFieldData } = field;
          return {
            ...publicFieldData,
            notes: null,
            accessLevel: 'approved' as const,
          };
        } else {
          // Restricted fields
          return {
            id: field.id,
            name: 'Private Field',
            crop: 'Unknown',
            sprayType: null,
            sprayTypes: [],
            variety: null,
            status: null,
            acres: '0',
            season: 'unknown',
            userId: field.userId,
            latitude: field.latitude,
            longitude: field.longitude,
            johnDeereFieldId: field.johnDeereFieldId,
            leafAgricultureFieldId: field.leafAgricultureFieldId,
            climateFieldViewId: field.climateFieldViewId,
            plantingDate: field.plantingDate,
            harvestDate: field.harvestDate,
            createdAt: field.createdAt,
            updatedAt: field.updatedAt,
            accessLevel: 'restricted' as const,
            geometry: field.geometry,
            notes: null,
          };
        }
      }),
    ]);

    console.log(`✅ Returning ${fieldsWithAccess.length} total fields`);

    return NextResponse.json(fieldsWithAccess, { headers });
  } catch (error) {
    console.error('Error fetching all nearby fields:', error);
    return NextResponse.json(
      { message: 'Failed to fetch all nearby fields' },
      { status: 500 }
    );
  }
}
