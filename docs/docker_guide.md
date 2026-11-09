# Docker & Containerization Deployment Guide

## 1. Overview
The Smart Document Classification System provides production-ready container definitions:
- **Backend**: Python 3.12-slim multi-stage image with a dedicated non-root user and health probes.
- **Frontend**: Multi-stage Node 20 build served via Nginx Alpine with built-in reverse proxy and SPA routing.
- **Database**: Official MongoDB 8.0 image with persistent volume storage.
- **Orchestration**: `docker-compose.yml` linking all three containers in a private network.

---

## 2. Docker Architecture & Port Mapping

| Service | Container Name | Host Port | Internal Port | Persistent Volume |
| :--- | :--- | :--- | :--- | :--- |
| **MongoDB** | `smart-doc-mongodb` | `27017` | `27017` | `mongodb_data` |
| **Backend** | `smart-doc-backend` | `8000` | `8000` | `document_uploads`, `model_artifacts` |
| **Frontend** | `smart-doc-frontend` | `3000` | `80` | None (Stateless) |

---

## 3. Running with Docker Compose

### Prerequisites
- Docker Engine & Docker Compose installed.

### Step 1: Build & Launch Services
```bash
docker-compose up --build -d
```

### Step 2: Check Container Status
```bash
docker-compose ps
```

### Step 3: Stream Logs
```bash
# View all logs
docker-compose logs -f

# View only backend logs
docker-compose logs -f backend
```

### Step 4: Access Application
- **Frontend Dashboard**: Open [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation**: Open [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **Health Check**: Open [http://localhost:8000/health](http://localhost:8000/health)

### Step 5: Stop Services
```bash
docker-compose down
```
To also remove volumes (Warning: resets database):
```bash
docker-compose down -v
```

