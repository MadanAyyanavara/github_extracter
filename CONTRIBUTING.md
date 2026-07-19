# Contributing to GitHub Code City

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful, inclusive, and professional in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing opinions
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project maintainers.

---

## Getting Started

### Prerequisites

- **Frontend Development**:
  - Node.js 20+ (use `nvm` or `asdf` for version management)
  - npm 10+
  - Basic understanding of React 19, TypeScript, Three.js

- **Backend Development**:
  - Java 21 (JDK)
  - Maven 3.9+
  - Git
  - Familiarity with Spring Boot, JGit

### Local Setup

```bash
# Clone the repository
git clone https://github.com/your-username/github-code-city.git
cd github-code-city

# Frontend setup
npm install
npm run dev

# Backend setup (in another terminal)
cd backend
export ANTHROPIC_API_KEY="sk-..."
mvn clean package
mvn spring-boot:run
```

### Project Structure

See [README.md](README.md) for detailed file structure.

---

## Development Workflow

### 1. Create an Issue or Fork

**For contributors with write access:**
```bash
git checkout -b feature/your-feature-name
```

**For external contributors:**
1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature-name`

### 2. Code Style & Standards

#### Frontend (TypeScript/React)

**File naming:**
- Components: PascalCase (e.g., `CodeCityCanvas.tsx`)
- Utilities: camelCase (e.g., `formatters.ts`)
- Types: PascalCase (e.g., `RepoAnalysis.ts`)

**Formatting:**
```bash
# Auto-format with Prettier
npm run format

# Check formatting
npm run format:check

# Lint with ESLint
npm run lint

# Type check
npm run type-check
```

**Code style checklist:**
- [ ] Use `const`/`let` (no `var`)
- [ ] Use single quotes for strings
- [ ] Use semicolons
- [ ] Arrow functions: `(params) => {}` (parens required)
- [ ] Comments: Only for WHY, not WHAT
- [ ] Max line length: 100 chars (see `.editorconfig`)
- [ ] Explicit return types for functions

**Example:**
```typescript
// ✅ Good
export const computeHeight = (linesOfCode: number): number => {
  return Math.max(0.5, Math.log10(linesOfCode) * 3)
}

// ❌ Bad
const computeHeight = (loc) => Math.max(0.5, Math.log10(loc) * 3)
```

#### Backend (Java)

**File naming:**
- Classes: PascalCase (e.g., `RepositoryAnalyzerService.java`)
- Methods: camelCase (e.g., `analyzeRepository()`)
- Constants: UPPER_SNAKE_CASE (e.g., `THREAD_POOL_SIZE`)

**Formatting:**
```bash
# Check formatting with Maven
cd backend
mvn spotless:check

# Auto-format
mvn spotless:apply
```

**Code style checklist:**
- [ ] 2-space indentation
- [ ] Max line length: 120 chars
- [ ] Use lombok for boilerplate (getters, setters, constructors)
- [ ] Private fields, public getters
- [ ] Explicit type parameters for generics
- [ ] JavaDoc for public classes and methods
- [ ] No wildcard imports

**Example:**
```java
/**
 * Analyzes a GitHub repository and extracts code metrics.
 *
 * @param repoUrl the URL of the GitHub repository
 * @param commitSha optional specific commit SHA
 * @return complete analysis with metrics and layout
 * @throws Exception if repository cannot be analyzed
 */
public CodeCityAnalysis analyzeRepository(String repoUrl, String commitSha) throws Exception {
  // Implementation
}
```

### 3. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

**Examples:**

```
feat(backend): implement concentric layout algorithm

- Sort files by LOC + complexity
- Place utilities at center (0,0)
- Arrange complex modules on outer rings

Closes #123
```

```
fix(frontend): raycaster pick on mobile devices

Fixes issue where touch events weren't properly intercepted on iOS.
Added touch-specific event handlers.

Fixes #456
```

```
docs(api): add rate limiting specification

Clarify rate limiting requirements and examples.
```

**Commit best practices:**
- [ ] One logical change per commit
- [ ] Meaningful subject line (<50 chars)
- [ ] Reference issues/PRs in footer
- [ ] Include motivation in body (why, not what)

### 4. Testing

#### Frontend Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Test guidelines:**
- Test behavior, not implementation
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Aim for >80% coverage on critical paths

**Example:**
```typescript
describe('computeHeight', () => {
  it('should scale logarithmically with lines of code', () => {
    // Arrange
    const linesOfCode = 100

    // Act
    const height = computeHeight(linesOfCode)

    // Assert
    expect(height).toBeCloseTo(6.0, 1)
  })

  it('should have minimum height of 0.5', () => {
    expect(computeHeight(1)).toBe(0.5)
  })
})
```

#### Backend Tests

```bash
cd backend
# Run all tests
mvn test

# Run specific test
mvn test -Dtest=RepositoryAnalyzerServiceTest

# With coverage
mvn jacoco:report
```

**Test guidelines:**
- Use JUnit 5
- Use Mockito for dependencies
- Test both happy path and error cases
- Aim for >80% coverage

**Example:**
```java
@Test
void testComputeLinesOfCode() {
  // Arrange
  String content = "public void test() {\n  // comment\n  System.out.println();\n}";
  RepositoryAnalyzerService service = new RepositoryAnalyzerService();

  // Act
  int loc = service.computeLinesOfCode(content);

  // Assert
  assertEquals(2, loc);
}
```

### 5. Pull Request Process

1. **Update your branch:**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Open a Pull Request:**
   - Use the [PR template](.github/pull_request_template.md)
   - Link related issues
   - Describe what changed and why
   - Include screenshots for UI changes

4. **Address feedback:**
   - Make requested changes
   - Respond to comments
   - Re-request review when ready

5. **Ensure CI/CD passes:**
   - All checks must pass (frontend lint/type-check, backend test, security scan)
   - CodeQL analysis must pass
   - Test coverage must be maintained

### 6. Code Review Checklist

**For reviewers:**
- [ ] Code follows style guidelines
- [ ] Tests are included and pass
- [ ] Documentation is updated
- [ ] Performance impact is acceptable
- [ ] Security implications are considered
- [ ] Commits are well-structured
- [ ] No unnecessary dependencies added

**For submitters:**
- [ ] Self-review before requesting review
- [ ] Run: `npm run type-check && npm run lint && npm run build`
- [ ] Run: `mvn clean package` (backend)
- [ ] All tests pass locally
- [ ] No breaking changes (or justified)

---

## Documentation

### Updating Documentation

When adding features or making changes:
1. Update relevant `.md` files in the root directory
2. Update API documentation if endpoints change
3. Update architecture documentation if design changes
4. Add/update inline code comments for complex logic

### Documentation Standards

- Use Markdown formatting
- Include code examples where relevant
- Keep examples up-to-date
- Link to related documentation
- Use clear, concise language

---

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md):
- Provide clear, minimal reproduction steps
- Include environment information
- Attach logs/screenshots
- Specify severity

---

## Feature Requests

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md):
- Describe the problem it solves
- Explain proposed solution
- Include acceptance criteria
- Consider impact on frontend/backend

---

## Performance Considerations

When contributing performance-critical code:
- [ ] Profile before/after (Chrome DevTools, JFR)
- [ ] Document performance implications
- [ ] Include benchmarks if relevant
- [ ] Consider memory usage (especially frontend GPU)

---

## Security Considerations

When contributing security-sensitive code:
- [ ] Review for OWASP Top 10
- [ ] Validate all external inputs
- [ ] Use secure APIs/libraries
- [ ] Don't commit secrets/keys
- [ ] Run GitHub CodeQL locally before PR

```bash
# Run CodeQL locally
gh codeql database create /tmp/codeql_db --language=java
gh codeql database analyze /tmp/codeql_db codeql/java-queries --format=sarif-latest
```

---

## Questions?

- **Setup issues?** Check [SETUP.md](SETUP.md)
- **Architecture questions?** See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Performance concerns?** Read [PERFORMANCE.md](PERFORMANCE.md)
- **Deployment questions?** Review [DEPLOY.md](DEPLOY.md)

---

## Recognition

Contributors will be recognized:
- In commit history
- In release notes (for significant contributions)
- As repository contributors

Thank you for contributing! 🎉
