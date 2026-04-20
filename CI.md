# CI/CD Pipeline Documentation

This project uses a comprehensive 7-phase CI/CD pipeline to ensure code quality, security, and reliability.

📊 **Visual Pipeline Diagram**: See [.github/CI_PIPELINE_DIAGRAM.md](./.github/CI_PIPELINE_DIAGRAM.md) for a visual representation of the pipeline flow.

## Pipeline Overview

The CI pipeline runs on:
- Push to `main` branch
- Pull requests

### Phase 1: Lint, Validate, and Sanitize
**Purpose**: Ensure code quality and security standards

**Steps**:
- Install dependencies for backend and frontend
- Check for hardcoded secrets
- Validate sensitive files are not committed
- Validate package.json integrity
- Check for unsafe input handling patterns (SQL injection, XSS, eval usage)
- Run ESLint on backend and frontend
- Run TypeScript type checking

**Security Checks**:
- Detects potential hardcoded secrets (passwords, API keys, tokens)
- Identifies SQL injection vulnerabilities
- Flags XSS risks (innerHTML, dangerouslySetInnerHTML)
- Detects eval() usage

### Phase 2: Unit Testing
**Purpose**: Validate individual components work correctly

**Steps**:
- Install backend dependencies
- Run Jest unit tests
- Generate coverage reports

**Requirements**:
- All unit tests must pass
- Depends on Phase 1 success

### Phase 3: Integration Testing
**Purpose**: Test backend API endpoints with real database

**Steps**:
- Start PostgreSQL service
- Install backend dependencies
- Run Prisma migrations
- Execute e2e tests

**Services**:
- PostgreSQL 16 (port 5432)

**Environment**:
- `DATABASE_URL`: postgres://postgres:postgres@localhost:5432/valentines_test

### Phase 4: E2E Testing (Playwright)
**Purpose**: Test full application flow in browser

**Steps**:
- Start PostgreSQL service
- Install dependencies for backend and frontend
- Validate Playwright configuration exists
- Install Playwright browsers
- Run database migrations
- Build backend and frontend
- Execute Playwright tests
- Upload test reports as artifacts

**Services**:
- PostgreSQL 16 (port 5432)

**Artifacts**:
- Playwright HTML report
- Test results and screenshots

### Phase 5: Test and Build Docker
**Purpose**: Validate Docker configuration and build images

**Steps**:
- Set up Docker Buildx
- Validate Docker files exist (docker-compose.yml, Dockerfiles)
- Validate Docker Compose configuration
- Start services with Docker Compose
- Verify services are running
- Build backend Docker image
- Build frontend Docker image
- Clean up containers and volumes

**Docker Images Built**:
- `valentines/backend:ci`
- `valentines/frontend:ci`

### Phase 6: Security Scan
**Purpose**: Identify vulnerabilities and generate security artifacts

**Steps**:
- Install Syft (SBOM generator)
- Generate Software Bill of Materials (SBOM)
- Install Trivy (vulnerability scanner)
- Scan for CRITICAL vulnerabilities (fails on findings)
- Scan for HIGH/CRITICAL vulnerabilities (report only)
- Install Cosign (artifact signing)
- Sign SBOM with keyless signing (push events only)
- Verify signed artifacts
- Upload security artifacts

**Security Tools**:
- **Syft**: Generates SBOM in SPDX format
- **Trivy**: Scans for vulnerabilities in dependencies
- **Cosign**: Signs artifacts using Sigstore keyless signing

**Artifacts**:
- `sbom-dependencies.spdx.json`: Software Bill of Materials
- `trivy-report.txt`: Vulnerability scan report
- `sbom.sig`: SBOM signature
- `sbom.pem`: Signing certificate

**Vulnerability Thresholds**:
- CRITICAL: Pipeline fails if found (unfixed ignored)
- HIGH: Reported but doesn't fail pipeline

### Phase 7: CI Summary
**Purpose**: Aggregate results and provide overview

**Steps**:
- Collect results from all phases
- Generate summary table
- Fail if any phase failed

**Summary Includes**:
- Status of each phase (success/failure)
- Overall pipeline result

## Local Testing

### Run Linting
```bash
# Backend
cd backend && npm run lint

# Frontend
cd valentines && npm run lint
```

### Run Type Checking
```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend
cd valentines && npx tsc --noEmit
```

### Run Unit Tests
```bash
cd backend && npm test
```

### Run Integration Tests
```bash
# Start PostgreSQL first
docker run -d -p 5432:5432 \
  -e POSTGRES_DB=valentines_test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16

# Run tests
cd backend && npm run test:e2e
```

### Run Playwright Tests
```bash
cd valentines
npm install
npx playwright install --with-deps
npm run test:e2e
```

### Build Docker Images
```bash
# Backend
docker build -f backend/Dockerfile -t valentines/backend:local backend

# Frontend
docker build -f valentines/Dockerfile -t valentines/frontend:local valentines
```

### Run Docker Compose
```bash
docker compose up -d
```

## Troubleshooting

### Phase 1 Failures

**Linting Errors**:
```bash
npm run lint -- --fix
```

**Type Errors**:
Review TypeScript errors and fix type issues

**Security Violations**:
- Remove hardcoded secrets
- Use environment variables
- Sanitize user inputs

### Phase 2 Failures

**Unit Test Failures**:
```bash
cd backend && npm test -- --verbose
```

### Phase 3 Failures

**Database Connection**:
- Verify PostgreSQL service is healthy
- Check DATABASE_URL format

**Migration Failures**:
```bash
cd backend && npx prisma migrate reset
```

### Phase 4 Failures

**Playwright Tests**:
```bash
cd valentines
npm run test:e2e -- --debug
```

View reports:
```bash
npx playwright show-report
```

### Phase 5 Failures

**Docker Build Issues**:
- Check Dockerfile syntax
- Verify all required files exist
- Review build logs

**Docker Compose Issues**:
```bash
docker compose config  # Validate configuration
docker compose logs    # View service logs
```

### Phase 6 Failures

**Trivy Vulnerabilities**:
- Review `trivy-report.txt` artifact
- Update dependencies
- Add exceptions to `.trivyignore` if needed

**Cosign Failures**:
- Only runs on push events (not PRs)
- Requires proper GitHub OIDC permissions

## Configuration Files

- `.github/workflows/ci.yml`: Main CI pipeline
- `docker-compose.yml`: Docker services configuration
- `backend/Dockerfile`: Backend container image
- `valentines/Dockerfile`: Frontend container image
- `.trivyignore`: Trivy vulnerability exceptions
- `valentines/playwright.config.ts`: Playwright configuration

## Environment Variables

### CI Environment
All required environment variables are configured in the workflow file.

### Local Development
Create `.env` files:

**backend/.env**:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/valentines
PORT=3001
```

**valentines/.env.local**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Security Best Practices

1. **Never commit secrets**: Use environment variables
2. **Keep dependencies updated**: Regularly run `npm audit`
3. **Review Trivy reports**: Address HIGH/CRITICAL vulnerabilities
4. **Sanitize inputs**: Prevent XSS and SQL injection
5. **Use parameterized queries**: Avoid SQL concatenation
6. **Validate Docker images**: Scan before deployment

## Artifacts

Pipeline artifacts are available for 90 days:
- Playwright reports (Phase 4)
- Security artifacts (Phase 6)

Download from GitHub Actions run page.

## Performance

Typical pipeline duration:
- Phase 1: ~2-3 minutes
- Phase 2: ~1-2 minutes
- Phase 3: ~2-3 minutes
- Phase 4: ~5-7 minutes
- Phase 5: ~3-5 minutes
- Phase 6: ~2-3 minutes
- Phase 7: ~30 seconds

**Total**: ~15-25 minutes

## Contributing

Before submitting a PR:
1. Run linting and type checking locally
2. Ensure all tests pass
3. Build Docker images successfully
4. Review security scan results
