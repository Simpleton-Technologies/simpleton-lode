/**
 * LodeRuntime™ and Lode Architecture™
 * Copyright © 2025 Demiris Brown. All Rights Reserved.
 *
 * This software is the proprietary and confidential information of
 * Ladale Industries LLC (parent company of Simpleton Technologies).
 *
 * Unauthorized copying, distribution, or use of this software, in whole
 * or in part, via any medium is strictly prohibited. This software is
 * protected under United States and international copyright and trade
 * secret laws. No license, express or implied, is granted for any use
 * other than as explicitly authorized in writing by Demiris Brown.
 *
 * For licensing inquiries, contact: Founder@simpletontechnologies.com
 *
 * LodeRuntime, Lode Architecture, and the Lode logo are trademarks of
 * Ladale Industries LLC.
 */

/**
 * Real-Time Market Data Synchronization — with Self-Healing.
 *
 * On a successful fetch the price is proposed with `proposer: 'market-feed'`
 * and stale state is cleared (`stale: false`, `lastSuccess`, `retryCount: 0`).
 * On a fetch failure the node is proposed *without* a new `value` — only
 * the stale flag, retryCount, and lastAttempt are spread into props. Because
 * `AstNode.update()` merges props via spread, the last-known-good price is
 * preserved; the UI keeps showing the number while the dot dims naturally
 * as the freshness neuron decays (no freshness spike fires on self-heal).
 *
 * The `proposer` tag matters — `trace.why()` sees 'market-feed' vs
 * 'self-heal' as first-class entries. The CivilianWhyTooltip uses this
 * distinction to render "Updated 11:04 from live feed" vs "Last known
 * price (reconnecting)".
 *
 * Overlap guard: once a retry chain is active for a symbol it stays
 * `inFlight` until success. The 5s interval-driven tick is a no-op for
 * that symbol during an outage, so we don't stack parallel retries.
 *
 * StrictMode hygiene: start() returns a stop function that clears the
 * two intervals *and* every pending retry timer.
 */
export class MarketDataSync {
  static start(runtime, siteAST) {
    const freshnessMap = {
      XAUUSD: siteAST.goldFreshnessNeuron,
      XAGUSD: siteAST.silverFreshnessNeuron,
      XPTUSD: siteAST.platinumFreshnessNeuron,
      XPDUSD: siteAST.palladiumFreshnessNeuron,
    };

    const inFlight = new Set();
    const retryTimers = new Set();

    const updatePrice = async (nodeId, symbol, isRetry = false) => {
      // Don't stack retries: if a retry chain is already running for this
      // symbol, the 5s interval-driven fire should skip. A retry call
      // (isRetry=true) always proceeds — that's the chain continuing.
      if (!isRetry && inFlight.has(symbol)) return;
      inFlight.add(symbol);

      try {
        const res = await fetch(`/api/market/${symbol}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // newValue as object → AstNode.update spreads it into props, so
        // `stale`/`lastSuccess`/`retryCount` land as sibling props next to
        // `value`. evaluate() still returns node.props.value for readers.
        await runtime.proposeMutation('set', nodeId, {
          bindingName: symbol,
          newValue: {
            value: data.price,
            stale: false,
            lastSuccess: Date.now(),
            retryCount: 0,
          },
        }, 'market-feed');

        runtime.brain.stimulate(siteAST.marketUpdateNeuron, 30);
        const freshnessNeuron = freshnessMap[symbol];
        if (freshnessNeuron) runtime.brain.stimulate(freshnessNeuron, 42);

        inFlight.delete(symbol);
      } catch (err) {
        const node = runtime.astStore.get(nodeId);
        const retryCount = (node?.props?.retryCount || 0) + 1;

        // Mark stale but keep last value — no `value` field in the update
        // means the spread-merge in node.update() preserves the previous
        // price. Freshness neuron is deliberately NOT stimulated, so its
        // LIF potential continues decaying and the UI dot dims on its own.
        await runtime.proposeMutation('set', nodeId, {
          bindingName: symbol,
          newValue: {
            stale: true,
            retryCount,
            lastAttempt: Date.now(),
          },
        }, 'self-heal');

        console.warn(`[market-feed] ${symbol} fetch failed (attempt ${retryCount}): ${err.message}`);

        // Exponential backoff, capped at 30s. No ceiling on attempts —
        // network outages should eventually recover.
        const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(retryCount, 6)));
        const timer = setTimeout(() => {
          retryTimers.delete(timer);
          updatePrice(nodeId, symbol, true);
        }, delay);
        retryTimers.add(timer);
        // stay inFlight — the interval shouldn't fire a parallel attempt
      }
    };

    const updateDiamondIndex = async () => {
      try {
        const res = await fetch('/api/diamond-index');
        if (!res.ok) return;
        const data = await res.json();
        await runtime.proposeMutation('set', siteAST.diamondIndex.id, {
          bindingName: 'diamondIndex',
          newValue: data.value,
        }, 'market-feed');
      } catch (_) { /* silent; 30s cadence, not ticker-critical */ }
    };

    const updateRolexDB = async () => {
      try {
        const res = await fetch('/api/rolex/market');
        if (!res.ok) return;
        const data = await res.json();
        await runtime.proposeMutation('set', siteAST.rolexDatabase.id, {
          bindingName: 'rolexDB',
          newValue: data,
        }, 'market-feed');
      } catch (_) { /* silent */ }
    };

    // Initial fetch
    updatePrice(siteAST.goldPrice.id,      'XAUUSD');
    updatePrice(siteAST.silverPrice.id,    'XAGUSD');
    updatePrice(siteAST.platinumPrice.id,  'XPTUSD');
    updatePrice(siteAST.palladiumPrice.id, 'XPDUSD');
    updateDiamondIndex();
    updateRolexDB();

    const metalsInterval = setInterval(() => {
      updatePrice(siteAST.goldPrice.id,      'XAUUSD');
      updatePrice(siteAST.silverPrice.id,    'XAGUSD');
      updatePrice(siteAST.platinumPrice.id,  'XPTUSD');
      updatePrice(siteAST.palladiumPrice.id, 'XPDUSD');
    }, 5000);

    const assetsInterval = setInterval(() => {
      updateDiamondIndex();
      updateRolexDB();
    }, 30000);

    return () => {
      clearInterval(metalsInterval);
      clearInterval(assetsInterval);
      for (const t of retryTimers) clearTimeout(t);
      retryTimers.clear();
      inFlight.clear();
    };
  }
}
