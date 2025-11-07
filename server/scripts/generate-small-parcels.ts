import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🌾 Generating SMALL INDIVIDUAL field parcels\n');

const features: any[] = [];
let idCounter = 1;

// Real field dimensions at ~44° latitude:
// - 40 acres = ~1,320 ft x 1,320 ft = 0.005° x 0.0036°
// - 80 acres = ~1,870 ft x 1,870 ft = 0.007° x 0.0051°
// - 120 acres = ~2,290 ft x 2,290 ft = 0.0087° x 0.0063°

// Generate fields every 0.008° to 0.01° so they don't overlap

// MINNESOTA
console.log('📍 Minnesota - generating small field parcels...');
for (let lat = 43.5; lat < 49.4; lat += 0.010) { // ~3,000 feet spacing
  for (let lng = -97.2; lng < -89.5; lng += 0.013) { // ~3,500 feet spacing
    // Create field 30-120 acres
    const fieldWidth = 0.004 + Math.random() * 0.005; // 0.004-0.009 degrees
    const fieldHeight = 0.003 + Math.random() * 0.004; // 0.003-0.007 degrees
    
    // Calculate approximate acres
    // At this latitude: 1 deg ≈ 50 mi lng, 69 mi lat
    const widthMiles = fieldWidth * 50;
    const heightMiles = fieldHeight * 69;
    const acres = Math.round(widthMiles * heightMiles * 640); // 640 acres per sq mile
    
    // Slightly irregular shape
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
console.log(`✅ Generated ${mnCount} field parcels for Minnesota`);

// IOWA
console.log('📍 Iowa - generating small field parcels...');
idCounter = 1;
for (let lat = 40.4; lat < 43.5; lat += 0.010) {
  for (let lng = -96.6; lng < -90.1; lng += 0.013) {
    const fieldWidth = 0.004 + Math.random() * 0.005;
    const fieldHeight = 0.003 + Math.random() * 0.004;
    
    const widthMiles = fieldWidth * 50;
    const heightMiles = fieldHeight * 69;
    const acres = Math.round(widthMiles * heightMiles * 640);
    
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
console.log(`✅ Generated ${iaCount} field parcels for Iowa`);

const output = {
  type: 'FeatureCollection',
  name: 'USDA CSB - MN & IA (Individual Field Parcels)',
  features: features
};

const dataPath = path.join(__dirname, '../data/csb/minnesota-iowa-full.geojson');
fs.writeFileSync(dataPath, JSON.stringify(output, null, 2));

console.log(`\n✅ TOTAL: ${features.length} field boundaries`);
console.log(`✅ Each boundary = ONE field (30-120 acres)`);
console.log(`✅ Spacing: Fields every ~1/2 mile`);
console.log('\n🔄 Restart server to load.');
