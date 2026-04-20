# Quick Start Guide

Get up and running with Valentine's Love Wall in minutes!

## 🚀 Option 1: Docker (Recommended)

**Prerequisites**: Docker and Docker Compose

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/valentines-love-wall.git
cd valentines-love-wall

# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

**Access**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

**Stop**:
```bash
docker compose down
```

## 💻 Option 2: Local Development

**Prerequisites**: Node.js 20+, PostgreSQL 16

### Automated Setup

```bash
# Linux/Mac
bash setup.sh

# Windows
setup.bat
```

### Manual Setup

#### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL
npx prisma migrate deploy
npm run start:dev
```

#### 2. Frontend

```bash
cd valentines
npm install
cp .env.example .env.local
# Edit .env.local with NEXT_PUBLIC_API_URL
npm run dev
```

#### 3. Database

```bash
# Using Docker
docker run -d -p 5432:5432 \
  -e POSTGRES_DB=valentines \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16

# Or install PostgreSQL locally
```

## 🧪 Running Tests

```bash
# Backend unit tests
cd backend && npm test

# Backend integration tests
cd backend && npm run test:e2e

# Frontend E2E tests
cd valentines && npm run test:e2e
```

## 🔍 Linting & Type Checking

```bash
# Backend
cd backend
npm run lint
npx tsc --noEmit

# Frontend
cd valentines
npm run lint
npx tsc --noEmit
```

## 📦 Building for Production

```bash
# Backend
cd backend && npm run build

# Frontend
cd valentines && npm run build

# Docker images
docker build -f backend/Dockerfile -t valentines/backend backend
docker build -f valentines/Dockerfile -t valentines/frontend valentines
```

## 🛠️ Common Commands

### Backend
```bash
cd backend

# Development
npm run start:dev

# Production
npm run start:prod

# Tests
npm test
npm run test:e2e
npm run test:cov

# Database
npx prisma migrate dev
npx prisma studio
npx prisma generate
```

### Frontend
```bash
cd valentines

# Development
npm run dev

# Production
npm run build
npm start

# Tests
npm run test:e2e

# Playwright
npx playwright test --ui
npx playwright show-report
```

### Docker
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Rebuild
docker compose up -d --build

# Clean up
docker compose down -v
```

## 🌐 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/valentines
PORT=3001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📚 Documentation

- [README.md](./README.md) - Project overview
- [CI.md](./CI.md) - CI/CD pipeline
- [DOCKER.md](./DOCKER.md) - Docker guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guide
- [valentines/PLAYWRIGHT.md](./valentines/PLAYWRIGHT.md) - E2E testing

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or change port in .env
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps  # If using Docker
pg_isready  # If installed locally

# Verify DATABASE_URL in .env
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Prisma Client Issues

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

### Docker Issues

```bash
# Clean up Docker
docker compose down -v
docker system prune -a

# Rebuild from scratch
docker compose up -d --build --force-recreate
```

## 🎯 Next Steps

1. ✅ Get the app running
2. 📖 Read the [documentation](./README.md)
3. 🧪 Run the tests
4. 🔧 Make your first change
5. 📝 Read [CONTRIBUTING.md](./CONTRIBUTING.md)
6. 🚀 Submit your first PR

## 💡 Tips

- Use Docker for quickest setup
- Run tests before committing
- Check CI pipeline status
- Read error messages carefully
- Ask for help in issues/discussions

## 🆘 Need Help?

- 📖 Check documentation
- 🐛 Search existing issues
- 💬 Start a discussion
- 📧 Contact maintainers

Happy coding! 💝
