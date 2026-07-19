# Project Maintenance & Operations

Guidelines for maintaining GitHub Code City project quality, stability, and security.

## Release Management

### Versioning Scheme

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

Example: `v1.2.3`

### Release Process

```bash
# 1. Create release branch
git checkout -b release/v1.2.0

# 2. Update version in files
# - package.json (frontend)
# - pom.xml (backend)
# - .github/workflows/ci.yml (image tags)

# 3. Update CHANGELOG.md
# Add entry for v1.2.0 with all changes

# 4. Commit and tag
git add package.json pom.xml CHANGELOG.md
git commit -m "chore: bump version to 1.2.0"
git tag -a v1.2.0 -m "Release v1.2.0"

# 5. Push and create PR
git push origin release/v1.2.0
# Create PR for review

# 6. After merge, push tag
git push origin v1.2.0

# 7. Create GitHub release
gh release create v1.2.0 --notes-file RELEASE_NOTES.md
```

### CHANGELOG Format

```markdown
## [1.2.0] - 2025-07-25

### Added
- Raycaster selection with emissive glow (#123)
- Backend health check endpoint (#456)

### Changed
- Improved concentric layout algorithm (#789)
- Refactored laser connection rendering

### Fixed
- Memory leak in temp directory cleanup (#321)
- CORS preflight on mobile devices (#654)

### Security
- Added rate limiting (10/min per IP)
- Validated all external inputs

### Breaking Changes
- Removed deprecated `/api/analyze-legacy` endpoint
```

---

## Dependency Management

### Frontend Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Major version update (major version bump required)
npm install package-name@latest

# Security audit
npm audit

# Fix security vulnerabilities
npm audit fix
```

**Policy:**
- Review dependencies monthly
- Update minor/patch versions automatically (CI/CD)
- Manual review for major versions
- Remove unused dependencies quarterly

### Backend Dependencies

```bash
cd backend

# Check for updates
mvn versions:display-dependency-updates

# Update specific dependency
mvn versions:use-latest-releases

# Security check
mvn dependency-check:check
```

**Policy:**
- Same as frontend
- Spring Boot framework versions: Update quarterly
- Major library upgrades: Plan 1-2 sprints in advance

---

## Monitoring & Observability

### Metrics to Track

**Backend:**
```
- analyze duration (p50, p95, p99)
- success/failure rate
- active temp directories
- API response times
- Error rates by type
- Memory usage (heap, GC pauses)
```

**Frontend:**
```
- page load time (core vitals)
- time to interactive
- frame rate (60 FPS target)
- GPU memory usage
- network requests
- JavaScript errors
```

### Monitoring Stack

**Prometheus:**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'code-city-backend'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/actuator/prometheus'
```

**Grafana Dashboards:**
- Backend: Response time, throughput, errors, memory
- Frontend: Core Web Vitals, error rate, build size
- Infrastructure: CPU, memory, disk I/O (K8s)

### Alerting Rules

```yaml
# alerts.yml
groups:
  - name: code-city
    rules:
      - alert: HighErrorRate
        expr: rate(analyze_errors_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate on /api/analyze"

      - alert: SlowAnalysis
        expr: analyze_duration_seconds_bucket{le="30"} < 0.5
        for: 10m
        annotations:
          summary: "Analysis latency degrading"

      - alert: HighMemoryUsage
        expr: jvm_memory_used_bytes / jvm_memory_max_bytes > 0.85
        for: 5m
        annotations:
          summary: "JVM memory usage >85%"
```

---

## Performance Management

### Baseline Metrics

Record quarterly:

```
Backend Analysis:
- Small repo (<100 files): 2-3 seconds
- Medium repo (500-1000 files): 10-15 seconds
- Large repo (5000+ files): 45-60 seconds

Frontend Rendering:
- 1000 nodes: <16ms frame time (60 FPS)
- GPU memory: <100MB
- Page load: <2 seconds

Network:
- API response: <30 seconds (p95)
- Gzip ratio: >90% (500KB → 50KB)
```

### Performance Regression Testing

```bash
# Run performance benchmarks
npm run bench:frontend
mvn test -P performance

# Compare against baseline
./scripts/compare-benchmarks.sh baseline current
```

---

## Security Updates

### Regular Security Audits

**Monthly:**
```bash
# Frontend
npm audit

# Backend
mvn dependency-check:check
```

**Quarterly:**
```bash
# Run OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000

# CodeQL analysis
gh codeql database analyze ...
```

**Annually:**
- Third-party security assessment
- Penetration testing
- Code review audit

### Vulnerability Response

**Timeline:**
- Critical: Fix within 24 hours
- High: Fix within 72 hours
- Medium: Fix within 2 weeks
- Low: Fix in next release

**Steps:**
1. Acknowledge receipt immediately
2. Identify affected versions
3. Create patch release
4. Push notification to users
5. Document in SECURITY.md

---

## Backup & Disaster Recovery

### Backup Strategy

**Daily:**
```
- Database: Full backup to S3
- Configuration: Version controlled (Git)
```

**Weekly:**
```
- Docker images: Mirror to multiple registries
- Helm charts: Push to chart repository
```

**Monthly:**
```
- Full snapshot: Development environment
- Documentation: PDF export
```

### Recovery Procedures

**Database Corruption:**
```bash
# Restore from latest backup
aws s3 cp s3://backups/postgres/latest.dump ./latest.dump
pg_restore -d codecity latest.dump
```

**Service Outage:**
```bash
# Scale to 0 (pause service)
kubectl -n code-city scale deployment code-city-backend --replicas=0

# Fix issue
# (e.g., redeploy, config change, rollback)

# Scale back up
kubectl -n code-city scale deployment code-city-backend --replicas=3
```

---

## Documentation Maintenance

### Quarterly Reviews

- [ ] README.md accuracy
- [ ] API documentation vs reality
- [ ] Architecture diagrams updated
- [ ] Setup instructions tested
- [ ] Examples in docs run correctly

### Annual Documentation Audit

- [ ] Outdated content removed
- [ ] New features documented
- [ ] Code examples up-to-date
- [ ] Links verified (no 404s)
- [ ] Images/diagrams current

---

## Community Management

### Issue Triage

**Weekly:**
```
- Review new issues
- Apply labels (bug, feature, documentation, etc.)
- Assign priority (P0-P3)
- Assign to maintainers
```

**Labels:**
- `bug`: Defect in functionality
- `feature`: Enhancement request
- `documentation`: Docs update
- `good first issue`: Suitable for new contributors
- `help wanted`: Looking for assistance
- `security`: Security concern
- `wontfix`: Closed as intended

### PR Review SLA

- **Critical path** (security, performance): 24 hours
- **Standard**: 3-5 days
- **Community**: 1-2 weeks

### Support Channels

- **GitHub Issues**: Bug reports, features
- **Discussions**: Questions, architecture discussions
- **Email**: security@example.com (security issues only)

---

## Incident Response

### Incident Severity

| Level | Example | Response Time |
|-------|---------|----------------|
| P0 | System down, data loss | 15 min |
| P1 | Major feature broken | 1 hour |
| P2 | Degraded performance | 4 hours |
| P3 | Minor issue, workaround exists | 24 hours |

### Incident Process

1. **Detect**: Monitoring alert or user report
2. **Triage**: Assess severity and scope
3. **Respond**: Immediate mitigation (rollback, scale-up, etc.)
4. **Fix**: Implement permanent solution
5. **Deploy**: Push fix to production
6. **Postmortem**: Analyze root cause, prevent recurrence

### Incident Communication

- [ ] Acknowledge receipt (15 min)
- [ ] Initial assessment (30 min)
- [ ] Status updates (every 30 min during incident)
- [ ] Resolution notification
- [ ] Postmortem summary (24 hours)

---

## License Compliance

### License Check

```bash
# List all dependencies and licenses
npm list --depth=0
npm list --all | grep -E "licenses:"

mvn license:add-third-party
cat target/generated-sources/license/THIRD-PARTY.txt
```

### Accepted Licenses

- MIT
- Apache 2.0
- BSD 2-Clause
- BSD 3-Clause
- ISC
- CC0 1.0 Universal

### Restricted Licenses

- GPL v3
- AGPL
- SSPL
- Commons Clause

**Action**: File license-issue, plan migration

---

## Cleanup & Hygiene

### Monthly

```bash
# Remove old branches (>30 days)
git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D

# Clean Docker images
docker image prune -a

# Archive old logs
./scripts/archive-logs.sh
```

### Quarterly

```bash
# Remove unused npm packages
npm prune --production

# Update lockfiles
npm ci
npm audit fix

# Backend cleanup
cd backend
mvn clean
```

### Annually

```bash
# Major dependency updates
npm upgrade --save

# Refactor legacy code sections
# Archive old documentation

# Review and update security policies
```

---

## Runbooks

### "Service is Slow" Runbook

1. Check monitoring (Prometheus/Grafana)
   - High memory usage? GC tuning needed
   - High latency on `/api/analyze`? Repository size issue
   - Network bottleneck? Check bandwidth

2. Check logs
   ```bash
   kubectl -n code-city logs deployment/code-city-backend | grep -i error
   ```

3. Quick fixes
   - Scale up replicas: `kubectl scale deployment ... --replicas=5`
   - Increase memory limit: `kubectl set resources deployment ... --limits=memory=2Gi`

4. Long-term: Optimize algorithm, add caching, upgrade infrastructure

### "Memory Leak" Runbook

1. Confirm memory leak
   ```bash
   # Check heap trend
   kubectl top pod <pod-name> -c backend --all-containers
   ```

2. Restart pod (temporary)
   ```bash
   kubectl delete pod <pod-name> -n code-city
   ```

3. Investigate
   - Check GC logs for full GC frequency
   - Profile with JFR: `jcmd <pid> JFR.start duration=60s`
   - Analyze heap dump: `jcmd <pid> GC.heap_dump`

4. Fix and redeploy

---

## Checklists

### Pre-Release Checklist

- [ ] All tests passing
- [ ] Security audit passing
- [ ] Performance benchmarks acceptable
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Release notes written

### Post-Release Checklist

- [ ] GitHub release created
- [ ] Docker images pushed
- [ ] Helm charts updated
- [ ] Deployment to staging verified
- [ ] Smoke tests passing
- [ ] Announcement sent (if major)

### Monthly Maintenance Checklist

- [ ] Dependency updates reviewed
- [ ] Performance metrics baseline recorded
- [ ] Security audit completed
- [ ] Issues triaged
- [ ] Documentation reviewed
- [ ] Backups verified

