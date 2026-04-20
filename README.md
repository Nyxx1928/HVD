# Valentine's Love Wall

[![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml)

A full-stack application for sharing love notes and messages, built with NestJS backend and Next.js frontend.

## Project Structure

```
.
├── backend/          # NestJS API server
├── valentines/       # Next.js frontend application
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Quick Start

**New to the project?** Check out the [Quick Start Guide](./QUICK_START.md) for the fastest way to get up and running!

### Local Development

#### Prerequisites
- Node.js 20+
- PostgreSQL 16
- npm

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update DATABASE_URL in .env
npx prisma migrate deploy
npm run start:dev
```

#### Frontend Setup
```bash
cd valentines
npm install
cp .env.example .env.local
# Update NEXT_PUBLIC_API_URL in .env.local
npm run dev
```

### Docker Setup

See [DOCKER.md](./DOCKER.md) for detailed Docker instructions.

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Features

- 💌 Create and share love notes
- 💬 Comment on love notes
- 🎨 Customizable note colors and emojis
- 🔒 Rate limiting for API protection
- 🐳 Docker support
- 🧪 Comprehensive testing (Unit, Integration, E2E)
- 🔐 Security scanning and SBOM generation

## Tech Stack

### Backend
- NestJS
- Prisma ORM
- PostgreSQL
- TypeScript
- Jest

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Three.js

### DevOps
- Docker & Docker Compose
- GitHub Actions CI/CD
- Playwright (E2E testing)
- Trivy (Security scanning)
- Cosign (Artifact signing)

## Documentation

- [CI/CD Pipeline](./CI.md) - Comprehensive CI/CD documentation
- [Docker Setup](./DOCKER.md) - Docker deployment guide
- [Backend README](./backend/README.md) - Backend-specific documentation
- [Frontend README](./valentines/README.md) - Frontend-specific documentation

## Development

### Running Tests

```bash
# Backend unit tests
cd backend && npm test

# Backend integration tests
cd backend && npm run test:e2e

# Frontend E2E tests
cd valentines && npm run test:e2e
```

### Linting

```bash
# Backend
cd backend && npm run lint

# Frontend
cd valentines && npm run lint
```

### Type Checking

```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend
cd valentines && npx tsc --noEmit
```

## CI/CD Pipeline

The project uses a 7-phase CI/CD pipeline:

1. **Lint, Validate, and Sanitize** - Code quality and security checks
2. **Unit Testing** - Component-level tests
3. **Integration Testing** - API endpoint tests with database
4. **E2E Testing (Playwright)** - Full application flow tests
5. **Test and Build Docker** - Container image validation
6. **Security Scan** - Vulnerability scanning and SBOM generation
7. **CI Summary** - Results aggregation

See [CI.md](./CI.md) for detailed pipeline documentation.

## Security

- Automated security scanning with Trivy
- SBOM generation with Syft
- Artifact signing with Cosign
- Input sanitization checks
- Rate limiting on API endpoints
- SQL injection prevention with Prisma

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

All PRs must pass the CI pipeline before merging.

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
