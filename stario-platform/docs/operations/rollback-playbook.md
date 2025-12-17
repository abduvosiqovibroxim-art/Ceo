# Stario Platform - Rollback Playbook

## Overview

This playbook provides step-by-step procedures for rolling back releases in the Stario platform. Always prioritize service availability over debugging.

## Table of Contents
1. [Pre-Rollback Checklist](#pre-rollback-checklist)
2. [Quick Rollback Commands](#quick-rollback-commands)
3. [Service-Specific Rollbacks](#service-specific-rollbacks)
4. [Database Rollback](#database-rollback)
5. [Feature Flag Rollbacks](#feature-flag-rollbacks)
6. [Post-Rollback Verification](#post-rollback-verification)

---

## Pre-Rollback Checklist

Before initiating a rollback:

- [ ] **Confirm the issue is deployment-related** (not infrastructure/external)
- [ ] **Document current state** (error messages, metrics, affected users)
- [ ] **Notify stakeholders** via #incidents Slack channel
- [ ] **Have database backup ready** if data migration involved
- [ ] **Identify rollback target** (previous stable version)

### Decision Tree

```
Is the service completely down?
├── Yes → Immediate rollback (skip to Quick Rollback Commands)
└── No → Is error rate > 5%?
    ├── Yes → Schedule rollback within 15 minutes
    └── No → Is it a security issue?
        ├── Yes → Immediate rollback
        └── No → Evaluate during business hours
```

---

## Quick Rollback Commands

### Kubernetes Rollback (Recommended)

```bash
# Rollback API Gateway to previous version
kubectl rollout undo deployment/api-gateway -n stario

# Rollback to specific revision
kubectl rollout undo deployment/api-gateway --to-revision=2 -n stario

# Check rollback status
kubectl rollout status deployment/api-gateway -n stario

# View rollout history
kubectl rollout history deployment/api-gateway -n stario
```

### Rollback All Services

```bash
# Emergency: Rollback all deployments to previous version
kubectl rollout undo deployment -n stario

# Verify all pods are running
kubectl get pods -n stario
```

### Docker Compose (Local/Staging)

```bash
# Pull previous image version
export VERSION=v1.2.3  # Previous stable version

# Update and restart
docker-compose -f docker-compose.yml down
docker-compose -f docker-compose.yml pull
docker-compose -f docker-compose.yml up -d

# Verify
docker-compose ps
```

---

## Service-Specific Rollbacks

### API Gateway Rollback

```bash
# Step 1: Rollback deployment
kubectl rollout undo deployment/api-gateway -n stario

# Step 2: Verify rollback
kubectl get pods -l app=api-gateway -n stario

# Step 3: Health check
curl https://api.stario.uz/health

# Step 4: Verify metrics
curl https://api.stario.uz/metrics | grep http_requests_total
```

**Common Issues After Rollback**:
- Cached routes may cause issues → Restart nginx ingress
- JWT signing key mismatch → Verify secrets are consistent

---

### Video Generation Service Rollback

```bash
# Step 1: Rollback video-gen service
kubectl rollout undo deployment/video-gen -n stario

# Step 2: Rollback video-gen workers
kubectl rollout undo deployment/video-gen-worker -n stario

# Step 3: Clear job queue (if needed)
kubectl exec -it $(kubectl get pod -l app=video-gen -o name -n stario | head -1) -n stario -- \
  python -c "import redis; r = redis.Redis(); r.delete('video_generation_queue')"

# Step 4: Verify
kubectl logs -l app=video-gen -n stario --tail=20
```

**Important**: Video generation involves GPU workloads. After rollback:
1. Verify GPU pods are scheduled correctly
2. Check model files are present
3. Verify CUDA drivers compatibility

---

### Face Similarity Service Rollback

```bash
# Step 1: Rollback
kubectl rollout undo deployment/face-similarity -n stario

# Step 2: Verify model loaded
kubectl logs -l app=face-similarity -n stario | grep "Model loaded"

# Step 3: Test endpoint
curl -X POST https://api.stario.uz/face-quiz/health

# Step 4: Verify latency
curl https://api.stario.uz/metrics | grep face_similarity_duration
```

---

### Poster Generation Service Rollback

```bash
# Step 1: Rollback
kubectl rollout undo deployment/poster-gen -n stario

# Step 2: Verify SDXL model
kubectl exec -it $(kubectl get pod -l app=poster-gen -o name -n stario | head -1) -n stario -- \
  ls -la /models/sdxl

# Step 3: Test generation
curl -X POST https://api.stario.uz/posters/generate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"artist_id": "test", "text": "Test"}'
```

---

### RegTech Filter Service Rollback

```bash
# Step 1: Rollback
kubectl rollout undo deployment/regtech-filter -n stario

# Step 2: Verify moderation working
kubectl logs -l app=regtech-filter -n stario | grep "Moderation result"

# Step 3: Test content check
curl -X POST https://api.stario.uz/content/moderate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text": "Test message"}'
```

---

## Database Rollback

### Schema Migration Rollback

```bash
# View migration history
alembic history

# Rollback one migration
alembic downgrade -1

# Rollback to specific version
alembic downgrade abc123

# Rollback all migrations (DANGER!)
alembic downgrade base
```

### Point-in-Time Recovery

```bash
# Step 1: Stop all services writing to DB
kubectl scale deployment --all --replicas=0 -n stario

# Step 2: Restore from backup
pg_restore -h postgres.stario.uz -U stario -d stario_new \
  /backups/stario_20250120_100000.dump

# Step 3: Swap databases
psql -h postgres.stario.uz -U stario -c "
  ALTER DATABASE stario RENAME TO stario_old;
  ALTER DATABASE stario_new RENAME TO stario;
"

# Step 4: Start services
kubectl scale deployment --all --replicas=1 -n stario

# Step 5: Verify
psql -h postgres.stario.uz -U stario -c "SELECT count(*) FROM users;"
```

### Data Rollback (Specific Tables)

```bash
# Restore specific table from backup
pg_restore -h postgres.stario.uz -U stario -d stario \
  --table=artists \
  /backups/stario_20250120_100000.dump

# Or using SQL dump
psql -h postgres.stario.uz -U stario -d stario < /backups/artists_backup.sql
```

---

## Feature Flag Rollbacks

### Disable Feature via Environment Variable

```bash
# Disable specific feature
kubectl set env deployment/api-gateway \
  FEATURE_VOICE_QUIZ_ENABLED=false \
  -n stario

# Disable AI features (use mock)
kubectl set env deployment/video-gen \
  USE_MOCK_AI=true \
  -n stario
```

### Redis Feature Flags

```bash
# Disable feature flag in Redis
kubectl exec -it $(kubectl get pod -l app=redis -o name -n stario | head -1) -n stario -- \
  redis-cli SET feature:voice_quiz:enabled false

# List all feature flags
kubectl exec -it $(kubectl get pod -l app=redis -o name -n stario | head -1) -n stario -- \
  redis-cli KEYS "feature:*"
```

### Emergency Feature Kill Switch

```bash
# Kill all non-essential features
kubectl set env deployment/api-gateway \
  EMERGENCY_MODE=true \
  FEATURE_VIDEO_GEN_ENABLED=false \
  FEATURE_POSTER_GEN_ENABLED=false \
  FEATURE_VOICE_QUIZ_ENABLED=false \
  -n stario
```

---

## Post-Rollback Verification

### Health Checks

```bash
# All services health
for svc in api-gateway video-gen face-similarity poster-gen regtech-filter; do
  echo "Checking $svc..."
  curl -s https://api.stario.uz/health/$svc | jq .
done
```

### Smoke Tests

```bash
# Run smoke tests
./scripts/smoke-tests.sh

# Or manually:
# 1. User registration
curl -X POST https://api.stario.uz/auth/register \
  -d '{"email": "test@example.com", "password": "Test123!"}'

# 2. Artist list
curl https://api.stario.uz/artists

# 3. Health endpoint
curl https://api.stario.uz/health
```

### Metrics Verification

```bash
# Check error rate dropped
curl -s https://prometheus.stario.uz/api/v1/query \
  --data-urlencode 'query=sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))' \
  | jq '.data.result[0].value[1]'

# Should be < 0.01 (1%)
```

### Log Review

```bash
# Check for errors after rollback
kubectl logs -l app=api-gateway -n stario --since=5m | grep -i error

# Check for crash loops
kubectl get pods -n stario | grep -E "(CrashLoopBackOff|Error)"
```

---

## Rollback Communication Template

### Slack Message Template

```
🔴 **ROLLBACK IN PROGRESS**

**Service**: [service name]
**Environment**: [production/staging]
**Reason**: [brief description]
**Started**: [time]
**ETA**: [estimated completion]
**Impact**: [user-facing impact]

**Status**: ⏳ In Progress

Will update when complete.
```

### Post-Rollback Update

```
✅ **ROLLBACK COMPLETE**

**Service**: [service name]
**Rolled back to**: [version]
**Completed at**: [time]
**Current status**: All systems operational

**Next steps**:
- Post-mortem scheduled for [date/time]
- Fix being developed in PR #[number]

**Metrics**:
- Error rate: [current] (was [during incident])
- P95 latency: [current]ms (was [during incident]ms)
```

---

## Rollback Decision Matrix

| Symptom | Severity | Action |
|---------|----------|--------|
| 5xx errors > 10% | Critical | Immediate rollback |
| P95 latency > 2x baseline | High | Rollback within 15 min |
| Single feature broken | Medium | Feature flag disable |
| Minor UI bugs | Low | Hotfix, no rollback |
| Security vulnerability | Critical | Immediate rollback |
| Data corruption | Critical | Database restore |

---

## Emergency Contacts

| Role | Contact | When to Call |
|------|---------|--------------|
| On-call Engineer | oncall@stario.uz | SEV-1, SEV-2 |
| Database Admin | dba@stario.uz | Database rollback needed |
| Platform Lead | platform@stario.uz | Multi-service issues |
| Security | security@stario.uz | Security-related rollbacks |

---

## Appendix: Version History

Keep track of deployment versions for quick reference:

| Date | Version | Services | Notes |
|------|---------|----------|-------|
| 2025-01-20 | v1.2.3 | All | Stable baseline |
| 2025-01-19 | v1.2.2 | api-gateway | Bug fix |
| 2025-01-18 | v1.2.1 | video-gen | Performance improvement |

Update this table after each deployment.
