# GitHub Code City — Backend (Java Spring Boot)

## Overview

A Spring Boot 3.3.5 REST service that analyzes GitHub repositories using:
- **JGit** for repository cloning and git history analysis
- **JavaParser** for AST-based code metrics (LOC, cognitive complexity)
- **LangChain4j** (Anthropic API) for AI-driven architecture pattern recognition
- **Spring Web** for REST endpoints

## Prerequisites

- Java 21+
- Maven 3.9+
- Git
- ANTHROPIC_API_KEY environment variable (for AI-powered architecture analysis)

## Building

```bash
cd backend
mvn clean package
```

## Running

```bash
export ANTHROPIC_API_KEY="your-api-key"
mvn spring-boot:run
```

Server starts on `http://localhost:8080`.

## API Endpoints

### POST /api/analyze
Analyzes a GitHub repository and returns comprehensive code metrics and architecture insights.

**Request:**
```json
{
  "repoUrl": "https://github.com/user/repo.git",
  "commitSha": "abc123..." // optional, analyze specific commit
}
```

**Response:**
```json
{
  "repoMetadata": {
    "repositoryName": "repo-name",
    "primaryLanguage": "TypeScript",
    "architecturePattern": "Layered Monolith",
    "aiExecutiveSummary": "..."
  },
  "visualCanvasConfig": {
    "gridSizeX": 50,
    "gridSizeZ": 50
  },
  "nodes": [...],
  "edges": [...],
  "aiDeepDives": {
    "architectureBlueprint": "...",
    "logicIntersects": [...]
  }
}
```

### POST /api/timeline
Retrieves commit history for time-travel navigation.

**Request:**
```json
{
  "repoUrl": "https://github.com/user/repo.git"
}
```

**Response:**
```json
[
  {
    "commitSha": "abc123...",
    "commitDate": "2025-06-01",
    "commitMessage": "Initial commit"
  },
  ...
]
```

## Architecture

### Services

- **RepoAnalysisService**: Orchestrates the full analysis pipeline
- **GitService**: Clones repos, manages git operations, handles commits
- **CodeMetricsService**: Counts LOC, analyzes cognitive complexity, extracts imports
- **GitChurnService**: Calculates file-level churn scores
- **ArchitectureAnalysisService**: Uses LangChain4j + Claude to identify patterns

### Models

Data classes matching the frontend contract:
- `CodeCityAnalysis`: Root response type
- `CodeCityNode`: File metrics and metadata
- `CodeCityEdge`: Dependency relationships
- `AiDeepDives`: Architecture analysis from Claude

## Code Metrics

### Lines of Code (LOC)
Raw line count, excluding blank lines and comments.

### Cognitive Complexity
Counts decision points: if/else, loops, switch/case, logical operators, try/catch.

### Git Churn Score
Normalized (0–1) based on number of commits touching a file over repository history.

### Architecture Analysis
LangChain4j sends a structured prompt to Claude 3.5 Sonnet, asking for:
1. Architecture pattern (MVC, Layered, Event-Driven, etc.)
2. High-level executive summary
3. Detailed blueprint (constraints, dependencies, layers)
4. Key logic flows and integration points

## Extending

### Adding Language Support
Update `CodeMetricsService.detectLanguage()` and `isSourceFile()` to recognize new file extensions.

### Improving Complexity Analysis
Replace regex-based complexity counting in `analyzeCognitivComplexity()` with language-specific parsers (e.g., JavaParser for Java files).

### Custom AI Prompts
Modify the prompt in `ArchitectureAnalysisService.analyzeArchitecture()` or extend `ArchitectureAnalyzer` interface for multi-turn conversations.

## Notes

- Repository clones are temporary and cleaned up after analysis
- Large repositories may take time to analyze (proportional to file count)
- Ensure sufficient disk space for cloning during peak usage
- LangChain4j falls back to default analysis if API key is missing or API calls fail
