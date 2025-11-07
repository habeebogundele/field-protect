#!/bin/bash

echo "🚜 FieldShare - Next.js Migration Setup"
echo "======================================="
echo ""

# Check if backup already exists
if [ -f "package.express.json" ]; then
    echo "⚠️  Backup files already exist. Skipping backup step."
else
    echo "📦 Step 1: Backing up Express configuration..."
    mv package.json package.express.json
    mv tsconfig.json tsconfig.express.json
    mv tailwind.config.ts tailwind.config.express.ts
    echo "✅ Backup complete!"
fi

echo ""
echo "📦 Step 2: Switching to Next.js configuration..."
cp package.nextjs.json package.json
cp tsconfig.nextjs.json tsconfig.json
cp tailwind.config.nextjs.js tailwind.config.js
echo "✅ Configuration files updated!"

echo ""
echo "📦 Step 3: Installing dependencies..."
npm install
echo "✅ Dependencies installed!"

echo ""
echo "📦 Step 4: Checking environment variables..."
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env with your actual values!"
else
    echo "✅ .env file exists!"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your environment variables"
echo "2. Run 'npm run db:push' to push database schema"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "📚 See MIGRATION_GUIDE.md for detailed information"
echo "📚 See NEXTJS_README.md for usage instructions"
echo ""
echo "To rollback to Express version:"
echo "  mv package.json package.nextjs.json"
echo "  mv package.express.json package.json"
echo "  mv tsconfig.express.json tsconfig.json"
echo "  mv tailwind.config.express.ts tailwind.config.ts"
echo "  npm install"
