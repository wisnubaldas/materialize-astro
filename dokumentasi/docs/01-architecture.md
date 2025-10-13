# System Architecture

```mermaid
flowchart LR
  subgraph FRONTEND [Frontend Layer]
    A1(Astro + Vue 3) -->|REST| B1(FastAPI API Gateway)
  end

  subgraph BACKEND [Backend Services]
    B1 --> C1[Auth Service]
    B1 --> C2[Cargo Service]
    B1 --> C3[Invoice Service]
    B1 --> C4[Report Service]
    B1 --> C5[Scheduler Service (Celery + APScheduler)]
  end

  subgraph INFRA [Infrastructure Layer]
    D1[(MySQL DB1)]
    D2[(MySQL DB2)]
    D3[(Redis Broker)]
    D4[(Elasticsearch)]
  end

  C1 --> D1
  C2 --> D2
  C5 --> D3
  B1 --> D4
```
