# Valentine's Love Wall - NestJS Backend

A self-hosted NestJS backend API for the Valentine's Love Wall application, replacing Supabase with PostgreSQL and Prisma ORM.

## Prerequisites

- Node.js 20+ 
- Docker and Docker Compose (for PostgreSQL)
- npm or yarn

## Technology Stack

- **Framework**: NestJS 10.x
- **Database**: PostgreSQL 16.x
- **ORM**: Prisma 5.x
- **Validation**: class-validator & class-transformer
- **Language**: TypeScript

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and update with your values:

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3001)
- `CORS_ORIGIN`: Frontend URL (default: http://localhost:3000)

### 3. Start PostgreSQL

Using Docker Compose (recommended):

```bash
docker-compose up postgres -d
```

Or use your own PostgreSQL instance and update `DATABASE_URL` in `.env`.

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

### 5. Start the Backend

Development mode with hot reload:

```bash
npm run start:dev
```

Production mode:

```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3001`.

## Available Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with watch
- `npm run start:prod` - Start in production mode
- `npm run build` - Build the application
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Run tests with coverage
- `npm run lint` - Lint the code
- `npm run format` - Format code with Prettier

## Project Structure

```
backend/
├── src/
│   ├── main.ts              # Application entry point
│   ├── app.module.ts        # Root module
│   ├── app.controller.ts    # Root controller
│   └── app.service.ts       # Root service
├── test/                    # E2E tests
├── prisma/                  # Database schema and migrations
├── .env.example             # Environment variables template
└── package.json             # Dependencies and scripts
```

## API Endpoints

### Health Check

- `GET /` - Returns API status

More endpoints will be added as the migration progresses.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment (development/production) | development |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:3000 |
| `RATE_LIMIT_NOTES_MAX` | Max notes per IP per window | 5 |
| `RATE_LIMIT_NOTES_WINDOW_MS` | Rate limit window for notes (ms) | 60000 |
| `RATE_LIMIT_COMMENTS_MAX` | Max comments per IP per window | 10 |
| `RATE_LIMIT_COMMENTS_WINDOW_MS` | Rate limit window for comments (ms) | 60000 |

## Next Steps

1. Set up Prisma schema (Task 2)
2. Implement Love Notes module (Task 3)
3. Implement Comments module (Task 4)
4. Add rate limiting (Task 5)
5. Update frontend to use this API (Task 8)

## License

MIT
