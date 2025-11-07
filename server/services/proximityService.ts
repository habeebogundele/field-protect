import { storage } from "../storage";
import * as turf from "@turf/turf";

export class ProximityService {
  async calculateAndStoreAdjacentFields(fieldId: string): Promise<void> {
    const field = await storage.getField(fieldId);
    if (!field) return;

    // Clear existing adjacent field relationships
    await storage.deleteAdjacentFields(fieldId);

    // Get all other fields
    const allFields = await storage.getFieldsByUserId(field.userId);
    const otherUsersFields = await this.getAllOtherUsersFields(field.userId);
    const allOtherFields = [...allFields.filter(f => f.id !== fieldId), ...otherUsersFields];

    // If there are no other fields, no adjacency to calculate
    if (allOtherFields.length === 0) {
      return;
    }

    const fieldGeometry = field.geometry as GeoJSON.Feature<GeoJSON.Polygon>;

    for (const otherField of allOtherFields) {
      const otherGeometry = otherField.geometry as GeoJSON.Feature<GeoJSON.Polygon>;
      
      // Calculate distance between field boundaries
      const distance = turf.distance(
        turf.centroid(fieldGeometry),
        turf.centroid(otherGeometry),
        { units: 'kilometers' }
      );

      // Consider fields adjacent if they're within 100 meters (0.1 km)
      const adjacencyThreshold = 0.1; // kilometers (100 meters)
      
      if (distance <= adjacencyThreshold) {
        // Check if fields actually share a boundary or are very close
        const bufferedField = turf.buffer(fieldGeometry, 10, { units: 'meters' });
        if (!bufferedField) continue;
        
        const intersects = turf.booleanIntersects(bufferedField, otherGeometry);
        
        if (intersects) {
          // Calculate shared boundary length
          let sharedBoundaryLength = 0;
          
          try {
            const intersection = turf.intersect(bufferedField as any, otherGeometry as any);
            if (intersection) {
              // Approximate shared boundary length
              sharedBoundaryLength = turf.length(intersection, { units: 'meters' });
            }
          } catch (error) {
            console.warn('Failed to calculate intersection for adjacent fields:', error);
            // Set a default shared boundary length based on field sizes
            sharedBoundaryLength = Math.min(
              turf.length(turf.polygonToLine(fieldGeometry), { units: 'meters' }),
              turf.length(turf.polygonToLine(otherGeometry), { units: 'meters' })
            ) * 0.1; // Estimate 10% shared boundary
          }

          await storage.createAdjacentField({
            fieldId: field.id,
            adjacentFieldId: otherField.id,
            distance,
            sharedBoundaryLength,
          });
        }
      }
    }
  }

  private async getAllOtherUsersFields(excludeUserId: string) {
    // Get all fields from other users for proximity calculation
    const { storage } = await import('../storage');
    return await storage.getAllFieldsExceptUser(excludeUserId);
  }

  async findNearbyFields(geometry: GeoJSON.Feature<GeoJSON.Polygon>, radiusKm: number = 5) {
    // This would typically use a spatial database query with PostGIS
    // For now, we'll implement a basic version
    const center = turf.centroid(geometry);
    const searchArea = turf.circle(center, radiusKm, { units: 'kilometers' });
    
    // In a real implementation, you'd query the database with spatial filters
    // For now, we'll return an empty array
    return [];
  }

  calculateFieldOverlap(field1: GeoJSON.Feature<GeoJSON.Polygon>, field2: GeoJSON.Feature<GeoJSON.Polygon>): number {
    try {
      const intersection = turf.intersect(field1 as any, field2 as any);
      if (!intersection) return 0;
      
      const field1Area = turf.area(field1);
      const intersectionArea = turf.area(intersection);
      
      return (intersectionArea / field1Area) * 100; // Return percentage overlap
    } catch (error) {
      console.error('Error calculating field overlap:', error);
      return 0;
    }
  }
}

export const proximityService = new ProximityService();
