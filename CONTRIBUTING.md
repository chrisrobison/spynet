# Contributing to SpyNet AR

Thank you for your interest in contributing to SpyNet AR! This document provides guidelines and workflows for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Architecture Guidelines](#architecture-guidelines)
- [Testing Requirements](#testing-requirements)

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/spynet-ar.git`
3. Add upstream remote: `git remote add upstream https://github.com/original/spynet-ar.git`
4. Follow the [QUICKSTART.md](QUICKSTART.md) to set up your environment

## Development Workflow

### 1. Create a Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 2. Make Changes

- Write clean, documented code
- Add tests for new features
- Update documentation as needed
- Follow the code style guidelines

### 3. Test Your Changes

```bash
# Run linting
pnpm run lint

# Run type checking
pnpm run typecheck

# Run tests
pnpm run test

# Run integration tests
pnpm run test:integration
```

### 4. Commit Your Changes

Follow the [commit guidelines](#commit-guidelines) below.

### 5. Push and Create PR

```bash
# Push your branch
git push origin feature/your-feature-name

# Then create a Pull Request on GitHub
```

## Code Style

### TypeScript/JavaScript

We use ESLint and Prettier for code formatting:

```bash
# Auto-fix linting issues
pnpm run lint:fix

# Format code
pnpm run format
```

**Key conventions**:
- Use TypeScript for all new code
- Prefer `const` over `let`, avoid `var`
- Use async/await over promises
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use meaningful variable names

Example:
```typescript
/**
 * Validates a QR code JWT payload
 * @param jwt - The JWT string from the QR code
 * @returns Validation result with decoded payload
 * @throws {ValidationError} If JWT is invalid or expired
 */
export async function validateQrJwt(jwt: string): Promise<QrPayload> {
  // Implementation
}
```

### Python

We use Black for formatting and ruff for linting:

```bash
cd services/orchestrator
black .
ruff check .
```

**Key conventions**:
- Follow PEP 8
- Use type hints
- Add docstrings for functions and classes
- Keep functions focused and testable

Example:
```python
def generate_mission(
    player_id: str,
    context: PlayerContext
) -> MissionSpec:
    """
    Generate a personalized mission for the player.

    Args:
        player_id: The player's UUID
        context: Player's current context and history

    Returns:
        A validated mission specification

    Raises:
        ValidationError: If mission cannot be generated
    """
    # Implementation
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
feat(missions): add cipher mission type
fix(auth): resolve JWT expiration issue
docs(api): update authentication endpoints
refactor(zones): simplify control meter calculation
test(qr): add integration tests for QR scanning
```

### Scope Guidelines

- `api` - API gateway
- `missions` - Mission service
- `players` - Player service
- `factions` - Faction service
- `zones` - Zone service
- `orchestrator` - AI orchestrator
- `mobile` - Mobile app
- `web` - Web app
- `db` - Database changes
- `docs` - Documentation

## Pull Request Process

### Before Submitting

1. ✅ All tests pass
2. ✅ Code is linted and formatted
3. ✅ Documentation is updated
4. ✅ Commit messages follow guidelines
5. ✅ Branch is up to date with main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed

## Checklist
- [ ] Tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. Automated checks must pass (linting, tests, build)
2. At least one approval required
3. No unresolved conversations
4. Branch must be up to date with main

## Architecture Guidelines

### Service Structure

Each service follows this structure:

```
services/my-service/
├── src/
│   ├── controllers/    # HTTP request handlers
│   ├── services/       # Business logic
│   ├── repositories/   # Data access
│   ├── models/         # Data models
│   ├── utils/          # Utilities
│   └── index.ts        # Entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
└── tsconfig.json
```

### Database Changes

1. Create migration file: `pnpm run db:migration:create "description"`
2. Write both `up` and `down` migrations
3. Test migration: `pnpm run db:migrate`
4. Test rollback: `pnpm run db:migrate:rollback`
5. Update schema documentation in `docs/schemas/database.md`

### API Endpoints

Follow RESTful conventions:

```
GET    /v1/resource        # List
GET    /v1/resource/:id    # Get one
POST   /v1/resource        # Create
PATCH  /v1/resource/:id    # Update
DELETE /v1/resource/:id    # Delete
POST   /v1/resource/:id/action  # Special actions
```

### Error Handling

Use consistent error format:

```typescript
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { /* optional context */ }
  }
}
```

## Testing Requirements

### Unit Tests

- Test individual functions/methods
- Mock external dependencies
- Aim for >80% coverage

```typescript
describe('validateQrJwt', () => {
  it('should validate a valid JWT', async () => {
    const jwt = 'valid.jwt.token';
    const result = await validateQrJwt(jwt);
    expect(result).toBeDefined();
  });

  it('should reject an expired JWT', async () => {
    const jwt = 'expired.jwt.token';
    await expect(validateQrJwt(jwt)).rejects.toThrow(ValidationError);
  });
});
```

### Integration Tests

- Test service interactions
- Use Testcontainers for dependencies
- Test happy paths and error cases

### E2E Tests

- Test complete user flows
- Use Detox for mobile, Playwright for web
- Cover critical paths only

## Documentation

### When to Update Docs

- Adding new features → Update `docs/gameplay.md`
- Changing APIs → Update `docs/api/README.md`
- Database changes → Update `docs/schemas/database.md`
- Architecture changes → Update `docs/tech-stack.md`
- New setup steps → Update `docs/SETUP.md`

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep it up to date with code

## Questions?

- Check existing [documentation](docs/)
- Search [GitHub Issues](https://github.com/yourusername/spynet-ar/issues)
- Ask in Discord (link TBD)
- Open a new issue for clarification

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to SpyNet AR! 🕵️‍♂️
