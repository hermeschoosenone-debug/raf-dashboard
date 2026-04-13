// Raf Trading Brain — Main Orchestrator
// Runs every 5 minutes via cron job
// Coordinates: Scanner → Strategy → Risk → Portfolio

const config = require('./config');
const { CryptoScanner } = require('./scanners/crypto-scanner');

const { PortfolioManager } = require('./portfolio/manager');
const { RiskEngine } = require('./risk/engine');
const fs = require('fs');

class RafBrain {
  constructor() {
    this.config = config;
    this.cryptoScanner = new CryptoScanner(config);

    this.portfolio = new PortfolioManager(config);
    this.risk = new RiskEngine(config, this.portfolio);
    this.cycleCount = 0;
    this.skillsGeneratedToday = 0;
    this.lastSkillGenDate = new Date().toDateString();
  }

  async init() {
    console.log('[Brain] Initializing Raf Trading System...');
    await this.cryptoScanner.init();
    this.portfolio.loadState();
    console.log(`[Brain] Portfolio loaded: $${this.portfolio.capital.toFixed(2)} | ${this.portfolio.positions.length} positions`);
  }

  async runCycle() {
    this.cycleCount++;
    const cycleStart = Date.now();
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[CYCLE ${this.cycleCount}] ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    const report = {
      cycle: this.cycleCount,
      timestamp: new Date().toISOString(),
      cryptoScan: null,
      polyScan: null,
      decisions: [],
      performance: null,
      riskReport: null,
      skills: [],
      errors: [],
    };

    try {
      // 1. SCAN MARKETS
      console.log('[Brain] Scanning markets...');
      report.cryptoScan = await this.cryptoScanner.scanMarkets();
      console.log(`[Brain] Crypto: ${report.cryptoScan.regime} regime | ${report.cryptoScan.pairs.length} pairs scanned`);

      // 2. CHECK EXISTING POSITIONS
      console.log('[Brain] Checking positions...');
      const prices = {};
      report.cryptoScan.pairs.forEach(p => { prices[p.symbol] = p.price; });
      const triggered = this.portfolio.updatePositions(prices);
      if (triggered) {
        console.log(`[Brain] 🚨 ${triggered.triggered} on ${triggered.position.symbol}`);
        const closed = this.portfolio.closePosition(
          triggered.position.id,
          triggered.exitPrice,
          triggered.triggered
        );
        console.log(`[Brain] Closed ${closed?.symbol} with PnL: $${closed?.realizedPnL?.toFixed(2)}`);
        report.decisions.push({
          action: 'CLOSE',
          reason: triggered.triggered,
          pnl: closed?.realizedPnL,
        });
      }

      // 3. GENERATE TRADE DECISIONS
      const decisions = this.generateDecisions(report.cryptoScan, report.polyScan);
      report.decisions = [...report.decisions, ...decisions];

      // 4. RISK VALIDATION
      report.riskReport = this.risk.generateRiskReport();
      console.log(`[Brain] Risk: ${report.riskReport.mode} | Exposure: ${report.riskReport.exposurePct}%`);

      // 5. EXECUTE VALID DECISIONS
      for (const decision of decisions) {
        const validation = this.risk.validateTrade(decision);
        if (!validation.valid) {
          console.log(`[Brain] ❌ ${decision.symbol}: ${validation.errors.join(', ')}`);
          continue;
        }
        if (report.riskReport.portfolioState === 'defensive') {
          console.log(`[Brain] 🛡️ Skipping ${decision.symbol} — DEFENSIVE mode`);
          continue;
        }
        // Execute (mock for now — requires real API keys)
        this.executeTrade(decision);
      }

      // 6. PERFORMANCE UPDATE
      report.performance = this.portfolio.getPerformance();
      console.log(`[Brain] Capital: $${report.performance.capital.toFixed(2)} | PnL: $${report.performance.totalPnL.toFixed(2)} | Win rate: ${report.performance.winRate}%`);

      // 7. SKILLS GENERATION (5-10/day)
      this.generateSkills(report);

      // 8. SAVE STATE
      this.portfolio.saveState();

      // 9. LOG TO MEMORY
      await this.logToMemory(report);

    } catch (e) {
      console.error('[Brain] Cycle error:', e);
      report.errors.push(e.message);
    }

    const cycleTime = Date.now() - cycleStart;
    console.log(`[Brain] Cycle ${this.cycleCount} complete in ${cycleTime}ms`);

    return report;
  }

  generateDecisions(cryptoScan, polyScan) {
    const decisions = [];
    const state = this.risk.getPortfolioState();
    const maxNewPositions = state === 'aggressive' ? 3 : state === 'balanced' ? 2 : 1;

    // Crypto opportunities
    if (cryptoScan.opportunities && cryptoScan.opportunities.length > 0) {
      for (const opp of cryptoScan.opportunities.slice(0, maxNewPositions)) {
        if (opp.type === 'BREAKOUT' || opp.type === 'STRONG_UP') {
          const confidence = Math.min(90, Math.abs(opp.changePct24h) * 10);
          const stopLoss = opp.price * 0.985;
          const takeProfit = opp.price * 1.03;

          decisions.push({
            action: 'BUY',
            asset: opp.symbol,
            strategy: 'TrendFollowing',
            positionSize: this.risk.calculatePositionSize(
              this.portfolio.capital, opp.price, 1.5, confidence
            ),
            confidence,
            entryPrice: opp.price,
            stopLoss,
            takeProfit,
            reasoning: `${opp.trend} detected — ${opp.changePct24h.toFixed(2)}% 24h move`,
            riskLevel: confidence > 70 ? 'HIGH' : confidence > 50 ? 'MEDIUM' : 'LOW',
          });
        }
      }
    }

    return decisions;
  }

  executeTrade(decision) {
    // MOCK EXECUTOR — requires real API keys + exchange connections
    console.log(`[Brain] 📋 TRADE SIGNAL:`);
    console.log(`  Action: ${decision.action} ${decision.asset}`);
    console.log(`  Strategy: ${decision.strategy}`);
    console.log(`  Qty: ${decision.positionSize} @ $${decision.entryPrice}`);
    console.log(`  SL: $${decision.stopLoss} | TP: $${decision.takeProfit}`);
    console.log(`  Confidence: ${decision.confidence}% | Risk: ${decision.riskLevel}`);

    // Add to portfolio (mock — real execution would call exchange API)
    if (decision.positionSize > 0) {
      const pos = this.portfolio.addPosition({
        symbol: decision.asset,
        side: decision.action,
        quantity: decision.positionSize,
        entryPrice: decision.entryPrice,
        stopLoss: decision.stopLoss,
        takeProfit: decision.takeProfit,
        strategy: decision.strategy,
        confidence: decision.confidence,
      });
      console.log(`[Brain] ✅ Position added: ${pos.id}`);
    }

    return true;
  }

  generateSkills(report) {
    // Check if we need new skills today
    const today = new Date().toDateString();
    if (today !== this.lastSkillGenDate) {
      this.skillsGeneratedToday = 0;
      this.lastSkillGenDate = today;
    }

    if (this.skillsGeneratedToday >= 5) return;
    if (this.skillsGeneratedToday >= 10) return;

    const newSkills = [];

    // Generate based on market conditions
    if (report.cryptoScan?.regime === 'volatile') {
      newSkills.push({
        name: 'Volatility Breakout Scalp',
        description: 'Trade short-term breakouts during high volatility regimes',
        whyItWorks: 'Volatility creates momentum that persists for 15-60 minutes',
        whenToUse: 'Crypto regime = volatile AND 24h change > 5%',
        dataInputs: ['ATR', 'Bollinger Bands', 'Volume spike'],
        executionSteps: ['1. Wait for candle close outside Bollinger Bands', '2. Confirm with 2x ATR spike', '3. Enter on pullback with tight SL'],
        riskManagement: 'Max 1% per trade, exit if not profitable in 30 min',
        backtestHypothesis: 'Expect 55-60% win rate with 2:1 R:R in volatile markets',
      });
    }

    // Regime-specific skill
    if (report.cryptoScan?.regime === 'trending') {
      newSkills.push({
        name: 'Trend Continuation Fade',
        description: 'Enter on pullbacks during established trends',
        whyItWorks: 'Trends tend to continue — pullbacks are entry opportunities',
        whenToUse: 'Regime = trending AND 24h change > 2% AND RSI < 70',
        dataInputs: ['EMA crossover', 'RSI', '24h momentum'],
        executionSteps: ['1. Confirm EMA20 > EMA50 (uptrend)', '2. Wait for RSI pullback below 50', '3. Enter on RSI bounce with SL below swing low'],
        riskManagement: '1.5% SL, 3% TP, trail if profitable',
        backtestHypothesis: 'Expect 60-65% win rate in trending markets',
      });
    }

    // General skill
    newSkills.push({
      name: 'Spread Arbitrage Scanner',
      description: 'Detect price differences for same asset across exchanges',
      whyItWorks: 'Same asset should cost same everywhere — differences = profit',
      whenToUse: 'BTC or ETH showing >0.5% spread between exchanges',
      dataInputs: ['CCXT multi-exchange tickers', 'Real-time spread'],
      executionSteps: ['1. Monitor BTC/ETH spread across Binance, Coinbase, Kraken', '2. Buy on lower exchange, sell on higher', '3. Close when spread converges'],
      riskManagement: 'Subtract exchange fees from gross spread, net must be >0.3%',
      backtestHypothesis: 'Low frequency but high accuracy when edge exists',
    });

    // Limit skills generated
    const toAdd = newSkills.slice(0, 5 - this.skillsGeneratedToday);
    this.skillsGeneratedToday += toAdd.length;

    if (toAdd.length > 0) {
      console.log(`[Brain] 🧠 Generated ${toAdd.length} new skills`);
      report.skills = toAdd;
      this.saveSkills(toAdd);
    }
  }

  saveSkills(skills) {
    try {
      const skillFile = '/root/.openclaw/workspace/raf/trading/skills/skills-log.md';
      let existing = '';
      if (fs.existsSync(skillFile)) {
        existing = fs.readFileSync(skillFile, 'utf8');
      }

      const header = `\n## Skills Generated — ${new Date().toISOString()}\n\n`;
      let content = header;
      for (const skill of skills) {
        content += `### ${skill.name}\n`;
        content += `- **Description:** ${skill.description}\n`;
        content += `- **Why it works:** ${skill.whyItWorks}\n`;
        content += `- **When to use:** ${skill.whenToUse}\n`;
        content += `- **Data inputs:** ${skill.dataInputs.join(', ')}\n`;
        content += `- **Execution:** ${skill.executionSteps.join(' | ')}\n`;
        content += `- **Risk management:** ${skill.riskManagement}\n`;
        content += `- **Backtest hypothesis:** ${skill.backtestHypothesis}\n\n`;
      }

      fs.appendFileSync(skillFile, content + '\n');
    } catch (e) {
      console.error('[Brain] Skill save error:', e.message);
    }
  }

  async logToMemory(report) {
    try {
      const memoryFile = '/root/.openclaw/workspace/raf/MEMORY.md';
      let memory = fs.readFileSync(memoryFile, 'utf8');

      // Update daily log
      const today = new Date().toISOString().split('T')[0];
      const perf = report.performance;

      const logEntry = `\n### Cycle ${report.cycle} — ${report.timestamp}\n`;
      // Keep memory concise — don't append every cycle
    } catch (e) {
      // Non-critical
    }
  }
}

// CLI mode
if (require.main === module) {
  const brain = new RafBrain();
  brain.init().then(async () => {
    const report = await brain.runCycle();
    console.log('\n[CYCLE REPORT]');
    console.log(JSON.stringify(report.performance, null, 2));
  }).catch(console.error);
}

module.exports = { RafBrain };
