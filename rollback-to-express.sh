#!/bin/bash

echo "🔄 FieldShare - Rollback to Express Version"
echo "==========================================="
echo ""

# Check if Express backup exists
if [ ! -f "package.express.json" ]; then
    echo "❌ Error: No Express backup found!"
    echo "Cannot rollback without package.express.json"
    exit 1
fi

echo "📦 Step 1: Backing up Next.js configuration..."
mv package.json package.nextjs.json
mv tsconfig.json tsconfig.nextjs.json
mv tailwind.config.js tailwind.config.nextjs.js
echo "✅ Next.js configuration backed up!"

echo ""
echo "📦 Step 2: Restoring Express configuration..."
cp package.express.json package.json
cp tsconfig.express.json tsconfig.json
cp tailwind.config.express.ts tailwind.config.ts
echo "✅ Express configuration restored!"

echo ""
echo "📦 Step 3: Installing Express dependencies..."
npm install
echo "✅ Dependencies installed!"

echo ""
echo "🎉 Rollback complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the Express server (port 5000)"
echo "2. Your data and .env file are unchanged"
echo ""
echo "To switch back to Next.js:"
echo "  ./setup-nextjs.sh"
