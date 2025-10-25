# x402 Protocol Observatory - Blockchain Research Platform

![Research](https://img.shields.io/badge/Research-Platform-blue)
![Base](https://img.shields.io/badge/Base-Chain-purple)
![Solana](https://img.shields.io/badge/Solana-Chain-green)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Quick Start

**👉 NEW USER? [START HERE →](START-HERE.md)** Complete setup guide (15 minutes)

**Alternative:** [GETTING-STARTED.md](GETTING-STARTED.md) for detailed troubleshooting

```bash
# 1. Install & Setup
npm install
cp .env.example .env
# Edit .env with your database URL

# 2. Initialize Database
npx prisma generate && npx prisma db push

# 3. Verify Setup
npm run verify

# 4. Start System (2 terminals)
npm run dev              # Terminal 1: Web dashboard
npm run collect:hybrid   # Terminal 2: Data collection

# 5. Visit Dashboard
# Open http://localhost:3000/dashboard
```

**Already set up?** Jump to [Usage](#-api-documentation) or [Research Tools](#-research--analysis)

---

## 🔬 Overview

The x402 Protocol Observatory is a blockchain research platform designed for monitoring and analyzing x402 protocol deployments across Base and Solana networks. This system aggregates publicly available blockchain data to provide researchers, academics, and market analysts with comprehensive insights into protocol dynamics and ecosystem development.

### Research Focus

- **Protocol Analysis**: Study x402 protocol implementations and patterns
- **Market Research**: Analyze adoption rates and usage metrics
- **Academic Studies**: Build datasets for blockchain research
- **Educational Resources**: Understand decentralized protocol mechanics

## 📊 Core Features

### Data Collection & Analysis
- **Protocol Monitoring**: Track x402 deployments in real-time
- **Transaction Analysis**: Aggregate and analyze protocol interactions
- **Historical Data**: Build comprehensive datasets for research
- **Pattern Recognition**: Identify deployment and usage patterns

### Research Tools
- **Statistical Analysis**: Quantitative metrics on protocol activity
- **Comparative Studies**: Analyze different protocol implementations
- **Network Visualization**: Graph protocol relationships and interactions
- **Export Capabilities**: Download datasets for external analysis

### Transparency Features
- **Public Dashboard**: Open access to protocol metrics
- **API Access**: Programmatic access to research data
- **Documentation**: Comprehensive methodology documentation
- **Open Source**: Transparent codebase and algorithms

## 🛠️ Technical Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Node.js, Prisma ORM
- **Database**: PostgreSQL (primary), Redis (caching)
- **Blockchain**: Viem (Base), @solana/web3.js (Solana)
- **Analytics**: D3.js, Recharts for visualization

## 📦 Installation

### Prerequisites

- Node.js 20.0+
- PostgreSQL 14+
- Redis 7+ (optional, for caching)
- RPC access to Base and Solana networks

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ChicoPanama/x402-Scanner.git
cd x402-Scanner

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your RPC endpoints

# Setup database
npx prisma generate
npx prisma db push

# Start development server
npm run dev

# Start data collection (separate terminal)
npm run collect:base    # Base chain collector
npm run collect:solana  # Solana collector
```

## 🔧 Configuration

### Environment Variables

```bash
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/x402observatory"
REDIS_URL="redis://localhost:6379"

# Base Network
BASE_RPC_URL="https://mainnet.base.org"
BASE_WS_URL="wss://mainnet.base.org"

# Solana Network
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
HELIUS_API_KEY="" # Optional: Enhanced RPC

# Research Features
ENABLE_HISTORICAL_SYNC="true"
DATA_RETENTION_DAYS="90"
ANALYSIS_INTERVAL_MS="60000"
```

## 📁 Project Structure

```
x402-observatory/
├── app/                    # Next.js application
│   ├── api/               # REST API endpoints
│   ├── dashboard/         # Research dashboard
│   └── docs/             # Documentation pages
├── collectors/            # Blockchain data collectors
│   ├── base/             # Base network collector
│   └── solana/           # Solana network collector
├── analyzers/            # Data analysis modules
│   ├── patterns/         # Pattern recognition
│   └── statistics/       # Statistical analysis
├── lib/                  # Shared libraries
│   ├── blockchain/       # Chain interaction
│   └── database/         # Data access layer
├── prisma/              # Database schema
└── public/              # Static assets
```

## 🔍 Research Methodology

### Data Collection
- Monitor public blockchain transactions
- Aggregate protocol deployment events
- Track interaction patterns
- Store historical data for analysis

### Analysis Framework
1. **Quantitative Analysis**: Statistical metrics and trends
2. **Temporal Analysis**: Time-series protocol activity
3. **Network Analysis**: Relationship mapping between addresses
4. **Comparative Analysis**: Cross-protocol comparisons

### Metrics Tracked
- Protocol deployment frequency
- Transaction volumes and patterns
- User participation rates
- Network distribution metrics
- Adoption curve analysis

## 📈 API Documentation

### REST Endpoints

```typescript
GET /api/protocols           // List all tracked protocols
GET /api/protocols/:id       // Protocol details
GET /api/analytics/overview  // System-wide metrics
GET /api/research/export     // Export research data
POST /api/webhooks           // Register data webhooks
```

### WebSocket Streams

```typescript
ws://localhost:3000/stream/protocols  // Real-time protocol events
ws://localhost:3000/stream/analytics  // Live analytics updates
```

## 🔬 Research & Analysis

The Observatory includes powerful analysis tools for identifying high-quality protocols:

### Quality Analyzers

```bash
# Analyze protocols from x402scan.com (fresh data)
npm run analyze

# Analyze protocols in your database (collected data)
npm run analyze:db
```

Both tools score protocols 0-100 based on:
- **Transaction volume** (0-30 points)
- **Daily activity rate** (0-25 points)
- **Recent activity** (0-20 points)
- **Dollar volume** (0-25 points)

### Signals Detected

- **HIGH_VOLUME**: 100+ transactions
- **WHALE_ACTIVITY**: Large transaction averages
- **HOT_LAUNCH**: New protocols with strong traction
- **VELOCITY_SPIKE**: Sudden activity increases
- **VERY_ACTIVE**: 10+ transactions per day
- **HOT**: Activity in the last hour

### Recommendations Generated

- 🔥 **CRITICAL**: Institutional interest detected
- 🚀 **EARLY**: Strong initial traction
- ⭐ **HIGH**: Strong metrics across the board
- 👀 **MONITOR**: Shows promise
- 📊 **RESEARCH**: Interesting patterns

### Sample Output

```
🏆 TOP 10 PROTOCOLS BY QUALITY SCORE

Rank | Address        | Chain  | Score | Txs   | $/Day | Signals
----------------------------------------------------------------------
 1   | 0x1234...5678 | BASE   |  95  |   342 |  23.1 | HIGH_VOLUME, WHALE_ACTIVITY
 2   | 0xabcd...ef01 | BASE   |  87  |   198 |  15.2 | VERY_ACTIVE, HIGH_VALUE

🔥 CRITICAL ATTENTION
   0x1234...5678 (BASE)
   Institutional interest detected

📄 Exported to quality-report-2024-10-25.csv
```

**For detailed research methodology, see [RESEARCH.md](RESEARCH.md)**

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Data validation
npm run test:validation
```

## 📊 Use Cases

### Academic Research
- Blockchain ecosystem studies
- Protocol adoption patterns
- Network effect analysis
- Decentralized system dynamics

### Market Analysis
- Protocol competitiveness studies
- Adoption rate tracking
- Usage pattern analysis
- Ecosystem health metrics

### Educational Purpose
- Learn blockchain fundamentals
- Understand protocol mechanics
- Study tokenomics
- Research decentralized systems

## 🚀 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📚 Documentation

Comprehensive documentation available at `/docs` including:
- Data collection methodology
- Analysis algorithms
- API reference
- Research papers and findings

## 🤝 Contributing

We welcome contributions from researchers and developers:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/research-tool`)
3. Commit your changes (`git commit -m 'Add research tool'`)
4. Push to branch (`git push origin feature/research-tool`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🎓 Academic Use

If you use this platform in your research, please cite:
```
x402 Protocol Observatory (2024). Blockchain Research Platform.
https://github.com/ChicoPanama/x402-Scanner
```

## ⚖️ Ethical Guidelines

This platform is designed for legitimate research and educational purposes:
- All data is publicly available on blockchain
- No private information is collected
- Transparent methodology and open source
- Focus on understanding, not exploitation

## 🙏 Acknowledgments

- Blockchain research community
- Open source contributors
- Academic institutions using this platform
- Base and Solana networks

## 📞 Support

- Documentation: [docs.x402observatory.org](https://docs.x402observatory.org)
- Research Forum: [forum.x402observatory.org](https://forum.x402observatory.org)
- Email: research@x402observatory.org

---

**Built for blockchain research and education** 🔬
