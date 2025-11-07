import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

interface CSBFeature {
  type: 'Feature';
  properties: {
    CSBID: string;
    CSBACRES?: number;
    acres?: number;
    CDL2024?: number;
    CDL2023?: number;
    CDL2022?: number;
    CDL2021?: number;
    CDL2020?: number;
    STATEFIPS?: string;
    CNTYFIPS?: string;
    [key: string]: any;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: any;
  };
}

interface CSBFeatureCollection {
  type: 'FeatureCollection';
  name?: string;
  features: CSBFeature[];
}

/**
 * CSBStorage - Queries REAL USDA Crop Sequence Boundaries from GeoPackage files
 * Uses ogr2ogr to efficiently query ~2-3 million field boundaries across corn belt states
 */
export class CSBStorage {
  private gpkgFiles: string[] = [];
  private loaded: boolean = false;

  constructor() {}

  /**
   * Initialize - check for GeoPackage files
   */
  async load(): Promise<void> {
    try {
      const dataDir = path.join(__dirname, 'data', 'csb');
      
      // Check for state GeoPackage files - All corn belt states
      const stateFiles = [
        'south-dakota.gpkg',
        'north-dakota.gpkg',
        'iowa.gpkg',
        'minnesota.gpkg',
        'illinois.gpkg',
        'nebraska.gpkg',
        'ohio.gpkg',
        'wisconsin.gpkg',
        'indiana.gpkg'
      ];
      
      this.gpkgFiles = stateFiles
        .map(f => path.join(dataDir, f))
        .filter(f => fs.existsSync(f));
      
      if (this.gpkgFiles.length > 0) {
        this.loaded = true;
        console.log(`✅ CSB Storage: Found ${this.gpkgFiles.length} state GeoPackage files with REAL USDA boundaries`);
        console.log(`📊 States loaded: ${this.gpkgFiles.map(f => path.basename(f, '.gpkg')).join(', ')}`);
        console.log(`📊 Ready to query ~4-5 million field boundaries across corn belt`);
      } else {
        console.log(`⚠️  CSB Storage: No GeoPackage files found in ${dataDir}`);
        this.loaded = false;
      }
    } catch (error) {
      console.error(`❌ CSB Storage: Failed to initialize:`, error);
      this.loaded = false;
    }
  }

  /**
   * Get field boundaries within a bounding box using ogr2ogr spatial query
   */
  getBoundariesByBbox(bbox: BoundingBox, limit: number = 100): CSBFeatureCollection {
    if (!this.loaded || this.gpkgFiles.length === 0) {
      console.warn('⚠️  CSB Storage: No GeoPackage files loaded');
      return { type: 'FeatureCollection', features: [] };
    }

    try {
      const allFeatures: CSBFeature[] = [];
      
      // Query each state GeoPackage file
      for (const gpkgFile of this.gpkgFiles) {
        if (allFeatures.length >= limit) break;
        
        try {
          // Use ogr2ogr to query with spatial filter (bbox)
          const sql = `SELECT CSBID, CSBACRES as acres, CDL2024, CDL2023, CDL2022, CDL2021, CDL2020, STATEFIPS, CNTYFIPS, * FROM national1724`;
          
          const cmd = `ogr2ogr -f GeoJSON /vsistdout/ "${gpkgFile}" \
            -spat ${bbox.minLng} ${bbox.minLat} ${bbox.maxLng} ${bbox.maxLat} \
            -limit ${limit - allFeatures.length}`;
          
          const output = execSync(cmd, {
            encoding: 'utf-8',
            maxBuffer: 50 * 1024 * 1024, // 50MB buffer
            stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr warnings
          });
          
          if (output && output.trim().length > 0) {
            const geojson = JSON.parse(output);
            if (geojson.features && Array.isArray(geojson.features)) {
              allFeatures.push(...geojson.features);
            }
          }
        } catch (error: any) {
          // Silently skip files that don't intersect bbox or have errors
          if (!error.message?.includes('No features found')) {
            console.warn(`⚠️  Error querying ${path.basename(gpkgFile)}:`, error.message);
          }
        }
      }
      
      console.log(`📍 CSB Query: Found ${allFeatures.length} REAL USDA boundaries in bbox [${bbox.minLng.toFixed(3)}, ${bbox.minLat.toFixed(3)}, ${bbox.maxLng.toFixed(3)}, ${bbox.maxLat.toFixed(3)}]`);
      
      return {
        type: 'FeatureCollection',
        name: 'USDA Crop Sequence Boundaries',
        features: allFeatures.slice(0, limit)
      };
    } catch (error) {
      console.error('❌ CSB Query error:', error);
      return { type: 'FeatureCollection', features: [] };
    }
  }

  /**
   * Get crop name from CDL code
   */
  getCropName(code: number): string {
    const cropCodes: Record<number, string> = {
      1: 'Corn',
      5: 'Soybeans',
      24: 'Winter Wheat',
      36: 'Alfalfa',
      61: 'Fallow/Idle',
      176: 'Grassland/Pasture'
    };
    return cropCodes[code] || `Crop ${code}`;
  }

  /**
   * Get statistics about loaded data
   */
  getStats() {
    return {
      loaded: this.loaded,
      stateFiles: this.gpkgFiles.map(f => path.basename(f)),
      totalStates: this.gpkgFiles.length,
      estimatedBoundaries: this.gpkgFiles.length > 0 ? '~2-3 million' : '0'
    };
  }
}

// Singleton instance
export const csbStorage = new CSBStorage();
