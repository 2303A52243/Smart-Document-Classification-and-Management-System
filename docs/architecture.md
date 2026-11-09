# System Architecture Specification

## 1. High-Level Architecture Diagram

```mermaid
graph TB
    subgraph Client Tier
        UI[React 18 SPA + Vite]
        Tailwind[Tailwind CSS v4]
        Recharts[Recharts Analytics]
    end

    subgraph API Tier - FastAPI
        AuthRouter["/api/auth (JWT + Bcrypt)"]
        DocRouter["/api/documents (CRUD + Ingestion)"]
        CatRouter["/api/categories"]
        AnalyticsRouter["/api/analytics (Metrics & Logs)"]
        HealthRouter["/health"]
    end

    subgraph NLP & Processing Engine
        Extractor["Document Extractor (PyMuPDF / docx / txt)"]
        Preprocessor["Text Preprocessor (Unicode NFKD, Regex)"]
        Vectorizer["TF-IDF Vectorizer (1-2 ngrams, 30k max)"]
        Classifier["Calibrated LinearSVC (Platt Sigmoid Scaling)"]
    end

    subgraph Persistence Tier
        MongoDB[(MongoDB 8.2 Database)]
        StorageVault["Local Secure Disk Storage (/uploads)"]
        ModelArtifacts["Serialized Models (/models/*.joblib)"]
    end

    UI -->|REST over HTTP/JSON| API Tier - FastAPI
    DocRouter --> Extractor
    Extractor --> Preprocessor
    Preprocessor --> Vectorizer
    Vectorizer --> Classifier
    DocRouter --> StorageVault
    API Tier - FastAPI --> MongoDB
    Classifier --> ModelArtifacts
```

## 2. Component Descriptions

### Client Tier (Frontend)
- Built on React 18, Vite, and React Router.
- Uses Axios with global interceptors to attach bearer tokens and handle session expiration.
- Dynamic data rendering with Recharts components (PieChart, BarChart, AreaChart).
- Responsive grid and flexbox design providing desktop, tablet, and mobile views.

### API Gateway Tier (FastAPI)
- Exposes RESTful endpoints conforming to OpenAPI 3.0 standards.
- Enforces user tenancy isolation: users query documents filtered by `user_id == current_user._id`.
- Implements comprehensive error handling with standard HTTP status codes (`200`, `201`, `400`, `401`, `404`, `500`, `503`).

### NLP Pipeline Tier
- Preprocessing cleans text identically during model training and real-time inference.
- Calibrated probability estimates map uncalibrated SVM margins into confidence percentages.
- Conservative threshold policies detect ambiguous text and flag records for human review.

### Persistence Tier
- **MongoDB**: Stores structured document records, user accounts, and activity telemetry.
- **Local Storage Vault**: Stores original files under randomized UUID names.
- **Model Storage**: Stores serialized joblib pipelines and evaluation metric JSON reports.
