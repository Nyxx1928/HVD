#!/bin/bash

# Valentine's Love Wall - Setup Script
# This script helps set up the development environment

set -e

echo "🎉 Valentine's Love Wall - Setup Script"
echo "========================================"
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20 or higher is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"
echo ""

# Check if Docker is installed
echo "🐳 Checking Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed: $(docker --version)"
else
    echo "⚠️  Docker is not installed. Docker is optional but recommended."
fi
echo ""

# Backend setup
echo "🔧 Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update DATABASE_URL in backend/.env"
fi

echo "📦 Installing backend dependencies..."
npm install

echo "🗄️  Generating Prisma client..."
npx prisma generate

echo "✅ Backend setup complete!"
echo ""

cd ..

# Frontend setup
echo "🎨 Setting up frontend..."
cd valentines

if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Please update NEXT_PUBLIC_API_URL in valentines/.env.local"
fi

echo "📦 Installing frontend dependencies..."
npm install

echo "✅ Frontend setup complete!"
echo ""

cd ..

# Summary
echo "🎊 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo ""
echo "1. Update environment variables:"
echo "   - backend/.env"
echo "   - valentines/.env.local"
echo ""
echo "2. Start PostgreSQL database:"
echo "   docker run -d -p 5432:5432 \\"
echo "     -e POSTGRES_DB=valentines \\"
echo "     -e POSTGRES_USER=postgres \\"
echo "     -e POSTGRES_PASSWORD=postgres \\"
echo "     postgres:16"
echo ""
echo "3. Run database migrations:"
echo "   cd backend && npx prisma migrate deploy"
echo ""
echo "4. Start the backend:"
echo "   cd backend && npm run start:dev"
echo ""
echo "5. Start the frontend:"
echo "   cd valentines && npm run dev"
echo ""
echo "Or use Docker Compose:"
echo "   docker compose up -d"
echo ""
echo "📚 Documentation:"
echo "   - README.md - Project overview"
echo "   - CI.md - CI/CD pipeline documentation"
echo "   - DOCKER.md - Docker setup guide"
echo ""
echo "Happy coding! 💝"
