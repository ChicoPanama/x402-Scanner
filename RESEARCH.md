# Research & Analysis Guide

This guide explains how to use the x402 Observatory's research and analysis tools to identify high-quality protocols and early opportunities.

## Overview

The Observatory provides two analysis tools focused on **actionable insights**:

1. **Quality Analyzer** (`npm run analyze`) - Scrapes x402scan.com for fresh data
2. **Database Analyzer** (`npm run analyze:db`) - Analyzes protocols you've collected

Both tools score protocols based on quality signals and unusual activity patterns.

## Quality Scoring System

Protocols are scored 0-100 based on:

### Transaction Volume (0-30 points)
- 100+ transactions: 30 points
- 50-99 transactions: 20 points
- 10-49 transactions: 10 points

### Daily Activity Rate (0-25 points)
- 10+ tx/day: 25 points (VERY_ACTIVE)
- 5-9 tx/day: 15 points (ACTIVE)
- 1-4 tx/day: 10 points

### Recent Activity (0-20 points)
- Active in last hour: 20 points (HOT)
- Active in last 24h: 15 points
- Active in last week: 10 points

### Volume Metrics (0-25 points)
- $10+ volume: 25 points (HIGH_VALUE)
- $1-9 volume: 15 points
- $0.10-0.99 volume: 5 points

## Signal Detection

The analyzers detect these patterns:

### Quality Signals

**HIGH_VOLUME** - More than 100 transactions
- Indicates sustained interest and usage

**VERY_ACTIVE** - 10+ transactions per day
- Strong ongoing engagement

**HOT** - Activity in the last hour
- Real-time interest, catch it early

**HIGH_VALUE** - Significant dollar volume
- Institutional or whale participation

### Unusual Activity

**HOT_LAUNCH** - New protocol with 50+ transactions in first day
- Strong initial traction, early opportunity

**WHALE_ACTIVITY** - Average transaction > $100
- Large players involved

**VELOCITY_SPIKE** - 20+ transactions per day
- Sudden surge in activity

## Using the Quality Analyzer

Analyzes protocols directly from x402scan.com:

```bash
npm run analyze
```

### What it does:
1. Scrapes x402scan.com for protocol data
2. Extracts activity metrics and patterns
3. Scores each protocol 0-100
4. Detects unusual activity
5. Generates actionable recommendations
6. Stores promising protocols in database

### Output Example:

```
🔬 Analyzing x402 Protocol Quality Indicators

📊 Evaluating 47 protocols for quality signals...

📈 QUALITY RESEARCH REPORT
═══════════════════════════════════════

🌟 HIGH QUALITY PROTOCOLS:
   0x1234...5678
   Score: 85/100
   Signals: HIGH_VOLUME, WHALE_ACTIVITY, HOT
   🔥 CRITICAL: Institutional interest detected

🚀 EARLY OPPORTUNITIES:
   0xabcd...ef01
   Activity: {"transactions": 127, "wallets": 45, "volume": 1250}

═══════════════════════════════════════
Total Analyzed: 47
High Quality: 8
Unusual Activity: 12
Early Opportunities: 3
```

### Recommendations:

- **🔥 CRITICAL**: Immediate attention - institutional interest
- **🚀 EARLY**: Strong initial traction - early opportunity
- **⭐ HIGH**: Strong metrics across the board
- **👀 MONITOR**: Shows promise, track developments
- **📊 RESEARCH**: Has interesting patterns

## Using the Database Analyzer

Analyzes protocols already in your database:

```bash
npm run analyze:db
```

### What it does:
1. Queries all ACTIVE protocols from database
2. Calculates comprehensive quality metrics
3. Generates quality scores
4. Creates detailed report
5. Exports to CSV for further analysis

### Output Example:

```
📊 Analyzing protocols in database...

DATABASE QUALITY ANALYSIS REPORT
======================================================================

🏆 TOP 10 PROTOCOLS BY QUALITY SCORE

Rank | Address        | Chain  | Score | Txs   | $/Day | Signals
----------------------------------------------------------------------
 1   | 0x1234...5678 | BASE   |  95  |   342 |  23.1 | HIGH_VOLUME, WHALE_ACTIVITY, HOT
 2   | 0xabcd...ef01 | BASE   |  87  |   198 |  15.2 | VERY_ACTIVE, HIGH_VALUE
 3   | 0x9876...4321 | SOLANA |  79  |   156 |  12.7 | HOT_LAUNCH, ACTIVE

🔥 CRITICAL ATTENTION

   0x1234...5678 (BASE)
   🔥 CRITICAL: Institutional interest detected
   Signals: HIGH_VOLUME, WHALE_ACTIVITY, HOT
   342 txs, 23.1/day

📊 STATISTICS

   Total Protocols Analyzed: 47
   Critical: 3
   Early Opportunities: 5
   High Quality: 12
   Worth Monitoring: 18

   Total Transactions: 4,523
   Average Quality Score: 58.3/100

📄 Exported to quality-report-2024-10-25.csv
```

## Research Workflow

### 1. Initial Discovery

Run the hybrid monitor to collect data:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run collect:hybrid
```

Let it run for a few hours to collect protocols.

### 2. Analyze Quality

Use the database analyzer to find promising protocols:

```bash
npm run analyze:db
```

Review the report and CSV export.

### 3. Periodic Checks

Run the x402scan analyzer periodically to catch new protocols:

```bash
npm run analyze
```

Recommended: Every 4-6 hours during active periods.

### 4. Track Changes

Compare CSV exports over time to identify:
- Protocols gaining momentum
- Sustained growth patterns
- Declining interest
- New entries worth watching

## CSV Export

The database analyzer exports a CSV file with all metrics:

```csv
Address,Chain,Quality Score,Total Transactions,Transactions/Day,Total Volume,Days Since Creation,Signals,Recommendation
0x1234...5678,BASE,95,342,23.10,12.45,14.8,"HIGH_VOLUME, WHALE_ACTIVITY, HOT","🔥 CRITICAL"
...
```

Use with Excel, Google Sheets, or Python for:
- Time-series analysis
- Correlation studies
- Custom visualizations
- Statistical modeling

## Interpreting Results

### High Quality Protocols (Score > 70)
- **Action**: Research thoroughly, track closely
- **Why**: Multiple positive signals
- **Risk**: May already be discovered

### Early Opportunities (HOT_LAUNCH signal)
- **Action**: Deep dive into fundamentals
- **Why**: Strong initial traction
- **Risk**: High volatility, needs validation

### Whale Activity
- **Action**: Monitor transaction patterns
- **Why**: Institutional interest
- **Risk**: Could be a setup

### Velocity Spikes
- **Action**: Investigate cause
- **Why**: Unusual attention spike
- **Risk**: Could be temporary

## Advanced Research

### Combining with Blockchain Data

Use the API to correlate quality scores with on-chain data:

```typescript
// Get protocols with whale activity
const whaleProtocols = await fetch('/api/protocols?sortBy=volume');

// Analyze their transaction patterns
for (const protocol of whaleProtocols.data) {
  // Check if whale activity is sustained or one-time
  const txs = await fetch(`/api/protocols/${protocol.id}`);
  // Analyze transaction distribution
}
```

### Custom Scoring

Modify scoring in `scripts/analyze-database.ts`:

```typescript
// Adjust weights based on your research focus
if (protocol.totalTransactions > YOUR_THRESHOLD) {
  qualityScore += YOUR_POINTS;
}
```

### Alert System

Set up alerts for high-quality protocols:

```bash
# Run analyzer in cron job
0 */4 * * * cd /path/to/x402-Scanner && npm run analyze:db > /tmp/analysis.log

# Parse for CRITICAL signals
# Send notifications when found
```

## Best Practices

1. **Don't Rely on Scores Alone**
   - Scores are indicators, not financial advice
   - Do your own research
   - Verify on-chain data

2. **Track Over Time**
   - Single snapshot is insufficient
   - Look for sustained patterns
   - Compare historical data

3. **Cross-Validate**
   - Check multiple data sources
   - Verify x402scan data on-chain
   - Look for consensus signals

4. **Context Matters**
   - Market conditions affect all protocols
   - Chain-specific events impact scores
   - Time of day affects activity

5. **Use for Research**
   - Educational and research purposes
   - Build datasets for analysis
   - Study protocol dynamics
   - Understand ecosystem health

## Troubleshooting

### "No protocols found" in Quality Analyzer

x402scan.com structure may have changed. Check discovered API endpoints in output.

**Solution**: Use database analyzer instead:
```bash
npm run analyze:db
```

### Empty Database Analyzer Report

You haven't collected any protocols yet.

**Solution**: Run hybrid monitor first:
```bash
npm run collect:hybrid
```

### Puppeteer Errors

Browser automation issues.

**Solution**: Install Chromium dependencies:
```bash
# Ubuntu/Debian
sudo apt-get install -y chromium-browser

# Or use the database analyzer which doesn't need Puppeteer
npm run analyze:db
```

## Ethical Considerations

These tools are designed for:
- ✅ Academic research
- ✅ Educational purposes
- ✅ Understanding protocol dynamics
- ✅ Building datasets
- ✅ Market research

Not for:
- ❌ Financial advice
- ❌ Market manipulation
- ❌ Front-running
- ❌ Exploitative trading

## Support

Questions about research methodology:
- Check the codebase documentation
- Review scoring algorithms in source
- Open an issue for clarification

---

**Remember**: These are research tools. Always do your own research and never invest more than you can afford to lose.
