import { storage } from "../storage";

export class JohnDeereService {
  private readonly baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://api.deere.com' 
    : 'https://sandboxapi.deere.com';
  
  private readonly clientId = process.env.JOHN_DEERE_CLIENT_ID;
  private readonly clientSecret = process.env.JOHN_DEERE_CLIENT_SECRET;
  private readonly redirectUri = process.env.JOHN_DEERE_REDIRECT_URI;

  constructor() {
    if (!this.clientId || !this.clientSecret) {
      console.warn('John Deere API credentials not configured');
    }
  }

  async getAuthorizationUrl(userId: string): Promise<string> {
    if (!this.clientId || !this.redirectUri) {
      throw new Error('John Deere API not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: 'org1 org2 files',
      state: userId, // Include user ID in state for security
    });

    return `${this.baseUrl}/platform/oauth2/authorize?${params.toString()}`;
  }

  async handleAuthCallback(userId: string, authCode: string): Promise<void> {
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('John Deere API not configured');
    }

    try {
      // Exchange authorization code for access token
      const tokenResponse = await fetch(`${this.baseUrl}/platform/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: authCode,
          redirect_uri: this.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Failed to get access token: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      
      // Store tokens in user record
      const user = await storage.getUser(userId);
      if (user) {
        await storage.upsertUser({
          ...user,
          johnDeereAccessToken: tokenData.access_token,
          johnDeereRefreshToken: tokenData.refresh_token,
        });
      }

      // Update integration status
      await storage.upsertApiIntegration({
        userId,
        provider: 'john_deere',
        isConnected: true,
        lastSyncAt: new Date(),
        syncStatus: 'success',
        settings: {
          tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        },
      });

    } catch (error) {
      console.error('Error handling John Deere auth callback:', error);
      
      await storage.upsertApiIntegration({
        userId,
        provider: 'john_deere',
        isConnected: false,
        syncStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  async syncFields(userId: string) {
    const user = await storage.getUser(userId);
    if (!user?.johnDeereAccessToken) {
      throw new Error('John Deere not connected');
    }

    try {
      // Get organizations first
      const orgsResponse = await this.makeApiCall(user.johnDeereAccessToken, '/platform/organizations');
      const organizations = orgsResponse.values || [];

      let syncedFieldsCount = 0;
      const errors: string[] = [];

      for (const org of organizations) {
        try {
          // Get fields for this organization
          const fieldsResponse = await this.makeApiCall(
            user.johnDeereAccessToken, 
            `/platform/organizations/${org.id}/fields`
          );
          
          const fields = fieldsResponse.values || [];

          for (const johnDeereField of fields) {
            try {
              // Get field boundaries
              const boundariesResponse = await this.makeApiCall(
                user.johnDeereAccessToken,
                `/platform/organizations/${org.id}/fields/${johnDeereField.id}/boundaries`
              );

              const boundaries = boundariesResponse.values || [];
              if (boundaries.length === 0) continue;

              // Use the first active boundary
              const activeBoundary = boundaries.find(b => b.active) || boundaries[0];

              // Convert John Deere boundary to GeoJSON
              const geometry = this.convertToGeoJSON(activeBoundary);
              if (!geometry) continue;

              // Calculate area in acres
              const acres = this.calculateAcres(geometry);

              // Check if field already exists
              const existingFields = await storage.getFieldsByUserId(userId);
              const existingField = existingFields.find(f => f.johnDeereFieldId === johnDeereField.id);

              if (existingField) {
                // Update existing field
                await storage.updateField(existingField.id, {
                  name: johnDeereField.name,
                  geometry,
                  acres: acres.toString(),
                });
              } else {
                // Create new field
                await storage.createField({
                  name: johnDeereField.name,
                  userId,
                  geometry,
                  acres: acres.toString(),
                  crop: 'Unknown', // John Deere doesn't always provide crop info in boundaries
                  season: new Date().getFullYear().toString(),
                  johnDeereFieldId: johnDeereField.id,
                });
              }

              syncedFieldsCount++;
            } catch (fieldError) {
              console.error(`Error syncing field ${johnDeereField.id}:`, fieldError);
              errors.push(`Field ${johnDeereField.name}: ${fieldError instanceof Error ? fieldError.message : 'Unknown error'}`);
            }
          }
        } catch (orgError) {
          console.error(`Error syncing organization ${org.id}:`, orgError);
          errors.push(`Organization ${org.name}: ${orgError instanceof Error ? orgError.message : 'Unknown error'}`);
        }
      }

      // Update integration status
      await storage.upsertApiIntegration({
        userId,
        provider: 'john_deere',
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
      console.error('Error syncing John Deere fields:', error);
      
      await storage.upsertApiIntegration({
        userId,
        provider: 'john_deere',
        isConnected: true,
        syncStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  private async makeApiCall(accessToken: string, endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.deere.axiom.v3+json',
        'Content-Type': 'application/vnd.deere.axiom.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`John Deere API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private convertToGeoJSON(boundary: any): GeoJSON.Feature<GeoJSON.Polygon> | null {
    try {
      // John Deere boundaries are typically in GeoJSON format already
      if (boundary.multiPolygons && boundary.multiPolygons.length > 0) {
        const multiPolygon = boundary.multiPolygons[0];
        if (multiPolygon.rings && multiPolygon.rings.length > 0) {
          const coordinates = multiPolygon.rings.map((ring: any) => 
            ring.points.map((point: any) => [point.lon, point.lat])
          );
          
          return {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates,
            },
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error converting John Deere boundary to GeoJSON:', error);
      return null;
    }
  }

  private calculateAcres(geometry: GeoJSON.Feature<GeoJSON.Polygon>): number {
    try {
      // This is a simplified calculation - in production you'd use a proper geospatial library
      // For now, return a placeholder value
      return 50; // acres
    } catch (error) {
      console.error('Error calculating acres:', error);
      return 0;
    }
  }
}

export const johnDeereService = new JohnDeereService();
