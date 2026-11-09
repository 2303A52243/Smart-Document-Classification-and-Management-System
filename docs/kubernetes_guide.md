# Kubernetes Local & Production Deployment Guide

## 1. Overview
The `k8s/` directory contains declarative YAML manifests for deploying the system onto Kubernetes clusters (Minikube, Docker Desktop Kubernetes, Kind, or managed cloud clusters like GKE, EKS, AKS).

---

## 2. Manifest Inventory

| Manifest | Kind | Purpose |
| :--- | :--- | :--- |
| `configmap.yaml` | `ConfigMap` | Non-sensitive runtime variables (timeouts, thresholds, CORS). |
| `secret-template.yaml` | `Secret` | Credentials (`JWT_SECRET_KEY`, `MONGODB_URL`). |
| `pvc.yaml` | `PersistentVolumeClaim` | 5Gi volume requests for uploads and MongoDB data. |
| `mongodb.yaml` | `Deployment`, `Service` | Standalone MongoDB pod with ClusterIP service. |
| `backend.yaml` | `Deployment`, `Service` | FastAPI backend with liveness/readiness probes and volume mount. |
| `frontend.yaml` | `Deployment`, `Service` | Nginx frontend served via NodePort `30080`. |
| `ingress.yaml` | `Ingress` | Nginx Ingress Controller routing rules for `smartdoc.local`. |

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Ensure Cluster is Running
```bash
# Minikube
minikube status

# Or Docker Desktop Kubernetes
kubectl cluster-info
```

### Step 2: Build Images (or point to registry)
```bash
# If using Minikube, point your terminal to Minikube's Docker daemon:
minikube docker-env | Invoke-Expression   # PowerShell
# or: eval $(minikube docker-env)         # Bash

# Build images locally
docker build -t smart-doc-backend:latest ./backend
docker build -t smart-doc-frontend:latest ./frontend
```

### Step 3: Apply Persistent Storage & Secrets
```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret-template.yaml
kubectl apply -f k8s/pvc.yaml
```

### Step 4: Deploy MongoDB Database
```bash
kubectl apply -f k8s/mongodb.yaml
kubectl rollout status deployment/mongodb-deployment
```

### Step 5: Deploy Backend & Frontend
```bash
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl rollout status deployment/backend-deployment
kubectl rollout status deployment/frontend-deployment
```

### Step 6: Verify Pods & Services
```bash
kubectl get pods -l app=smart-doc
kubectl get services -l app=smart-doc
```

### Step 7: Access the Application
- **NodePort Access**: If using Minikube:
  ```bash
  minikube service frontend-service
  ```
  On Docker Desktop Kubernetes: Open [http://localhost:30080](http://localhost:30080).
- **Ingress Access** (if ingress controller is enabled):
  Add `127.0.0.1 smartdoc.local` to your hosts file and open `http://smartdoc.local`.

---

## 4. Troubleshooting & Clean Up

### Inspecting Pod Logs
```bash
kubectl logs -l component=backend --tail=50
```

### Tear Down
```bash
kubectl delete -f k8s/
```

