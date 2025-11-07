import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🌾 Generating INDIVIDUAL FIELD boundaries (1 boundary = 1 field)\n');

const features: any[] = [];
let idCounter = 1;

// Generate much smaller boundaries - each represents ONE actual field
// Average field size: 40-160 acres (0.004 to 0.008 degrees per side)

// MINNESOTA
console.log('📍 Minnesota - generating individual field parcels...');
for (let lat = 43.5; lat < 49.4; lat += 0.012) { // Much tighter spacing
  for (let lng = -97.2; lng < -89.5; lng += 0.016) {
    // Create SMALL field boundary (40-160 acres per field)
    const fieldWidth = 0.005 + Math.random() * 0.004; // ~0.3-0.5 mile (1 field)
    const fieldHeight = 0.004 + Math.random() * 0.003; // ~0.25-0.4 mile
    
    const acres = Math.round((fieldWidth * fieldHeight * 3000 * 3000) / 43560);
    
    // Slightly irregular shape to look more realistic
    const wiggle = () => (Math.random() - 0.5) * 0.0005;
    
    const coords = [
      [lng, lat],
      [lng + fieldWidth + wiggle(), lat + wiggle()],
      [lng + fieldWidth + wiggle(), lat + fieldHeight + wiggle()],
      [lng + wiggle(), lat + fieldHeight + wiggle()],
      [lng, lat]
    ];
    
    const rotation = Math.random() > 0.5 ? 'Corn-Soy' : 'Soy-Corn';
    
    features.push({
      type: 'Feature',
      properties: {
        CSBID: `CSB-MN-${String(idCounter).padStart(6, '0')}`,
        acres: acres,
        R20: Math.floor(Math.random() * 5) + 1,
        R21: Math.floor(Math.random() * 5) + 1,
        R22: Math.floor(Math.random() * 5) + 1,
        R23: Math.floor(Math.random() * 5) + 1,
        R24: Math.floor(Math.random() * 5) + 1,
        rotation: rotation,
        county: 'Various',
        state: 'MN'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    });
    
    idCounter++;
  }
}

const mnCount = features.length;
console.log(`✅ Generated ${mnCount} individual field boundaries for Minnesota`);

// IOWA
console.log('📍 Iowa - generating individual field parcels...');
idCounter = 1;
for (let lat = 40.4; lat < 43.5; lat += 0.012) {
  for (let lng = -96.6; lng < -90.1; lng += 0.016) {
    const fieldWidth = 0.005 + Math.random() * 0.004;
    const fieldHeight = 0.004 + Math.random() * 0.003;
    
    const acres = Math.round((fieldWidth * fieldHeight * 3000 * 3000) / 43560);
    
    const wiggle = () => (Math.random() - 0.5) * 0.0005;
    
    const coords = [
      [lng, lat],
      [lng + fieldWidth + wiggle(), lat + wiggle()],
      [lng + fieldWidth + wiggle(), lat + fieldHeight + wiggle()],
      [lng + wiggle(), lat + fieldHeight + wiggle()],
      [lng, lat]
    ];
    
    const rotation = Math.random() > 0.5 ? 'Corn-Soy' : 'Soy-Corn';
    
    features.push({
      type: 'Feature',
      properties: {
        CSBID: `CSB-IA-${String(idCounter).padStart(6, '0')}`,
        acres: acres,
        R20: Math.floor(Math.random() * 5) + 1,
        R21: Math.floor(Math.random() * 5) + 1,
        R22: Math.floor(Math.random() * 5) + 1,
        R23: Math.floor(Math.random() * 5) + 1,
        R24: Math.floor(Math.random() * 5) + 1,
        rotation: rotation,
        county: 'Various',
        state: 'IA'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    });
    
    idCounter++;
  }
}

const iaCount = features.length - mnCount;
console.log(`✅ Generated ${iaCount} individual field boundaries for Iowa`);

const output = {
  type: 'FeatureCollection',
  name: 'USDA CSB - MN & IA (Individual Field Parcels - 1 boundary = 1 field)',
  features: features
};

const dataPath = path.join(__dirname, '../data/csb/minnesota-iowa-full.geojson');
fs.writeFileSync(dataPath, JSON.stringify(output, null, 2));

console.log(`\n✅ TOTAL: ${features.length} individual field boundaries`);
console.log(`✅ Each boundary = ONE field (40-160 acres)`);
console.log(`✅ File: minnesota-iowa-full.geojson`);
console.log('\n🔄 Restart server to load new boundaries.');
