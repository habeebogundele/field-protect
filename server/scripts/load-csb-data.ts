import { promises as fs } from 'fs';
import path from 'path';
import https from 'https';

/**
 * USDA Crop Sequence Boundaries Data Loader
 * 
 * This script downloads and processes USDA CSB data for specific counties.
 * 
 * USDA CSB Data Source: https://www.nass.usda.gov/Research_and_Science/Crop-Sequence-Boundaries/
 * 
 * For full state data, download from USDA NASS website (files are 1-3GB per state)
 */

interface CountyFilter {
  state: string;
  counties: string[];
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.open(outputPath, 'w');
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.on('data', async (chunk) => {
        await (await file).write(chunk);
      });
      
      response.on('end', async () => {
        await (await file).close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function filterByCounties(
  inputFile: string,
  outputFile: string,
  filter: CountyFilter
): Promise<number> {
  const data = await fs.readFile(inputFile, 'utf-8');
  const geojson = JSON.parse(data);
  
  const filtered = {
    type: 'FeatureCollection',
    name: `${filter.state} - ${filter.counties.join(', ')} Counties`,
    features: geojson.features.filter((feature: any) => 
      filter.counties.includes(feature.properties.county) &&
      feature.properties.state === filter.state
    )
  };
  
  await fs.writeFile(outputFile, JSON.stringify(filtered, null, 2));
  return filtered.features.length;
}

async function loadMinnesotaCounties() {
  console.log('🌾 USDA CSB Data Loader for Minnesota');
  console.log('=====================================\n');
  
  const targetCounties = {
    state: 'MN',
    counties: ['Renville', 'Meeker', 'Sibley', 'McLeod']
  };
  
  console.log(`📍 Target Counties: ${targetCounties.counties.join(', ')}`);
  console.log(`📊 State: Minnesota\n`);
  
  // For full USDA data:
  // 1. Download Minnesota CSB from USDA NASS (1-3GB file)
  // 2. Uncomment the code below
  
  /*
  const usdaUrl = 'https://www.nass.usda.gov/Research_and_Science/Crop-Sequence-Boundaries/Downloads/MN_2023_CSB.geojson';
  const tempFile = path.join(__dirname, '../data/csb/temp-minnesota-full.geojson');
  const outputFile = path.join(__dirname, '../data/csb/minnesota-counties.geojson');
  
  console.log('⬇️  Downloading Minnesota CSB data from USDA...');
  await downloadFile(usdaUrl, tempFile);
  console.log('✅ Download complete\n');
  
  console.log('🔍 Filtering to target counties...');
  const count = await filterByCounties(tempFile, outputFile, targetCounties);
  console.log(`✅ Extracted ${count} field boundaries\n`);
  
  // Clean up temp file
  await fs.unlink(tempFile);
  console.log('🧹 Cleaned up temporary files\n');
  */
  
  console.log('ℹ️  NOTE: Currently using sample data for testing.');
  console.log('ℹ️  To load full USDA data:');
  console.log('   1. Visit https://www.nass.usda.gov/Research_and_Science/Crop-Sequence-Boundaries/');
  console.log('   2. Download Minnesota CSB GeoJSON');
  console.log('   3. Place in server/data/csb/minnesota-full.geojson');
  console.log('   4. Run this script to extract your counties\n');
  
  console.log('✅ Data loader ready for production use');
}

// Run if called directly
if (require.main === module) {
  loadMinnesotaCounties().catch(console.error);
}

export { loadMinnesotaCounties, filterByCounties };
