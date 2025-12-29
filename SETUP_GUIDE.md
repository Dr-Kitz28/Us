# Docker & Kubernetes Setup Guide

## Prerequisites

### For Docker Compose
1. **Install Docker Desktop for Windows**
   - Download from: https://www.docker.com/products/docker-desktop
   - Enable WSL 2 backend during installation
   - Start Docker Desktop (system tray icon)
   - Verify: `docker --version` and `docker-compose --version`

### For Kubernetes
Choose ONE of these options:

#### Option 1: Docker Desktop Kubernetes (Recommended for Windows)
1. Open Docker Desktop
2. Settings → Kubernetes → Enable Kubernetes
3. Wait for "Kubernetes is running" status
4. Verify: `kubectl version --client`

#### Option 2: Minikube
```powershell
# Install with Chocolatey
choco install minikube

# Start cluster
minikube start --driver=docker

# Verify
kubectl get nodes
```

#### Option 3: Kind (Kubernetes in Docker)
```powershell
# Install with Chocolatey
choco install kind

# Create cluster
kind create cluster --name dating-app

# Verify
kubectl cluster-info
```

## Current Issues & Solutions

### Issue 1: Docker Desktop Not Running
**Error**: `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`

**Solution**:
1. Open Docker Desktop from Start menu
2. Wait for "Docker Desktop is running" notification
3. Verify with: `docker ps`
4. Then retry: `docker-compose up -d`

### Issue 2: Kubernetes Cluster Not Configured
**Error**: `dial tcp [::1]:8080: connectex: No connection could be made`

**Solution**:
1. Enable Kubernetes in Docker Desktop (see prerequisites)
2. OR start Minikube: `minikube start`
3. Verify cluster: `kubectl cluster-info`
4. Then retry: `kubectl apply -f k8s/`

### Issue 3: Missing npm Scripts
**Status**: ✅ **FIXED** - Added `seed` and `test` scripts to package.json

## Quick Start Commands

### Local Development (No Docker/K8s)
```powershell
# Terminal 1 - Start Next.js dev server
npm run dev

# Terminal 2 - Run Prisma Studio (optional)
npm run prisma:studio
```

**Access**: http://localhost:3000

### Docker Compose (With All Services)

```powershell
# Start Docker Desktop first!

# Terminal 1 - Start all services in background
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app

# Stop services
docker-compose stop

# Remove everything
docker-compose down -v
```

**Services Started**:
- App: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
- Jaeger: http://localhost:16686

### Kubernetes (Production-like)

```powershell
# Enable K8s in Docker Desktop first!

# Terminal 1 - Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/config.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment
kubectl get pods -n dating-app
kubectl get svc -n dating-app
kubectl get hpa -n dating-app

# Port forward to access locally
kubectl port-forward -n dating-app deployment/dating-app 3000:3000

# View logs
kubectl logs -f -n dating-app deployment/dating-app

# Delete everything
kubectl delete namespace dating-app
```

## Troubleshooting

### Docker Compose Issues

1. **"version is obsolete" warning** - Safe to ignore, or remove `version:` line from docker-compose.yml

2. **Port already in use**
   ```powershell
   # Find process using port 3000
   netstat -ano | findstr :3000
   
   # Kill process (replace PID)
   taskkill /PID <PID> /F
   ```

3. **Out of disk space**
   ```powershell
   # Clean up Docker
   docker system prune -a --volumes
   ```

### Kubernetes Issues

1. **Context not set**
   ```powershell
   # List contexts
   kubectl config get-contexts
   
   # Set context
   kubectl config use-context docker-desktop
   # OR for minikube
   kubectl config use-context minikube
   ```

2. **Namespace doesn't exist**
   ```powershell
   # Create namespace first
   kubectl create namespace dating-app
   ```

3. **Image pull errors**
   ```powershell
   # Build and load image (for local K8s)
   docker build -t dating-app:latest .
   
   # For minikube
   minikube image load dating-app:latest
   
   # For kind
   kind load docker-image dating-app:latest --name dating-app
   ```

## Recommended Development Workflow

### Option A: Local Only (Fastest for Development)
```powershell
# Terminal 1
npm run dev

# Terminal 2 (optional - if you need database UI)
npm run prisma:studio
```

**Pros**: Fast, no Docker overhead, instant hot reload
**Cons**: No Redis, Kafka, Prometheus (use SQLite as DB)

### Option B: Docker Compose (Best for Testing Full Stack)
```powershell
# Terminal 1 - Start infrastructure
docker-compose up -d postgres redis

# Terminal 2 - Run app locally (connects to Docker services)
npm run dev
```

**Pros**: Real infrastructure, still fast hot reload
**Cons**: Requires Docker Desktop running

### Option C: Full Docker Compose (Production-like)
```powershell
docker-compose up -d
docker-compose logs -f app
```

**Pros**: Exactly like production, all services running
**Cons**: Slower hot reload, rebuilds needed for code changes

### Option D: Kubernetes (For Scale Testing)
```powershell
# Build image
docker build -t dating-app:latest .

# Deploy
kubectl apply -f k8s/

# Port forward
kubectl port-forward -n dating-app deployment/dating-app 3000:3000
```

**Pros**: Test autoscaling, rolling updates, production config
**Cons**: Slowest iteration, complex debugging

## Environment Variables

Create `.env` file (already exists):
```env
# For local dev (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# For Docker (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/dating_app"

# Redis (optional for local, required for Docker)
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Feature Flags
FEATURE_RSBM_MATCHING="true"
FEATURE_GOLDEN_RATIO="true"
```

## Next Steps

1. ✅ **Fixed npm scripts** - `npm test` and `npm run seed` now work
2. ✅ **Added safety tables** - Run `npx prisma db push` to update schema
3. ✅ **Created safety API endpoints** - `/api/safety/report` and `/api/admin/moderation`
4. ✅ **Integrated RSBM** - Enhanced recommendations now use RSBM algorithm
5. ⏳ **Start Docker Desktop** - Required for Docker Compose and K8s
6. ⏳ **Run database migrations** - `npx prisma db push`
7. ⏳ **Add unit tests** - Create test files in `__tests__/` directories

## Testing the Setup

### 1. Test Local Development
```powershell
npm run dev
# Open http://localhost:3000
```

### 2. Test Safety API (after server starts)
```powershell
# Submit a report (requires authentication)
curl -X POST http://localhost:3000/api/safety/report `
  -H "Content-Type: application/json" `
  -d '{"reportedUserId":"user123","category":"harassment","reason":"Inappropriate messages"}'
```

### 3. Test RSBM Recommendations
```powershell
# Get recommendations (requires authentication)
curl http://localhost:3000/api/enhanced-recommendations
```

## Summary

- ✅ **Local dev works** - Next.js server running on Terminal 3
- ⚠️ **Docker requires Docker Desktop** - Not currently running
- ⚠️ **K8s requires cluster** - Not currently configured
- ✅ **Database works** - SQLite in sync
- ✅ **Safety features added** - New API endpoints + schema tables
- ✅ **RSBM integrated** - Feature flag enabled

**Recommendation**: Continue with local development (Option A) until you need full infrastructure testing.
