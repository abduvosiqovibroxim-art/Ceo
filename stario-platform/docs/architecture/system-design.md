# Stario Platform - System Architecture

## Overview

Stario is an AI-powered platform for creating personalized video greetings, face quizzes, and merchandise with celebrity artists.

## Architecture Diagram

```mermaid
graph TB
    subgraph Clients
        TG[Telegram Mini App]
        WEB[Web App]
        ADMIN[Admin Panel]
    end

    subgraph API Layer
        GW[API Gateway<br/>:8000]
    end

    subgraph Services
        AUTH[Auth Service<br/>:8001]
        VID[Video Gen<br/>:8002]
        VOC[Voice Gen<br/>:8003]
        FACE[Face Similarity<br/>:8004]
        POST[Poster Gen<br/>:8005]
        MERCH[Merch Engine<br/>:8006]
        REG[RegTech Filter<br/>:8007]
    end

    subgraph AI Services
        LP[LivePortrait]
        ST[SadTalker]
        RVC[RVC Voice]
        IF[InsightFace]
        SDXL[SDXL]
    end

    subgraph Data
        PG[(PostgreSQL)]
        RD[(Redis)]
        S3[(S3 Storage)]
    end

    subgraph External
        STRIPE[Stripe]
        PAYME[Payme]
        CLICK[Click]
        BOX[BoxNow]
    end

    TG --> GW
    WEB --> GW
    ADMIN --> GW

    GW --> AUTH
    GW --> VID
    GW --> VOC
    GW --> FACE
    GW --> POST
    GW --> MERCH
    GW --> REG

    VID --> LP
    VID --> ST
    VOC --> RVC
    FACE --> IF
    POST --> SDXL

    AUTH --> PG
    VID --> RD
    FACE --> RD
    GW --> S3

    MERCH --> STRIPE
    MERCH --> PAYME
    MERCH --> CLICK
    MERCH --> BOX
```

## Data Flow: Video Generation

```mermaid
sequenceDiagram
    participant U as User
    participant GW as API Gateway
    participant REG as RegTech Filter
    participant VID as Video Gen
    participant RD as Redis Queue
    participant AI as AI Pipeline
    participant S3 as Storage

    U->>GW: POST /videos/generate
    GW->>REG: Moderate text content
    REG-->>GW: Approved
    GW->>RD: Queue job
    RD-->>GW: job_id
    GW-->>U: {job_id, status: queued}

    loop Worker
        VID->>RD: Dequeue job
        VID->>AI: Generate TTS audio
        AI-->>VID: audio.mp3
        VID->>AI: Animate face
        AI-->>VID: video.mp4
        VID->>S3: Upload video
        VID->>RD: Update job status
    end

    U->>GW: GET /videos/jobs/{id}
    GW->>RD: Get job status
    RD-->>GW: {status: completed, video_url}
    GW-->>U: Video ready
```

## Data Flow: Face Quiz (PII Compliant)

```mermaid
sequenceDiagram
    participant U as User
    participant GW as API Gateway
    participant S3 as Storage
    participant FACE as Face Similarity
    participant AI as InsightFace

    U->>GW: POST /face-quiz/start
    GW->>S3: Generate presigned URL
    S3-->>GW: upload_url (5min expiry)
    GW-->>U: {quiz_id, upload_url}

    U->>S3: Upload photo directly
    U->>GW: POST /face-quiz/{id}/analyze

    GW->>FACE: Compare faces
    FACE->>AI: Get embeddings
    AI-->>FACE: similarity_score
    FACE-->>GW: Result

    Note over S3: Auto-delete after 3s
    GW->>S3: Schedule deletion

    GW-->>U: {similarity: 72.5%, badge: "Lookalike"}
```

## Database Schema (ERD)

```mermaid
erDiagram
    users ||--o{ orders : places
    users ||--o{ videos : creates
    users ||--o{ face_quiz_results : takes

    artists ||--o{ videos : featured_in
    artists ||--o{ artist_prompts : has
    artists ||--|| artist_restrictions : has

    orders ||--|{ order_items : contains
    orders ||--o| payments : has

    videos }o--|| artist_prompts : uses

    users {
        uuid id PK
        string email UK
        string password_hash
        string role
        boolean is_verified
        timestamp created_at
    }

    artists {
        uuid id PK
        string name
        string category
        string verification_status
        boolean is_active
        int total_videos
        decimal rating
    }

    artist_restrictions {
        uuid id PK
        uuid artist_id FK
        array whitelist_topics
        array blacklist_topics
        int max_duration_seconds
    }

    videos {
        uuid id PK
        uuid user_id FK
        uuid artist_id FK
        string video_url
        string status
        int processing_time_ms
    }

    orders {
        uuid id PK
        uuid user_id FK
        string status
        int total_uzs
        string payment_provider
        timestamp created_at
    }

    payments {
        uuid id PK
        uuid order_id FK
        string provider
        int amount_uzs
        string status
    }
```

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| API Gateway | FastAPI (Python) | Request routing, auth, rate limiting |
| Auth | JWT + OAuth2 | Authentication & authorization |
| Video Gen | LivePortrait, SadTalker | Face animation |
| Voice Gen | RVC, FastSpeech2 | Voice cloning & TTS |
| Face Similarity | InsightFace | Face recognition |
| Poster Gen | SDXL | Image generation |
| Database | PostgreSQL 15 | Primary data store |
| Cache/Queue | Redis 7 | Caching, job queues |
| Storage | S3/MinIO | Object storage |
| Container | Docker, Kubernetes | Orchestration |
| CI/CD | GitHub Actions | Automation |
| Monitoring | Prometheus, Grafana | Observability |

## Performance Requirements

| Metric | Target | Implementation |
|--------|--------|----------------|
| Video Generation | ≤40s | GPU queue, parallel processing |
| Poster Generation | ≤5s | Optimized SDXL inference |
| Face Similarity | ≤200ms | Pre-computed embeddings |
| Daily Capacity | 10k requests | Horizontal scaling |
| Uptime | 99.9% | Multi-AZ deployment |

## Security Architecture

### Authentication Flow
1. User authenticates via email/password or Telegram
2. JWT access token (30min) + refresh token (7 days)
3. RBAC: admin, operator, validator, artist, user

### Data Protection
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- PII minimization (ephemeral uploads)
- Audit logging (90-day retention)

### Compliance
- Data residency: Uzbekistan
- Legal export capability
- Artist verification workflow
