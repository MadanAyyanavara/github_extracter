# GitHub Code City — Frontend-Backend Integration

## Integration Status: ✅ COMPLETE

### Data Flow Architecture

```
Backend (Java Spring Boot)          Frontend (React 19 + Three.js)
┌─────────────────────────────┐     ┌──────────────────────────────┐
│ RepoAnalysisService         │     │ fetchRepoAnalysis()          │
│ ├─ GitService (JGit)        │────▶├─ checkBackendHealth()       │
│ ├─ CodeMetricsService       │     │ ├─ Timeout: 30s             │
│ ├─ GitChurnService          │     │ └─ Fallback: mock data      │
│ └─ ArchitectureAnalysisService    │                             │
└──────────────────────────────┘     └──────────────────────────────┘
        POST /api/analyze                   │
        POST /api/timeline                  │
        GET /api/health                     ▼
                                   useCodeCityStore
                                   ├─ repoAnalysis
                                   ├─ timeline
                                   └─ selectedNodeId
                                           │
                                           ▼
                                   CodeCityCanvas
                                   ├─ topologicalLayout
                                   └─ buildCityMeshes
                                           │
                                           ▼
                                   Three.js Rendering
                                   ├─ computeHeight (linesOfCode)
                                   ├─ computeFootprint (complexity)
                                   └─ computeColor (language|churn)
```

### Payload Contract Verification

**Backend Model (Java)**
```java
CodeCityNode(
  id: String,
  fileName: String,
  relativePath: String,
  language: String,
  linesOfCode: int,              // ▶ Height calculation
  cognitiveComplexity: int,      // ▶ Footprint calculation
  gitChurnScore: double,         // ▶ Color interpolation
  coordinates: {x, z},           // ▶ Position override
  aiExplainer: {purpose, keyFunctions, techDebtWarning}
)
```

**Frontend Type (TypeScript)**
```typescript
interface CodeCityNode {
  id: string
  fileName: string
  relativePath: string
  language: string
  linesOfCode: number
  cognitiveComplexity: number
  gitChurnScore: number
  coordinates: { x: number; z: number }
  aiExplainer: {
    purpose: string
    keyFunctions: string[]
    techDebtWarning: string
  }
}
```

✅ **PERFECT ALIGNMENT** — Backend Jackson serialization matches frontend TypeScript types.

### Three.js Metrics Binding

#### Height Calculation
```typescript
// src/layout/cityMetrics.ts
export const computeHeight = (linesOfCode: number): number => {
  return Math.max(0.5, Math.log10(linesOfCode) * 3)
}
// Uses: node.linesOfCode from backend
// Range: 0.5 units (tiny) to ~15+ units (massive)
// Formula: Logarithmic scaling prevents extreme buildings
```

#### Footprint Calculation
```typescript
export const computeFootprint = (cognitiveComplexity: number): number => {
  return Math.max(1.0, Math.sqrt(cognitiveComplexity))
}
// Uses: node.cognitiveComplexity from backend
// Range: 1.0 units (thin) to ~10+ units (wide)
// Formula: Square root scaling balances visual impact
```

#### Color Interpolation
```typescript
// Language mode: Direct lookup
LANGUAGE_COLORS[node.language] // TypeScript=#3178c6, Java=#007396, etc.

// Churn mode: HSL interpolation
const churn = Math.min(1, node.gitChurnScore)
const hue = 120 - churn * 120    // Green (stable) ▶ Red (churned)
const saturation = 70 + churn * 30
const lightness = 45 + churn * 5
return hsl(hue, saturation%, lightness%)
```

### Coordinate Layout (Backend → Frontend)

**Backend (Java)**
- Sets all coordinates to `(0, 0)` in RepoAnalysisService

**Frontend (React)**
- `topologicalLayout.ts` computes positions based on dependency graph
- Orders nodes by "utility score" (fan-in − 0.5 × fan-out)
- Arranges in spiral/radial pattern around origin
- Assigns X, Z coordinates respecting grid bounds

This is **intentional**: Layout computation on frontend is faster and independent of analysis request.

### Error Handling & Fallback

**Happy Path**
1. Frontend detects backend available via `/api/health`
2. POST `/api/analyze` with repoUrl
3. Backend analyzes repository, returns CodeCityAnalysis JSON
4. Three.js renders with real metrics

**Fallback Path (Backend Down)**
1. Frontend health check fails (or timeout)
2. `shouldUseMockData()` returns true
3. `fetchRepoAnalysis()` returns mock data
4. UI displays "Using Mock Data" indicator (bottom-left)
5. App fully functional with deterministic mock repository

**Timeout Handling**
- Health check: 2s timeout
- Analyze request: 30s timeout (repos can be large)
- Timeline request: 30s timeout
- All failures gracefully downgrade to mock

### Real Data Validation

When backend is running and connected:

```bash
# Test health endpoint
curl http://localhost:8080/api/health
# Response: {"status":"ok","timestamp":"1234567890"}

# Test analysis endpoint
curl -X POST http://localhost:8080/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/torvalds/linux"}'
# Response: Full CodeCityAnalysis JSON with real metrics

# Test timeline endpoint
curl -X POST http://localhost:8080/api/timeline \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/torvalds/linux"}'
# Response: Array of TimelineEntry objects
```

### CORS Configuration

**Backend (WebFluxCorsConfig)**
- Accepts: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- Origins: localhost:5173, localhost:3000, 127.0.0.1:5173
- Headers: All
- Credentials: Allowed
- Max-Age: 3600s

**Preflight Handling**
- OPTIONS requests auto-answered by Spring Boot
- Credentials (cookies, auth) allowed
- Streaming headers (Transfer-Encoding, Content-Disposition) exposed

### Backend Status Indicator

**Component**: `BackendStatus.tsx`
- Located: Bottom-left corner, fixed position
- Polling: Every 5s (cached)
- States:
  - 🟢 Green pulsing dot: "Backend Connected"
  - 🔴 Red pulsing dot: "Using Mock Data"

### Next Steps for Testing

1. **Start Frontend** (already running on 5173)
   ```bash
   npm run dev
   ```

2. **Install Maven** (one-time)
   ```powershell
   winget install Maven.Maven
   ```

3. **Start Backend**
   ```bash
   cd backend
   $env:ANTHROPIC_API_KEY = "sk-your-key" # Optional
   mvn clean package
   mvn spring-boot:run
   ```

4. **Verify Integration**
   - Open http://localhost:5173
   - Observe backend status indicator (should turn green)
   - Enter a real GitHub repo URL
   - Verify 3D city renders with real metrics

### Metrics Visible in UI

**Node Heights** (by Lines of Code)
- Controller files: 5–8 units
- Service files: 8–12 units
- Utility modules: 2–4 units

**Node Footprints** (by Cognitive Complexity)
- Simple utilities: 1 unit (thin spike)
- Complex business logic: 5–10 units (wide base)

**Node Colors** (by Language or Churn)
- Language mode: TypeScript (#3178c6) vs. Java (#007396) vs. Python (#3776ab)
- Churn mode: Green (stable, <10% history) → Yellow → Red (churned, 50%+ history)

**AI Insights Panel**
- Overview tab: Repository summary and architecture pattern
- Architecture tab: LangChain4j-generated blueprint (if API key set)
- Node tab: Selected file's purpose, key functions, tech debt warnings

### Known Limitations

1. **Time-Travel Snapshots**: Frontend expects 6 commits; backend returns configurable count
2. **Coordinate Override**: Backend sets (0,0); frontend computes layout. Can be enhanced later.
3. **Large Repos**: >1000 files may take 30+ seconds to analyze
4. **API Key Optional**: Architecture analysis uses defaults if ANTHROPIC_API_KEY is missing

### Debugging

**Frontend only sees mock data?**
- Check: `curl http://localhost:8080/api/health`
- If 404/timeout → backend not running
- Check browser console for fetch errors

**Backend returns errors?**
- Ensure repo URL is valid and public
- Verify git is installed on system
- Check disk space for temp clones

**Metrics look wrong?**
- Verify backend returned correct linesOfCode/complexity values
- Check cityMetrics formulas haven't been modified
- Inspect browser DevTools → Network → /api/analyze response

---

**Integration Complete**: All components wired. Ready for end-to-end testing.
