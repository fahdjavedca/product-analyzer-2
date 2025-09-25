#!/bin/bash

# Database Setup Script for Global Product Analyzer

echo "🗄️  Setting up database..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please run ./setup.sh first."
    exit 1
fi

# Load environment variables (handle multiline values)
echo "📋 Loading environment variables..."
export $(cat .env.local | grep -v '^#' | grep -v '^$' | grep -v 'BEGIN.*KEY' | grep -v 'END.*KEY' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env.local"
    exit 1
fi

echo "✅ DATABASE_URL loaded: ${DATABASE_URL:0:30}..."

# Go to backend directory
cd backend

echo "🔧 Generating Prisma client..."
npx prisma generate

echo "📊 Running database migrations..."
npx prisma migrate dev --name init

echo "🌱 Seeding database..."
npx prisma db seed

echo ""
echo "✅ Database setup completed successfully!"
echo ""
echo "🔗 You can now:"
echo "   - Start the development servers: npm run dev"
echo "   - Open Prisma Studio: npx prisma studio"
echo "   - View the database: http://localhost:5555"
echo ""
