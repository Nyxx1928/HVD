# CI Pipeline Visual Diagram

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     TRIGGER: Push to main / PR                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: Lint, Validate, and Sanitize          ⏱️ 2-3 min     │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Install dependencies (backend + frontend)                    │
│  ✓ Check for hardcoded secrets                                  │
│  ✓ Validate sensitive files                                     │
│  ✓ Check package.json integrity                                 │
│  ✓ Detect unsafe input handling (SQL injection, XSS, eval)      │
│  ✓ Run ESLint (backend + frontend)                              │
│  ✓ Run TypeScript type checking (backend + frontend)            │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: Unit Testing                          ⏱️ 1-2 min     │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Install backend dependencies                                 │
│  ✓ Run Jest unit tests                                          │
│  ✓ Generate coverage reports                                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: Integration Testing                   ⏱️ 2-3 min     │
├─────────────────────────────────────────────────────────────────┤
│  🐘 Start PostgreSQL 16 service                                 │
│  ✓ Install backend dependencies                                 │
│  ✓ Run Prisma migrations                                        │
│  ✓ Execute e2e tests                                            │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: E2E Testing (Playwright)              ⏱️ 5-7 min     │
├─────────────────────────────────────────────────────────────────┤
│  🐘 Start PostgreSQL 16 service                                 │
│  ✓ Install dependencies (backend + frontend)                    │
│  ✓ Validate Playwright configuration                            │
│  ✓ Install Playwright browsers (Chromium, Firefox, WebKit)      │
│  ✓ Run Prisma migrations                                        │
│  ✓ Build backend                                                │
│  ✓ Build frontend                                               │
│  ✓ Execute Playwright tests                                     │
│  📦 Upload test reports as artifacts                            │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: Test and Build Docker                 ⏱️ 3-5 min     │
├─────────────────────────────────────────────────────────────────┤
│  🐳 Set up Docker Buildx                                        │
│  ✓ Validate Docker configuration files                          │
│  ✓ Validate Docker Compose configuration                        │
│  ✓ Start services with Docker Compose                           │
│  ✓ Verify services are running                                  │
│  ✓ Build backend Docker image (valentines/backend:ci)           │
│  ✓ Build frontend Docker image (valentines/frontend:ci)         │
│  ✓ Stop and clean up containers                                 │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 6: Security Scan                         ⏱️ 2-3 min     │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Install Syft (SBOM generator)                               │
│  ✓ Generate Software Bill of Materials (SBOM)                   │
│  🔍 Install Trivy (vulnerability scanner)                       │
│  ✓ Scan for CRITICAL vulnerabilities (fails on findings)        │
│  ✓ Scan for HIGH/CRITICAL vulnerabilities (report)              │
│  🔐 Install Cosign (artifact signing)                           │
│  ✓ Sign SBOM with keyless signing (push events only)            │
│  ✓ Verify signed artifacts                                      │
│  📦 Upload security artifacts                                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 7: CI Summary                            ⏱️ 30 sec      │
├─────────────────────────────────────────────────────────────────┤
│  ✓ Collect results from all phases                              │
│  ✓ Generate summary table                                       │
│  ✓ Fail if any phase failed                                     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
            ┌───────────────┐         ┌───────────────┐
            │  ✅ SUCCESS   │         │  ❌ FAILURE   │
            │               │         │               │
            │  Merge Ready  │         │  Fix Issues   │
            └───────────────┘         └───────────────┘
```

## Phase Dependencies

```
Phase 1 (Lint & Validate)
    │
    └─→ Phase 2 (Unit Tests)
            │
            └─→ Phase 3 (Integration Tests)
                    │
                    └─→ Phase 4 (E2E Tests)
                            │
                            └─→ Phase 5 (Docker Build)
                                    │
                                    └─→ Phase 6 (Security Scan)
                                            │
                                            └─→ Phase 7 (Summary)
```

## Service Dependencies

```
┌──────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐      ┌────────────┐      ┌────────────┐    │
│  │ PostgreSQL │◄─────│  Backend   │◄─────│  Frontend  │    │
│  │   :5432    │      │   :3001    │      │   :3000    │    │
│  └────────────┘      └────────────┘      └────────────┘    │
│       │                     │                    │           │
│       │                     │                    │           │
│       └─────────────────────┴────────────────────┘           │
│                    Health Checks                             │
└──────────────────────────────────────────────────────────────┘
```

## Security Scanning Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Scan Phase                       │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    Syft      │    │    Trivy     │    │   Cosign     │
│              │    │              │    │              │
│ Generate     │    │ Scan for     │    │ Sign & Verify│
│ SBOM         │    │ Vulnerabilities│  │ Artifacts    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Artifacts   │
                    │              │
                    │ • SBOM       │
                    │ • Report     │
                    │ • Signature  │
                    │ • Certificate│
                    └──────────────┘
```

## Test Coverage

```
┌─────────────────────────────────────────────────────────────┐
│                      Test Pyramid                            │
└─────────────────────────────────────────────────────────────┘

                        ┌──────────┐
                        │   E2E    │  Phase 4
                        │ Playwright│  (5-7 min)
                        └──────────┘
                      ┌──────────────┐
                      │ Integration  │  Phase 3
                      │   Tests      │  (2-3 min)
                      └──────────────┘
                  ┌──────────────────────┐
                  │    Unit Tests        │  Phase 2
                  │      (Jest)          │  (1-2 min)
                  └──────────────────────┘
```

## Artifact Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Artifacts Generated                       │
└─────────────────────────────────────────────────────────────┘

Phase 4 (E2E Tests)
    │
    ├─→ playwright-report/
    │       └─→ HTML test report
    │
    └─→ test-results/
            └─→ Screenshots, videos, traces

Phase 6 (Security Scan)
    │
    ├─→ sbom-dependencies.spdx.json
    │       └─→ Software Bill of Materials
    │
    ├─→ trivy-report.txt
    │       └─→ Vulnerability scan results
    │
    ├─→ sbom.sig
    │       └─→ SBOM signature
    │
    └─→ sbom.pem
            └─→ Signing certificate
```

## Failure Handling

```
┌─────────────────────────────────────────────────────────────┐
│                    Failure Recovery                          │
└─────────────────────────────────────────────────────────────┘

Phase Fails
    │
    ├─→ Phase 1 Failure
    │       └─→ Fix linting/type errors
    │           └─→ Push again
    │
    ├─→ Phase 2 Failure
    │       └─→ Fix unit tests
    │           └─→ Push again
    │
    ├─→ Phase 3 Failure
    │       └─→ Fix integration tests
    │           └─→ Push again
    │
    ├─→ Phase 4 Failure
    │       └─→ Fix E2E tests
    │           └─→ Download artifacts
    │               └─→ Review reports
    │                   └─→ Push again
    │
    ├─→ Phase 5 Failure
    │       └─→ Fix Docker configuration
    │           └─→ Test locally
    │               └─→ Push again
    │
    └─→ Phase 6 Failure
            └─→ Update dependencies
                └─→ Or add to .trivyignore
                    └─→ Push again
```

## Timeline

```
0 min  ├─────────────────────────────────────────────────────┤ 25 min
       │                                                      │
       ├──────┤ Phase 1 (2-3 min)                           │
       │      ├────┤ Phase 2 (1-2 min)                       │
       │           ├──────┤ Phase 3 (2-3 min)                │
       │                  ├────────────┤ Phase 4 (5-7 min)   │
       │                               ├────────┤ Phase 5 (3-5 min)
       │                                        ├──────┤ Phase 6 (2-3 min)
       │                                               ├┤ Phase 7 (30s)
       │                                                      │
       └──────────────────────────────────────────────────────┘
       
Total Duration: 15-25 minutes
```

## Concurrency Control

```
┌─────────────────────────────────────────────────────────────┐
│              Concurrency: cancel-in-progress                 │
└─────────────────────────────────────────────────────────────┘

Push 1 (main) ──────────────────────────────► Running
                                                   │
Push 2 (main) ──────────────────────────► Cancels │
                                              │    │
                                              ▼    ▼
                                          Running  Cancelled

PR 1 (feature-a) ──────────────────────► Running
                                              │
PR 2 (feature-b) ──────────────────────► Running (different branch)
                                              │
                                              ▼
                                          Both run in parallel
```

## Legend

```
✓  = Success step
🐘 = PostgreSQL service
🐳 = Docker service
🔍 = Security tool
🔐 = Signing tool
📦 = Artifact upload
⏱️  = Estimated duration
```

---

For detailed information about each phase, see [CI.md](../CI.md)
