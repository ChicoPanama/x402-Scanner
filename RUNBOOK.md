# x402 Observatory Runbook

**One-page quickstart to get running in <5 minutes**

## Prerequisites

- Node.js 20.0+ (`node -v`)
- PostgreSQL 14+ running
- (Optional) Redis 7+ for caching
- (Optional) Docker + Docker Compose

## Option 1: Quick Start (Local)

### 1. Install & Configure (2 min)
```bash
# Clone and enter
cd x402-Observatory

# Install dependencies
PUPPETEER_SKIP_DOWNLOAD=true npm install

# Setup environment
cp .env.example .env

# Edit .env - REQUIRED: Set your DATABASE_URL
# nano .env
```

**Minimal .env for development:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/x402observatory"
```

### 2. Initialize Database (1 min)
```bash
# Generate Prisma client & push schema
npx prisma generate
npx prisma db push
```

### 3. Verify Setup (30 sec)
```bash
npm run verify
```

### 4. Run Application (1 min)
```bash
# Terminal 1: Start web app
npm run dev

# Terminal 2: Start data collector
npm run collect:hybrid
```

### 5. Access Dashboard
Open browser: **http://localhost:3000/dashboard**

---

## Option 2: Docker Compose (Fastest)

```bash
# Start everything (database, redis, app, collectors)
docker compose up -d

# View logs
docker compose logs -f

# Access dashboard
# http://localhost:3000/dashboard
```

**Stop services:**
```bash
docker compose down
```

---

## Core Commands

### Development
```bash
npm run dev              # Start Next.js dev server (port 3000)
npm run build            # Build for production
npm start                # Run production build
```

### Data Collection
```bash
npm run collect:base     # Monitor Base blockchain
npm run collect:solana   # Monitor Solana blockchain
npm run collect:hybrid   # Combined collector (recommended)
```

### Analysis
```bash
npm run analyze          # Analyze from x402scan.com
npm run analyze:db       # Analyze local database
```

### Code Quality
```bash
npm run lint             # ESLint check
npx tsc --noEmit        # TypeScript check
npm test                 # Run tests
```

### Database
```bash
npx prisma studio        # Visual database browser
npx prisma generate      # Regenerate Prisma client
npx prisma db push       # Push schema changes
```

---

## API Endpoints

### Health & Status
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/monitor/status
```

### Data Access
```bash
# List protocols
curl http://localhost:3000/api/protocols?limit=10

# Filter by chain
curl http://localhost:3000/api/protocols?chain=BASE

# Get statistics
curl http://localhost:3000/api/stats

# Specific protocol
curl http://localhost:3000/api/protocols/{id}
```

---

## Common Issues & Fixes

### Issue: Port 3000 already in use
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Issue: Cannot connect to database
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U user -d x402observatory

# Check .env has correct DATABASE_URL
cat .env | grep DATABASE_URL
```

### Issue: Prisma Client not generated
```bash
# Regenerate
npx prisma generate

# If still fails, clean and reinstall
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

### Issue: TypeScript errors
```bash
# Check errors
npx tsc --noEmit

# Rebuild
npm run build
```

### Issue: ESLint warnings
```bash
# Check issues
npm run lint

# Auto-fix (be careful)
npm run lint -- --fix
```

---

## Environment Variables Reference

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/db` |

### Optional but Recommended
| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis cache | `redis://localhost:6379` |
| `BASE_RPC_URL` | Base RPC endpoint | `https://mainnet.base.org` |
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `PORT` | Web server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |

### Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_HISTORICAL_SYNC` | Sync historical data | `true` |
| `DATA_RETENTION_DAYS` | Keep data for N days | `90` |
| `ANALYSIS_INTERVAL_MS` | Analysis frequency | `60000` (1 min) |
| `X402SCAN_URL` | x402scan.com URL | `https://www.x402scan.com` |

---

## Project Structure (Key Files)

```
x402-observatory/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard page
│   └── layout.tsx        # Root layout
├── collectors/
│   ├── base/            # Base collector
│   ├── solana/          # Solana collector
│   └── hybrid/          # Unified collector
├── lib/
│   ├── blockchain/      # Chain clients
│   ├── database/        # Prisma client
│   └── services/        # Business logic
├── scripts/
│   ├── analyze-x402-quality.ts  # Quality analyzer
│   └── verify-setup.ts          # Setup verification
├── prisma/
│   └── schema.prisma    # Database schema
├── .env                 # Your environment config
├── package.json         # Dependencies
└── docker-compose.yml   # Docker setup
```

---

## Monitoring & Logs

### Application Logs
```bash
# Development mode (logs to console)
npm run dev

# Production mode (structured logs)
npm start | pino-pretty
```

### Collector Logs
```bash
# Watch collector output
npm run collect:hybrid

# Or with log file
npm run collect:hybrid 2>&1 | tee collector.log
```

### Database Activity
```bash
# Open Prisma Studio
npx prisma studio

# Or query directly
psql -U user -d x402observatory -c "SELECT COUNT(*) FROM \"Protocol\";"
```

---

## Performance Tips

1. **Enable Redis** for faster API responses:
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

2. **Use hybrid collector** instead of individual collectors:
   ```bash
   npm run collect:hybrid  # More efficient
   ```

3. **Set reasonable intervals** in .env:
   ```bash
   ANALYSIS_INTERVAL_MS="300000"  # 5 minutes instead of 1
   ```

4. **Limit data retention**:
   ```bash
   DATA_RETENTION_DAYS="30"  # Keep less historical data
   ```

---

## Backup & Recovery

### Backup Database
```bash
pg_dump -U user x402observatory > backup.sql
```

### Restore Database
```bash
psql -U user -d x402observatory < backup.sql
```

### Export Research Data
```bash
# Use the built-in export API
curl http://localhost:3000/api/research/export > data.json
```

---

## Getting Help

1. **Check logs** first (most issues show up here)
2. **Run verify script**: `npm run verify`
3. **Check environment**: `cat .env`
4. **Test database**: `npx prisma studio`
5. **View full docs**: See README.md, GETTING-STARTED.md

**Common Error Patterns:**
- "Cannot find module" → Run `npm install`
- "Prisma Client not generated" → Run `npx prisma generate`
- "Port already in use" → Change PORT or kill process
- "Database connection failed" → Check DATABASE_URL

---

## Quick Health Check

Run this to verify everything is working:

```bash
# 1. Check Node.js
node -v  # Should be 20.0+

# 2. Install dependencies
PUPPETEER_SKIP_DOWNLOAD=true npm install

# 3. Check TypeScript
npx tsc --noEmit  # Should show no errors

# 4. Check ESLint
npm run lint  # Should be clean

# 5. Verify setup
npm run verify

# 6. Start app
npm run dev

# 7. Test API
curl http://localhost:3000/api/health
```

If all checks pass ✅ → You're ready to go!

---

## Next Steps

Once running:
1. Visit **http://localhost:3000** for landing page
2. Visit **http://localhost:3000/dashboard** for real-time data
3. Start collectors: `npm run collect:hybrid`
4. Run analysis: `npm run analyze:db`
5. Explore API: `curl http://localhost:3000/api/protocols`

For detailed guides, see:
- **GETTING-STARTED.md** - Full setup walkthrough
- **README.md** - Complete documentation
- **RESEARCH.md** - Research methodology
- **NEXT_STEPS.md** - Recommended improvements
