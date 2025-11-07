import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { proximityService } from '@/lib/services/proximityService';

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

// GET /api/fields/[id] - Get single field
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userResult = await getUserFromRequest(request);
  if (userResult instanceof NextResponse) return userResult;

  try {
    const field = await storage.getField(params.id);

    if (!field) {
      return NextResponse.json({ message: 'Field not found' }, { status: 404 });
    }

    // Check if user owns this field or has permission
    if (field.userId !== userResult.userId) {
      const hasPermission = await storage.canViewField(userResult.userId, params.id);

      if (!hasPermission) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }

      // Return field without owner-sensitive info
      const { notes, ...publicFieldData } = field;
      return NextResponse.json(publicFieldData);
    }

    return NextResponse.json(field);
  } catch (error) {
    console.error('Error fetching field:', error);
    return NextResponse.json(
      { message: 'Failed to fetch field' },
      { status: 500 }
    );
  }
}

// PUT /api/fields/[id] - Update field
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userResult = await getUserFromRequest(request);
  if (userResult instanceof NextResponse) return userResult;

  try {
    const field = await storage.getField(params.id);

    if (!field || field.userId !== userResult.userId) {
      return NextResponse.json({ message: 'Field not found' }, { status: 404 });
    }

    const updateData = await request.json();

    const updatedField = await storage.updateField(params.id, updateData);

    // Log the update
    await storage.createFieldUpdate({
      fieldId: params.id,
      userId: userResult.userId,
      updateType: 'metadata_changed',
      description: 'Field updated',
      oldValue: { crop: field.crop, status: field.status },
      newValue: { crop: updatedField.crop, status: updatedField.status },
    });

    // Recalculate proximity if geometry changed
    if (updateData.geometry) {
      await proximityService.calculateAndStoreAdjacentFields(params.id);
    }

    return NextResponse.json(updatedField);
  } catch (error) {
    console.error('Error updating field:', error);
    return NextResponse.json(
      { message: 'Failed to update field' },
      { status: 500 }
    );
  }
}

// DELETE /api/fields/[id] - Delete field
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userResult = await getUserFromRequest(request);
  if (userResult instanceof NextResponse) return userResult;

  try {
    const field = await storage.getField(params.id);

    if (!field || field.userId !== userResult.userId) {
      return NextResponse.json({ message: 'Field not found' }, { status: 404 });
    }

    // Log the deletion before deleting
    await storage.createFieldUpdate({
      fieldId: params.id,
      userId: userResult.userId,
      updateType: 'deleted',
      description: `Field "${field.name}" deleted`,
      oldValue: {
        name: field.name,
        crop: field.crop,
        status: field.status,
        acres: field.acres,
      },
      newValue: null,
    });

    await storage.deleteAdjacentFields(params.id);
    await storage.deleteField(params.id);

    return NextResponse.json({ message: 'Field deleted successfully' });
  } catch (error) {
    console.error('Error deleting field:', error);
    return NextResponse.json(
      { message: 'Failed to delete field' },
      { status: 500 }
    );
  }
}
