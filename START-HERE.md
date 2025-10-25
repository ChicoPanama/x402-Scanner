# START HERE - x402 Protocol Observatory

Welcome! You've chosen the complete x402 Observatory system. This guide will get you from zero to analyzing protocols in about **15 minutes**.

## 🎯 What You're Getting

A complete blockchain research platform that:
- ✅ Imports existing x402 protocols from x402scan.com
- ✅ Monitors Base blockchain in real-time for new protocols
- ✅ Monitors Solana blockchain in real-time for new protocols
- ✅ Analyzes protocol quality with automated scoring
- ✅ Provides live dashboard with auto-refresh
- ✅ Exports data as CSV for research
- ✅ Offers REST API for custom integrations

## ⚡ Quick Start Checklist

### Prerequisites (5 minutes)

- [ ] **Node.js 20+** installed → Check with `node --version`
- [ ] **PostgreSQL 14+** installed and running
- [ ] **Git** installed
- [ ] Terminal/command line access

**Don't have these?** See [Detailed Prerequisites](#detailed-prerequisites) below.

### Setup Steps (10 minutes)

#### 1. Clone Repository

```bash
git clone https://github.com/ChicoPanama/x402-Scanner.git
cd x402-Scanner

# IMPORTANT: Switch to the correct branch
git checkout claude/project-vision-setup-011CUUkYBQVyogD5j84pMbMC
```

#### 2. Install Dependencies

```bash
npm install
```

This installs all required packages. Takes 2-3 minutes.

#### 3. Create Database

```bash
# Create the database
createdb x402observatory

# If you get "command not found", try:
psql postgres -c "CREATE DATABASE x402observatory;"
```

#### 4. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Open .env and edit it
nano .env  # or use your preferred editor
```

**Minimum required configuration in `.env`:**

```env
# Database (adjust username/password if needed)
DATABASE_URL="postgresql://localhost/x402observatory"

# These use free public RPCs (works but slower)
BASE_RPC_URL="https://mainnet.base.org"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
```

**Optional but recommended** - Get free API keys for better performance:
- Base: [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/)
- Solana: [Helius](https://helius.dev/)

Then update `.env`:
```env
BASE_RPC_URL="https://base-mainnet.g.alchemy.com/v2/YOUR_KEY_HERE"
SOLANA_RPC_URL="https://rpc.helius.xyz/?api-key=YOUR_KEY_HERE"
```

#### 5. Initialize Database

```bash
npx prisma generate
npx prisma db push
```

You should see:
```
✔ Generated Prisma Client
🚀 Your database is now in sync with your schema
```

#### 6. Verify Everything Works

```bash
npm run verify
```

Expected output:
```
================================
x402 Observatory Setup Verification
================================

📋 Checking Environment Variables...
   ✅ DATABASE_URL: Set
   ✅ BASE_RPC_URL: Set
   ✅ SOLANA_RPC_URL: Set

🗄️  Checking Database Connection...
   ✅ Database connection successful
   ✅ Schema exists (0 protocols in database)

🔗 Checking Base Network Connection...
   ✅ Connected to Base (Block: 23456789)

🔗 Checking Solana Network Connection...
   ✅ Connected to Solana (Slot: 298765432)

🌐 Checking x402scan.com Availability...
   ✅ x402scan.com is accessible

🎉 Setup verification passed!
```

If you see this, you're ready! If not, see [Troubleshooting](#troubleshooting).

## 🚀 Running The System

You'll need **2 terminal windows**:

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

**Open your browser to:** http://localhost:3000

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
[Discovery] ✅ Imported 47 protocols

=== Phase 2: Blockchain Monitoring ===
[BaseMonitor] Starting from block 23456789
[SolanaMonitor] Starting from slot 298765432

📊 Current Status:
   Total Protocols: 47
   - Base: 45
   - Solana: 2
```

**Leave both terminals running!**

## 📊 Viewing Your Data

### Dashboard

Visit: **http://localhost:3000/dashboard**

You'll see:
- Monitor status (Base/Solana running indicators)
- Live protocol feed with auto-refresh
- Protocol details table
- Real-time statistics

### API Endpoints

Test the API:

```bash
# Get all protocols
curl http://localhost:3000/api/protocols

# Get statistics
curl http://localhost:3000/api/stats

# Check monitor status
curl http://localhost:3000/api/monitor/status

# Get specific protocol
curl http://localhost:3000/api/protocols/PROTOCOL_ID
```

### Database GUI

```bash
npx prisma studio
```

Opens at http://localhost:5555 - browse all data visually.

## 🔬 Analyzing Protocol Quality

After the monitor has been running for 5-10 minutes:

```bash
npm run analyze:db
```

You'll get a detailed report:

```
DATABASE QUALITY ANALYSIS REPORT
======================================================================

🏆 TOP 10 PROTOCOLS BY QUALITY SCORE

Rank | Address        | Chain  | Score | Txs   | $/Day | Signals
----------------------------------------------------------------------
 1   | 0x1234...5678 | BASE   |  95  |   342 |  23.1 | HIGH_VOLUME, WHALE_ACTIVITY
 2   | 0xabcd...ef01 | BASE   |  87  |   198 |  15.2 | VERY_ACTIVE, HIGH_VALUE

🔥 CRITICAL ATTENTION
   0x1234...5678 (BASE)
   🔥 CRITICAL: Institutional interest detected

📄 Exported to quality-report-2024-10-25.csv
```

The CSV file contains all protocols with quality scores - perfect for research!

## 🎓 Next Steps

1. **Let it run for a few hours** - More data = better analysis
2. **Run analysis periodically** - `npm run analyze:db` every few hours
3. **Check the dashboard** - Monitor live activity
4. **Export data** - Use CSV files for your research
5. **Read the docs** - Explore RESEARCH.md for advanced analysis

## 📚 Available Documentation

- **START-HERE.md** (you are here) - Quick start guide
- **GETTING-STARTED.md** - Detailed setup with troubleshooting
- **RESEARCH.md** - Analysis methodology and research techniques
- **README.md** - Project overview and features
- **QUICKSTART.md** - Alternative quick reference

## 🛠️ Useful Commands

```bash
# Data Collection
npm run collect:hybrid   # All-in-one (recommended)
npm run collect:base     # Base only
npm run collect:solana   # Solana only

# Analysis
npm run analyze          # Analyze from x402scan.com
npm run analyze:db       # Analyze your database

# Development
npm run dev              # Web dashboard
npm run build            # Production build
npm run start            # Production server

# Database
npx prisma studio        # Visual database browser
npx prisma generate      # Regenerate Prisma client
npx prisma db push       # Update database schema

# Verification
npm run verify           # Check setup
```

## 🔧 Troubleshooting

### "Database connection failed"

**Check if PostgreSQL is running:**

```bash
# macOS
brew services list
brew services start postgresql@14

# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql

# Windows
# Check Services app for PostgreSQL
```

**Test connection manually:**
```bash
psql -l  # List databases
```

**Create database if needed:**
```bash
createdb x402observatory
```

### "Schema not initialized"

Run:
```bash
npx prisma generate
npx prisma db push
```

### "Base/Solana connection failed"

**Using public RPCs?** They're rate-limited. Consider getting free API keys:
- Base: https://www.alchemy.com/
- Solana: https://helius.dev/

**Check your .env file** has correct RPC URLs.

### "x402scan.com not accessible"

That's okay! The system will skip x402scan and use blockchain monitoring only.

You won't get historical data, but you'll catch new protocols.

### "Port 3000 already in use"

Add to your `.env`:
```env
PORT=3001
```

Then use http://localhost:3001

### "Module not found" errors

Make sure you're on the correct branch:
```bash
git branch  # Should show claude/project-vision-setup-011CUUkYBQVyogD5j84pMbMC
```

Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Still Having Issues?

1. Check you're on the right branch
2. Run `npm run verify` to diagnose
3. Check the detailed guide: GETTING-STARTED.md
4. Open an issue on GitHub with error details

## 🎯 What You Should See

After 10-15 minutes of running:

**Terminal 1 (Web Dashboard):**
```
▲ Next.js 14.2.18
- Local:        http://localhost:3000
✓ Ready in 2.1s
✓ Compiled /api/protocols in 234ms
✓ Compiled /api/stats in 145ms
```

**Terminal 2 (Hybrid Monitor):**
```
📊 Status Update (10:30:15 AM):
   Protocols: 47 (45 Base, 2 Solana)
   Recent Transactions (24h): 342

[BaseMonitor] Processing block 23456890
[SolanaMonitor] Processing slot 298765500
```

**Browser (http://localhost:3000/dashboard):**
- Green status indicators for both monitors
- Protocol table with 40+ entries
- Auto-refresh counter counting down
- Statistics cards showing data

**Database (npx prisma studio):**
- Protocol table with protocols
- Transaction table with transactions
- All fields populated

## 🎉 Success Indicators

You know it's working when:

- ✅ Dashboard shows protocols
- ✅ Monitor status shows "Running"
- ✅ Terminal shows periodic updates
- ✅ Protocol count increasing
- ✅ Database has data (check Prisma Studio)
- ✅ Analysis generates CSV reports

## 📊 System Architecture

```
┌──────────────┐
│ x402scan.com │─────┐
└──────────────┘     │
                     │
┌──────────────┐     │      ┌─────────────┐      ┌─────────────┐
│ Base Chain   │─────┼─────▶│   Hybrid    │─────▶│ PostgreSQL  │
└──────────────┘     │      │   Monitor   │      └─────────────┘
                     │      └─────────────┘             │
┌──────────────┐     │                                  │
│ Solana Chain │─────┘                                  ▼
└──────────────┘                                ┌─────────────┐
                                                │   Next.js   │
                                                │  Dashboard  │
                                                └─────────────┘
                                                        │
                                                        ▼
                                                  Your Browser
                                              http://localhost:3000
```

## 💡 Pro Tips

1. **Use better RPCs** - Public RPCs are slow. Get free API keys for much faster performance.

2. **Let it run overnight** - The more data, the better the analysis.

3. **Check the CSV exports** - Great for Excel/Python analysis.

4. **Monitor the dashboard** - Auto-refreshes every 10 seconds.

5. **Use Prisma Studio** - Visual way to explore all data.

6. **Read RESEARCH.md** - Learn about the scoring methodology.

## 🎓 Learning Resources

- **What is Prisma?** - Database ORM we use → https://www.prisma.io/
- **What is Next.js?** - Web framework → https://nextjs.org/
- **What is Viem?** - Ethereum library → https://viem.sh/
- **What is Solana web3.js?** - Solana library → https://solana.com/docs

## 🔐 Security & Ethics

This platform is designed for:
- ✅ Educational purposes
- ✅ Academic research
- ✅ Market analysis
- ✅ Protocol studies

**All data is publicly available on blockchains.**

Not for:
- ❌ Financial advice
- ❌ Market manipulation
- ❌ Exploitative trading

## 📞 Support

- **Documentation Issues**: Check GETTING-STARTED.md
- **Bugs**: Open GitHub issue
- **Questions**: Review RESEARCH.md

---

## ✨ You're Ready!

Follow the checklist above, and you'll have a working x402 Observatory in about 15 minutes.

**Start with:**
1. Install prerequisites
2. Clone & checkout branch
3. Run `npm install`
4. Create database
5. Configure `.env`
6. Run `npm run verify`
7. Start both terminals

**Then enjoy:**
- Real protocol data immediately
- Live monitoring
- Quality analysis
- Research tools

Good luck with your research! 🚀
