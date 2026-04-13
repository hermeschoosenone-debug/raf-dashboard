# TOOLS.md - Trading Infrastructure

## 📦 Installed Packages (npm)
```
/root/.openclaw/workspace/raf/node_modules/
├── ccxt/                    # Unified crypto exchange trading
├── @polymarket/clob-client/ # Polymarket prediction markets
└── node-fetch/              # HTTP requests
```

## 🔑 Exchange Connections

### Binance (ACTIVE ✅ — API keys pending from Roo)
| Setting | Value |
|---------|-------|
| Exchange | Binance (CCXT: `binance`) |
| Pairs | Spot + USDT-M Futures |
| SOL Price | $81.82 (live) |
| 24h Volume | 2.18M SOL |
| Status | Connected, awaiting API keys for trading |

### Bybit (READY ✅ — backup exchange)
| Setting | Value |
|---------|-------|
| Exchange | Bybit (CCXT: `bybit`) |
| Pairs | Spot + USDT perpetuals |
| Status | API available, no keys yet |

### BloFin (BLOCKED ❌)
| Issue | Detail |
|-------|--------|
| Problem | IP in restricted region — all endpoints 403 |
| API Keys | In memory only (not stored anywhere) |
| Decision | Abandoned — using Binance instead |

### All Exchange Keys
| Exchange | API Key | Secret | Status |
|----------|---------|--------|--------|
| Binance | PENDING | PENDING | Not configured |
| Bybit | — | — | Not configured |
| BloFin | e9ca64... (memory only) | b626b3... | BLOCKED, discarded |

## 🔑 Required API Keys (TODO)

### Binance (Priority)
| Key | Status |
|-----|--------|
| `BINANCE_API_KEY` | **NEEDED** |
| `BINANCE_SECRET` | **NEEDED** |

**Permissions required:** Read + Trade (Spot + Futures)

## 📊 Skills Library (Research-Based)

| Skill | File | Confidence | Best For |
|-------|------|------------|----------|
| MACD + RSI Momentum | `skills/MACD_RSI_Momentum_Strategy.md` | 73%+ | Trending markets, swing trades |
| Fixed Fractional Sizing | `skills/Fixed_Fractional_Position_Sizing.md` | VERY HIGH | All strategies, risk management |
| Breakout Trading | `skills/Breakout_Trading_Strategy.md` | HIGH | Post-consolidation moves |

## 📊 Strategy Pipeline (Pending Live Trading)

```
1. SCAN → CCXT → Binance/Bybit → token prices
   ↓
2. SIGNAL → MACD crossover + RSI > 50 + volume spike > 2x MA
   ↓
3. RISK → $5 fixed risk (Roo mandate) + 50% bankroll cap
   ↓
4. EXECUTE → CCXT market order
   ↓
5. MANAGE → SL + TP + trailing stop
```

## 🚀 Quick Test Commands

```bash
# Test Binance public data (NO keys needed)
node -e "const ccxt = require('ccxt'); const b = new ccxt.binance(); b.fetchTicker('SOL/USDT').then(t => console.log('SOL:', t.last));" 2>&1

# Test Bybit public data
node -e "const ccxt = require('ccxt'); const byb = new ccxt.bybit(); byb.fetchTicker('SOL/USDT').then(t => console.log('SOL:', t.last));" 2>&1

# Scan tokens on Binance
node -e "const ccxt = require('ccxt'); const b = new ccxt.binance(); b.loadMarkets().then(() => console.log('Binance loaded:', Object.keys(b.markets).length, 'pairs'));" 2>&1
```
