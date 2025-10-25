# Quick Start Guide - x402 Protocol Observatory

This guide will help you get the x402 Protocol Observatory up and running in minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20.0+** - [Download here](https://nodejs.org/)
- **PostgreSQL 14+** - [Download here](https://www.postgresql.org/download/)
- **Git** - For cloning the repository

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/ChicoPanama/x402-Scanner.git
cd x402-Scanner

# Install dependencies
npm install
```

## Step 2: Set Up Database

### Option A: Local PostgreSQL

```bash
# Create database
createdb x402observatory

# Or using psql:
psql -U postgres
CREATE DATABASE x402observatory;
\q
```

### Option B: Using Docker

```bash
# Start PostgreSQL with Docker
docker run --name x402-postgres \
  -e POSTGRES_PASSWORD=x402password \
  -e POSTGRES_USER=x402user \
  -e POSTGRES_DB=x402observatory \
  -p 5432:5432 \
  -d postgres:14-alpine
```

## Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

### Minimum Required Configuration:

```env
# Database
DATABASE_URL="postgresql://x402user:x402password@localhost:5432/x402observatory"

# Base Network (required)
BASE_RPC_URL="https://mainnet.base.org"

# Solana Network (required)
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
```

### Recommended: Use Better RPC Providers

For production use, consider these free/paid RPC providers:

**Base:**
- [Alchemy](https://www.alchemy.com/) - Free tier available
- [Infura](https://www.infura.io/) - Free tier available
- [QuickNode](https://www.quicknode.com/) - Free tier available

**Solana:**
- [Helius](https://helius.dev/) - Free tier available
- [QuickNode](https://www.quicknode.com/) - Free tier available
- Public RPC (rate limited): `https://api.mainnet-beta.solana.com`

## Step 4: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Create database schema
npx prisma db push

# Verify database connection
npx prisma studio
# This opens a GUI at http://localhost:5555
```

## Step 5: Start the Application

You'll need **3 terminal windows** for a complete setup:

### Terminal 1: Web Dashboard

```bash
npm run dev
```

The dashboard will be available at: **http://localhost:3000**

### Terminal 2: Base Chain Monitor

```bash
npm run collect:base
```

This monitor will:
- Connect to Base blockchain
- Scan new blocks for x402 protocols
- Store detected protocols in database

### Terminal 3: Solana Chain Monitor

```bash
npm run collect:solana
```

This monitor will:
- Connect to Solana blockchain
- Scan new slots for x402 protocols
- Store detected protocols in database

## Step 6: Verify It's Working

1. **Check Dashboard**: Open http://localhost:3000/dashboard
2. **Monitor Status**: Both monitors should show "Running"
3. **View Logs**: Check terminal outputs for activity
4. **API Test**: Visit http://localhost:3000/api/health

## Monitoring Activity

The monitors will:
- Start from the current block/slot
- Process new blocks/slots as they arrive
- Detect x402 protocol patterns
- Store protocols and transactions in database
- Update dashboard in real-time

## Customizing Protocol Detection

The detection logic is in:
- `lib/monitors/base-monitor.ts` - Base chain detection
- `lib/monitors/solana-monitor.ts` - Solana chain detection

Look for the `detectX402Pattern()` method to customize what patterns to look for.

## Common Issues

### Database Connection Failed

```bash
# Check if PostgreSQL is running
pg_isready

# Or on macOS with Homebrew:
brew services list
```

### RPC Connection Failed

- Check your RPC_URL in `.env`
- Verify you're not hitting rate limits
- Try a different RPC provider

### Port Already in Use

```bash
# Change port in .env
PORT=3001

# Then restart: npm run dev
```

### Prisma Client Not Generated

```bash
# Regenerate Prisma client
npx prisma generate
```

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# View database
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma db push --force-reset
```

## Docker Deployment (Alternative)

For a complete Docker setup:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

This starts:
- PostgreSQL database
- Redis cache
- Next.js web app
- Base chain monitor
- Solana chain monitor

## Next Steps

1. **Customize Detection**: Modify `detectX402Pattern()` methods
2. **Add Analytics**: Implement custom metrics in `analyzers/`
3. **Export Data**: Use `/api/research/export` endpoint
4. **Set Up Alerts**: Implement webhook notifications
5. **Scale Up**: Use better RPC providers and add caching

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/protocols` - List protocols
- `GET /api/protocols/:id` - Protocol details
- `GET /api/stats` - System statistics
- `GET /api/monitor/status` - Monitor status

## Need Help?

- **Documentation**: Check README.md for detailed info
- **Issues**: https://github.com/ChicoPanama/x402-Scanner/issues
- **Discord**: (Add your community link)

## Performance Tips

1. Use dedicated RPC endpoints (not public shared ones)
2. Enable Redis caching for faster API responses
3. Monitor database size and implement data retention policies
4. Consider horizontal scaling for high-traffic scenarios

---

**You're all set!** The monitors are now watching for x402 protocols on Base and Solana. 🚀
