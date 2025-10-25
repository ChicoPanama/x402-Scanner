# Getting Started - x402 Observatory MVP

This guide will get you from zero to a working x402 protocol monitoring system in **under 10 minutes**.

## What You'll Build

A system that:
1. ✅ Pulls existing x402 protocols from x402scan.com
2. ✅ Monitors Base and Solana blockchains in real-time
3. ✅ Displays protocols on a live dashboard
4. ✅ Analyzes protocol quality and patterns

## Prerequisites (5 minutes)

### 1. Install Node.js 20+

```bash
# Check if you have Node.js
node --version

# If not, install from https://nodejs.org/
```

### 2. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql-14
sudo systemctl start postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 3. Clone Repository

```bash
git clone https://github.com/ChicoPanama/x402-Scanner.git
cd x402-Scanner
```

## Setup Steps (5 minutes)

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14 (web framework)
- Prisma (database)
- Viem (Base blockchain)
- Solana web3.js (Solana blockchain)
- Axios, Cheerio, Puppeteer (x402scan scraping)
- And more...

### Step 2: Create Database

```bash
# Create the database
createdb x402observatory

# Or if that doesn't work:
psql postgres
CREATE DATABASE x402observatory;
\q
```

### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env (use your preferred editor)
nano .env
```

**Minimum required configuration:**

```env
# Database (adjust if your PostgreSQL has a password)
DATABASE_URL="postgresql://localhost/x402observatory"

# Base Network (free public RPC)
BASE_RPC_URL="https://mainnet.base.org"

# Solana Network (free public RPC)
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

# x402scan
X402SCAN_URL="https://www.x402scan.com"
```

**For better performance, use dedicated RPCs:**

Get free API keys from:
- Base: [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/)
- Solana: [Helius](https://helius.dev/) or [QuickNode](https://www.quicknode.com/)

Then update your `.env`:
```env
BASE_RPC_URL="https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY"
SOLANA_RPC_URL="https://rpc.helius.xyz/?api-key=YOUR_API_KEY"
```

### Step 4: Initialize Database Schema

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push
```

You should see:
```
✔ Generated Prisma Client
🚀  Your database is now in sync with your schema
```

### Step 5: Verify Setup

```bash
npm run verify
```

This checks:
- ✅ Environment variables are set
- ✅ Database connection works
- ✅ Base network is accessible
- ✅ Solana network is accessible
- ✅ x402scan.com is reachable

If you see "🎉 Setup verification passed!" you're ready!

## Running the MVP (2 terminals)

### Terminal 1: Web Dashboard

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.2.18
- Local:        http://localhost:3000
✓ Ready in 2.1s
```

Open your browser to: **http://localhost:3000**

### Terminal 2: Hybrid Monitor

```bash
npm run collect:hybrid
```

You should see:
```
===========================================
  x402 Protocol Observatory
  Hybrid Monitoring System
===========================================

Data Sources:
  1. x402scan.com (discovery & historical)
  2. Base blockchain (real-time)
  3. Solana blockchain (real-time)

=== Phase 1: x402scan Integration ===
[HybridMonitor] ✅ x402scan.com is accessible
[Discovery] Discovering x402 contracts from x402scan.com...
[Discovery] Found 47 protocols from x402scan

=== Phase 2: Blockchain Monitoring ===
[BaseMonitor] Starting from block 23456789
[SolanaMonitor] Starting from slot 298765432

=== Phase 3: Periodic Sync ===
Scheduling sync every 300s

📊 Current Status:
   Total Protocols: 47
   - Base: 45
   - Solana: 2
```

## What You Should See

### Dashboard (http://localhost:3000)

Homepage showing:
- Live protocol counts (Base, Solana, total)
- Real-time transaction stats
- Feature overview

### Research Dashboard (http://localhost:3000/dashboard)

Interactive dashboard with:
- Monitor status indicators (Base/Solana)
- Live protocol feed
- Auto-refresh toggle
- Protocol details table
- Chain filtering

### API Endpoints

Test the API:
```bash
# Get all protocols
curl http://localhost:3000/api/protocols

# Get statistics
curl http://localhost:3000/api/stats

# Check monitor status
curl http://localhost:3000/api/monitor/status
```

## Analyzing Protocols

After the monitor has collected protocols (wait 5-10 minutes), analyze them:

```bash
npm run analyze:db
```

You'll see:
```
DATABASE QUALITY ANALYSIS REPORT
======================================================================

🏆 TOP 10 PROTOCOLS BY QUALITY SCORE

Rank | Address        | Chain  | Score | Txs   | $/Day | Signals
----------------------------------------------------------------------
 1   | 0x1234...5678 | BASE   |  95  |   342 |  23.1 | HIGH_VOLUME, WHALE_ACTIVITY
```

Plus a CSV export for further analysis!

## Troubleshooting

### "Database connection failed"

**Check if PostgreSQL is running:**
```bash
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Test connection
psql -U postgres -c "SELECT version();"
```

**Create database manually:**
```bash
psql postgres
CREATE DATABASE x402observatory;
\q
```

### "Schema not initialized"

Run:
```bash
npx prisma generate
npx prisma db push
```

### "Base/Solana connection failed"

**Using public RPCs:** These are rate-limited. Get free API keys from Alchemy/Helius.

**Check your RPC URLs** in `.env` are correct.

### "Port 3000 already in use"

Change the port in `.env`:
```env
PORT=3001
```

Then use `http://localhost:3001`

### "x402scan.com not accessible"

That's okay! The system will work with just blockchain monitoring.

The hybrid monitor will skip x402scan and use only blockchain data.

## Next Steps

Once everything is running:

1. **Watch the dashboard** - See protocols appear in real-time
2. **Run analysis** - `npm run analyze:db` to find quality protocols
3. **Check the API** - Build custom queries and integrations
4. **Export data** - CSV files for research and analysis
5. **Read RESEARCH.md** - Advanced analysis techniques

## What's Happening

**The hybrid monitor is:**
1. Importing protocols from x402scan.com (historical data)
2. Watching Base blockchain for new deployments
3. Watching Solana blockchain for new deployments
4. Storing everything in PostgreSQL
5. Updating stats in real-time
6. Syncing with x402scan every 5 minutes

**The dashboard is:**
1. Fetching data from the API
2. Refreshing every 10 seconds
3. Showing live protocol activity
4. Displaying monitor status

**You can:**
1. View all protocols at `/dashboard`
2. Query the API at `/api/*`
3. Analyze quality with `npm run analyze:db`
4. Export data as CSV for research

## System Architecture

```
┌─────────────────┐
│  x402scan.com   │──┐
└─────────────────┘  │
                     │
┌─────────────────┐  │    ┌──────────────┐    ┌─────────────┐
│  Base Chain     │──┼───▶│ Hybrid       │───▶│ PostgreSQL  │
└─────────────────┘  │    │ Monitor      │    └─────────────┘
                     │    └──────────────┘           │
┌─────────────────┐  │                               │
│  Solana Chain   │──┘                               ▼
└─────────────────┘                          ┌─────────────┐
                                             │  Next.js    │
                                             │  Dashboard  │
                                             └─────────────┘
```

## Performance Tips

1. **Use dedicated RPC endpoints** - Public RPCs are slow and rate-limited
2. **Let it run for a few hours** - Need time to collect data
3. **Enable Redis caching** - Add REDIS_URL to .env for faster API responses
4. **Monitor database size** - Set DATA_RETENTION_DAYS in .env

## Support

- **Issues:** https://github.com/ChicoPanama/x402-Scanner/issues
- **Documentation:** README.md, QUICKSTART.md, RESEARCH.md
- **Examples:** Check `scripts/` for analysis examples

---

**You're now running the x402 Protocol Observatory!** 🎉

Visit http://localhost:3000/dashboard to see your protocols.
