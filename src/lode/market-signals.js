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
 */

/**
 * Market-signals layer for simpleton-lode.
 *
 * Turns the raw market-data node (price + stale flag) into a small tree
 * of derived nodes so the UI can show more than a single spot number:
 *
 *   market-data            ← existing; raw value + stale flag
 *   └── price-history      ← capped window of recent ticks (last N)
 *       ├── ma:fast        ← moving-average, short window (e.g. 5 ticks)
 *       ├── ma:slow        ← moving-average, longer window (e.g. 20 ticks)
 *       ├── volatility     ← stdev of period-over-period returns
 *       └── trend-signal   ← {direction, strength} from MA crossover
 *
 * Every derived node is isRoot:true so evaluate() populates valueStore
 * directly, and the existing subscribe/useLodeValue pipeline in
 * simpleton-lode reacts to derived-value changes without any custom
 * glue. Evaluators read child values via runtime.evaluate(childId) which
 * honors the runtime's memoization cache.
 *
 * Dependency-graph wiring is explicit. Core's rebuildDependencies does
 * not auto-wire custom types' children, so we call
 * `runtime.depGraph.addDependency(dependentId, dependencyId)` by hand
 * when spawning. This is the same pattern `LivingRuntime.load()` uses
 * for its baked-in sample graph (price / quantity / discount / total).
 *
 * On each market tick, `appendTick(runtime, priceHistoryId, {value, ts})`
 * sets a new bounded `ticks` array into the price-history node. That
 * single set mutation cascades through _reEvaluateSet to all four
 * derived nodes automatically.
 */

import { AstNode } from './runtime.js';

export const PRICE_HISTORY_CAP = 120;
export const MA_FAST_WINDOW    = 5;
export const MA_SLOW_WINDOW    = 20;
export const VOLATILITY_WINDOW = 20;

// ─── Evaluators ────────────────────────────────────────────────────────

export function priceHistoryEvaluator(node) {
  // ticks is an array of { value, ts } sorted oldest→newest. Returning
  // the raw array makes the derived nodes' evaluators trivial.
  return Array.isArray(node.props.ticks) ? node.props.ticks : [];
}

export function movingAverageEvaluator(node, runtime) {
  const historyId = node.children[0];
  if (!historyId) return null;
  const ticks = runtime.evaluate(historyId);
  if (!Array.isArray(ticks) || ticks.length === 0) return null;
  const window = Number.isInteger(node.props.window) ? node.props.window : MA_FAST_WINDOW;
  const slice = ticks.slice(-window);
  const sum = slice.reduce((acc, t) => acc + (Number.isFinite(t.value) ? t.value : 0), 0);
  return slice.length > 0 ? sum / slice.length : null;
}

export function volatilityEvaluator(node, runtime) {
  const historyId = node.children[0];
  if (!historyId) return 0;
  const ticks = runtime.evaluate(historyId);
  if (!Array.isArray(ticks) || ticks.length < 2) return 0;
  const window = Number.isInteger(node.props.window) ? node.props.window : VOLATILITY_WINDOW;
  const slice = ticks.slice(-(window + 1));
  const returns = [];
  for (let i = 1; i < slice.length; i++) {
    const prev = slice[i - 1].value;
    const curr = slice[i].value;
    if (Number.isFinite(prev) && prev !== 0 && Number.isFinite(curr)) {
      returns.push((curr - prev) / prev);
    }
  }
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance);
}

export function trendSignalEvaluator(node, runtime) {
  // children = [ma:fast id, ma:slow id]
  const fast = runtime.evaluate(node.children[0]);
  const slow = runtime.evaluate(node.children[1]);
  if (fast == null || slow == null) return { direction: 'neutral', strength: 0 };
  if (!Number.isFinite(fast) || !Number.isFinite(slow)) return { direction: 'neutral', strength: 0 };
  const delta = fast - slow;
  const base = slow !== 0 ? Math.abs(slow) : 1;
  const pct = delta / base;
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral';
  const strength = Math.min(1, Math.abs(pct) * 100);
  return { direction, strength };
}

// ─── Type registration ─────────────────────────────────────────────────

export function registerMarketSignalTypes(runtime) {
  runtime.registerNodeType('price-history',  { evaluator: priceHistoryEvaluator,  isRoot: true, schemaVersion: 1 });
  runtime.registerNodeType('moving-average', { evaluator: movingAverageEvaluator, isRoot: true, schemaVersion: 1 });
  runtime.registerNodeType('volatility',     { evaluator: volatilityEvaluator,    isRoot: true, schemaVersion: 1 });
  runtime.registerNodeType('trend-signal',   { evaluator: trendSignalEvaluator,   isRoot: true, schemaVersion: 1 });
}

// ─── Spawning ──────────────────────────────────────────────────────────

/**
 * Build the full derived-signal subtree for a single symbol.
 * Returns { priceHistoryId, maFastId, maSlowId, volatilityId, trendId }
 * so callers can hold onto the ids for targeted mutation or UI lookup.
 */
export async function spawnMarketSignalsForSymbol(runtime, { symbol, ownerId = 'system' }) {
  const priceHistory = new AstNode(
    'price-history',
    { symbol, ticks: [] },
    [],
    { ownerId, annotations: [`symbol:${symbol}`] },
  );
  let r = await runtime.proposeMutation('spawn', null, { ast: priceHistory, subtreeNodes: [priceHistory] }, ownerId);
  if (!r.success) throw new Error(`spawnMarketSignalsForSymbol(${symbol}): price-history spawn failed: ${r.reason}`);

  const maFast = new AstNode(
    'moving-average',
    { symbol, window: MA_FAST_WINDOW, label: 'fast' },
    [priceHistory.id],
    { ownerId, annotations: [`symbol:${symbol}`, `window:${MA_FAST_WINDOW}`] },
  );
  r = await runtime.proposeMutation('spawn', null, { ast: maFast, subtreeNodes: [maFast] }, ownerId);
  if (!r.success) throw new Error(`ma:fast spawn failed: ${r.reason}`);
  runtime.depGraph.addDependency(maFast.id, priceHistory.id);

  const maSlow = new AstNode(
    'moving-average',
    { symbol, window: MA_SLOW_WINDOW, label: 'slow' },
    [priceHistory.id],
    { ownerId, annotations: [`symbol:${symbol}`, `window:${MA_SLOW_WINDOW}`] },
  );
  r = await runtime.proposeMutation('spawn', null, { ast: maSlow, subtreeNodes: [maSlow] }, ownerId);
  if (!r.success) throw new Error(`ma:slow spawn failed: ${r.reason}`);
  runtime.depGraph.addDependency(maSlow.id, priceHistory.id);

  const volatility = new AstNode(
    'volatility',
    { symbol, window: VOLATILITY_WINDOW },
    [priceHistory.id],
    { ownerId, annotations: [`symbol:${symbol}`] },
  );
  r = await runtime.proposeMutation('spawn', null, { ast: volatility, subtreeNodes: [volatility] }, ownerId);
  if (!r.success) throw new Error(`volatility spawn failed: ${r.reason}`);
  runtime.depGraph.addDependency(volatility.id, priceHistory.id);

  const trend = new AstNode(
    'trend-signal',
    { symbol },
    [maFast.id, maSlow.id],
    { ownerId, annotations: [`symbol:${symbol}`] },
  );
  r = await runtime.proposeMutation('spawn', null, { ast: trend, subtreeNodes: [trend] }, ownerId);
  if (!r.success) throw new Error(`trend-signal spawn failed: ${r.reason}`);
  runtime.depGraph.addDependency(trend.id, maFast.id);
  runtime.depGraph.addDependency(trend.id, maSlow.id);

  // Name the trend signal so `env.lookup('XAUUSD.trend')` etc. works from
  // the UI hook layer, matching the fork's ergonomic name convention.
  runtime.env.bindings.set(`${symbol}.priceHistory`, priceHistory.id);
  runtime.env.bindings.set(`${symbol}.maFast`,       maFast.id);
  runtime.env.bindings.set(`${symbol}.maSlow`,       maSlow.id);
  runtime.env.bindings.set(`${symbol}.volatility`,   volatility.id);
  runtime.env.bindings.set(`${symbol}.trend`,        trend.id);

  return {
    priceHistoryId: priceHistory.id,
    maFastId:       maFast.id,
    maSlowId:       maSlow.id,
    volatilityId:   volatility.id,
    trendId:        trend.id,
  };
}

/**
 * Sync variant for buildSiteAST, which is a synchronous function whose
 * return value is committed into React.useState. Same result as
 * spawnMarketSignalsForSymbol, but bypasses proposeMutation and instead
 * writes directly to astStore + wires depGraph — matching the
 * synchronous-init pattern the rest of buildSiteAST already uses.
 */
export function spawnMarketSignalsForSymbolSync(runtime, { symbol, ownerId = 'system' }) {
  const place = (node) => { runtime.astStore.set(node.id, node); return node; };

  const priceHistory = place(new AstNode(
    'price-history',
    { symbol, ticks: [] },
    [],
    { ownerId, annotations: [`symbol:${symbol}`] },
  ));
  const maFast = place(new AstNode(
    'moving-average',
    { symbol, window: MA_FAST_WINDOW, label: 'fast' },
    [priceHistory.id],
    { ownerId, annotations: [`symbol:${symbol}`, `window:${MA_FAST_WINDOW}`] },
  ));
  const maSlow = place(new AstNode(
    'moving-average',
    { symbol, window: MA_SLOW_WINDOW, label: 'slow' },
    [priceHistory.id],
    { ownerId, annotations: [`symbol:${symbol}`, `window:${MA_SLOW_WINDOW}`] },
  ));
  const volatility = place(new AstNode(
    'volatility',
    { symbol, window: VOLATILITY_WINDOW },
    [priceHistory.id],
    { ownerId, annotations: [`symbol:${symbol}`] },
  ));
  const trend = place(new AstNode(
    'trend-signal',
    { symbol },
    [maFast.id, maSlow.id],
    { ownerId, annotations: [`symbol:${symbol}`] },
  ));

  runtime.depGraph.addDependency(maFast.id,     priceHistory.id);
  runtime.depGraph.addDependency(maSlow.id,     priceHistory.id);
  runtime.depGraph.addDependency(volatility.id, priceHistory.id);
  runtime.depGraph.addDependency(trend.id,      maFast.id);
  runtime.depGraph.addDependency(trend.id,      maSlow.id);

  runtime.depGraph.setParent(maFast.id,     priceHistory.id);
  runtime.depGraph.setParent(maSlow.id,     priceHistory.id);
  runtime.depGraph.setParent(volatility.id, priceHistory.id);
  runtime.depGraph.setParent(trend.id,      maFast.id);

  runtime.env.bindings.set(`${symbol}.priceHistory`, priceHistory.id);
  runtime.env.bindings.set(`${symbol}.maFast`,       maFast.id);
  runtime.env.bindings.set(`${symbol}.maSlow`,       maSlow.id);
  runtime.env.bindings.set(`${symbol}.volatility`,   volatility.id);
  runtime.env.bindings.set(`${symbol}.trend`,        trend.id);

  return {
    priceHistory, maFast, maSlow, volatility, trend,
    priceHistoryId: priceHistory.id,
    maFastId:       maFast.id,
    maSlowId:       maSlow.id,
    volatilityId:   volatility.id,
    trendId:        trend.id,
  };
}

// ─── Tick append helper ────────────────────────────────────────────────

/**
 * Append one tick to a price-history node and trigger the cascade to all
 * derived nodes. Caps the ticks array at PRICE_HISTORY_CAP to keep
 * evaluators O(1) amortized regardless of how long the feed runs.
 */
export async function appendTick(runtime, priceHistoryId, tick, proposer = 'market-signals') {
  const node = runtime.astStore.get(priceHistoryId);
  if (!node) return { success: false, reason: `price-history ${priceHistoryId} not found` };
  const existing = Array.isArray(node.props.ticks) ? node.props.ticks : [];
  const nextTicks = [...existing, tick];
  if (nextTicks.length > PRICE_HISTORY_CAP) nextTicks.splice(0, nextTicks.length - PRICE_HISTORY_CAP);
  return runtime.proposeMutation(
    'set',
    priceHistoryId,
    { bindingName: `${node.props.symbol}.priceHistory`, newValue: { ...node.props, ticks: nextTicks } },
    proposer,
  );
}
