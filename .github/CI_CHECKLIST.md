# CI Pipeline Checklist

This checklist helps you ensure your code will pass the CI pipeline before pushing.

## ✅ Pre-Push Checklist

Run these commands locally before pushing to avoid CI failures:

### Backend Checks

```bash
cd backend

# 1. Install dependencies
npm ci

# 2. Linting
npm run lint

# 3. Type checking
npx tsc --noEmit

# 4. Unit tests
npm test

# 5. Integration tests (requires PostgreSQL)
npm run test:e2e

# 6. Build
npm run build
```

### Frontend Checks

```bash
cd valentines

# 1. Install dependencies
npm ci

# 2. Linting
npm run lint

# 3. Type checking
npx tsc --noEmit

# 4. E2E tests (requires Playwright)
npm run test:e2e

# 5. Build
npm run build
```

### Security Checks

```bash
# From project root

# 1. Check for hardcoded secrets
grep -r -E "(PASSWORD|SECRET|API_KEY|TOKEN|CREDENTIAL)\s*=\s*['\"][a-zA-Z0-9+/=]{16,}" \
  --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" \
  --exclude-dir={node_modules,.git,.next,dist,build} \
  backend/ valentines/

# 2. Check for sensitive files
find . -name ".env" -o -name ".env.local" -o -name "*.pem" -o -name "*.key" \
  -not -path "*/node_modules/*" -not -path "*/.git/*"

# 3. Check for unsafe patterns
grep -r -E "\beval\(" --include="*.ts" --include="*.js" \
  --exclude-dir={node_modules,.git,.next,dist,build} backend/ valentines/

# 4. Check for innerHTML usage
grep -r -E "\.innerHTML\s*=" --include="*.ts" --include="*.tsx" \
  --exclude-dir={node_modules,.git,.next,dist,build} valentines/
```

### Docker Checks

```bash
# 1. Validate Docker Compose
docker compose config

# 2. Build backend image
docker build -f backend/Dockerfile -t valentines/backend:test backend

# 3. Build frontend image
docker build -f valentines/Dockerfile -t valentines/frontend:test valentines

# 4. Test with Docker Compose
docker compose up -d
docker compose ps
docker compose down -v
```

## 📋 CI Pipeline Phases

### Phase 1: Lint, Validate, and Sanitize ⏱️ ~2-3 min

- [ ] No hardcoded secrets
- [ ] No sensitive files committed
- [ ] Valid package.json files
- [ ] No unsafe input handling
- [ ] Backend linting passes
- [ ] Frontend linting passes
- [ ] Backend type checking passes
- [ ] Frontend type checking passes

**Common Failures**:
- ESLint errors → Run `npm run lint -- --fix`
- TypeScript errors → Fix type issues
- Hardcoded secrets → Use environment variables

### Phase 2: Unit Testing ⏱️ ~1-2 min

- [ ] All backend unit tests pass
- [ ] Test coverage meets requirements

**Common Failures**:
- Test failures → Run `npm test` locally
- Missing mocks → Add proper test mocks

### Phase 3: Integration Testing ⏱️ ~2-3 min

- [ ] PostgreSQL service starts
- [ ] Database migrations succeed
- [ ] All e2e tests pass

**Common Failures**:
- Database connection → Check DATABASE_URL
- Migration errors → Test migrations locally
- API test failures → Run `npm run test:e2e` locally

### Phase 4: E2E (Playwright) ⏱️ ~5-7 min

- [ ] Playwright config exists
- [ ] Test directory exists
- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] All Playwright tests pass

**Common Failures**:
- Build errors → Run `npm run build` locally
- Test timeouts → Increase timeouts or fix slow operations
- Element not found → Update selectors

### Phase 5: Test and Build Docker ⏱️ ~3-5 min

- [ ] docker-compose.yml exists
- [ ] Dockerfiles exist
- [ ] Docker Compose config valid
- [ ] Services start successfully
- [ ] Backend image builds
- [ ] Frontend image builds

**Common Failures**:
- Build context errors → Check .dockerignore
- Missing files → Verify COPY commands
- Service health checks → Check service logs

### Phase 6: Security Scan ⏱️ ~2-3 min

- [ ] SBOM generated
- [ ] No CRITICAL vulnerabilities
- [ ] Trivy scan passes
- [ ] Artifacts signed (push only)

**Common Failures**:
- Critical vulnerabilities → Update dependencies
- High vulnerabilities → Review and update or add to .trivyignore

### Phase 7: CI Summary ⏱️ ~30 sec

- [ ] All phases succeeded
- [ ] Summary generated

## 🚨 Quick Fixes

### Linting Errors
```bash
npm run lint -- --fix
```

### Type Errors
```bash
# Check errors
npx tsc --noEmit

# Common fixes:
# - Add proper types
# - Fix import statements
# - Update interfaces
```

### Test Failures
```bash
# Run specific test
npm test -- path/to/test.spec.ts

# Run with verbose output
npm test -- --verbose

# Update snapshots (if applicable)
npm test -- -u
```

### Build Errors
```bash
# Clear cache
rm -rf .next dist node_modules
npm install
npm run build
```

### Docker Errors
```bash
# Check Docker daemon
docker ps

# Validate Dockerfile
docker build -f backend/Dockerfile backend --no-cache

# Check logs
docker compose logs
```

## 💡 Pro Tips

1. **Run checks locally first** - Saves CI time and iterations
2. **Use pre-commit hooks** - Automate checks before commit
3. **Fix one phase at a time** - Don't try to fix everything at once
4. **Read error messages** - They usually tell you exactly what's wrong
5. **Check CI logs** - Full error details are in the GitHub Actions logs
6. **Test Docker locally** - Don't wait for CI to test Docker builds
7. **Keep dependencies updated** - Reduces security scan failures
8. **Use .trivyignore wisely** - Document why vulnerabilities are ignored

## 🔧 Automation

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "Running pre-commit checks..."

# Lint
npm run lint --prefix backend
npm run lint --prefix valentines

# Type check
npx tsc --noEmit --project backend/tsconfig.json
npx tsc --noEmit --project valentines/tsconfig.json

# Tests
npm test --prefix backend

echo "✅ Pre-commit checks passed!"
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

### VS Code Tasks

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run All CI Checks",
      "type": "shell",
      "command": "npm run lint && npx tsc --noEmit && npm test",
      "problemMatcher": []
    }
  ]
}
```

## 📊 Expected Timings

| Phase | Duration | Can Fail |
|-------|----------|----------|
| Phase 1 | 2-3 min | Yes |
| Phase 2 | 1-2 min | Yes |
| Phase 3 | 2-3 min | Yes |
| Phase 4 | 5-7 min | Yes |
| Phase 5 | 3-5 min | Yes |
| Phase 6 | 2-3 min | Yes |
| Phase 7 | 30 sec | No |
| **Total** | **15-25 min** | - |

## 🆘 Still Failing?

1. Check the [CI.md](../CI.md) documentation
2. Review GitHub Actions logs
3. Search existing issues
4. Ask in discussions
5. Contact maintainers

Remember: The CI pipeline is here to help you catch issues early! 🎯
