# Code Style Guide

Comprehensive style guide for GitHub Code City project to ensure consistency across codebase.

## Frontend (TypeScript/React)

### File Organization

```typescript
// 1. Import statements (grouped by source)
import { useEffect, useState } from 'react'
import * as THREE from 'three'

import { useCodeCityStore } from '@/store/useCodeCityStore'
import { CodeCityCanvas } from '@/components/CodeCityCanvas/CodeCityCanvas'

import { computeHeight } from '@/layout/cityMetrics'
import styles from './App.module.css'

// 2. Types/Interfaces
interface Props {
  theme: 'dark' | 'light'
}

// 3. Constants
const DEFAULT_TIMEOUT = 30000

// 4. Component
export const MyComponent = ({ theme }: Props) => {
  // Implementation
}

// 5. Exports
export default MyComponent
```

### Naming Conventions

```typescript
// Components: PascalCase
const MyComponent = () => {}

// Functions: camelCase
const fetchData = () => {}

// Constants: UPPER_SNAKE_CASE
const MAX_NODES = 1000

// Private properties: leading underscore + camelCase
const _privateVar = 42

// Event handlers: handleXxx or onXxx
const handleClick = () => {}
const onClick = () => {}

// Booleans: isXxx, hasXxx, shouldXxx
const isLoading = false
const hasError = false
const shouldRetry = true

// Arrays: plural
const nodes: CodeCityNode[] = []
```

### Type Annotations

```typescript
// ✅ Always explicit for public functions
export const computeHeight = (linesOfCode: number): number => {
  return Math.max(0.5, Math.log10(linesOfCode) * 3)
}

// ✅ Can infer in local variables
const height = computeHeight(100) // inferred: number

// ❌ Avoid 'any'
const data: any = {}  // BAD

// ✅ Use proper types
const data: CodeCityAnalysis = ...  // GOOD
```

### String Handling

```typescript
// ✅ Single quotes
const message = 'Hello, world'

// ❌ Double quotes (except when needed)
const message = "Hello, world"  // BAD

// ✅ Template literals for interpolation
const formatted = `Height: ${height}px`

// ✅ Multi-line strings
const sql = `
  SELECT * FROM nodes
  WHERE linesOfCode > ?
`
```

### Comments

```typescript
// ✅ Explain WHY, not WHAT
// Use square root to balance visual impact across complexity range
const footprint = Math.sqrt(cognitiveComplexity)

// ❌ Don't comment obvious code
const footprint = Math.sqrt(cognitiveComplexity)  // Calculate footprint

// ✅ Document complex algorithms
/**
 * Concentric topological layout algorithm.
 * Sorts files by (LOC + complexity*10), places low-complexity utilities
 * near center (0,0), complex modules progressively outward in rings.
 */
const computeConcentricLayout = (...) => {
  // Implementation
}

// ✅ Mark temporary/hack code
// TODO: Remove after migration to new API
// FIXME: Handle edge case for repos >10k files
// HACK: Workaround for Chrome bug in Three.js raycaster
```

### React Patterns

```typescript
// ✅ Use functional components with hooks
export const CodeCityCanvas = ({ theme }: Props) => {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Effect
  }, [dependencies])

  return <div>{/* JSX */}</div>
}

// ✅ Use const for components
const ChildComponent = () => {}

// ❌ Avoid class components
class MyComponent extends React.Component {
  // Outdated pattern
}
```

### Module Imports

```typescript
// ✅ Import order: external → project → relative
import { useEffect } from 'react'
import * as THREE from 'three'

import { useCodeCityStore } from '@/store/useCodeCityStore'
import { computeHeight } from '@/layout/cityMetrics'

import styles from './CodeCityCanvas.module.css'

// ✅ Use path aliases (configured in vite.config.ts)
import { useStore } from '@/store/useStore'

// ❌ Avoid relative paths for project imports
import { useStore } from '../../store/useStore'  // BAD
```

---

## Backend (Java)

### File Organization

```java
// 1. Package declaration
package com.github.codecity.service;

// 2. Import statements (grouped by source)
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import com.github.codecity.model.*;

import java.nio.file.Files;
import java.util.*;

// 3. Class documentation
/**
 * Analyzes GitHub repositories and extracts code metrics.
 * Uses JGit for version control analysis and custom AST parsing for code metrics.
 */
@Service
public class RepositoryAnalyzerService {

  // 4. Constants
  private static final int THREAD_POOL_SIZE = 4;

  // 5. Fields
  @Autowired
  private GitService gitService;

  // 6. Constructors
  public RepositoryAnalyzerService() { }

  // 7. Public methods
  public RepositorySnapshot analyzeRepository(String repoUrl) throws Exception {
    // Implementation
  }

  // 8. Private methods
  private void deleteDirectory(File file) throws IOException {
    // Implementation
  }
}
```

### Naming Conventions

```java
// Classes: PascalCase
public class RepositoryAnalyzerService { }

// Methods: camelCase
public void analyzeRepository() { }

// Constants: UPPER_SNAKE_CASE
private static final int MAX_RETRIES = 3;

// Fields: private + camelCase
private String repositoryUrl;

// Booleans: isXxx, hasXxx, shouldXxx
private boolean isAnalyzing;
private boolean hasError;
private boolean shouldRetry;

// Local variables: camelCase
int fileCount = 0;
String filePath = "src/Main.java";
```

### Type Annotations

```java
// ✅ Explicit return types
public CodeCityAnalysis analyzeRepository(String repoUrl, String commitSha) throws Exception {
  return new CodeCityAnalysis(...);
}

// ✅ Generic type parameters explicit
Map<String, CodeCityNode> nodeMap = new HashMap<>();
List<CodeCityEdge> edges = new ArrayList<>();

// ❌ Avoid raw types
List nodes = new ArrayList();  // BAD
Map map = new HashMap();       // BAD

// ✅ Use type inference for obvious cases
var nodes = findSourceFiles(repoDir);  // OK in Java 10+
```

### Documentation

```java
/**
 * Analyzes a GitHub repository and extracts code metrics.
 * Performs shallow clone, AST analysis, and dependency extraction.
 *
 * @param repoUrl the URL of the GitHub repository (e.g., https://github.com/user/repo.git)
 * @param commitSha optional specific commit SHA; analyzes HEAD if null
 * @return complete analysis including metrics, layout, and AI insights
 * @throws Exception if repository cannot be cloned or analyzed
 * @see GitService for low-level git operations
 */
public CodeCityAnalysis analyzeRepository(String repoUrl, String commitSha) throws Exception {
  // Implementation
}

// ✅ Document non-obvious code
// Concentric layout: sort by (LOC + complexity*10) ascending,
// place utilities near center (0,0), complex modules on outer rings
Map<String, GridCoordinate> coordinates = computeConcentricLayout(files);
```

### Exception Handling

```java
// ✅ Specific exceptions
try {
  return repository.cloneRepository();
} catch (GitAPIException e) {
  throw new RepositoryException("Failed to clone repository", e);
} catch (IOException e) {
  throw new RepositoryException("Disk I/O error", e);
}

// ❌ Generic exceptions
try {
  // Implementation
} catch (Exception e) {
  throw new RuntimeException(e);  // BAD: loses context
}

// ✅ Checked vs unchecked appropriately
// Checked: recoverable errors (file not found, network timeout)
// Unchecked: programming errors (null pointer, invalid argument)
```

### Collections

```java
// ✅ Explicit types
List<CodeCityNode> nodes = new ArrayList<>();
Map<String, Integer> langCounts = new HashMap<>();
Set<String> visited = new HashSet<>();

// ✅ Use streams when readable
nodes.stream()
  .filter(n -> n.getLinesOfCode() > 100)
  .map(CodeCityNode::getLanguage)
  .collect(Collectors.toSet());

// ✅ Traditional loops for complex logic
for (CodeCityNode node : nodes) {
  String language = node.getLanguage();
  if (complexCondition(language)) {
    processNode(node);
  }
}

// ❌ Avoid premature lambdas
nodes.parallelStream().filter(...).map(...);  // Often slower!
```

### Testing

```java
// ✅ Clear test names
@Test
void testComputeLinesOfCodeExcludesBlankLinesAndComments() {
  // Arrange
  String content = "public void test() {\n  // comment\n  System.out.println();\n}";

  // Act
  int loc = analyzer.computeLinesOfCode(content);

  // Assert
  assertEquals(2, loc);
}

// ✅ Use @DisplayName for complex tests
@Test
@DisplayName("Concentric layout places utilities near center")
void testConcentricLayoutOrder() {
  // Implementation
}
```

---

## CSS/Styling

### CSS Modules

```css
/* ✅ Use camelCase for class names */
.container {
  display: flex;
  gap: 1rem;
}

.headerTitle {
  font-size: 1.5rem;
  font-weight: bold;
}

/* ✅ Use CSS variables for theme */
.darkMode {
  --bg-color: #1a1a1a;
  --text-color: #ffffff;
  background-color: var(--bg-color);
}

/* ✅ Mobile-first responsive design */
.canvasPane {
  width: 100%;
  height: auto;
}

@media (min-width: 1024px) {
  .canvasPane {
    width: 70%;
    height: 100vh;
  }
}
```

### Usage in Components

```typescript
// ✅ Import and use
import styles from './CodeCityCanvas.module.css'

export const CodeCityCanvas = () => {
  return (
    <div className={styles.canvasPane}>
      {/* Content */}
    </div>
  )
}

// ✅ Conditional classes
<div className={`${styles.container} ${isSelected ? styles.selected : ''}`}>
  {/* Content */}
</div>

// ✅ Or use clsx helper
import clsx from 'clsx'

<div className={clsx(styles.container, isSelected && styles.selected)}>
  {/* Content */}
</div>
```

---

## Git Practices

### Branch Naming

```bash
# Feature branch
git checkout -b feature/add-raycaster-selection

# Bug fix
git checkout -b fix/memory-leak-in-raycaster

# Documentation
git checkout -b docs/update-performance-guide

# Refactoring
git checkout -b refactor/simplify-layout-algorithm

# ✅ Use lowercase, hyphens, descriptive names
# ❌ Avoid: feature/xyz, fix/123, random-branch
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, missing semicolons, etc)
- `refactor`: Code refactoring without feature/fix
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `chore`: Build process, dependencies, etc
- `ci`: CI/CD changes

**Examples:**
```
feat(frontend): implement raycaster selection with emissive glow

- Add Raycaster intersection detection
- Apply indigo emissive glow (0x6b21a8) on selection
- Emit nodeId to store on click
- Add visual feedback on hover

Closes #123
```

```
fix(backend): prevent memory leak in temp directory cleanup

Implement AsyncFileVisitor pattern instead of recursive deletion.
Reduces peak memory by 40% on large repos.

Fixes #456
```

---

## Code Review Checklist

### Before Submitting

- [ ] Code follows style guide (run formatters)
- [ ] Types are explicit (TypeScript, Java)
- [ ] Comments explain WHY (not WHAT)
- [ ] No unnecessary variables/methods
- [ ] Tests pass locally
- [ ] No new warnings generated
- [ ] Commits are well-structured

### During Review

- [ ] Correctness: Does it work as intended?
- [ ] Performance: Is there a better way?
- [ ] Readability: Can future developers understand it?
- [ ] Testing: Are edge cases covered?
- [ ] Security: Are inputs validated?
- [ ] Style: Does it follow guidelines?

---

## Auto-Formatting Commands

```bash
# Frontend
npm run format          # Auto-format with Prettier
npm run format:check   # Check formatting without changes
npm run lint           # Lint with ESLint
npm run lint:fix       # Auto-fix ESLint issues

# Backend
cd backend
mvn spotless:apply     # Auto-format with Spotless
mvn spotless:check     # Check formatting without changes
```

---

## Tools & Configuration

- **Frontend Formatter:** Prettier (`.prettierrc.json`)
- **Frontend Linter:** ESLint (`eslint.config.js`)
- **Backend Formatter:** Spotless (configured in `pom.xml`)
- **EditorConfig:** `.editorconfig` (editor-agnostic settings)

---

Consistency enables maintainability. Thank you for following this guide!
