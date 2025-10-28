# System Map - x402 Protocol Observatory

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     x402 Observatory                         │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │   Next.js 14   │  │  Collectors    │  │   Analyzers   │ │
│  │   Web App      │  │  (Base/Solana) │  │   (Quality)   │ │
│  │   Port: 3000   │  │  Background    │  │   Scripts     │ │
│  └────────┬───────┘  └───────┬────────┘  └───────┬───────┘ │
│           │                  │                    │          │
│           └──────────────────┼────────────────────┘          │
│                              │                               │
│                    ┌─────────▼─────────┐                    │
│                    │   Prisma ORM      │                    │
│                    └─────────┬─────────┘                    │
│                              │                               │
│           ┌──────────────────┼──────────────────┐           │
│           │                  │                  │           │
│  ┌────────▼────────┐  ┌──────▼──────┐  ┌───────▼───────┐  │
│  │  PostgreSQL 14  │  │   Redis 7   │  │  Blockchain   │  │
│  │  Port: 5432     │  │ Port: 6379  │  │   RPC APIs    │  │
│  └─────────────────┘  └─────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Services

### 1. Next.js Web Application
- **Type**: Frontend + API Routes
- **Port**: 3000
- **Technology**: Next.js 14.2.33, React 18, TypeScript 5
- **Entry Point**: `npm run dev` (development) or `npm start` (production)
- **Routes**:
  - `/` - Landing page
  - `/dashboard` - Real-time protocol dashboard
  - `/api/health` - Health check endpoint
  - `/api/protocols` - Protocol data API
  - `/api/protocols/[id]` - Individual protocol details
  - `/api/stats` - System statistics
  - `/api/monitor/status` - Monitor status check

### 2. Base Chain Collector
- **Type**: Background Service
- **Technology**: Node.js + Viem + TypeScript
- **Entry Point**: `npm run collect:base`
- **File**: `collectors/base/index.ts`
- **Function**: Monitors Base blockchain for x402 protocol deployments
- **Dependencies**:
  - Base RPC endpoint
  - PostgreSQL connection
  - Redis (optional)

### 3. Solana Chain Collector
- **Type**: Background Service
- **Technology**: Node.js + @solana/web3.js + TypeScript
- **Entry Point**: `npm run collect:solana`
- **File**: `collectors/solana/index.ts`
- **Function**: Monitors Solana blockchain for x402 protocol deployments
- **Dependencies**:
  - Solana RPC endpoint
  - PostgreSQL connection
  - Redis (optional)

### 4. Hybrid Collector
- **Type**: Background Service
- **Technology**: Combined Base + Solana + x402scan integration
- **Entry Point**: `npm run collect:hybrid`
- **File**: `collectors/hybrid/index.ts`
- **Function**: Unified collection from multiple sources
- **Dependencies**:
  - All blockchain RPC endpoints
  - x402scan.com (web scraping fallback)
  - PostgreSQL connection

### 5. Quality Analyzer
- **Type**: Batch Script
- **Technology**: Node.js + Puppeteer + TypeScript
- **Entry Point**: `npm run analyze`
- **File**: `scripts/analyze-x402-quality.ts`
- **Function**: Analyzes protocol quality from x402scan.com
- **Dependencies**:
  - Puppeteer/Chrome
  - PostgreSQL connection
  - x402scan.com access

### 6. Database Analyzer
- **Type**: Batch Script
- **Entry Point**: `npm run analyze:db`
- **File**: `scripts/analyze-database.ts`
- **Function**: Analyzes protocols in local database
- **Dependencies**: PostgreSQL connection

## Data Stores

### PostgreSQL Database
- **Version**: 14+
- **Port**: 5432 (default)
- **Connection**: Via DATABASE_URL environment variable
- **Schema**: Managed by Prisma
- **Models**:
  - `Protocol` - Main protocol tracking
  - `Transaction` - Transaction history
  - `Interaction` - User interaction tracking
  - `ProtocolAnalytics` - Aggregated metrics
  - `SystemStats` - System-wide statistics
  - `ResearchExport` - Export datasets
  - `Webhook` - Webhook subscriptions

### Redis Cache (Optional)
- **Version**: 7+
- **Port**: 6379 (default)
- **Connection**: Via REDIS_URL environment variable
- **Purpose**: Performance optimization and rate limiting

## External Dependencies

### Blockchain RPC Endpoints
1. **Base Network**
   - RPC: `https://mainnet.base.org`
   - WebSocket: `wss://mainnet.base.org`
   - Library: Viem v2.21.45

2. **Solana Network**
   - RPC: `https://api.mainnet-beta.solana.com`
   - Enhanced: Helius API (optional)
   - Library: @solana/web3.js v1.95.8

### Data Sources
- **x402scan.com**: Protocol discovery and quality analysis
  - API endpoints (if available)
  - Web scraping fallback (Cheerio + Axios)
  - Rate limited: 2 seconds between requests

## Environment Variables

### Required
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/x402observatory"
```

### Optional but Recommended
```bash
REDIS_URL="redis://localhost:6379"
BASE_RPC_URL="https://mainnet.base.org"
BASE_WS_URL="wss://mainnet.base.org"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
```

### Configuration
```bash
NODE_ENV="development"
PORT="3000"
LOG_LEVEL="info"
ENABLE_HISTORICAL_SYNC="true"
DATA_RETENTION_DAYS="90"
ANALYSIS_INTERVAL_MS="60000"
```

## Docker Compose Services

When using Docker Compose (`docker compose up -d`):

### postgres
- **Image**: postgres:14-alpine
- **Container**: x402-postgres
- **Port**: 5432:5432
- **Credentials**: x402user / x402password
- **Database**: x402observatory
- **Health Check**: `pg_isready -U x402user`

### redis
- **Image**: redis:7-alpine
- **Container**: x402-redis
- **Port**: 6379:6379
- **Health Check**: `redis-cli ping`

### app
- **Build**: Dockerfile (Next.js app)
- **Container**: x402-app
- **Port**: 3000:3000
- **Depends On**: postgres, redis

### collector-base
- **Build**: Dockerfile.collector
- **Container**: x402-collector-base
- **Depends On**: postgres, redis
- **Environment**: CHAIN=base

### collector-solana
- **Build**: Dockerfile.collector
- **Container**: x402-collector-solana
- **Depends On**: postgres, redis
- **Environment**: CHAIN=solana

## Start Order

### Without Docker (Manual)
1. Start PostgreSQL (external or local)
2. Start Redis (optional, for caching)
3. Run `npm install`
4. Run `npx prisma generate`
5. Run `npx prisma db push` (first time)
6. Start Next.js app: `npm run dev`
7. Start collectors (separate terminals):
   - `npm run collect:base`
   - `npm run collect:solana`
   - OR `npm run collect:hybrid`

### With Docker Compose
1. `docker compose up -d` (starts all services)
2. Services start in dependency order automatically
3. View logs: `docker compose logs -f`

## Health Checks

### Application Health
```bash
curl http://localhost:3000/api/health
```

### Monitor Status
```bash
curl http://localhost:3000/api/monitor/status
```

### Database Connection
```bash
npx prisma studio
```

### Redis (if running)
```bash
redis-cli ping
```

## File Structure

```
x402-observatory/
├── app/                      # Next.js application
│   ├── api/                  # REST API endpoints
│   │   ├── health/          # Health check
│   │   ├── protocols/       # Protocol data
│   │   ├── stats/           # Statistics
│   │   └── monitor/         # Monitor status
│   ├── dashboard/           # Dashboard page
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── collectors/              # Blockchain collectors
│   ├── base/               # Base chain collector
│   ├── solana/             # Solana collector
│   └── hybrid/             # Unified collector
├── lib/                    # Shared libraries
│   ├── blockchain/         # Chain interaction
│   │   ├── base.ts        # Base client
│   │   └── solana.ts      # Solana client
│   ├── database/          # Database access
│   │   └── client.ts      # Prisma client
│   ├── monitors/          # Monitor services
│   │   ├── base-monitor.ts
│   │   └── solana-monitor.ts
│   └── services/          # Business logic
│       ├── x402scan-client.ts
│       ├── hybrid-monitor.ts
│       └── contract-discovery.ts
├── prisma/                # Database schema
│   └── schema.prisma      # Prisma models
├── scripts/               # Utility scripts
│   ├── analyze-x402-quality.ts
│   ├── analyze-database.ts
│   └── verify-setup.ts
├── docker-compose.yml     # Docker services
├── Dockerfile             # Next.js image
├── Dockerfile.collector   # Collector image
└── package.json          # Dependencies
```

## Network Topology

```
Internet
   │
   ├─── Base RPC (mainnet.base.org)
   ├─── Solana RPC (api.mainnet-beta.solana.com)
   └─── x402scan.com
         │
         ▼
   ┌────────────────┐
   │  Collectors    │
   │  (Base/Solana) │
   └────────┬───────┘
            │
            ▼
   ┌────────────────┐
   │  PostgreSQL DB │
   │  + Redis Cache │
   └────────┬───────┘
            │
            ▼
   ┌────────────────┐
   │  Next.js API   │
   │  Port: 3000    │
   └────────┬───────┘
            │
            ▼
   ┌────────────────┐
   │  User Browser  │
   │  Dashboard     │
   └────────────────┘
```

## Resource Requirements

### Development
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 10GB for database and logs
- **Node.js**: v20.0.0 or higher
- **Network**: Stable connection for RPC calls

### Production
- **CPU**: 4+ cores
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 50GB+ for long-term data retention
- **Database**: PostgreSQL 14+ with proper indexing
- **Redis**: 2GB RAM allocation recommended
