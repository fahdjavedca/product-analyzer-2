#!/bin/bash

# Global Product Analyzer Setup Script
echo "🚀 Setting up Global Product Analyzer..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker is available"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install missing dependencies if needed
echo "📦 Installing missing dependencies..."
cd backend && npm install ts-node tsconfig-paths && cd ..

# Copy environment template
if [ ! -f .env.local ]; then
    echo "📋 Creating .env.local from template..."
    cp env.example .env.local
    echo "⚠️  Please edit .env.local with your API keys and configuration"
else
    echo "✅ .env.local already exists"
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Setting up database..."
cd backend

# Load environment variables (handle multiline values)
if [ -f "../.env.local" ]; then
    # Export only simple key=value pairs, skip multiline values
    export $(cat ../.env.local | grep -v '^#' | grep -v '^$' | grep -v 'BEGIN.*KEY' | grep -v 'END.*KEY' | xargs)
fi

npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env.local with your API keys"
echo "2. Start development servers:"
echo "   npm run dev"
echo ""
echo "🔗 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:3000"
echo "   API Health: http://localhost:3000/api/v1/health"
echo "   Prisma Studio: cd backend && npx prisma studio"
echo ""
