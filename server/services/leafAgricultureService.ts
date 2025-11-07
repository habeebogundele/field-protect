import { storage } from "../storage";

export class LeafAgricultureService {
  private readonly baseUrl = 'https://api.withleaf.io';

  async connectUser(userId: string, apiKey: string): Promise<void> {
    try {
      // Test the API key by making a simple request
      const response = await fetch(`${this.baseUrl}/api/fields`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Invalid Leaf Agriculture API key');
      }

      // Store API key in user record
      const user = await storage.getUser(userId);
      if (user) {
        await storage.upsertUser({
          ...user,
          leafAgricultureApiKey: apiKey,
        });
      }

      // Update integration status
      await storage.upsertApiIntegration({
        userId,
        provider: 'leaf_agriculture',
        isConnected: true,
        lastSyncAt: new Date(),
        syncStatus: 'success',
      });

    } catch (error) {
      console.error('Error connecting to Leaf Agriculture:', error);
      
      await storage.upsertApiIntegration({
        userId,
        provider: 'leaf_agriculture',
        isConnected: false,
        syncStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  async syncFields(userId: string) {
    const user = await storage.getUser(userId);
    if (!user?.leafAgricultureApiKey) {
      throw new Error('Leaf Agriculture not connected');
    }

    try {
      // Get all fields from Leaf Agriculture
      const response = await fetch(`${this.baseUrl}/api/fields`, {
        headers: {
          'Authorization': `Bearer ${user.leafAgricultureApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Leaf Agriculture API error: ${response.status} ${response.statusText}`);
      }

      const fieldsData = await response.json();
      const leafFields = fieldsData.fields || [];

      let syncedFieldsCount = 0;
      const errors: string[] = [];

      for (const leafField of leafFields) {
        try {
          // Get field boundaries
          const boundaryResponse = await fetch(`${this.baseUrl}/api/fields/${leafField.id}/boundary`, {
            headers: {
              'Authorization': `Bearer ${user.leafAgricultureApiKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (!boundaryResponse.ok) {
            errors.push(`Field ${leafField.name}: Could not fetch boundary`);
            continue;
          }

          const boundaryData = await boundaryResponse.json();
          const geometry = boundaryData.geometry;

          if (!geometry) {
            errors.push(`Field ${leafField.name}: No geometry data`);
            continue;
          }

          // Calculate area in acres
          const acres = this.calculateAcres(geometry);

          // Determine crop and season from field operations
          const { crop, season } = await this.getFieldCropInfo(leafField.id, user.leafAgricultureApiKey);

          // Check if field already exists
          const existingFields = await storage.getFieldsByUserId(userId);
          const existingField = existingFields.find(f => f.leafAgricultureFieldId === leafField.id);

          if (existingField) {
            // Update existing field
            await storage.updateField(existingField.id, {
              name: leafField.name,
              geometry,
              acres: acres.toString(),
              crop,
              season,
            });
          } else {
            // Create new field
            await storage.createField({
              name: leafField.name,
              userId,
              geometry,
              acres: acres.toString(),
              crop,
              season,
              leafAgricultureFieldId: leafField.id,
            });
          }

          syncedFieldsCount++;
        } catch (fieldError) {
          console.error(`Error syncing field ${leafField.id}:`, fieldError);
          errors.push(`Field ${leafField.name}: ${fieldError instanceof Error ? fieldError.message : 'Unknown error'}`);
        }
      }

      // Update integration status
      await storage.upsertApiIntegration({
        userId,
        provider: 'leaf_agriculture',
        isConnected: true,
        lastSyncAt: new Date(),
        syncStatus: errors.length > 0 ? 'error' : 'success',
        errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
      });

      return {
        syncedFieldsCount,
        errors,
        message: `Synced ${syncedFieldsCount} fields${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
      };

    } catch (error) {
      console.error('Error syncing Leaf Agriculture fields:', error);
      
      await storage.upsertApiIntegration({
        userId,
        provider: 'leaf_agriculture',
        isConnected: true,
        syncStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  private async getFieldCropInfo(fieldId: string, apiKey: string): Promise<{ crop: string; season: string }> {
    try {
      // Get field operations to determine crop type
      const response = await fetch(`${this.baseUrl}/api/fields/${fieldId}/operations`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { crop: 'Unknown', season: new Date().getFullYear().toString() };
      }

      const operationsData = await response.json();
      const operations = operationsData.operations || [];

      // Find the most recent planting operation
      const plantingOps = operations.filter((op: any) => 
        op.operationType === 'planting' || op.operationType === 'planted'
      );

      if (plantingOps.length > 0) {
        const mostRecent = plantingOps.sort((a: any, b: any) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )[0];

        const crop = mostRecent.crop || mostRecent.cropName || 'Unknown';
        const season = new Date(mostRecent.startTime).getFullYear().toString();

        return { crop, season };
      }

      return { crop: 'Unknown', season: new Date().getFullYear().toString() };
    } catch (error) {
      console.error('Error getting field crop info:', error);
      return { crop: 'Unknown', season: new Date().getFullYear().toString() };
    }
  }

  private calculateAcres(geometry: GeoJSON.Feature<GeoJSON.Polygon>): number {
    try {
      // This is a simplified calculation - in production you'd use a proper geospatial library
      // For now, return a placeholder value based on coordinate bounds
      const coordinates = geometry.geometry.coordinates[0];
      if (coordinates.length < 3) return 0;

      // Very rough approximation
      const bounds = coordinates.reduce(
        (acc, coord) => {
          acc.minLon = Math.min(acc.minLon, coord[0]);
          acc.maxLon = Math.max(acc.maxLon, coord[0]);
          acc.minLat = Math.min(acc.minLat, coord[1]);
          acc.maxLat = Math.max(acc.maxLat, coord[1]);
          return acc;
        },
        { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity }
      );

      // Rough approximation: 1 degree lat ≈ 69 miles, 1 degree lon ≈ 54.6 miles (at 45° lat)
      const latMiles = (bounds.maxLat - bounds.minLat) * 69;
      const lonMiles = (bounds.maxLon - bounds.minLon) * 54.6;
      const squareMiles = latMiles * lonMiles;
      const acres = squareMiles * 640; // 640 acres per square mile

      return Math.max(1, Math.round(acres));
    } catch (error) {
      console.error('Error calculating acres:', error);
      return 50; // Default fallback
    }
  }
}

export const leafAgricultureService = new LeafAgricultureService();
