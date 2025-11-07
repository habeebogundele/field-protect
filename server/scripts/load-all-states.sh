#!/bin/bash
set -e

echo "🚜 Loading all corn belt states into PostGIS..."
echo "This will take 30-60 minutes for ~2-3 million boundaries"
echo ""

cd server/data/csb

# Load each state
for state_file in iowa.gpkg illinois.gpkg indiana.gpkg minnesota.gpkg nebraska.gpkg; do
  state_name=$(basename "$state_file" .gpkg)
  echo "======================================"
  echo "🌾 Loading $state_name..."
  echo "======================================"
  
  ogr2ogr -f "PostgreSQL" \
    "PG:$DATABASE_URL" \
    -nln csb_boundaries \
    -append \
    -nlt PROMOTE_TO_MULTI \
    -lco GEOMETRY_NAME=geom \
    -progress \
    "$state_file"
  
  echo "✅ $state_name loaded"
  echo ""
done

echo "======================================"
echo "✅ ALL STATES LOADED!"
echo "======================================"

# Get count
psql "$DATABASE_URL" -c "SELECT state_fips, COUNT(*) as count FROM csb_boundaries GROUP BY state_fips ORDER BY state_fips;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_boundaries FROM csb_boundaries;"

echo ""
echo "Running VACUUM ANALYZE..."
psql "$DATABASE_URL" -c "VACUUM ANALYZE csb_boundaries;"

echo "✅ Done!"
