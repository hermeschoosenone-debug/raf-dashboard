// Crypto Market Scanner — Raf
// Scans crypto markets for opportunities and regime identification

const ccxt = require('ccxt');
const fs = require('fs');

class CryptoScanner {
  constructor(config) {
    this.config = config;
    this.exchanges = {};
    this.topPairs = [
      'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 
      'SOL/USDT', 'XRP/USDT', 'DOGE/USDT',
      'ADA/USDT', 'AVAX/USDT', 'DOT/USDT'
    ];
  }

  async init() {
    const enabledExchanges = Object.entries(this.config.exchanges)
      .filter(([_, cfg]) => cfg.enabled)
      .map(([name]) => name);

    for (const name of enabledExchanges) {
      try {
        const exchange = new ccxt[name]({
          apiKey: this.config.exchanges[name].apiKey,
          secret: this.config.exchanges[name].secret,
          enableRateLimit: true,
        });
        if (this.config.exchanges[name].testnet) {
          exchange.setSandboxMode(true);
        }
        await exchange.loadMarkets();
        this.exchanges[name] = exchange;
        console.log(`[Scanner] ${name} loaded — ${Object.keys(exchange.markets).length} pairs`);
      } catch (e) {
        console.error(`[Scanner] Failed to load ${name}:`, e.message);
      }
    }
  }

  async scanMarkets() {
    const results = {
      timestamp: new Date().toISOString(),
      regime: 'unknown',
      pairs: [],
      opportunities: [],
      alerts: [],
      volatility: 'normal',
    };

    if (Object.keys(this.exchanges).length === 0) {
      results.note = 'No exchanges connected — using public data';
      // Fall back to Binance public data
      try {
        const binance = new ccxt.binance({ enableRateLimit: true });
        await binance.loadMarkets();
        this.exchanges.binance = binance;
      } catch (e) {
        results.error = e.message;
        return results;
      }
    }

    const primaryExchange = this.exchanges.binance || Object.values(this.exchanges)[0];

    for (const symbol of this.topPairs) {
      try {
        const ticker = await primaryExchange.fetchTicker(symbol);
        const results_1 = require('/root/.openclaw/workspace/raf/trading/scanners/crypto-scanner.js').default;
        
        const data = {
          symbol,
          price: ticker.last,
          change24h: ticker.change || 0,
          changePct24h: ticker.changePercent || 0,
          volume24h: ticker.baseVolume || 0,
          high24h: ticker.high || 0,
          low24h: ticker.low || 0,
          spread: ticker.ask && ticker.bid ? ((ticker.ask - ticker.bid) / ticker.last) * 100 : 0,
        };

        // Calculate simple regime indicators
        const atr = await this.getATR(primaryExchange, symbol, 14);
        data.volatility = atr;

        // Trend detection
        const trend = this.detectTrend(data);
        data.trend = trend;

        // Identify opportunities
        if (Math.abs(data.changePct24h) > 5) {
          results.opportunities.push({
            type: data.changePct24h > 0 ? 'BREAKOUT' : 'DUMP',
            symbol,
            ...data,
          });
          results.alerts.push(`${symbol} moved ${data.changePct24h.toFixed(2)}% in 24h`);
        }

        if (data.spread > 0.1) {
          results.opportunities.push({
            type: 'WIDE_SPREAD',
            symbol,
            spread: data.spread,
          });
        }

        results.pairs.push(data);
      } catch (e) {
        console.error(`[Scanner] Error scanning ${symbol}:`, e.message);
      }
    }

    // Determine market regime
    const avgChange = results.pairs.reduce((sum, p) => sum + Math.abs(p.changePct24h || 0), 0) / results.pairs.length;
    if (avgChange > 5) results.regime = 'volatile';
    else if (avgChange > 2) results.regime = 'trending';
    else if (avgChange > 0.5) results.regime = 'choppy';
    else results.regime = 'calm';

    return results;
  }

  detectTrend(data) {
    if (data.changePct24h > 3) return 'STRONG_UP';
    if (data.changePct24h > 1) return 'UP';
    if (data.changePct24h < -3) return 'STRONG_DOWN';
    if (data.changePct24h < -1) return 'DOWN';
    return 'NEUTRAL';
  }

  async getATR(exchange, symbol, period = 14) {
    try {
      const ohlcv = await exchange.fetchOHLCV(symbol, '1h', undefined, period + 10);
      const trs = [];
      for (let i = 1; i < ohlcv.length; i++) {
        const high = ohlcv[i][2];
        const low = ohlcv[i][3];
        const prevClose = ohlcv[i - 1][4];
        const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
        trs.push(tr);
      }
      const atr = trs.slice(-period).reduce((a, b) => a + b, 0) / period;
      return atr;
    } catch (e) {
      return 0;
    }
  }

  async getOrderBook(symbol, limit = 20) {
    const exchange = this.exchanges.binance || Object.values(this.exchanges)[0];
    try {
      return await exchange.fetchOrderBook(symbol, limit);
    } catch (e) {
      console.error(`[Scanner] Order book error:`, e.message);
      return null;
    }
  }
}

module.exports = { CryptoScanner };

// CLI mode
if (require.main === module) {
  const config = require('../config.js');
  const scanner = new CryptoScanner(config);
  
  scanner.init().then(async () => {
    console.log('\n=== CRYPTO MARKET SCAN ===');
    const results = await scanner.scanMarkets();
    console.log('Regime:', results.regime.toUpperCase());
    console.log('Pairs scanned:', results.pairs.length);
    console.log('\nTop Movers:');
    results.pairs
      .sort((a, b) => Math.abs(b.changePct24h) - Math.abs(a.changePct24h))
      .slice(0, 5)
      .forEach(p => {
        console.log(`  ${p.symbol}: $${p.price?.toFixed(4)} (${p.changePct24h?.toFixed(2)}%)`);
      });
    if (results.opportunities.length > 0) {
      console.log('\nOpportunities:');
      results.opportunities.slice(0, 3).forEach(o => console.log(`  [${o.type}] ${o.symbol}`));
    }
    if (results.alerts.length > 0) {
      console.log('\nAlerts:');
      results.alerts.forEach(a => console.log(`  🚨 ${a}`));
    }
  }).catch(console.error);
}
