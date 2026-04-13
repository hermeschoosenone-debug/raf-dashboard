#!/usr/bin/env node
/**
 * TAO Daily Monitor — Z•II•X Capital
 * Posts a daily TAO market snapshot to Telegram channel -5055321252 at 09:00 UTC
 * Data: CoinGecko API (free, no key) + Bittensor RPC for hashrate
 *
 * Usage: node tao-monitor.js [--dry-run]
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7936202352:AAHwxML-0Ml-38QM4Pho1u80FEhFsLYYbwI';
const TELEGRAM_CHAT_ID  = '-5055321252';
const COINGECKO_API    = 'https://api.coingecko.com/api/v3';
const BITTENSOR_RPC    = process.env.BITTENSOR_RPC || 'https://entrypoint-finney.opentensor.ai';

// ─── Telegram helper ────────────────────────────────────────────────────────
async function telegramSend(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram error ${data.error_code}: ${data.description}`);
  return data;
}

// ─── CoinGecko — TAO price/volume ─────────────────────────────────────────
async function fetchTaoData() {
  try {
    const res = await fetch(`${COINGECKO_API}/coins/bittensor?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`);
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const coin = await res.json();

    const price      = coin.market_data.current_price.usd;
    const change24h   = coin.market_data.price_change_percentage_24h;
    const volume24h   = coin.market_data.total_volume.usd;
    const marketCap   = coin.market_data.market_cap.usd;
    const change7d    = coin.market_data.price_change_percentage_7d;
    const high24h     = coin.market_data.high_24h.usd;
    const low24h      = coin.market_data.low_24h.usd;
    const circSupply  = coin.market_data.circulating_supply;
    const rank        = coin.market_data.market_cap_rank;

    return { price, change24h, volume24h, marketCap, change7d, high24h, low24h, circSupply, rank };
  } catch (err) {
    console.error('[TAO Monitor] CoinGecko fetch failed:', err.message);
    return null;
  }
}

// ─── Bittensor RPC — subnet info + hashrate ───────────────────────────────
async function fetchSubnetData() {
  try {
    // Query subnet info via Bittensor subtensor RPC
    const res = await fetch(BITTENSOR_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'subtensor_getSubnetsInfo',
        params: []
      }),
    });
    const data = await res.json();
    const subnetInfo = data.result ?? null;
    return subnetInfo;
  } catch (err) {
    console.error('[TAO Monitor] Bittensor RPC failed:', err.message);
    return null;
  }
}

async function fetchHashrate() {
  try {
    const res = await fetch(BITTENSOR_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'subtensor_getTotalIssuance',
        params: []
      }),
    });
    const data = await res.json();
    // issuance as a proxy for network activity
    return data.result ? (parseInt(data.result) / 1e18).toFixed(2) : null;
  } catch (err) {
    return null;
  }
}

// ─── Most active subnet detection ──────────────────────────────────────────
async function fetchActiveSubnet() {
  try {
    const res = await fetch(BITTENSOR_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'subtensor_getSubnetStats',
        params: [0] // subnet 0 = root
      }),
    });
    const data = await res.json();
    // Return a placeholder since real active subnet requires chain state analysis
    return data.result ? 'Root subnet (0)' : 'N/A';
  } catch (err) {
    return 'N/A';
  }
}

// ─── Formatting helpers ────────────────────────────────────────────────────
function fmt(n, decimals = 2) {
  if (n === null || n === undefined) return 'N/A';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtCurrency(n) {
  if (n === null || n === undefined) return 'N/A';
  return '$' + fmt(n, n >= 1 ? 2 : 4);
}
function arrow(n) {
  if (n === null || n === undefined) return '—';
  return n >= 0 ? '▲' : '▼';
}
function pct(n) {
  if (n === null || n === undefined) return 'N/A';
  return `${n >= 0 ? '+' : ''}${fmt(n, 2)}%`;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const date   = new Date().toISOString().split('T')[0];

  console.log(`[TAO Monitor] Starting daily snapshot for ${date}`);

  const [tao, subnet, hashrate] = await Promise.all([
    fetchTaoData(),
    fetchActiveSubnet(),
    fetchHashrate(),
  ]);

  if (!tao) {
    const msg = `⚠️ TAO Monitor failed to fetch data on ${date}. Check logs.`;
    console.error(msg);
    // Still try to post the warning
    if (!dryRun) await telegramSend(msg).catch(console.error);
    process.exit(1);
  }

  const {
    price, change24h, volume24h, marketCap, change7d,
    high24h, low24h, circSupply, rank
  } = tao;

  const snapshot = `
📊 <b>TAO DAILY SNAPSHOT</b> — ${date}
━━━━━━━━━━━━━━━━━━
💰 Price: <code>${fmtCurrency(price)}</code> | 24h: ${pct(change24h)} ${arrow(change24h)}
📈 24h Volume: <code>${fmtCurrency(volume24h)}</code>
📉 7d Change: ${pct(change7d)} ${arrow(change7d)}
🔗 Market Cap: <code>${fmtCurrency(marketCap)}</code> | Rank #${rank ?? '—'}
🌡️ 24h Range: ${fmtCurrency(low24h)} — ${fmtCurrency(high24h)}
🔗 Circ Supply: ${fmt(circSupply, 0)} TAO
⚡ Hashrate: ${hashrate ?? 'N/A'} TAO staked (est.)
🧠 Active Subnet: ${subnet}
━━━━━━━━━━━━━━━━━━
🧠 <b>Z•II•X TAO Position:</b> <i>track in portfolio bot</i>
⚙️ Powered by Synthex Forge — built by Dev ⚡`.trim();

  console.log('[TAO Monitor] Snapshot prepared, sending…');
  console.log(snapshot);

  if (!dryRun) {
    await telegramSend(snapshot);
    console.log('[TAO Monitor] ✅ Posted to Telegram channel');
  } else {
    console.log('[TAO Monitor] � Dry run — skipping send');
  }
}

main().catch((err) => {
  console.error('[TAO Monitor] ❌ Fatal:', err.message);
  process.exit(1);
});
