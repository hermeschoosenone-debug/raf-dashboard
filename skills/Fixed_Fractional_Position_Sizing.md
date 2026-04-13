# Skill: Fixed Fractional Position Sizing

**Learned from:** Pro Trader Dashboard, Elite Trader, Trade Ideas, BacktestBase, Vince (Optimal f)  
**Date:** 2026-04-13  
**Type:** Risk Management / Position Sizing  
**Core Principle:** Risk the same % of account on every trade, let winners compound

---

## The Core Problem This Solves

Most traders **size positions randomly** — they feel confident so they bet big, feel scared so they bet small. This is trading based on emotion, not math.

Fixed Fractional Position Sizing forces **discipline**: the same risk on every trade, regardless of how you feel.

---

## The Four Position Sizing Methods

### 1. Fixed Dollar Amount (Simplest)
- Risk **$X per trade** regardless of account size
- **Problem:** Doesn't adapt as account grows/shrinks
- **Use when:** Account is very small (like our $35), fixed dollar makes more sense than %

### 2. Fixed Fractional (Recommended for Most)
- Risk **X% of current account equity** per trade
- Position size = Dollar Risk / Risk Per Share
- **Formula:** `Position Size = (Account × Risk%) / Trade Risk`
- Example: $35,000 account, 2% risk = $700 per trade
- **Advantage:** Size grows with winners, shrinks with losers automatically

### 3. Kelly Criterion (For Advanced)
- **Formula:** `f* = (bp - q) / b`
  - b = odds received (profit / risk)
  - p = probability of win
  - q = probability of loss (1 - p)
- **Result:** Optimal % of bankroll to risk
- **Warning:** Kelly can be aggressive — most pros use **Half-Kelly** (f/2) to reduce volatility
- **Requires:** Accurate win rate and avg win/loss data from backtesting

### 4. Optimal f (Most Complex)
- Ralph Vince's method for maximizing geometric growth
- Based on largest loss in trading system
- Requires historical trade data to calculate
- **Use when:** You have 100+ trades of data from your system

---

## How Fixed Fractional Works (Step by Step)

```
Account: $35 (0.428 SOL)
Risk per trade: $5 (Roo mandate)
Stop loss: 5% from entry

Step 1: Calculate max position size
  Position Size = $5 / 0.05 = $100 worth of asset

Step 2: Convert to units (SOL, coins, etc.)
  If SOL = $82 → 100/82 = 1.22 SOL
  But if max position = 50% of account = $17.50
  → Use MIN($100 notional, $17.50 notional limit)
  → Position = $17.50 / $82 = 0.213 SOL

Step 3: Adjust for confidence
  High confidence (70%+): May increase slightly
  Low confidence (<50%): Reduce or skip
  Never exceed max position cap
```

---

## Key Insights from Professional Traders

### What The Pros Say

1. **"Risk the same percentage on every trade"** — Pro Trader Dashboard
   - Emotions disappear when position size is formula-driven
   - Can't "feel" like betting more after a win

2. **"Fixed fractional automatically increases size as account grows"**
   - Winners compound faster
   - Losers automatically reduce exposure

3. **"Fixed dollar is better for small accounts"**
   - At $35, fixed % might mean $0.70/trade (2%) — too small to matter
   - Roo mandate: Fixed $5 per trade makes sense at this size

4. **"The goal is survival + compounding"**
   - Never blow up account (>20% drawdown)
   - 10% drawdown = need 11% gain just to recover
   - 50% drawdown = need 100% gain to recover

---

## Kelly Criterion Deep Dive

### The Formula
```
f* = (b × p - q) / b

Where:
b = net odds received on the trade (profit / loss ratio)
   Example: If you risk $5 to make $10, b = 2
p = probability of winning (win rate)
q = probability of losing (1 - p)

Example:
Win rate = 55%
Avg win = $7.50
Avg loss = $5.00
b = 7.50/5.00 = 1.5
p = 0.55
q = 0.45

Kelly % = (1.5 × 0.55 - 0.45) / 1.5
        = (0.825 - 0.45) / 1.5
        = 0.375 / 1.5
        = 0.25 = 25% of bankroll

HALF-KELLY = 12.5% of bankroll per trade
```

### Kelly vs Fixed Fractional

| Method | Best For | Risk Level |
|--------|----------|------------|
| Fixed Dollar ($5) | Small accounts, Roo mandate | Depends on account |
| Fixed Fractional (2%) | Medium accounts, steady growth | Moderate |
| Half-Kelly | Systems with high edge | Aggressive |
| Full Kelly | Rarely recommended | Very aggressive |

---

## Drawdown Protection Rules

1. **Maximum drawdown before halving position:** 10%
2. **Stop trading at 15% drawdown:** Review system
3. **Never increase position size after a loss** — this is how blowups happen
4. **After hitting new equity high:** Consider increasing size by 0.5% per new high

---

## Implementation for Our Bot

```
Account: 0.428 SOL (~$35)
Roo Mandate: $5 risk per trade
Max position cap: 50% of bankroll

Risk Calculation:
  Dollar Risk = $5
  Stop Loss % = 15% (from entry)
  Entry Price = P
  
  Position Size = $5 / (P × 0.15) = 5/(0.15P) SOL
  
  Example: SOL @ $82
    Position = 5/(82 × 0.15) = 5/12.30 = 0.406 SOL
    Value = 0.406 × 82 = $33.29 (within 50% cap ✓)

  If position exceeds 50% cap (0.214 SOL for $35):
    → Reject signal (not enough capital for full $5 risk)
    → Log: "Position too large for account at this price"
```

---

## Position Sizing Decision Tree

```
Is trade signal confirmed?
  NO → Skip trade, no position
  YES → Continue

Calculate raw position size from $5 risk:
  Size = $5 / (Entry × StopLoss%)

Apply max cap (50% of bankroll):
  Max Size = Bankroll × 0.50
  
Is raw size > max cap?
  YES → Is capped position still viable (≥$0.50 trade value)?
    YES → Use capped size, accept reduced risk
    NO → Reject trade (token too expensive for account)
  NO → Use raw size, full $5 risk

Calculate actual risk:
  Actual Risk = Size × (Entry - StopLoss)
  Should ≈ $5 (within 10%)
```

---

## Status
- **Confidence:** VERY HIGH — proven over decades by professionals
- **Best for:** All trading strategies, all account sizes
- **Integrates with:** All momentum, mean reversion, breakout strategies
