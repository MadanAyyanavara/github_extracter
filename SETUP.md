# GitHub Code City - Setup & Running

## Prerequisites

### Global Requirements
- **Git** (for cloning repositories) - [Download](https://git-scm.com)
- **Java 21+** (Already installed: `java -version` shows Java 24.0.2 ✓)

## Frontend Setup

The frontend is **fully configured and ready to run**.

```bash
# Install dependencies (already done)
npm install

# Start dev server (already running on localhost:5173)
npm run dev
```

The app loads with **mock data by default**, so you can test UI immediately.

## Backend Setup

### 1. Install Maven 3.9+

**Option A: Windows Package Manager (Fastest)**
```powershell
winget install Maven.Maven
```

**Option B: Download Direct**
- Go to https://maven.apache.org/download.cgi
- Download Binary zip for Windows
- Extract to `C:\apache-maven-3.9.x`
- Add `C:\apache-maven-3.9.x\bin` to your PATH
- Verify: `mvn --version`

**Option C: Chocolatey (if installed)**
```powershell
choco install maven
```

### 2. Set ANTHROPIC_API_KEY

The backend uses Claude AI for architecture analysis. You have two options:

**Option A: Set Environment Variable (Recommended)**

**Windows PowerShell:**
```powershell
$env:ANTHROPIC_API_KEY = "sk-your-actual-api-key"

# Then run:
mvn spring-boot:run
```

**Windows Command Prompt:**
```cmd
set ANTHROPIC_API_KEY=sk-your-actual-api-key
mvn spring-boot:run
```

**Option B: No API Key (Fallback Mode)**
The backend will use default architecture analysis if API key is missing:
```bash
mvn spring-boot:run
# Will start without AI analysis, but app still works
```

### 3. Build & Run Backend

```bash
cd backend

# Clean build (first time)
mvn clean package

# Run the server
mvn spring-boot:run
```

Server will start on `http://localhost:8080/api`

### 4. Test Connection

Once both frontend and backend are running:
1. **Frontend** listens on `http://localhost:5173`
2. **Backend** listens on `http://localhost:8080/api`

Enter any GitHub repository URL (e.g., `https://github.com/torvalds/linux`) in the frontend, and it will:
- Clone the repo
- Extract code metrics
- Analyze git history
- Generate architecture insights (if API key is set)

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `ANTHROPIC_API_KEY` | Optional | None | Claude AI for architecture analysis |
| `VITE_API_BASE_URL` | Optional | `http://localhost:8080/api` | Frontend backend URL (set in `.env`) |

## Troubleshooting

### Maven not found
- Verify Maven is installed: `mvn --version`
- Check PATH includes Maven bin directory
- Restart PowerShell/CMD after adding to PATH

### Backend compilation fails
- Ensure Java 21+: `java -version`
- Clean Maven cache: `mvn clean`
- Delete `~/.m2/repository` and rebuild

### API calls fail from frontend
- Verify backend is running: `curl http://localhost:8080/api/timeline`
- Check CORS headers in response
- Ensure frontend is on `localhost:5173`

### Architecture analysis shows defaults
- ANTHROPIC_API_KEY might be missing or invalid
- Check environment variable: `echo $env:ANTHROPIC_API_KEY` (PowerShell)
- Restart backend after setting new key

## Architecture

```
Frontend (React 19 + Vite)          Backend (Spring Boot + JGit)
   localhost:5173                      localhost:8080/api
        |                                   |
        |---> POST /api/analyze      Clones repo
        |     (repoUrl, commitSha)    Analyzes metrics
        |                             Extracts dependencies
        |---> POST /api/timeline      Architecture analysis
              (repoUrl)               Returns JSON
```

## What's Included

### Frontend Components
- `CodeCityCanvas` - 3D visualization with Three.js
- `AiDrawer` - AI-powered insights panel
- `TimeTravelSlider` - Time-travel through commit history

### Backend Services
- `GitService` - JGit repository operations
- `CodeMetricsService` - LOC, complexity, imports
- `GitChurnService` - File churn scoring
- `TimelineService` - Commit history extraction (NEW)
- `ArchitectureAnalysisService` - LangChain4j + Claude

## Next Steps

1. Install Maven
2. Set ANTHROPIC_API_KEY (optional but recommended)
3. Run: `mvn spring-boot:run` in `backend/` directory
4. Open http://localhost:5173 and test with a GitHub repo URL
