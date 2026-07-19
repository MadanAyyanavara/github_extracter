# GitHub Code City — REST API Specification

## Base URL
```
http://localhost:8080/api
```

---

## POST /analyze

Analyzes a GitHub repository and returns comprehensive code metrics with 3D layout coordinates.

### Request

```json
{
  "repoUrl": "https://github.com/user/repository.git",
  "commitSha": "abc1234567890def... (optional)"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repoUrl` | string | ✓ | Public GitHub repository URL |
| `commitSha` | string | ✗ | Git commit SHA. If omitted, analyzes HEAD |

### Response (200 OK)

```json
{
  "repoMetadata": {
    "repositoryName": "my-service",
    "primaryLanguage": "TypeScript",
    "architecturePattern": "Layered Monolith with Event-Driven Workers",
    "aiExecutiveSummary": "A distributed service featuring layered architecture..."
  },
  "visualCanvasConfig": {
    "gridSizeX": 50,
    "gridSizeZ": 50
  },
  "nodes": [
    {
      "id": "node-1",
      "fileName": "authController.ts",
      "relativePath": "src/api/authController.ts",
      "language": "TypeScript",
      "linesOfCode": 120,
      "cognitiveComplexity": 8,
      "gitChurnScore": 0.3,
      "coordinates": {
        "x": 2.5,
        "z": 1.8
      },
      "aiExplainer": {
        "purpose": "Handles user authentication and session lifecycle",
        "keyFunctions": [
          "login",
          "logout",
          "validateToken",
          "refreshSession"
        ],
        "techDebtWarning": ""
      }
    }
    // ... more nodes
  ],
  "edges": [
    {
      "id": "edge-1",
      "sourceNodeId": "node-1",
      "targetNodeId": "node-5",
      "dependencyType": "import",
      "description": "Imports authService"
    }
    // ... more edges
  ],
  "aiDeepDives": {
    "architectureBlueprint": "The system follows a layered architecture pattern...",
    "logicIntersects": [
      {
        "flowName": "Request Processing",
        "description": "Incoming requests are routed through controllers..."
      },
      {
        "flowName": "Data Consistency",
        "description": "Data modifications flow through service layer..."
      }
    ]
  }
}
```

### Response Fields

**CodeCityNode**:
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique node identifier (node-N) |
| `fileName` | string | File name only (e.g., `service.ts`) |
| `relativePath` | string | Path relative to repo root |
| `language` | string | Detected language (TypeScript, Java, Python, etc.) |
| `linesOfCode` | int | Physical lines of code (excluding blanks/comments) |
| `cognitiveComplexity` | int | Logical complexity score (1–100+) |
| `gitChurnScore` | double | Normalized commit frequency (0.0–1.0) |
| `coordinates` | {x, z} | 3D layout position (concentric rings) |
| `aiExplainer` | object | AI-generated metadata (if API key set) |

**CodeCityEdge**:
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique edge identifier |
| `sourceNodeId` | string | Source file node ID |
| `targetNodeId` | string | Target file node ID |
| `dependencyType` | string | `import`, `require`, `use`, etc. |
| `description` | string | Human-readable description |

### Error Responses

**400 Bad Request** — Invalid URL or missing fields
```json
{
  "error": "Invalid repository URL format"
}
```

**404 Not Found** — Repository doesn't exist or is private
```json
{
  "error": "Repository not found or access denied"
}
```

**408 Request Timeout** — Analysis exceeded 30 seconds
```json
{
  "error": "Repository analysis timed out"
}
```

**500 Internal Server Error** — Unexpected server failure
```json
{
  "error": "Failed to analyze repository: <details>"
}
```

### Example cURL

```bash
curl -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/torvalds/linux.git",
    "commitSha": null
  }'
```

### Performance Characteristics

| Repository Size | Typical Time | Notes |
|-----------------|--------------|-------|
| Micro (~50 files) | 2–3 seconds | Small utility libraries |
| Small (~200 files) | 5–10 seconds | Single-service repos |
| Medium (~1000 files) | 15–30 seconds | Full microservices |
| Large (>5000 files) | 30–60 seconds | Monorepos, Linux kernel |

---

## POST /timeline

Retrieves git commit history for time-travel navigation.

### Request

```json
{
  "repoUrl": "https://github.com/user/repository.git"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repoUrl` | string | ✓ | Public GitHub repository URL |

### Response (200 OK)

```json
[
  {
    "commitSha": "abc1234567890def1234567890def123456",
    "commitDate": "2025-06-01",
    "commitMessage": "Initial monolith setup with auth and basic orders"
  },
  {
    "commitSha": "def1234567890abc1234567890abc12345678",
    "commitDate": "2025-06-15",
    "commitMessage": "Add analytics and reporting infrastructure"
  },
  {
    "commitSha": "789def1234567890abc1234567890abcdef12",
    "commitDate": "2025-07-01",
    "commitMessage": "Introduce event workers for async processing"
  }
  // ... more commits (up to 6 for time-travel snapshots)
]
```

### Response Fields

**TimelineEntry**:
| Field | Type | Description |
|-------|------|-------------|
| `commitSha` | string | Full git commit hash |
| `commitDate` | string | ISO date (YYYY-MM-DD) |
| `commitMessage` | string | First line of commit message |

### Error Responses

**400 Bad Request**
```json
{
  "error": "Invalid repository URL"
}
```

**404 Not Found**
```json
{
  "error": "Repository not accessible"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to extract timeline"
}
```

### Example cURL

```bash
curl -X POST http://localhost:8080/api/timeline \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/facebook/react.git"
  }'
```

---

## GET /health

Health check endpoint for backend availability detection.

### Response (200 OK)

```json
{
  "status": "ok",
  "timestamp": "1721410123456"
}
```

### Example cURL

```bash
curl http://localhost:8080/api/health
```

---

## CORS Headers

All endpoints return the following CORS headers:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
Access-Control-Allow-Headers: Content-Type, Accept
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

---

## Rate Limiting (Recommended)

```
/api/analyze:    Max 10 requests/minute per IP
/api/timeline:   Max 20 requests/minute per IP
/api/health:     No limit (used for discovery)
```

**Implementation** (Spring):
```java
@Component
public class RateLimitFilter implements WebFilter {
  private Map<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();
  
  @Override
  public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
    String ip = getClientIp(exchange);
    RateLimitBucket bucket = buckets.computeIfAbsent(ip, k -> new RateLimitBucket());
    
    if (!bucket.tryConsume()) {
      exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
      return exchange.getResponse().writeWith(Mono.empty());
    }
    
    return chain.filter(exchange);
  }
}
```

---

## Caching Strategy (Production)

```yaml
# Redis cache configuration
spring:
  redis:
    host: localhost
    port: 6379

# Cache /analyze responses for 1 hour
@Cacheable(value = "repoAnalysis", key = "#repoUrl + '_' + #commitSha", 
           unless = "#result == null", cacheManager = "cacheManager")
public CodeCityAnalysis analyzeRepository(String repoUrl, String commitSha) {
  // Implementation
}

# TTL: 1 hour (3600 seconds)
# Key format: "https://github.com/user/repo.git_abc123"
```

---

## Error Handling Best Practices

### Always Include Timestamps

```json
{
  "error": "Repository analysis failed",
  "timestamp": "2025-07-19T14:22:33Z",
  "requestId": "req-abc123-xyz789"
}
```

### Distinguish User Errors (4xx) from Server Errors (5xx)

```
400 Bad Request        — Invalid repoUrl format
403 Forbidden          — Repository is private
404 Not Found          — Repository doesn't exist
408 Request Timeout    — Analysis took >30 seconds
429 Too Many Requests  — Rate limit exceeded

500 Internal Server Error — Unexpected failure
503 Service Unavailable   — Backend overloaded
```

### Graceful Degradation

If `ANTHROPIC_API_KEY` is missing:
- ✓ Still return nodes, edges, metadata
- ✗ Return default architecture analysis instead of AI-generated
- ✓ Frontend shows "AI Insights Unavailable" message

---

## Monitoring & Observability

### Metrics to Track

```java
@Timed(value = "analyze.duration", description = "Time to analyze repository")
public CodeCityAnalysis analyzeRepository(...) { }

@Counted(value = "analyze.total", description = "Total /analyze requests")
public CodeCityAnalysis analyzeRepository(...) { }

@Gauge(value = "git.temp.dirs", description = "Active temp clones")
private AtomicInteger activeTempDirs = new AtomicInteger(0);
```

### Log Levels

```
DEBUG  — File iteration, pattern matching progress
INFO   — Repo analysis started, completed in X seconds
WARN   — Large repository (>5000 files), API key missing
ERROR  — Clone failed, network timeout, out of memory
```

Example:
```
2025-07-19 14:22:33 INFO  Starting analysis: https://github.com/facebook/react.git
2025-07-19 14:22:35 DEBUG Found 3,847 source files
2025-07-19 14:22:42 INFO  Cognitive complexity analysis complete
2025-07-19 14:23:01 WARN  Repository >1000 files, analyze took 28 seconds
2025-07-19 14:23:05 INFO  Architecture analysis: Layered (via Claude 3.5 Sonnet)
2025-07-19 14:23:05 INFO  Analysis complete: 3847 files in 32 seconds
```

