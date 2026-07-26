# 🚀 TalentSync — Event-Driven Microservices Platform

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?style=flat-square&logo=nodedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Express](https://img.shields.io/badge/Express.js-4.x-lightgrey?style=flat-square&logo=express)
![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)
![Redis](https://img.shields.io/badge/Redis-Cache--Aside-DC382D?style=flat-square&logo=redis)
![Apache Kafka](https://img.shields.io/badge/Apache_Kafka-Event--Driven-231F20?style=flat-square&logo=apachekafka)
![JWT](https://img.shields.io/badge/JWT-RBAC_Auth-black?style=flat-square&logo=jsonwebtokens)

TalentSync is a distributed, containerized microservices platform built with **Node.js, Express, and TypeScript**. It serves as a real-world reference implementation for enterprise backend patterns—including **API Gateway proxy routing**, **stateless JWT authentication with Role-Based Access Control (RBAC)**, **Redis Cache-Aside caching**, and **asynchronous event publishing via Apache Kafka**.

---

## 🏗️ Detailed System Architecture

             [ Client / Postman / CLI ]
                   │
                   │ HTTP Requests (Port 5000)
                   ▼
       ┌───────────────────────┐
       │    gateway-service    │
       └───────────┬───────────┘
                   │
    ┌──────────────┴──────────────┐
    │ /api/auth                   │ /api/jobs
    ▼                             ▼
┌──────────────┐          ┌──────────────┐
│ auth-service │          │ job-service  │
└──────────────┘          └──────┬───────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │ Cache                         │ Publish Event
                 ▼                               ▼
          ┌──────────────┐                ┌──────────────┐
          │    redis     │                │    kafka     │
          └──────────────┘                └──────────────┘
### 2. Request Processing & Data Flows

#### A. Authentication & Authorization Flow
1. **Login Request:** Client posts credentials to `POST /api/auth/login` via the API Gateway (`:5000`).
2. **Proxying:** `gateway-service` proxies the request to `auth-service` (`:5001`).
3. **Token Issuance:** `auth-service` validates credentials and issues a signed JSON Web Token (JWT) containing `userId`, `email`, and `role`.
4. **Stateless Verification:** When accessing protected routes (e.g., `POST /api/jobs`), `job-service` (`:5002`) verifies the JWT signature locally using a shared secret and evaluates role permissions (`CANDIDATE`, `RECRUITER`, `ADMIN`) without hitting `auth-service`.

#### B. Redis Cache-Aside Strategy (`GET /api/jobs`)
1. **Cache Read Check:** When a GET request hits `job-service`, it queries Redis for key `jobs:all`.
2. **Cache Hit:** If data exists in Redis, `job-service` returns cached JSON immediately (sub-10ms response time).
3. **Cache Miss:** If key is missing, `job-service` queries the database, sets the result into Redis with a Time-To-Live (`TTL = 60s`), and returns data to the client.

#### C. Cache Invalidation & Kafka Event Emission (`POST /api/jobs`)
1. **Write Request:** Authenticated user posts a new job listing.
2. **Database Mutation:** `job-service` saves the new record to persistent storage.
3. **Cache Invalidation:** `job-service` deletes key `jobs:all` from Redis so stale listings are never served.
4. **Asynchronous Event Publishing:** `job-service` publishes a `JOB_CREATED` payload to the `job-events` Kafka topic, allowing downstream services (e.g., search indexers, notification services) to react asynchronously.

---

## ✨ Key Technical Capabilities

| Pattern | Implementation Details |
| :--- | :--- |
| **API Gateway Pattern** | Single public entry point routing `/api/auth/*` and `/api/jobs/*` requests downstream using `express-http-proxy`. |
| **Distributed Auth & RBAC** | Stateless authorization using JWTs signed with HMAC SHA-256 and custom `authorizeRoles()` middleware. |
| **Cache-Aside Pattern** | High-speed memory caching with explicit cache invalidation (`redis.del('jobs:all')`) on write operations. |
| **Event-Driven Architecture (EDA)** | Non-blocking message producer powered by `kafkajs` streaming structured JSON domain events over Apache Kafka. |
| **Container Orchestration** | Full multi-container development environment managed via `docker-compose.yml` with dedicated networks and health-checks. |

---

## 🛠️ Microservices Ecosystem

| Service | Port | Internal URI | Primary Responsibility | Key Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **`gateway-service`** | `5000` | `http://gateway-service:5000` | API Gateway & reverse proxy. | `express`, `express-http-proxy` |
| **`auth-service`** | `5001` | `http://auth-service:5001` | User login & JWT issuance. | `express`, `jsonwebtoken`, `bcryptjs` |
| **`job-service`** | `5002` | `http://job-service:5002` | Job CRUD, Redis caching & Kafka publishing. | `express`, `ioredis`, `kafkajs`, `jsonwebtoken` |
| **`redis`** | `6379` | `redis:6379` | Distributed in-memory data store. | `redis:7-alpine` |
| **`kafka`** | `9092` | `kafka:9092` | Message broker for domain events. | `confluentinc/cp-kafka`, `zookeeper` |

---

## 📂 Repository Structure

```text
Talent-Sync-project/
├── docker-compose.yml          # Container configuration for all services
├── README.md                   # Project documentation
└── services/
    ├── gateway-service/        # Reverse proxy gateway
    │   ├── src/
    │   │   └── index.ts        # Route proxying setup
    │   ├── Dockerfile
    │   └── package.json
    ├── auth-service/           # Authentication microservice
    │   ├── src/
    │   │   └── index.ts        # Auth routes & JWT generation
    │   ├── Dockerfile
    │   └── package.json
    └── job-service/            # Job management microservice
        ├── src/
        │   ├── config/
        │   │   ├── redisClient.ts    # Redis client configuration
        │   │   └── kafkaProducer.ts  # Kafka producer client
        │   ├── middleware/
        │   │   └── auth.ts           # JWT authentication & RBAC middleware
        │   ├── routes/
        │   │   └── jobRoutes.ts      # Cache-Aside & Kafka event routes
        │   └── index.ts
        ├── Dockerfile
        └── package.json
🚀 Quickstart Guide
Prerequisites
Docker Desktop installed and running.

PowerShell, Bash, or Zsh terminal.

1. Clone & Spin Up Microservices
# Clone the repository
git clone [https://github.com/varshit123A/Talent-Sync-project.git](https://github.com/varshit123A/Talent-Sync-project.git)
cd Talent-Sync-project

# Build images and start all containers in detached mode
docker compose up --build -d

# Build images and start all containers in detached mode
docker compose up --build -d
2. Verify Container Health
Bash
docker compose ps
Ensure gateway-service, auth-service, job-service, redis, kafka, and zookeeper are all running.

🧪 API Testing Walkthrough
All requests are executed against the Gateway entry point on http://localhost:5000.

1. Authenticate & Obtain Token
Send a POST request to login and capture the issued JWT:

PowerShell
$res = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"sarah@example.com","password":"securepassword123"}'

# Extract token for subsequent requests
$token =$res.token
$headers = @{ Authorization = "Bearer $token" }
2. Demonstrate Redis Cache-Aside Pattern
Call 1: Cache Miss
Query job listings for the first time:

PowerShell
Invoke-RestMethod -Uri "http://localhost:5000/api/jobs" -Method Get
Response: { "source": "database", "data": [...] }

Behind the scenes: Fetches from database and populates Redis key jobs:all.

Call 2: Cache Hit
Query job listings again immediately:

PowerShell
Invoke-RestMethod -Uri "http://localhost:5000/api/jobs" -Method Get
Response: { "source": "cache", "data": [...] }

Behind the scenes: Served instantly from Redis in-memory storage without hitting the database.

3. Post Job (Cache Invalidation & Kafka Event)
Post a new job as an authenticated user:

PowerShell
Invoke-RestMethod -Uri "http://localhost:5000/api/jobs" `
  -Method Post `
  -Headers $headers `
  -ContentType "application/json" `
  -Body '{"title":"Lead Cloud Architect","company":"TalentSync AI","location":"Remote"}'
Observe Service Logs
Run docker compose logs -f job-service to observe the sequence:

[Cache Invalidation] Cleared Redis key: jobs:all

[job-service] Connecting to Kafka Producer...

[Kafka Event Published] Topic: job-events | Event: JOB_CREATED



                          
