@echo off
REM Valentine's Love Wall - Setup Script (Windows)
REM This script helps set up the development environment

echo.
echo 🎉 Valentine's Love Wall - Setup Script
echo ========================================
echo.

REM Check Node.js
echo 📦 Checking Node.js version...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 20 or higher.
    exit /b 1
)
echo ✅ Node.js is installed
echo.

REM Check Docker
echo 🐳 Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Docker is not installed. Docker is optional but recommended.
) else (
    echo ✅ Docker is installed
)
echo.

REM Backend setup
echo 🔧 Setting up backend...
cd backend

if not exist ".env" (
    echo 📝 Creating .env file from .env.example...
    copy .env.example .env
    echo ⚠️  Please update DATABASE_URL in backend\.env
)

echo 📦 Installing backend dependencies...
call npm install

echo 🗄️  Generating Prisma client...
call npx prisma generate

echo ✅ Backend setup complete!
echo.

cd ..

REM Frontend setup
echo 🎨 Setting up frontend...
cd valentines

if not exist ".env.local" (
    echo 📝 Creating .env.local file from .env.example...
    copy .env.example .env.local
    echo ⚠️  Please update NEXT_PUBLIC_API_URL in valentines\.env.local
)

echo 📦 Installing frontend dependencies...
call npm install

echo ✅ Frontend setup complete!
echo.

cd ..

REM Summary
echo 🎊 Setup Complete!
echo ==================
echo.
echo Next steps:
echo.
echo 1. Update environment variables:
echo    - backend\.env
echo    - valentines\.env.local
echo.
echo 2. Start PostgreSQL database:
echo    docker run -d -p 5432:5432 ^
echo      -e POSTGRES_DB=valentines ^
echo      -e POSTGRES_USER=postgres ^
echo      -e POSTGRES_PASSWORD=postgres ^
echo      postgres:16
echo.
echo 3. Run database migrations:
echo    cd backend ^&^& npx prisma migrate deploy
echo.
echo 4. Start the backend:
echo    cd backend ^&^& npm run start:dev
echo.
echo 5. Start the frontend:
echo    cd valentines ^&^& npm run dev
echo.
echo Or use Docker Compose:
echo    docker compose up -d
echo.
echo 📚 Documentation:
echo    - README.md - Project overview
echo    - CI.md - CI/CD pipeline documentation
echo    - DOCKER.md - Docker setup guide
echo.
echo Happy coding! 💝

pause
