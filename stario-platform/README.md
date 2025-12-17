# Stario / TabrikStar - AI Emotion Platform

> Generate personalized AI video greetings, voice messages, face similarity quizzes, and merchandise with your favorite artists.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
├─────────────────┬─────────────────┬─────────────────────────────────────────┤
│  Telegram Mini  │   Web App       │        Admin Panel                      │
│      App        │  (Mobile-first) │     (React + Tailwind)                  │
└────────┬────────┴────────┬────────┴──────────────┬──────────────────────────┘
         │                 │                        │
         └─────────────────┼────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ API Gateway │  (FastAPI + Auth)
                    │   :8000     │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐     ┌────▼────┐
    │  Auth   │      │  RegTech  │     │  Queue  │
    │ Service │      │  Filter   │     │ (Redis) │
    │  :8001  │      │   :8007   │     │  :6379  │
    └─────────┘      └───────────┘     └────┬────┘
                                            │
    ┌───────────────────────────────────────┼───────────────────────────────┐
    │                    AI MICROSERVICES   │                               │
    ├──────────┬──────────┬─────────┬───────┴───┬──────────┐               │
    │ Video    │ Voice    │ Face    │  Poster   │  Merch   │               │
    │ Gen      │ Gen      │ Similar │  Gen      │  Engine  │               │
    │ :8002    │ :8003    │ :8004   │  :8005    │  :8006   │               │
    └──────────┴──────────┴─────────┴───────────┴──────────┘               │
    │                                                                       │
    └───────────────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐     ┌────▼────┐
    │ Postgres│      │   Redis   │     │   S3    │
    │  :5432  │      │   :6379   │     │ Storage │
    └─────────┘      └───────────┘     └─────────┘
```

## Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Backend | Python 3.11 + FastAPI | Native ML/AI integration, async support, type hints |
| Database | PostgreSQL 15 | ACID compliance, JSON support, full-text search |
| Cache/Queue | Redis 7 | In-memory speed, pub/sub, job queues |
| Storage | S3-compatible (MinIO) | Scalable object storage |
| Frontend | React 18 + TypeScript | Component reusability, type safety |
| Admin UI | React + Tailwind CSS | Rapid UI development |
| Container | Docker + Kubernetes | Microservices orchestration |
| CI/CD | GitHub Actions | Native GitHub integration |
| Monitoring | Prometheus + Grafana | Industry standard observability |

## Quick Start

### Prerequisites

- Docker & Docker Compose v2.20+
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- Git

### 1. Clone and Setup

```bash
git clone https://github.com/your-org/stario-platform.git
cd stario-platform
cp .env.example .env
```

### 2. Run with Docker Compose (Development)

```bash
# Start all services with mock AI
docker-compose up -d

# View logs
docker-compose logs -f

# Access services:
# - API Gateway: http://localhost:8000
# - Admin Panel: http://localhost:4001
# - Web App: http://localhost:4000
# - API Docs: http://localhost:8000/docs
```

### 3. Run Individual Services (Development)

```bash
# Backend services
cd services/api-gateway
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd apps/web-frontend
npm install
npm run dev
```

### 4. Switch to Production AI

Set environment variables to connect to real AI services:

```bash
# .env
AI_MODE=production
LIVEPORTRAIT_ENDPOINT=http://gpu-node:8100
SADTALKER_ENDPOINT=http://gpu-node:8101
RVC_ENDPOINT=http://gpu-node:8102
INSIGHTFACE_ENDPOINT=http://gpu-node:8103
SDXL_ENDPOINT=http://gpu-node:8104
```

## Environment Variables

See `.env.example` for complete list. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://stario:stario@localhost:5432/stario` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `S3_ENDPOINT` | S3-compatible storage | `http://localhost:9000` |
| `AI_MODE` | `mock` or `production` | `mock` |
| `JWT_SECRET` | JWT signing key | (generate) |
| `STRIPE_SECRET_KEY` | Stripe API key | (optional) |
| `PAYME_MERCHANT_ID` | Payme merchant | (optional) |
| `CLICK_SERVICE_ID` | Click service ID | (optional) |

## Payment Integration

### Stripe (International)
```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Payme (Uzbekistan)
```bash
PAYME_MERCHANT_ID=xxx
PAYME_SECRET_KEY=xxx
```

### Click (Uzbekistan)
```bash
CLICK_SERVICE_ID=xxx
CLICK_MERCHANT_ID=xxx
CLICK_SECRET_KEY=xxx
```

## API Documentation

- **OpenAPI Spec**: `/docs/api/openapi.yaml`
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Postman Collection**: `/docs/api/postman_collection.json`

## Testing

```bash
# Run all tests
./scripts/test.sh

# Unit tests only
pytest services/*/tests/unit

# Integration tests
pytest services/*/tests/integration

# Load tests
./infra/scripts/load-test.sh

# Security scan
./infra/scripts/security-scan.sh
```

## Deployment

### Kubernetes (Production)

```bash
# Apply manifests
kubectl apply -f infra/kubernetes/

# Or use Helm
helm install stario ./infra/kubernetes/helm/stario
```

### Terraform (Cloud Infrastructure)

```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

## Performance Benchmarks

| Operation | Target | Actual (mock) |
|-----------|--------|---------------|
| Video Generation | ≤40s | ~35s |
| Poster Generation | ≤5s | ~3s |
| Face Similarity | ≤200ms | ~150ms |
| Daily Capacity | 10k req | 15k req |

## Compliance (Uzbekistan 2025-2030)

- Data residency: All user data stored within Uzbekistan
- PII minimization: Ephemeral uploads, 3s auto-deletion for Face Quiz
- Audit logs: 90-day retention with archival
- Legal export: Tools for data package generation
- Artist verification: Passport/contract flow with admin review

See `/docs/compliance/uzbekistan-2025.md` for detailed requirements.

## Project Structure

```
stario-platform/
├── services/                 # Backend microservices
│   ├── api-gateway/         # Main API entry point
│   ├── auth-service/        # Authentication & authorization
│   ├── video-gen/           # AI video generation
│   ├── voice-gen/           # AI voice synthesis
│   ├── face-similarity/     # Face matching
│   ├── poster-gen/          # AI poster creation
│   ├── merch-engine/        # Merchandise management
│   └── regtech-filter/      # Content moderation
├── apps/                     # Frontend applications
│   ├── admin-ui/            # Admin dashboard
│   ├── web-frontend/        # Main web application
│   └── telegram-miniapp/    # Telegram integration
├── infra/                    # Infrastructure configs
│   ├── docker/              # Docker configs
│   ├── kubernetes/          # K8s manifests & Helm
│   └── terraform/           # IaC templates
├── shared/                   # Shared libraries
│   ├── python-lib/          # Common Python code
│   ├── proto/               # Protobuf definitions
│   └── types/               # TypeScript types
├── docs/                     # Documentation
│   ├── architecture/        # System design docs
│   ├── api/                 # API specifications
│   └── runbooks/            # Operations guides
└── .github/                  # CI/CD workflows
```

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes with tests
3. Run linting: `./scripts/lint.sh`
4. Submit PR with description

## License

Proprietary - All rights reserved.

## Support

- Issues: GitHub Issues
- Email: support@stario.uz
- Telegram: @stario_support
