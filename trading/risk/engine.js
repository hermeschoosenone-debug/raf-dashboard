// Risk Engine — Raf
// Handles position sizing, drawdown protection, and exposure control

const fs = require('fs');

class RiskEngine {
  constructor(config, portfolioManager) {
    this.config = config;
    this.pm = portfolioManager;
    this.dailyLossLimit = config.risk.maxDrawdownPct;
    this.maxPositionPct = config.risk.maxPositionPct;
    this.maxExposurePct = config.risk.maxTotalExposurePct;
  }

  calculatePositionSize(capital, price, stopLossPct, confidence, strategyPerformance = {}) {
    // Kelly-inspired sizing adjusted by confidence and historical performance
    const baseRisk = capital * (this.maxPositionPct / 100);
    
    // Adjust based on confidence (0-100)
    const confidenceMultiplier = confidence / 100;
    
    // Adjust based on historical performance (0.5 - 1.5 range)
    const performanceMultiplier = Math.min(1.5, Math.max(0.5, (strategyPerformance.winRate || 0.5) * 2));
    
    // Adjust for volatility
    const stopLossMultiplier = 1 / stopLossPct;
    
    let size = baseRisk * confidenceMultiplier * performanceMultiplier * stopLossMultiplier;
    
    // Hard cap at max position
    const maxPosition = capital * (this.maxPositionPct / 100);
    size = Math.min(size, maxPosition);
    
    // Min size (at least $10 worth)
    const minSize = 10;
    if (size < minSize) return 0;

    return Math.floor(size / price); // Return quantity
  }

  checkDrawdown(capital, peakCapital, currentDrawdown) {
    const drawdownPct = ((peakCapital - capital) / peakCapital) * 100;
    
    if (drawdownPct >= this.dailyLossLimit) {
      return {
        allowed: false,
        mode: 'DEFENSIVE',
        reason: `Drawdown ${drawdownPct.toFixed(2)}% exceeds limit of ${this.dailyLossLimit}%`,
        action: 'STOP_TRADING',
      };
    }

    if (drawdownPct >= this.dailyLossLimit * 0.5) {
      return {
        allowed: true,
        mode: 'DEFENSIVE',
        reason: `Drawdown warning: ${drawdownPct.toFixed(2)}%`,
        action: 'REDUCE_EXPOSURE',
      };
    }

    return { allowed: true, mode: 'NORMAL', reason: null, action: null };
  }

  checkExposure(currentExposure, proposedTradeValue) {
    const totalExposure = currentExposure + proposedTradeValue;
    const maxExposure = this.pm.capital * (this.maxExposurePct / 100);

    if (totalExposure > maxExposure) {
      return {
        allowed: false,
        reason: `Proposed trade would exceed max exposure (${this.maxExposurePct}%)`,
        availableSpace: maxExposure - currentExposure,
      };
    }

    return { allowed: true, availableSpace: maxExposure - totalExposure };
  }

  validateTrade(trade) {
    const { symbol, quantity, price, stopLoss, takeProfit, confidence } = trade;
    const side = trade.side || trade.action;

    const errors = [];
    const warnings = [];

    if (!['BUY', 'SELL'].includes(trade.side || trade.action)) {
      errors.push('Invalid side — must be BUY or SELL');
    }

    if (quantity <= 0) {
      errors.push('Quantity must be positive');
    }

    if (price <= 0) {
      errors.push('Price must be positive');
    }

    if (stopLoss && stopLoss >= price && side === 'BUY') {
      errors.push('Stop loss must be below entry for BUY');
    }

    if (stopLoss && stopLoss <= price && side === 'SELL') {
      errors.push('Stop loss must be above entry for SELL');
    }

    if (takeProfit && takeProfit <= price && side === 'BUY') {
      errors.push('Take profit must be above entry for BUY');
    }

    if (takeProfit && takeProfit >= price && side === 'SELL') {
      errors.push('Take profit must be below entry for SELL');
    }

    if (confidence && (confidence < 0 || confidence > 100)) {
      errors.push('Confidence must be 0-100');
    }

    // Warnings
    if (stopLoss && Math.abs((stopLoss - price) / price) < 0.005) {
      warnings.push('Stop loss very tight (< 0.5%)');
    }

    if (quantity * price > this.pm.capital * 0.1) {
      warnings.push('Trade size > 10% of capital');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  getPortfolioState() {
    const exposure = this.pm.getTotalExposure();
    const exposurePct = (exposure / this.pm.capital) * 100;
    const drawdown = this.pm.getDrawdown();

    if (drawdown >= this.dailyLossLimit * 0.8 || exposurePct > 15) {
      return 'defensive';
    }
    if (drawdown >= this.dailyLossLimit * 0.3 || exposurePct > 8) {
      return 'balanced';
    }
    return 'aggressive';
  }

  generateRiskReport() {
    const state = this.getPortfolioState();
    const exposure = this.pm.getTotalExposure();
    const exposurePct = (exposure / this.pm.capital) * 100;
    const drawdown = this.pm.getDrawdown();

    return {
      timestamp: new Date().toISOString(),
      portfolioState: state,
      totalExposure: exposure,
      exposurePct: exposurePct.toFixed(2),
      maxExposurePct: this.maxExposurePct,
      drawdownPct: drawdown.toFixed(2),
      maxDrawdownPct: this.dailyLossLimit,
      positions: this.pm.positions.length,
      dailyLossLimit: this.dailyLossLimit,
      mode: state === 'defensive' ? '🔴 DEFENSIVE' : state === 'balanced' ? '🟡 BALANCED' : '🟢 AGGRESSIVE',
    };
  }
}

module.exports = { RiskEngine };
