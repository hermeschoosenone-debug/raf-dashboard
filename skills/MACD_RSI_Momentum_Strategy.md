# Skill: MACD + RSI Momentum Strategy

**Learned from:** FMZQuant, Axiory, Kavout, WunderTrading, Quantified Strategies  
**Date:** 2026-04-13  
**Type:** Technical Analysis / Momentum / Mean Reversion  
**Confidence:** 73%+ win rate with proper parameters  
**Applicable Markets:** Crypto, Forex, Equities (all timeframes)

---

## Core Concept

Combine **three core indicators** that each serve a specific purpose:

| Indicator | Purpose | Role |
|-----------|---------|------|
| **MACD** | Trend direction + momentum | Identifies trend changes, overall direction |
| **RSI** | Overbought/Oversold + divergence | Entry timing, divergence signals |
| **Slow MA (SMA)** | Trend filter | Confirms direction on higher timeframe |
| **Volume** | Confirms move strength | Volume spike confirms breakouts |

---

## Strategy Parameters

### MACD Settings (Crypto-Optimized)
- **Fast EMA:** 8 periods (not traditional 12)
- **Slow EMA:** 17 periods (not traditional 26)
- **Signal Line:** 9 periods
- *Faster settings reduce lag, better for crypto's fast moves*

### RSI Settings
- **Period:** 14 (standard) or 7 (more responsive)
- **Overbought:** 70 (sell zone)
- **Oversold:** 30 (buy zone)
- **Midline crossover:** 50 for trend confirmation

### Volume Requirement
- Volume > 20-period average = confirmation of breakout
- Volume spike (>2x average) = strong momentum signal

---

## Entry Rules

### **Bullish Entry (Long)**
```
1. Price ABOVE Slow MA (200 SMA) = uptrend confirmed
2. MACD line crosses ABOVE signal line (MACD crossover)
3. RSI crosses ABOVE 50 (momentum shifting positive) OR
   RSI shows bullish divergence (price makes lower low, RSI makes higher low)
4. Volume confirms: volume > 1.5x 20-period average
```

### **Bearish Entry (Short)**
```
1. Price BELOW Slow MA = downtrend confirmed
2. MACD line crosses BELOW signal line
3. RSI crosses BELOW 50 OR shows bearish divergence
4. Volume confirms breakout
```

---

## Exit Rules

### Take Profit (TP)
- **Target:** 1.5x to 2x the risk distance (Risk:Reward ≥ 1:1.5)
- Example: If stop loss is 5% away, take profit at 7.5-10% profit

### Stop Loss (SL)
- **Place at:** Recent swing high/low (for shorts: swing low)
- **Maximum:** 5-7% from entry for crypto
- **Never exceed:** Risk per trade dollar amount

### Trailing Stop
- Once price moves 2x risk in our favor, move SL to breakeven
- Then trail by 50% of the remaining move

---

## Divergence Rules (High-Conf Signal)

### Bullish Divergence (Strong Buy)
- Price makes a **lower low**
- RSI makes a **higher low** (hidden bullish)
- MACD makes a **higher low** (confirmation)
- → **Highest probability reversal signal**

### Bearish Divergence (Strong Sell)
- Price makes a **higher high**
- RSI makes a **lower high**
- MACD makes a **lower high**
- → **Strong reversal signal**

### Dual Divergence (Strongest)
- Both RSI and MACD show divergence simultaneously
- Price makes new high/low but BOTH indicators fail to confirm
- → **Highest conviction signal**

---

## Parameters for Crypto (15m - 4h timeframe)

```
Entry: MACD crossover + RSI > 50 + price above SMA 200
Stop: 3-5% below entry (or recent swing low)
TP: 6-10% above entry (2x risk minimum)
Volume: Required > 1.5x 20MA
Timeframe: 15min or 4hr for swing trades
Confidence boost: +15% if divergence present
```

---

## What I Learned (Key Insights)

1. **MACD alone is not enough** — 86% win rate claim requires combining with RSI and volume
2. **RSI divergence is the highest-probability signal** — when price and momentum disagree, momentum usually wins
3. **Volume is the filter** — don't trade MACD/RSI signals without volume confirmation
4. **Timeframe matters** — 4H signals are more reliable than 15m for swing trades
5. **Hidden divergence** (price makes lower low, RSI makes higher low) is more reliable than regular divergence

---

## When To Use

| Condition | Strategy |
|-----------|----------|
| Strong trend, pullback to SMA | Momentum continuation |
| Range-bound, RSI extremes | Mean reversion |
| Breakout from consolidation | MACD + volume confirmation |
| Price making new highs but RSI lower | **Bearish divergence → SELL** |
| Price making new lows but RSI higher | **Bullish divergence → BUY** |

---

## Risk Management Integration

- **Never risk more than 1-2% per trade** (Roo mandate: $5 on $35 = 14.3% — adjust for small accounts)
- **Fixed fractional sizing:** Risk % stays constant, position size adjusts
- **Kelly Criterion:** Can be used when win rate > 50% and R:R > 1.5

---

## Status
- **Confidence:** HIGH
- **Best for:** Trending markets, swing trades
- **Avoid during:** Low-volume choppy markets
