# x402-Scanner

A comprehensive blockchain intelligence system that detects new x402 protocol tokens and AI agents in real-time on Base (primary) and Solana (secondary), traces mint URLs automatically, and provides instant access to new opportunities before they're widely known.

## Features

- **Real-time Blockchain Scanning**: Continuously monitors Base and Solana networks for new token deployments
- **AI Agent Detection**: Advanced pattern recognition to identify AI-powered tokens and agents
- **x402 Protocol Support**: Specialized detection for x402 protocol tokens
- **Mint URL Tracing**: Automatically extracts and traces mint URLs from token metadata
- **WebSocket Integration**: Real-time updates pushed to connected clients
- **Analytics Dashboard**: Beautiful Next.js dashboard with real-time statistics
- **Risk Assessment**: Automated risk scoring and suspicious activity detection
- **Multi-chain Support**: Base (primary) and Solana (secondary) network coverage

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, Recharts
- **Backend**: Node.js, TypeScript
- **Blockchain**: Viem (Base), Solana Web3.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for high-performance caching and pub/sub
- **WebSocket**: ws for real-time communication
- **Analytics**: Custom pattern analyzer for AI agent detection

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL database
- Redis server
- RPC endpoints for Base and Solana networks

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/x402-scanner.git
cd x402-scanner
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/x402scanner"
REDIS_URL="redis://localhost:6379"
BASE_RPC_URL="https://mainnet.base.org"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
WS_PORT="8080"
NEXT_PUBLIC_WS_URL="ws://localhost:8080"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

4. Set up the database:

```bash
npm run db:generate
npm run db:push
```

## Usage

### Development Mode

Start the Next.js development server:

```bash
npm run dev
```

### Production Mode

Build and start the production server:

```bash
npm run build
npm start
```

### Running Scanners

Start the Base blockchain scanner:

```bash
npm run scan:base
```

Start the Solana blockchain scanner:

```bash
npm run scan:solana
```

Run both scanners concurrently:

```bash
npm run scan:all
```

### Running the Pattern Analyzer

Start the AI agent pattern analyzer:

```bash
npm run analyze
```

### Database Management

Generate Prisma client:

```bash
npm run db:generate
```

Push schema to database:

```bash
npm run db:push
```

Run migrations:

```bash
npm run db:migrate
```

Open Prisma Studio:

```bash
npm run db:studio
```

## Project Structure

```
x402-scanner/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── tokens/        # Token endpoints
│   │   ├── agents/        # AI agent endpoints
│   │   └── stats/         # Statistics endpoints
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard page
│   └── globals.css        # Global styles
├── services/              # Backend services
│   ├── scanner/           # Blockchain scanners
│   │   ├── base-scanner.ts
│   │   └── solana-scanner.ts
│   ├── analytics/         # Analytics services
│   │   └── pattern-analyzer.ts
│   ├── websocket/         # WebSocket server
│   │   └── server.ts
│   └── utils/            # Utility functions
│       └── token-analyzer.ts
├── prisma/               # Database schema
│   └── schema.prisma
├── lib/                  # Shared libraries
│   ├── hooks/           # React hooks
│   │   └── useWebSocket.ts
│   └── prisma.ts        # Prisma client
├── public/              # Static assets
└── package.json         # Dependencies
```

## API Endpoints

### GET /api/tokens

Fetch tokens with optional filters.

Query parameters:
- `network`: Filter by network (BASE, SOLANA)
- `limit`: Number of results (default: 50)
- `x402`: Only x402 tokens (true/false)

### GET /api/agents

Fetch AI agents with optional filters.

Query parameters:
- `network`: Filter by network (BASE, SOLANA)
- `limit`: Number of results (default: 50)
- `active`: Only active agents (true/false)

### GET /api/stats

Get system-wide statistics.

## WebSocket Events

Connect to `ws://localhost:8080` to receive real-time updates:

### Server to Client

- `token`: New token detected
- `agent`: New AI agent detected
- `stats`: Updated statistics
- `pong`: Response to ping

### Client to Server

- `ping`: Health check
- `subscribe`: Subscribe to specific channels
- `unsubscribe`: Unsubscribe from channels

## Database Schema

### Token

- Token address, name, symbol, decimals
- Network (Base/Solana)
- x402 protocol flag
- Mint URL
- Creation timestamp
- Analytics data

### AIAgent

- Agent address and metadata
- Network
- Associated token
- Social media links
- Activity status
- Pattern matches

### Transaction

- Transaction hash and details
- Token reference
- From/to addresses
- Transaction type
- Block information

### Analytics

- Holder count
- 24h transaction volume
- Price changes
- Risk scoring
- Suspicious activity detection

## Development

### Running Tests

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e      # End-to-end tests
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
