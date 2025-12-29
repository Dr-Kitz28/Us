# Next-Gen Dating App - Production-Ready Implementation

A research-backed, production-grade dating application built with Next.js 14, featuring advanced matching algorithms, comprehensive security, and India-first design principles.

## 🚀 Core Features

### Advanced Matching Algorithm (RSBM)
- **Reciprocal Stable-Bandit Matching** combining Gale-Shapley stable matching with Thompson Sampling
- Research-backed approach with hard gates, preference modeling, and fairness controls
- Collaborative filtering for personalized recommendations
- 6-step methodology: Hard Gates → Preference Model → Reciprocal Scoring → Stable Matching → Exploration → Fairness

### Production Infrastructure
- **Kubernetes-ready** with HPA (3-20 pod autoscaling), health checks, rolling updates
- **Docker Compose** with 11 services: PostgreSQL, Redis, Kafka, OpenSearch, Prometheus, Grafana, Jaeger, MinIO, Nginx
- **Redis caching layer** with dating-specific helpers (feed caching, rate limiting, distributed locks)
- **Observability** with structured logging, distributed tracing, Prometheus metrics

### Security & Trust
- **Cryptography layer**: AES-256-GCM envelope encryption, HMAC-SHA256, bcrypt, JWT
- **Trust & Safety**: Comprehensive reporting system, moderation queue, auto-enforcement
- **PII protection**: Automatic redaction in logs, secure token storage, field-level encryption

### India-First Design
- Optimized for 2G/3G networks with graceful degradation
- Low-end Android support (API 21+, tested on Redmi 9A/Galaxy A10)
- Regional language support (8+ Indian languages)
- Gen-Z focused UI with authenticity-first features

## 📁 Project Structure

```
/app                     # Next.js 14 app router
	/api                   # API routes (auth, recommendations, matches, messages, etc.)
	/app/feed              # Main discovery feed with swipeable cards
	/app/matches           # Matches and conversations
	/admin                 # Admin dashboard with golden ratio testing
/components              # React components (SwipeableCard, UI primitives)
/lib
	/rsbm                  # Reciprocal Stable-Bandit Matching engine
	/cache                 # Redis caching with dating-specific helpers
	/security              # Cryptography, encryption, JWT, token management
	/safety                # Trust & Safety (reporting, moderation, blocking)
	/observability         # Structured logging, tracing, metrics, health checks
	/design                # Design tokens (India-first, Gen-Z palette)
/prisma                  # Database schema and migrations
/k8s                     # Kubernetes manifests (deployment, HPA, ingress, config)
/docs                    # Comprehensive documentation (mobile strategy, research)
```

## 🏃 Quick Start

### Local Development (Windows PowerShell)

**1. Install dependencies**
```powershell
npm install
```

**2. Set up environment variables**
```powershell
# Copy .env.example to .env and configure
cp .env.example .env
```

**3. Generate Prisma client and push schema**
```powershell
npm run prisma:generate
npx prisma db push
```

**4. Seed database (optional)**
```powershell
npm run seed
```

**5. Run development server**
```powershell
npm run dev
# Opens at http://localhost:3000
```

### Docker Compose (Production-like)

```powershell
# Start all services (PostgreSQL, Redis, Kafka, Prometheus, Grafana, etc.)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

### Kubernetes Deployment

```powershell
# Create namespace and deploy
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/config.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n dating-app
kubectl get hpa -n dating-app

# View logs
kubectl logs -f deployment/dating-app -n dating-app
```

## 🧠 Research-Backed Features

### Matching Algorithm
- **Hard Gates**: Safety blocks, age/distance/gender filters, dealbreakers
- **Preference Model**: Matrix factorization + collaborative filtering
- **Reciprocal Scoring**: p_like(u→v) * p_like(v→u) * multipliers
- **Stable Matching**: Gale-Shapley on top-K candidates
- **Exploration**: Thompson Sampling (10% budget for new profiles)
- **Fairness**: Prevent "rich get richer" dynamics, ensure diversity

### Behavioral Tracking
- Dopamine reward system studies (LSE research)
- Variable reward schedules (70% optimal rate)
- Burnout prevention with mindfulness interventions
- Authenticity features for Gen-Z preferences

### Profile Quality
- Photo importance (University of Amsterdam: 10x impact)
- Prompt quality scoring
- Completeness analysis

## 🔒 Security Features

### Encryption
- **Field encryption**: AES-256-GCM with envelope encryption (KEK wraps DEK)
- **Hashing**: HMAC-SHA256 for phone/email lookup indexes
- **Passwords**: bcrypt with 12 rounds
- **JWT tokens**: Access (15min) + Refresh (7d) with issuer/audience validation

### Trust & Safety
- 9 report categories (harassment, fake profile, scam, etc.)
- 4-tier priority (critical/high/medium/low)
- Auto-enforcement for critical reports
- Strike system: 3 strikes = 7-day suspension
- Content moderation (toxicity, scam patterns, off-platform solicitation)

### PII Protection
- Automatic redaction in logs (phone: +91******1234, email: j***n@domain.com)
- No sensitive data in error messages
- Secure token storage (FlutterSecureStorage on mobile)

## 📊 Observability

### Logging
- **Structured JSON logs** with automatic PII redaction
- Log levels: error, warn, info, debug
- Request context propagation (requestId, traceId, sessionId)

### Tracing
- **Distributed tracing** with OpenTelemetry-style spans
- Trace ID propagation across services
- Parent-child span relationships

### Metrics
- **Prometheus format** with counters, gauges, histograms
- RED metrics: Rate, Errors, Duration (p50/p95/p99)
- Custom metrics: swipes, matches, messages

### Health Checks
- Database connectivity
- Redis connectivity
- Service-level health status

## 📱 Mobile Strategy

Comprehensive guide in [docs/MOBILE_STRATEGY.md](docs/MOBILE_STRATEGY.md)

### Recommended Stack
- **Flutter** for India-first performance on low-end Android
- **Clean Architecture** (Presentation/Domain/Data layers)
- **Riverpod 2.x** for state management
- **Dio** with retry interceptor for networking
- **Drift** for local SQLite storage

### Performance Budgets
- Cold start: < 2.5s on mid-range Android
- Feed render: p95 < 800ms on 4G
- Memory: < 150MB foreground
- APK size: < 50MB

## 🛠️ Technology Stack

### Core
- **Next.js 14.2.4** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript 5.5.4** - Type safety
- **Prisma 5.16.1** - ORM for PostgreSQL
- **NextAuth 4.24.7** - Authentication

### Infrastructure
- **PostgreSQL 16** - Relational database
- **Redis 7** - Caching and session storage
- **Kafka** - Event streaming
- **OpenSearch 2** - Search and analytics
- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **Jaeger** - Distributed tracing
- **MinIO** - Object storage (S3-compatible)
- **Nginx** - Reverse proxy and load balancer

### Libraries
- **Framer Motion 11.0.5** - Animations (swipe gestures)
- **Zustand 4.5.4** - State management
- **Zod 3.22.4** - Schema validation
- **IORedis 5.3.2** - Redis client
- **KafkaJS 2.2.4** - Kafka client
- **jsonwebtoken 9.0.2** - JWT handling

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth routes (login, callback, session)

### Discovery
- `GET /api/recommendations` - Basic recommendations
- `GET /api/enhanced-recommendations` - RSBM-powered recommendations
- `GET /api/golden-ratio` - Golden ratio based matching

### Interactions
- `POST /api/likes` - Like a profile
- `POST /api/passes` - Pass on a profile
- `GET /api/liked-users` - Get users you've liked
- `GET /api/swipe-history` - View swipe history

### Matches & Messaging
- `GET /api/matches` - Get all matches
- `GET /api/user-matches` - Get matches for user
- `GET /api/messages` - Get messages for a match
- `POST /api/messages` - Send a message

### Admin
- `GET /api/health` - Health check endpoint
- `GET /api/flags` - Feature flags
- `POST /api/seed` - Seed database (dev only)

## 🎨 Design System

India-first design tokens in [lib/design/tokens.ts](lib/design/tokens.ts)

### Color Palette (Gen-Z Focused)
- **Primary**: Vibrant coral (#FF6B6B)
- **Secondary**: Electric blue (#4ECDC4)
- **Accent**: Sunset orange (#FFE66D)
- **Semantic**: Success, warning, error variants

### Typography
- **Display**: For hero sections (48-96px)
- **Heading**: H1-H6 (16-40px)
- **Body**: Regular, small, micro (12-16px)

### Motion
- **Snappy**: 150ms for micro-interactions
- **Smooth**: 300ms for standard transitions
- **Dramatic**: 500ms for page transitions
- **Swipe gesture**: Custom spring physics

## 📚 Documentation

- [MOBILE_STRATEGY.md](docs/MOBILE_STRATEGY.md) - Comprehensive mobile implementation guide
- [RESEARCH_IMPLEMENTATION_COMPLETE.md](RESEARCH_IMPLEMENTATION_COMPLETE.md) - Research-backed features
- [GOLDEN_RATIO_IMPLEMENTATION_COMPLETE.md](GOLDEN_RATIO_IMPLEMENTATION_COMPLETE.md) - Golden ratio matching

## 🧪 Testing

```powershell
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests (Playwright)
npm run test:e2e
```

## 🚢 Deployment

### Environment Variables

Required variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dating_app"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_ISSUER="dating-app"
JWT_AUDIENCE="dating-app-users"

# Encryption
MASTER_ENCRYPTION_KEY="your-master-key-here"

# Feature Flags
FEATURE_RSBM_MATCHING="true"
FEATURE_GOLDEN_RATIO="true"
FEATURE_VOICE_PROMPTS="false"
```

### Production Checklist

- [ ] Set all environment variables
- [ ] Configure PostgreSQL with connection pooling
- [ ] Set up Redis cluster for high availability
- [ ] Configure Kafka topics and partitions
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting (100 req/min, 20 rps)
- [ ] Enable CORS for allowed origins
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure distributed tracing (Jaeger)
- [ ] Set up error tracking (Sentry or similar)
- [ ] Configure backup strategy (database + Redis)
- [ ] Set up CI/CD pipeline
- [ ] Configure HPA (3-20 pods based on CPU/memory)
- [ ] Set resource limits (CPU: 1 core, Memory: 2Gi)
- [ ] Configure health check endpoints
- [ ] Set up log aggregation (ELK or CloudWatch)
- [ ] Enable security headers (CSP, HSTS, X-Frame-Options)
- [ ] Configure content moderation (manual + automated)
- [ ] Set up incident response procedures
- [ ] Configure data retention policies
- [ ] Set up GDPR compliance measures

## 🤝 Contributing

1. Follow Clean Architecture principles
2. Write tests for new features
3. Use TypeScript strictly (no `any` types)
4. Follow existing code style (Prettier + ESLint)
5. Update documentation for new features
6. Ensure all health checks pass
7. Add feature flags for experimental features

## 📄 License

MIT

## 🙏 Acknowledgments

Research citations and academic papers referenced in development:
- LSE dopamine reward system studies
- University of Amsterdam photo importance research
- Pronk & Denissen choice overload studies
- OKCupid data insights on messaging
- Stable marriage algorithm (Gale-Shapley)
- Multi-armed bandit algorithms (Thompson Sampling)
- Dating app burnout and wellness intervention studies
- Gen-Z authenticity preference research

---

**Built with ❤️ for the next generation of meaningful connections**
