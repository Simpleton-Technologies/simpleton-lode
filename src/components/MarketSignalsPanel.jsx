/**
 * LodeRuntime™ and Lode Architecture™
 * Copyright © 2025 Demiris Brown. All Rights Reserved.
 *
 * This software is the proprietary and confidential information of
 * Ladale Industries LLC (parent company of Simpleton Technologies).
 */

/**
 * MarketSignalsPanel
 *
 * Renders the derived-signal column for each metal: fast MA, slow MA,
 * volatility, and trend direction/strength. Every value is pulled via
 * useLodeValue so it updates automatically when market-data-sync pushes
 * a new tick into the underlying price-history node.
 *
 * No domain logic here — this is a thin reader view. All the math is
 * in src/lode/market-signals.js evaluators, wired through the runtime
 * dependency graph.
 */

import React from 'react';
import { useLode, useLodeValue } from '@/lib/lode-context';

const SYMBOLS = [
  { key: 'XAUUSD', name: 'Gold',      dot: '#fbbf24' },
  { key: 'XAGUSD', name: 'Silver',    dot: '#94a3b8' },
  { key: 'XPTUSD', name: 'Platinum',  dot: '#a78bfa' },
  { key: 'XPDUSD', name: 'Palladium', dot: '#f4a97b' },
];

function formatPrice(v) {
  if (v == null || Number.isNaN(v)) return '—';
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPct(v) {
  if (v == null || Number.isNaN(v)) return '—';
  return (v * 100).toFixed(3) + '%';
}

function TrendBadge({ direction, strength }) {
  const fill = direction === 'up' ? '#10b981' : direction === 'down' ? '#ef4444' : '#6b7280';
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '–';
  const label = direction === 'up' ? 'Uptrend' : direction === 'down' ? 'Downtrend' : 'Neutral';
  const width = Math.max(4, Math.round((strength || 0) * 40));
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: fill, fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 14 }}>{arrow}</span>
      <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 11, color: '#9a937f' }}>{label}</span>
      <span aria-hidden="true" style={{ display: 'inline-block', width: 40, height: 3, background: 'rgba(244,239,226,0.10)', borderRadius: 2, overflow: 'hidden' }}>
        <span style={{ display: 'block', width, height: '100%', background: fill }} />
      </span>
    </div>
  );
}

function SignalRow({ symbol, name, dot }) {
  const { siteAST } = useLode();
  const signals = siteAST.signals?.[symbol];

  const maFast     = useLodeValue(signals?.maFastId);
  const maSlow     = useLodeValue(signals?.maSlowId);
  const volatility = useLodeValue(signals?.volatilityId);
  const trend      = useLodeValue(signals?.trendId) || { direction: 'neutral', strength: 0 };

  const cellStyle = {
    padding: '12px',
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontSize: 13,
    color: '#f4efe2',
    borderBottom: '1px solid rgba(244,239,226,0.10)',
  };

  return (
    <tr>
      <td style={{ ...cellStyle, textAlign: 'left' }}>
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: dot, marginRight: 8, verticalAlign: 'middle' }} />
        {name}
      </td>
      <td style={{ ...cellStyle, textAlign: 'right' }}>{formatPrice(maFast)}</td>
      <td style={{ ...cellStyle, textAlign: 'right' }}>{formatPrice(maSlow)}</td>
      <td style={{ ...cellStyle, textAlign: 'right', color: (volatility || 0) > 0.01 ? '#f59e0b' : '#9a937f' }}>
        {formatPct(volatility)}
      </td>
      <td style={{ ...cellStyle, textAlign: 'right' }}>
        <TrendBadge direction={trend.direction} strength={trend.strength} />
      </td>
    </tr>
  );
}

export default function MarketSignalsPanel() {
  const thStyle = {
    padding: '12px',
    textAlign: 'right',
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#9a937f',
    fontWeight: 500,
    borderBottom: '1px solid rgba(244,239,226,0.15)',
  };

  return (
    <section style={{ marginTop: 56 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        borderTop: '1px solid rgba(244,239,226,0.10)', paddingTop: 16, marginBottom: 20,
      }}>
        <div style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 10, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: '#c9a84c',
        }}>
          § SIGNALS · Derived from tick history
        </div>
        <div style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 10,
          color: '#6b6552',
        }}>
          MA · volatility · trend
        </div>
      </div>

      <p style={{
        fontFamily: '"EB Garamond", Georgia, serif', fontSize: 15,
        fontStyle: 'italic', color: '#9a937f', maxWidth: 720,
        lineHeight: 1.7, margin: '0 0 24px 0',
      }}>
        Every spot tick appends to a capped price-history node. The moving
        averages, volatility, and trend signals below are computed by the
        runtime's dependency graph — change a tick, the numbers update,
        the why-chain preserves the link back to the Kitco fetch.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: 'left' }}>Metal</th>
            <th style={thStyle}>MA · fast</th>
            <th style={thStyle}>MA · slow</th>
            <th style={thStyle}>Volatility</th>
            <th style={thStyle}>Trend</th>
          </tr>
        </thead>
        <tbody>
          {SYMBOLS.map((s) => (
            <SignalRow key={s.key} symbol={s.key} name={s.name} dot={s.dot} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
