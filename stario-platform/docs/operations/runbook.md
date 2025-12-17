# Stario Platform - Operations Runbook

## Table of Contents
1. [Overview](#overview)
2. [Service Health Checks](#service-health-checks)
3. [Common Issues & Resolutions](#common-issues--resolutions)
4. [Incident Response](#incident-response)
5. [Scaling Procedures](#scaling-procedures)
6. [Database Operations](#database-operations)
7. [Compliance Operations](#compliance-operations)

---

## Overview

### Architecture
- **API Gateway**: Main entry point (port 8000)
- **Video Gen Service**: AI video generation (port 8002)
- **Voice Gen Service**: Voice cloning/TTS (port 8003)
- **Face Similarity Service**: Face comparison (port 8004)
- **Poster Gen Service**: AI poster generation (port 8005)
- **Merch Engine**: E-commerce (port 8006)
- **RegTech Filter**: Content moderation (port 8007)

### Key Metrics
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Video Generation P95 | ≤40s | >40s |
| Poster Generation P95 | ≤5s | >5s |
| Face Similarity P95 | ≤200ms | >200ms |
| API Error Rate | <0.1% | >1% |
| Uptime | 99.9% | <99.5% |

### Contact Information
- **On-call**: oncall@stario.uz
- **Engineering Lead**: eng-lead@stario.uz
- **Compliance Officer**: compliance@stario.uz
- **Security Team**: security@stario.uz

---

## Service Health Checks

### Quick Health Check
```bash
# All services health
curl http://localhost:8000/health

# Individual services
curl http://localhost:8000/health/video-gen
curl http://localhost:8000/health/face-similarity
curl http://localhost:8000/health/poster-gen
```

### Database Health
```bash
# PostgreSQL
docker exec stario-postgres pg_isready -U stario

# Redis
docker exec stario-redis redis-cli ping
```

### GPU Status (AI Services)
```bash
# Check GPU availability
nvidia-smi

# Check GPU memory
nvidia-smi --query-gpu=memory.used,memory.total --format=csv
```

---

## Common Issues & Resolutions

### Issue: High API Latency

**Symptoms**:
- P95 latency > 500ms
- Users reporting slow responses

**Investigation**:
```bash
# Check API Gateway metrics
curl http://localhost:8000/metrics | grep http_request_duration

# Check database connections
docker exec stario-postgres psql -U stario -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis memory
docker exec stario-redis redis-cli info memory
```

**Resolution**:
1. Scale API Gateway replicas
   ```bash
   kubectl scale deployment api-gateway --replicas=5 -n stario
   ```
2. Check for slow database queries
   ```sql
   SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
   ```
3. Clear Redis cache if memory high
   ```bash
   docker exec stario-redis redis-cli FLUSHDB
   ```

---

### Issue: Video Generation Queue Backlog

**Symptoms**:
- Queue length > 100
- Users waiting > 2 minutes

**Investigation**:
```bash
# Check queue length
docker exec stario-redis redis-cli LLEN video_generation_queue

# Check worker status
kubectl get pods -l app=video-gen-worker -n stario

# Check GPU utilization
nvidia-smi
```

**Resolution**:
1. Scale video generation workers
   ```bash
   kubectl scale deployment video-gen-worker --replicas=5 -n stario
   ```
2. If GPU memory exhausted, restart workers
   ```bash
   kubectl rollout restart deployment video-gen-worker -n stario
   ```
3. Enable queue prioritization
   ```bash
   kubectl set env deployment/video-gen PRIORITY_MODE=true -n stario
   ```

---

### Issue: Face Similarity Service Slow (>200ms)

**Symptoms**:
- P95 > 200ms
- Alert: FaceSimilaritySlow

**Investigation**:
```bash
# Check service metrics
curl http://localhost:8004/metrics

# Check model loading
kubectl logs -l app=face-similarity -n stario --tail=100

# Check GPU availability
nvidia-smi -l 1
```

**Resolution**:
1. Verify model is loaded in GPU memory
   ```bash
   kubectl exec -it $(kubectl get pod -l app=face-similarity -o name -n stario) -n stario -- python -c "import torch; print(torch.cuda.is_available())"
   ```
2. Scale horizontally
   ```bash
   kubectl scale deployment face-similarity --replicas=3 -n stario
   ```
3. If model corrupted, restart to reload
   ```bash
   kubectl rollout restart deployment face-similarity -n stario
   ```

---

### Issue: Payment Processing Failures

**Symptoms**:
- Payment failure rate > 5%
- Alert: PaymentFailures

**Investigation**:
```bash
# Check payment service logs
kubectl logs -l app=api-gateway -n stario | grep payment

# Check external provider status
curl -s https://status.payme.uz/api/status
curl -s https://status.click.uz/api/status
```

**Resolution**:
1. If provider down, enable fallback
   ```bash
   kubectl set env deployment/api-gateway PAYMENT_FALLBACK=true -n stario
   ```
2. Check webhook endpoint
   ```bash
   curl -X POST http://localhost:8000/payments/webhook/payme -d '{"test": true}'
   ```
3. Verify SSL certificates not expired
   ```bash
   echo | openssl s_client -servername api.stario.uz -connect api.stario.uz:443 2>/dev/null | openssl x509 -noout -dates
   ```

---

### Issue: Ephemeral Uploads Not Being Deleted (PII Risk)

**Symptoms**:
- Alert: EphemeralUploadsStale
- S3 bucket growing unexpectedly

**Investigation**:
```bash
# Check pending deletions
docker exec stario-redis redis-cli LLEN ephemeral_deletion_queue

# Check S3 lifecycle rules
aws s3api get-bucket-lifecycle-configuration --bucket stario-ephemeral

# Check deletion worker logs
kubectl logs -l app=ephemeral-cleaner -n stario
```

**Resolution**:
1. **CRITICAL**: This is a compliance issue. Escalate immediately.
2. Run manual cleanup
   ```bash
   kubectl exec -it $(kubectl get pod -l app=api-gateway -o name -n stario | head -1) -n stario -- python -c "
   from stario_common.s3_client import S3Client
   import asyncio
   s3 = S3Client()
   asyncio.run(s3.cleanup_ephemeral_uploads())
   "
   ```
3. Verify lifecycle policy
   ```json
   {
     "Rules": [{
       "ID": "EphemeralAutoDelete",
       "Status": "Enabled",
       "Expiration": {"Days": 1}
     }]
   }
   ```

---

### Issue: Database Connection Pool Exhausted

**Symptoms**:
- Services returning 500 errors
- "too many connections" in logs

**Investigation**:
```bash
# Check active connections
docker exec stario-postgres psql -U stario -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Check max connections
docker exec stario-postgres psql -U stario -c "SHOW max_connections;"
```

**Resolution**:
1. Kill idle connections
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
   AND state_change < NOW() - INTERVAL '10 minutes';
   ```
2. Scale down API instances temporarily
   ```bash
   kubectl scale deployment api-gateway --replicas=2 -n stario
   ```
3. Increase max connections (requires restart)
   ```bash
   # In postgresql.conf
   max_connections = 200
   ```

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| SEV-1 | Critical, full outage | 15 min | API down, payment processing failed |
| SEV-2 | Major degradation | 30 min | Video gen 2x slower, partial outage |
| SEV-3 | Minor impact | 2 hours | Single feature broken, cosmetic issues |
| SEV-4 | Low priority | Next business day | Performance optimization, minor bugs |

### Incident Response Steps

#### 1. Acknowledge (5 min)
```bash
# Acknowledge in PagerDuty/Slack
/incident ack INC-001

# Start incident channel
/incident create --severity SEV-1 --title "API Gateway Down"
```

#### 2. Assess (10 min)
```bash
# Quick system status
kubectl get pods -n stario
kubectl get events -n stario --sort-by='.lastTimestamp' | tail -20

# Check recent deployments
kubectl rollout history deployment -n stario
```

#### 3. Communicate
- Update status page: https://status.stario.uz
- Notify stakeholders via Slack #incidents
- If SEV-1/SEV-2, notify leadership

#### 4. Mitigate
Apply temporary fixes:
```bash
# Rollback if recent deployment
kubectl rollout undo deployment/api-gateway -n stario

# Scale resources
kubectl scale deployment api-gateway --replicas=10 -n stario

# Enable maintenance mode if needed
kubectl set env deployment/api-gateway MAINTENANCE_MODE=true -n stario
```

#### 5. Resolve
- Identify root cause
- Apply permanent fix
- Verify fix in production

#### 6. Post-mortem (Within 48 hours)
- Document timeline
- Identify contributing factors
- Define action items
- Share learnings

---

## Scaling Procedures

### Horizontal Pod Autoscaling (HPA)

All services have HPA configured. To modify:

```bash
# View current HPA
kubectl get hpa -n stario

# Modify HPA
kubectl patch hpa api-gateway -n stario --patch '{"spec":{"maxReplicas":20}}'
```

### Manual Scaling

```bash
# Scale API Gateway
kubectl scale deployment api-gateway --replicas=10 -n stario

# Scale Video Gen Workers
kubectl scale deployment video-gen-worker --replicas=5 -n stario

# Scale Face Similarity
kubectl scale deployment face-similarity --replicas=3 -n stario
```

### Database Scaling

For PostgreSQL read replica:
```bash
# Add read replica
terraform apply -var="db_read_replicas=2"
```

### Redis Scaling

For Redis cluster expansion:
```bash
# Scale Redis cluster
kubectl scale statefulset redis --replicas=5 -n stario
```

---

## Database Operations

### Backup Verification

```bash
# List recent backups
aws s3 ls s3://stario-backups/postgres/ --recursive | tail -10

# Verify backup integrity
aws s3 cp s3://stario-backups/postgres/latest.sql.gz - | gunzip | head -100
```

### Point-in-Time Recovery

```bash
# Restore to specific time
pg_restore -h localhost -U stario -d stario_restored \
  --target-time="2025-01-20 10:00:00" \
  /path/to/backup.sql
```

### Query Performance

```bash
# Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

# Find slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Compliance Operations

### Audit Log Export

```bash
# Export last 90 days of audit logs
curl -X POST http://localhost:8000/content/audit-logs/export \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"date_from": "2025-01-01", "date_to": "2025-01-31"}'
```

### Legal Data Export (Seizure)

```bash
# Generate legal export package
curl -X POST http://localhost:8000/content/legal-export \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "case_id": "LEGAL-2025-001",
    "user_ids": ["user-uuid"],
    "date_from": "2025-01-01",
    "date_to": "2025-01-31",
    "include_logs": true,
    "include_content": true
  }'
```

### PII Cleanup Verification

```bash
# Verify ephemeral uploads are being deleted
curl http://localhost:8000/metrics | grep ephemeral

# Check data retention compliance
curl http://localhost:8000/admin/compliance/report \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Monthly Compliance Checklist

- [ ] Verify audit logs are being written
- [ ] Check data residency (all data in Uzbekistan)
- [ ] Verify ephemeral upload deletion (3s)
- [ ] Review access logs for anomalies
- [ ] Test legal export functionality
- [ ] Verify data retention policies

---

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Primary On-call | - | - | oncall@stario.uz |
| Engineering Lead | - | - | eng-lead@stario.uz |
| Database Admin | - | - | dba@stario.uz |
| Security Team | - | - | security@stario.uz |
| Compliance Officer | - | - | compliance@stario.uz |

---

## Useful Commands Reference

```bash
# Restart all services
kubectl rollout restart deployment -n stario

# View all logs
kubectl logs -l app=stario -n stario --tail=100 -f

# Enter service shell
kubectl exec -it $(kubectl get pod -l app=api-gateway -o name -n stario | head -1) -n stario -- /bin/bash

# Port forward for debugging
kubectl port-forward svc/api-gateway 8000:8000 -n stario

# Check resource usage
kubectl top pods -n stario

# Force delete stuck pod
kubectl delete pod <pod-name> -n stario --force --grace-period=0
```
