# Contributing to Valentine's Love Wall

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm
- PostgreSQL 16 (or use Docker)
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/valentines-love-wall.git
   cd valentines-love-wall
   ```

3. Run the setup script:
   ```bash
   # Linux/Mac
   bash setup.sh
   
   # Windows
   setup.bat
   ```

4. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation as needed

### 2. Test Your Changes

#### Backend Tests
```bash
cd backend

# Unit tests
npm test

# Integration tests
npm run test:e2e

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

#### Frontend Tests
```bash
cd valentines

# E2E tests
npm run test:e2e

# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

### 3. Commit Your Changes

Use conventional commit messages:

```bash
# Features
git commit -m "feat: add user profile page"

# Bug fixes
git commit -m "fix: resolve login redirect issue"

# Documentation
git commit -m "docs: update API documentation"

# Refactoring
git commit -m "refactor: simplify authentication logic"

# Tests
git commit -m "test: add tests for comment service"

# Chores
git commit -m "chore: update dependencies"
```

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style Guidelines

### TypeScript

- Use TypeScript strict mode
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Use enums for constants

### Naming Conventions

- **Files**: kebab-case (`user-service.ts`)
- **Classes**: PascalCase (`UserService`)
- **Functions**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Interfaces**: PascalCase with `I` prefix (`IUser`)

### Code Organization

```typescript
// 1. Imports
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// 2. Types/Interfaces
interface UserData {
  name: string;
  email: string;
}

// 3. Class/Component
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  
  // Public methods first
  async getUser(id: string) {
    return this.findUserById(id);
  }
  
  // Private methods last
  private async findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

## Testing Guidelines

### Unit Tests

- Test individual functions/methods
- Mock external dependencies
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

```typescript
describe('UserService', () => {
  it('should return user by id', async () => {
    // Arrange
    const userId = '123';
    const expectedUser = { id: userId, name: 'John' };
    
    // Act
    const result = await service.getUser(userId);
    
    // Assert
    expect(result).toEqual(expectedUser);
  });
});
```

### Integration Tests

- Test API endpoints
- Use test database
- Clean up after tests
- Test error cases

### E2E Tests

- Test user flows
- Use data-testid attributes
- Avoid hard-coded waits
- Test critical paths

## Security Guidelines

### Never Commit

- API keys or secrets
- Database credentials
- Private keys
- `.env` files

### Always

- Sanitize user inputs
- Use parameterized queries
- Validate data with DTOs
- Implement rate limiting
- Use HTTPS in production

### Input Validation

```typescript
import { IsString, IsEmail, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MaxLength(50)
  name: string;
  
  @IsEmail()
  email: string;
}
```

## Documentation

### Code Comments

```typescript
/**
 * Retrieves a user by their unique identifier
 * @param id - The user's UUID
 * @returns Promise resolving to user object or null
 * @throws NotFoundException if user doesn't exist
 */
async getUser(id: string): Promise<User | null> {
  // Implementation
}
```

### API Documentation

Document all endpoints:
- Method and path
- Request body/params
- Response format
- Error codes
- Example usage

### README Updates

Update relevant README files when:
- Adding new features
- Changing configuration
- Updating dependencies
- Modifying setup process

## Pull Request Process

### Before Submitting

- [ ] All tests pass locally
- [ ] Code is linted and formatted
- [ ] No TypeScript errors
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with main

### PR Description

Include:
1. **What**: Brief description of changes
2. **Why**: Reason for the changes
3. **How**: Technical approach
4. **Testing**: How you tested the changes
5. **Screenshots**: If UI changes

### Review Process

1. Automated CI checks must pass
2. At least one approval required
3. Address review comments
4. Squash commits if needed
5. Maintainer will merge

## CI/CD Pipeline

Your PR will go through 7 phases:

1. ✅ **Lint & Validate** - Code quality checks
2. ✅ **Unit Tests** - Component tests
3. ✅ **Integration Tests** - API tests
4. ✅ **E2E Tests** - Playwright tests
5. ✅ **Docker Build** - Container validation
6. ✅ **Security Scan** - Vulnerability checks
7. ✅ **Summary** - Results aggregation

All phases must pass for PR to be merged.

## Common Issues

### Linting Errors

```bash
npm run lint -- --fix
```

### Type Errors

```bash
npx tsc --noEmit
```

### Test Failures

```bash
# Run specific test
npm test -- path/to/test.spec.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Database Issues

```bash
# Reset database
cd backend
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

## Getting Help

- 📖 Read the [documentation](./README.md)
- 🐛 Check [existing issues](https://github.com/YOUR_USERNAME/YOUR_REPO/issues)
- 💬 Ask in discussions
- 📧 Contact maintainers

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing! 🎉
