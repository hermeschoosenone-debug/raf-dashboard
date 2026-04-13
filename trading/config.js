// Trading Configuration — Z•I I•X Capital / Raf
// ⚠️ Add real API keys before going live

module.exports = {
  // === PORTFOLIO ===
  portfolio: {
    initialBalance: 30,         // Starting capital ($)
    target: 100000,             // Goal: $100k
    currency: 'USDT',           // Bybit uses USDT
  },

  // === RISK MANAGEMENT ===
  risk: {
    maxDrawdownPct: 10,         // Stop trading if drawdown exceeds 10%
    maxPositionPct: 5,          // Max 5% per trade (Z•II•X mandate)
    maxTotalExposurePct: 20,   // Max 20% total deployed
    defaultStopLossPct: 1.5,   // 1.5% stop loss default
    takeProfitMultiplier: 2,    // TP = 2xSL minimum
  },

  // === BYBIT ===
  bybit: {
    enabled: true,
    testnet: true,              // true = testnet, false = mainnet
    apiKey: '',                 // ⚠️ Add your Bybit API key
    apiSecret: '',              // ⚠️ Add your Bybit API secret
    // testnet: https://api-testnet.bybit.com
    // mainnet: https://api.bybit.com
  },

  // === EXCHANGES ===
  exchanges: {
    binance: {
      enabled: false,
      apiKey: process.env.BINANCE_API_KEY || '',
      secret: process.env.BINANCE_SECRET || '',
      testnet: true,
    },
    coinbase: {
      enabled: false,
      apiKey: process.env.COINBASE_API_KEY || '',
      secret: process.env.COINBASE_SECRET || '',
      sandbox: true,
    },
    kraken: {
      enabled: false,
      apiKey: process.env.KRAKEN_API_KEY || '',
      secret: process.env.KRAKEN_SECRET || '',
    },
  },

  // === MARKET DATA ===
  marketData: {
    coinmarketcap: {
      enabled: false,
      apiKey: process.env.CMC_API_KEY || '',
    },
  },

  // === PORTFOLIO STATES ===
  portfolioStates: {
    aggressive: { exposurePct: 20, stopLossPct: 1.0 },
    balanced:   { exposurePct: 12, stopLossPct: 1.5 },
    defensive:  { exposurePct: 5,  stopLossPct: 2.0 },
  },

  // === STRATEGIES ===
  strategies: {
    trendFollowing: {
      enabled: true,
      timeframe: '1h',
      indicators: ['EMA_20', 'EMA_50', 'RSI'],
    },
    meanReversion: {
      enabled: true,
      timeframe: '15m',
      indicators: ['RSI', 'BollingerBands'],
    },
    arbitrage: {
      enabled: true,
      exchanges: ['binance', 'coinbase'],
      minSpreadPct: 0.5,
    },
    eventDriven: {
      enabled: true,
      sources: ['news'],
    },
    gridTrading: {
      enabled: false,
      gridLevels: 10,
      gridSpacingPct: 1.0,
    },
  },

  // === LOGGING ===
  logging: {
    level: 'info',    // debug, info, warn, error
    file: '/root/.openclaw/workspace/raf/trading/logs/trades.log',
  },
};
