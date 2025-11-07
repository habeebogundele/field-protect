import { storage } from "../storage";

export class FieldService {
  async hasAccessToField(fieldId: string, userFieldIds: string[]): Promise<boolean> {
    // Check if any of the user's fields are adjacent to the requested field
    for (const userFieldId of userFieldIds) {
      const adjacentFields = await storage.getAdjacentFields(userFieldId);
      if (adjacentFields.some(af => af.adjacentFieldId === fieldId)) {
        return true;
      }
    }
    return false;
  }

  async getAccessibleFields(userId: string) {
    const userFields = await storage.getFieldsByUserId(userId);
    const accessibleFields = [...userFields];
    
    // Get all adjacent fields
    for (const field of userFields) {
      const adjacent = await storage.getAdjacentFields(field.id);
      accessibleFields.push(...adjacent.map(af => af.adjacentField));
    }
    
    // Remove duplicates
    const uniqueFields = accessibleFields.filter((field, index, self) => 
      index === self.findIndex(f => f.id === field.id)
    );
    
    return uniqueFields;
  }
}

export const fieldService = new FieldService();
