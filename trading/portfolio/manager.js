// Portfolio Manager — Raf
// Tracks positions, PnL, capital, and performance metrics

const fs = require('fs');

class PortfolioManager {
  constructor(config) {
    this.config = config;
    this.capital = config.portfolio.initialBalance;
    this.peakCapital = this.capital;
    this.positions = [];
    this.tradeLog = [];
    this.dailyPnL = 0;
    this.sessionStart = Date.now();
  }

  addPosition(position) {
    const { symbol, side, quantity, entryPrice, stopLoss, takeProfit, strategy, confidence } = position;

    const pos = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      side,
      quantity,
      entryPrice,
      currentPrice: entryPrice,
      stopLoss,
      takeProfit,
      strategy,
      confidence,
      openedAt: new Date().toISOString(),
      unrealizedPnL: 0,
      pnlPct: 0,
    };

    this.positions.push(pos);
    return pos;
  }

  closePosition(positionId, exitPrice, reason = 'manual') {
    const pos = this.positions.find(p => p.id === positionId);
    if (!pos) return null;

    const pnl = pos.side === 'BUY'
      ? (exitPrice - pos.entryPrice) * pos.quantity
      : (pos.entryPrice - exitPrice) * pos.quantity;

    const result = {
      ...pos,
      exitPrice,
      closedAt: new Date().toISOString(),
      realizedPnL: pnl,
      pnlPct: (pnl / (pos.entryPrice * pos.quantity)) * 100,
      exitReason: reason,
    };

    // Update capital
    this.capital += pnl;
    if (this.capital > this.peakCapital) {
      this.peakCapital = this.capital;
    }

    // Log trade
    this.tradeLog.push(result);

    // Remove from positions
    this.positions = this.positions.filter(p => p.id !== positionId);

    return result;
  }

  updatePositions(currentPrices) {
    for (const pos of this.positions) {
      const price = currentPrices[pos.symbol];
      if (price) {
        pos.currentPrice = price;
        pos.unrealizedPnL = pos.side === 'BUY'
          ? (price - pos.entryPrice) * pos.quantity
          : (pos.entryPrice - price) * pos.quantity;
        pos.pnlPct = (pos.unrealizedPnL / (pos.entryPrice * pos.quantity)) * 100;

        // Check stop loss / take profit
        if (pos.side === 'BUY') {
          if (pos.stopLoss && price <= pos.stopLoss) return { triggered: 'STOP_LOSS', position: pos, exitPrice: price };
          if (pos.takeProfit && price >= pos.takeProfit) return { triggered: 'TAKE_PROFIT', position: pos, exitPrice: price };
        } else {
          if (pos.stopLoss && price >= pos.stopLoss) return { triggered: 'STOP_LOSS', position: pos, exitPrice: price };
          if (pos.takeProfit && price <= pos.takeProfit) return { triggered: 'TAKE_PROFIT', position: pos, exitPrice: price };
        }
      }
    }
    return null;
  }

  getTotalExposure() {
    return this.positions.reduce((sum, pos) => sum + (pos.currentPrice * pos.quantity), 0);
  }

  getDrawdown() {
    return ((this.peakCapital - this.capital) / this.peakCapital) * 100;
  }

  getPerformance() {
    const totalTrades = this.tradeLog.length;
    const wins = this.tradeLog.filter(t => t.realizedPnL > 0);
    const losses = this.tradeLog.filter(t => t.realizedPnL <= 0);
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;

    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.realizedPnL, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.realizedPnL, 0) / losses.length) : 1;
    const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    const totalPnL = this.tradeLog.reduce((sum, t) => sum + t.realizedPnL, 0);
    const sharpe = this.calculateSharpe();
    const maxDrawdown = this.getDrawdown();

    return {
      capital: this.capital,
      peakCapital: this.peakCapital,
      totalPnL,
      totalPnLPct: ((this.capital - this.config.portfolio.initialBalance) / this.config.portfolio.initialBalance) * 100,
      totalTrades,
      winRate: winRate.toFixed(1),
      sharpe: sharpe.toFixed(2),
      maxDrawdown: maxDrawdown.toFixed(2),
      riskRewardRatio: riskRewardRatio.toFixed(2),
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
      activePositions: this.positions.length,
      exposure: this.getTotalExposure(),
      exposurePct: ((this.getTotalExposure() / this.capital) * 100).toFixed(1),
    };
  }

  calculateSharpe(riskFreeRate = 0.02) {
    if (this.tradeLog.length < 2) return 0;
    
    const returns = this.tradeLog.map(t => t.pnlPct / 100);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance) || 1;
    
    const sharpe = (avgReturn - riskFreeRate / 365) / stdDev * Math.sqrt(365);
    return isFinite(sharpe) ? sharpe : 0;
  }

  saveState(filepath = '/root/.openclaw/workspace/raf/trading/portfolio-state.json') {
    const state = {
      timestamp: new Date().toISOString(),
      capital: this.capital,
      peakCapital: this.peakCapital,
      positions: this.positions,
      tradeLog: this.tradeLog.slice(-100), // Keep last 100
      dailyPnL: this.dailyPnL,
      performance: this.getPerformance(),
    };
    fs.writeFileSync(filepath, JSON.stringify(state, null, 2));
    return state;
  }

  loadState(filepath = '/root/.openclaw/workspace/raf/trading/portfolio-state.json') {
    try {
      if (fs.existsSync(filepath)) {
        const state = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        this.capital = state.capital;
        this.peakCapital = state.peakCapital;
        this.positions = state.positions || [];
        this.tradeLog = state.tradeLog || [];
        return true;
      }
    } catch (e) {
      console.error('[Portfolio] Load error:', e.message);
    }
    return false;
  }

  getPositions() {
    return this.positions.map(p => ({
      ...p,
      unrealizedPnL: p.unrealizedPnL?.toFixed(2),
      pnlPct: p.pnlPct?.toFixed(2),
    }));
  }
}

module.exports = { PortfolioManager };
