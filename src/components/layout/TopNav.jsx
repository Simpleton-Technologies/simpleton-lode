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

import React from 'react';
import { useLode, useLodeValue, useLodeNodeId, useLodeBrainActivation, useDevMode } from '@/lib/lode-context';
import { useTraceViewer } from '@/components/CausalTraceViewer';

const T = {
  ink: '#f4efe2',
  inkMuted: '#9a937f',
  inkFaint: '#6b6552',
  gold: '#c9a84c',
  goldDeep: '#a8873a',
  rose: '#f43f5e',
  good: '#3ccf91',
  hairline: 'rgba(244,239,226,0.10)',
  hairlineStrong: 'rgba(244,239,226,0.18)',
  body: '"Inter", -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  display: '"Playfair Display", Georgia, serif',
};

/**
 * Two-band global header — Fortune 500 pattern for finance/luxury sites:
 *
 *   Band 1 — brand + primary nav + utility
 *   Band 2 — live market ticker with source + timestamp + status
 *
 * Category-based primary nav (not product-based) keeps the site readable
 * for both amateurs and pros. Every price on the ticker rail cites its
 * source, so credibility is demonstrated, not announced.
 */
export function TopNav() {
  // Lode hooks only — no raw runtime.valueStore.get() reads.
  const { siteAST } = useLode();

  const goldId      = useLodeNodeId('goldPrice');
  const silverId    = useLodeNodeId('silverPrice');
  const platinumId  = useLodeNodeId('platinumPrice');
  const palladiumId = useLodeNodeId('palladiumPrice');

  const gold      = useLodeValue(goldId)      ?? 0;
  const silver    = useLodeValue(silverId)    ?? 0;
  const platinum  = useLodeValue(platinumId)  ?? 0;
  const palladium = useLodeValue(palladiumId) ?? 0;

  const feedUp   = gold > 0;
  const nowLabel = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }) + ' CT';

  const PrimaryItem = ({ path, label }) => (
    <button
      onClick={() => window.navigate(path)}
      onMouseEnter={(e) => { e.currentTarget.style.color = T.ink; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = T.inkMuted; }}
      style={{
        background: 'transparent', border: 0, cursor: 'pointer',
        padding: '6px 12px', color: T.inkMuted,
        fontFamily: T.body, fontSize: 13, fontWeight: 500,
        letterSpacing: '-0.005em',
        transition: 'color 0.18s ease',
      }}
    >
      {label}
    </button>
  );

  const Utility = ({ path, label, emphasize }) => (
    <button
      onClick={() => window.navigate(path)}
      onMouseEnter={(e) => { e.currentTarget.style.color = emphasize ? T.gold : T.ink; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = emphasize ? T.gold : T.inkFaint; }}
      style={{
        background: 'transparent', border: 0, cursor: 'pointer',
        padding: '4px 10px',
        color: emphasize ? T.gold : T.inkFaint,
        fontFamily: T.body, fontSize: 12, fontWeight: 500,
        letterSpacing: '0.02em',
        transition: 'color 0.18s ease',
      }}
    >
      {label}
    </button>
  );

  // Price pill — the colored dot's opacity is driven directly by the
  // metal's freshness neuron (LIF membrane potential). Just-updated
  // prices show a bright saturated dot; the dot fades as the neuron's
  // potential decays toward rest. No client-side timers. The moment a
  // new price lands, the brain re-stimulates and the dot relights.
  // Shift-click any price to open its causal trace. Gated behind dev
  // mode so civilian users don't stumble on it; when dev mode is on,
  // this is the fastest way to demo trace.why() from anywhere on the site.
  const { devMode } = useDevMode();
  const traceViewer = useTraceViewer();

  const Price = ({ code, value, dot, freshnessNeuronId, nodeId }) => {
    const fresh = useLodeBrainActivation(freshnessNeuronId, { pollHz: 10 });
    const dotOpacity = 0.18 + 0.82 * fresh.activation;
    return (
      <button
        onClick={(e) => {
          if (devMode && e.shiftKey && nodeId) traceViewer.open(nodeId);
        }}
        title={devMode ? `${code} · shift-click for causal trace` : code}
        style={{
          background: 'transparent', border: 0, cursor: 'pointer',
          padding: 0, color: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}
      >
        <span style={{
          width: 6, height: 6, background: dot, borderRadius: 999,
          opacity: dotOpacity,
          transition: 'opacity 0.4s ease',
        }} />
        <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', color: T.inkMuted }}>
          {code}
        </span>
        <span style={{
          fontFamily: T.mono, fontSize: 12, fontWeight: 600,
          color: T.ink,
          opacity: 0.55 + 0.45 * fresh.activation,
          transition: 'opacity 0.4s ease',
        }}>
          ${value.toFixed(2)}
        </span>
      </button>
    );
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'rgba(11,11,18,0.92)',
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${T.hairline}`,
    }}>
      {/* ═════════════════ Band 1 — brand + primary + utility ═════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center', gap: 24,
        padding: '14px 32px',
      }}>
        {/* Brand mark + tagline eyebrow */}
        <button
          onClick={() => window.navigate('/')}
          style={{
            background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <div style={{
            width: 34, height: 34, background: '#1A5FCF', color: '#fff',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 16,
          }}>S</div>
          <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: T.ink, fontFamily: T.body }}>
              Simpleton<span style={{ color: T.gold, fontSize: 12, verticalAlign: 'super' }}>™</span>
            </div>
            <div style={{
              marginTop: 2, fontFamily: T.mono,
              fontSize: 9, letterSpacing: '0.22em',
              color: T.gold, textTransform: 'uppercase',
            }}>
              Smart Enough to Be Called Simpleton
            </div>
          </div>
        </button>

        {/* Primary nav — the Simpleton Method, four movements.
            Know it. Price it. Print it. Own it. */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <PrimaryItem path="/education"         label="Know" />
          <PrimaryItem path="/markets"           label="Price" />
          <PrimaryItem path="/jewelry-appraisal" label="Print" />
          <PrimaryItem path="/what-is-this-worth" label="Own" />
        </nav>

        {/* Utility — Simplicity is the voice across all four, not a bucket */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Utility path="/simplicity"   label="Ask Simplicity" />
          <Utility path="/lookup"       label="Search" />
          <Utility path="/login"        label="Sign in" />
          <Utility path="/subscription" label="Membership" emphasize />
        </div>
      </div>

      {/* ═════════════════ Band 2 — live ticker rail ═════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        padding: '8px 32px',
        borderTop: `1px solid ${T.hairline}`,
        background: 'rgba(0,0,0,0.30)',
      }}>
        {/* Ticker — each dot's brightness is driven by its freshness neuron.
            Shift-click any pill opens its causal trace viewer. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <Price code="AU" value={gold}      dot="#fbbf24" freshnessNeuronId={siteAST.goldFreshnessNeuron}      nodeId={siteAST.goldPrice.id} />
          <Price code="AG" value={silver}    dot="#94a3b8" freshnessNeuronId={siteAST.silverFreshnessNeuron}    nodeId={siteAST.silverPrice.id} />
          <Price code="PT" value={platinum}  dot="#a78bfa" freshnessNeuronId={siteAST.platinumFreshnessNeuron}  nodeId={siteAST.platinumPrice.id} />
          <Price code="PD" value={palladium} dot="#f4a97b" freshnessNeuronId={siteAST.palladiumFreshnessNeuron} nodeId={siteAST.palladiumPrice.id} />
          <span style={{
            fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em',
            color: T.inkFaint, paddingLeft: 8, borderLeft: `1px solid ${T.hairline}`,
          }}>
            {feedUp ? `Kitco · ${nowLabel}` : 'Feed initializing…'}
          </span>
        </div>

        {/* System status dot */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999,
            background: feedUp ? T.good : T.rose,
            animation: feedUp ? 'topnavPulse 2.4s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.2em', color: T.inkFaint, textTransform: 'uppercase' }}>
            {feedUp ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes topnavPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </header>
  );
}
