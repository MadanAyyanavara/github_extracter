# GitHub Code City

An interactive 3D visualization tool for analyzing GitHub repositories. Renders code files as a "city" where building height = lines of code, footprint = cognitive complexity, and color = language or git churn. Navigate dependencies with glowing laser connections, inspect architecture with AI-powered insights, and time-travel through commit history.

## Overview

**Frontend** (React 19 + Three.js): Reactive UI with 3D WebGL rendering, Zustand state management, type-safe TypeScript.
**Backend** (Java 21 Spring Boot): REST API powered by JGit (git analysis), AST parsing (code metrics), and LangChain4j (Claude AI for architecture insights).

## Quick Start

### Frontend

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The app loads mock repository data by default.

### Backend

```bash
cd backend
export ANTHROPIC_API_KEY="sk-..."
mvn spring-boot:run
```

Server runs on `http://localhost:8080/api`.

## Architecture

### Frontend Features

- **3D Code City Viewport**: 20+ files rendered as 3D blocks in an interactive canvas
  - Height = `Math.max(0.5, Math.log10(linesOfCode) * 3)`
  - Footprint = `Math.max(1.0, Math.sqrt(cognitiveComplexity))`
  - Color = Language (default) or Git churn (toggle)
- **Laser Dependencies**: Click a block → glowing lines to all imports
- **Time-Travel Slider**: 6 commit snapshots, watch the city grow/shrink over time
- **AI Info Drawer**: 3 tabs
  - Overview: Repo metadata, executive summary
  - Architecture: LLM-generated blueprint, logic flows
  - Node: Selected file's metrics, key functions, tech debt warnings, related modules
- **Bidirectional Sync**: Click 3D block ↔ updates AI panel; click panel item ↔ tweens camera
- **Theme Toggle**: Dark/light with high-contrast palette

### Backend Features

- **Repository Analysis**
  - Clone via JGit
  - Find all source files (Java, TypeScript, JavaScript, Python, Go, Rust, C++, C#, Kotlin, Swift)
  - Extract metrics per file
  - Analyze git history
- **Code Metrics** (via pattern matching + AST where applicable)
  - Lines of Code (LOC): Raw line count minus blanks/comments
  - Cognitive Complexity: Count decision points (if/else, loops, switch, logical ops)
  - Git Churn Score: Normalized (0–1) commit frequency per file
- **Dependency Extraction**
  - Parse imports/requires from source
  - Match files to modules
  - Generate edge graph
- **Architecture Analysis** (via LangChain4j + Claude 3.5 Sonnet)
  - Detect pattern (Layered, MVC, Event-Driven, etc.)
  - Generate executive summary
  - Produce detailed blueprint
  - Identify key logic flows

## Data Contract

All communication via JSON matching this schema:

```typescript
interface CodeCityAnalysis {
  repoMetadata: {
    repositoryName: string
    primaryLanguage: string
    architecturePattern: string
    aiExecutiveSummary: string
  }
  visualCanvasConfig: { gridSizeX: number; gridSizeZ: number }
  nodes: CodeCityNode[] // 20+ files
  edges: CodeCityEdge[] // dependencies
  aiDeepDives: {
    architectureBlueprint: string
    logicIntersects: [
      { flowName: string; description: string }
      // 2–3 key flows
    ]
  }
}
```

## File Structure

```
.
├── frontend code (React, TypeScript, Vite, CSS Modules)
│   ├── src/
│   │   ├── components/        # CodeCityCanvas, AiDrawer, TimeTravelSlider
│   │   ├── three/             # Three.js scene, meshes, lasers, raycasting, camera
│   │   ├── layout/            # Metrics (height/footprint formulas), topological layout
│   │   ├── store/             # Zustand state (repoAnalysis, selectedNodeId, etc.)
│   │   ├── api/               # Fetch wrapper + mock data integration
│   │   ├── mock/              # 20-node service, 6-snapshot timeline
│   │   ├── utils/             # Palette, easing, formatters
│   │   └── types/             # Data contract TS interfaces
│   ├── vite.config.ts         # Alias @, React plugin, build config
│   ├── index.html             # Single-page app entry
│   └── package.json           # React 19, three.js 0.169, zustand, TypeScript 5.6
│
├── backend/                   # Java Spring Boot REST service
│   ├── src/main/java/com/github/codecity/
│   │   ├── controller/        # POST /api/analyze, POST /api/timeline
│   │   ├── service/           # RepoAnalysisService, GitService, CodeMetricsService, etc.
│   │   ├── model/             # Data classes matching frontend contract
│   │   └── CodeCityApplication.java
│   ├── pom.xml                # Spring Boot 3.3.5, JGit, LangChain4j, JavaParser
│   └── src/main/resources/application.yml
│
├── BACKEND.md                 # Backend setup, API, extending
└── README.md (this file)
```

## Development

### Frontend Build & Test

```bash
npm run type-check   # TypeScript strict mode
npm run lint         # ESLint + TS rules
npm run build        # Vite production build → dist/
npm run preview      # Serve dist locally
npm run dev          # Hot-reload dev server
```

### Backend Build & Test

```bash
cd backend
mvn clean package    # Compile, test, package JAR
mvn spring-boot:run  # Run with hot-reload (via Spring Boot Maven plugin)
```

## Extending

### Adding Language Support

1. **Frontend** (`src/layout/cityMetrics.ts`): Add language → hex color mapping
2. **Backend** (`CodeMetricsService`): Update `detectLanguage()`, `isSourceFile()`; optionally add language-specific AST parser

### Customizing AI Prompts

**Backend** (`ArchitectureAnalysisService.analyzeArchitecture()`):
- Modify the prompt sent to Claude
- Extend `ArchitectureAnalyzer` interface for multi-turn conversations

### Improving Metrics

Replace regex-based counting with language-specific parsers:
- JavaParser for `.java` files (already available)
- Babel for `.js/.ts` files
- Python AST for `.py` files

## Performance

- Frontend: ~700 kB bundle (three.js is large), tree-shakes unused Three.js APIs
- Backend: Analyzes typical repos (100–500 files) in 5–30 seconds (proportional to file count)
- Mock data: Instant (no network latency)

## Known Limitations

- Dependency extraction uses simple import regex; advanced dependency trees (transitive, dynamic) not supported
- Architecture analysis requires ANTHROPIC_API_KEY; falls back to defaults if missing/fails
- Large repos (1000+ files) may take time; temporary disk space required for clones
- Time-travel slider assumes 6 pre-baked snapshots (not dynamic per repo)

## Future Enhancements

- [ ] Real-time repo URL input, dynamic snapshot generation
- [ ] Multi-language complexity analysis (language-specific AST parsers)
- [ ] Dependency graph traversal (click a line to expand transitive deps)
- [ ] Heatmaps for technical debt clustering
- [ ] Export as 3D models, analytics dashboards
- [ ] WebAssembly-accelerated metrics (if performance becomes limiting)

## License

MIT