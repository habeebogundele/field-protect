import * as turf from '@turf/turf';
import { storage } from '../storage';

export const proximityService = {
  async calculateAndStoreAdjacentFields(fieldId: string) {
    try {
      const field = await storage.getField(fieldId);
      if (!field || !field.geometry) {
        return;
      }

      // Get all fields in the system
      const allFields = await storage.getAllFields?.() || [];
      
      // Filter out the current field
      const otherFields = allFields.filter(f => f.id !== fieldId && f.geometry);
      
      // Delete existing adjacent field records
      await storage.deleteAdjacentFieldsByFieldId(fieldId);
      
      // Calculate proximity for each field
      for (const otherField of otherFields) {
        try {
          const distance = turf.distance(
            turf.center(field.geometry as any).geometry,
            turf.center(otherField.geometry as any).geometry,
            { units: 'meters' }
          );
          
          // Only store if fields are within 5km of each other
          if (distance <= 5000) {
            // Check if fields share a boundary
            let sharedBoundaryLength = 0;
            try {
              const intersection = turf.lineIntersect(
                field.geometry as any,
                otherField.geometry as any
              );
              
              if (intersection.features.length > 0) {
                sharedBoundaryLength = turf.length(turf.lineString(
                  intersection.features.map(f => f.geometry.coordinates)
                ), { units: 'meters' });
              }
            } catch (err) {
              // If intersection calculation fails, continue without it
            }
            
            // Store the adjacent field relationship
            await storage.createAdjacentField({
              fieldId: fieldId,
              adjacentFieldId: otherField.id,
              distance,
              sharedBoundaryLength,
            });
          }
        } catch (err) {
          console.error(`Error calculating proximity for field ${otherField.id}:`, err);
        }
      }
    } catch (error) {
      console.error('Error in calculateAndStoreAdjacentFields:', error);
      throw error;
    }
  },

  async findNearbyFields(latitude: number, longitude: number, radiusKm: number = 5) {
    const allFields = await storage.getAllFields?.() || [];
    const point = turf.point([longitude, latitude]);
    
    const nearbyFields = allFields.filter(field => {
      if (!field.geometry) return false;
      
      try {
        const fieldCenter = turf.center(field.geometry as any);
        const distance = turf.distance(point, fieldCenter, { units: 'kilometers' });
        return distance <= radiusKm;
      } catch (err) {
        return false;
      }
    });
    
    return nearbyFields;
  },
};
