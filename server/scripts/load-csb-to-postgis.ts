import { db } from '../db';
import { sql } from 'drizzle-orm';
import { spawn } from 'child_process';
import * as path from 'path';

const states = [
  { name: 'Iowa', file: 'iowa.gpkg', fips: '19' },
  { name: 'Illinois', file: 'illinois.gpkg', fips: '17' },
  { name: 'Indiana', file: 'indiana.gpkg', fips: '18' },
  { name: 'Minnesota', file: 'minnesota.gpkg', fips: '27' },
  { name: 'Nebraska', file: 'nebraska.gpkg', fips: '31' }
];

async function loadStateToPostGIS(stateName: string, gpkgFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n🌾 Loading ${stateName} into PostGIS...`);
    
    const filePath = path.join(__dirname, '../data/csb', gpkgFile);
    const databaseUrl = process.env.DATABASE_URL!;
    
    const args = [
      '-f', 'PostgreSQL',
      `PG:${databaseUrl}`,
      '-nln', 'csb_boundaries',
      '-append',
      '-nlt', 'PROMOTE_TO_MULTI',
      '-lco', 'GEOMETRY_NAME=geom',
      '-progress',
      filePath
    ];
    
    const ogr2ogr = spawn('ogr2ogr', args);
    
    let stdout = '';
    let stderr = '';
    
    ogr2ogr.stdout?.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });
    
    ogr2ogr.stderr?.on('data', (data) => {
      stderr += data.toString();
      process.stderr.write(data);
    });
    
    ogr2ogr.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${stateName} loaded successfully`);
        resolve();
      } else {
        console.error(`❌ ${stateName} failed with code ${code}`);
        console.error(stderr);
        reject(new Error(`ogr2ogr failed for ${stateName}`));
      }
    });
    
    ogr2ogr.on('error', (error) => {
      console.error(`❌ ${stateName} error:`, error);
      reject(error);
    });
  });
}

async function main() {
  console.log('🚜 Starting CSB data load into PostGIS');
  console.log('This will load ~2-3 million real USDA field boundaries\n');
  
  for (const state of states) {
    try {
      await loadStateToPostGIS(state.name, state.file);
      
      // Check count
      const result = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM csb_boundaries 
        WHERE statefips = ${state.fips}
      `);
      console.log(`📊 ${state.name} total boundaries: ${result.rows[0]?.count || 0}`);
      
    } catch (error) {
      console.error(`Failed to load ${state.name}:`, error);
      // Continue with next state
    }
  }
  
  // Final count
  const totalResult = await db.execute(sql`SELECT COUNT(*) as count FROM csb_boundaries`);
  console.log(`\n✅ TOTAL BOUNDARIES LOADED: ${totalResult.rows[0]?.count || 0}`);
  
  console.log('\n🔄 Creating indexes...');
  await db.execute(sql`VACUUM ANALYZE csb_boundaries`);
  console.log('✅ Done!');
}

main().catch(console.error);
