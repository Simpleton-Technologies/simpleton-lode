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
import { useLode, useLodeValue, useLodeBrainActivation } from '@/lib/lode-context';
import { WhyButton } from '@/components/CausalTraceViewer';
import { TopNav } from '@/components/layout/TopNav';
import { Footer } from '@/components/layout/Footer';
import MarketSignalsPanel from '@/components/MarketSignalsPanel';

const T = {
  bg:        '#0b0b12',
  ink:       '#f4efe2',
  inkMuted:  '#9a937f',
  inkFaint:  '#6b6552',
  gold:      '#c9a84c',
  blue:      '#5b9cff',
  rose:      '#f43f5e',
  hairline:  'rgba(244,239,226,0.10)',
  mono:      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  body:      '"Inter", -apple-system, system-ui, sans-serif',
  display:   '"Playfair Display", Georgia, serif',
};

// Single row of the market table — pulls its own freshness state and
// renders a fading dot alongside the price. Every number has its own
// WhyButton linked to the underlying AST node.
function MetalRow({ name, node, value, dotColor, freshnessNeuronId }) {
  const fresh = useLodeBrainActivation(freshnessNeuronId, { pollHz: 10 });
  const dotOpacity = 0.18 + 0.82 * fresh.activation;
  const nowStamp = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false }) + ' CT';

  return (
    <tr style={{ borderBottom: `1px solid ${T.hairline}` }}>
      <td style={{ padding: '16px 12px', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            width: 8, height: 8, borderRadius: 999, background: dotColor,
            opacity: dotOpacity, transition: 'opacity 0.4s ease',
            boxShadow: fresh.spiking ? `0 0 6px ${dotColor}` : 'none',
          }} />
          <div>
            <div style={{ fontFamily: T.body, fontSize: 15, fontWeight: 500, color: T.ink }}>{name}</div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.inkFaint, letterSpacing: '0.08em' }}>
              {node.props.symbol}
            </div>
          </div>
        </div>
      </td>
      <td style={{
        padding: '16px 12px', textAlign: 'right', verticalAlign: 'middle',
        fontFamily: T.mono, fontSize: 20, fontWeight: 600, color: T.ink,
        letterSpacing: '-0.01em',
      }}>
        ${(value ?? 0).toFixed(2)}
      </td>
      <td style={{
        padding: '16px 12px', textAlign: 'right', verticalAlign: 'middle',
        fontFamily: T.mono, fontSize: 10, color: T.inkMuted,
        letterSpacing: '0.04em',
      }}>
        Kitco · {nowStamp}
      </td>
      <td style={{ padding: '16px 12px', textAlign: 'right', verticalAlign: 'middle' }}>
        <WhyButton nodeId={node.id} label={node.props.symbol} />
      </td>
    </tr>
  );
}

export default function SimpletonMarkets() {
  const { siteAST } = useLode();

  const goldValue      = useLodeValue(siteAST.goldPrice.id);
  const silverValue    = useLodeValue(siteAST.silverPrice.id);
  const platinumValue  = useLodeValue(siteAST.platinumPrice.id);
  const palladiumValue = useLodeValue(siteAST.palladiumPrice.id);

  const rows = [
    { name: 'Gold',      node: siteAST.goldPrice,      value: goldValue,      dot: '#fbbf24', freshId: siteAST.goldFreshnessNeuron },
    { name: 'Silver',    node: siteAST.silverPrice,    value: silverValue,    dot: '#94a3b8', freshId: siteAST.silverFreshnessNeuron },
    { name: 'Platinum',  node: siteAST.platinumPrice,  value: platinumValue,  dot: '#a78bfa', freshId: siteAST.platinumFreshnessNeuron },
    { name: 'Palladium', node: siteAST.palladiumPrice, value: palladiumValue, dot: '#f4a97b', freshId: siteAST.palladiumFreshnessNeuron },
  ];

  return (
    <div style={{ background: T.bg, color: T.ink, fontFamily: T.body, minHeight: '100vh' }}>
      <TopNav />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 32px 96px' }}>

        {/* Section kicker — SimpliFaxs-style mono rail */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          borderTop: `1px solid ${T.hairline}`, paddingTop: 16, marginBottom: 40,
        }}>
          <div style={{
            fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: T.gold,
          }}>
            § PRICE · Daily Spot
          </div>
          <div style={{
            fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em',
            color: T.inkMuted,
          }}>
            Sources cited on every number
          </div>
        </div>

        <h1 style={{
          fontFamily: T.display, fontSize: 'clamp(36px, 5vw, 60px)',
          fontWeight: 400, lineHeight: 1.08, margin: '0 0 6px 0',
          letterSpacing: '-0.01em',
        }}>
          Daily spot.
        </h1>
        <h1 style={{
          fontFamily: T.display, fontSize: 'clamp(36px, 5vw, 60px)',
          fontWeight: 400, fontStyle: 'italic', color: T.gold,
          lineHeight: 1.08, margin: '2px 0 24px 0',
          letterSpacing: '-0.01em',
        }}>
          Cited, timestamped, traceable.
        </h1>

        <p style={{
          fontFamily: '"EB Garamond", Georgia, serif', fontSize: 17,
          fontStyle: 'italic', color: T.inkMuted, maxWidth: 720,
          lineHeight: 1.75, margin: '0 0 48px 0',
        }}>
          Every price on this page answers two questions: <em>what</em> and <em>why</em>.
          The fading dot shows how fresh the number is — driven by the metal's
          freshness neuron, not a timer. The <span style={{ color: T.blue, fontFamily: T.mono, fontSize: 14 }}>?</span> next to each price
          opens the causal trace — every mutation, every feed update, every proposer,
          recorded by the runtime itself.
        </p>

        {/* Market table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.hairline}` }}>
              <th style={{
                padding: '12px', textAlign: 'left', width: '30%',
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: T.inkMuted, fontWeight: 500,
              }}>Metal</th>
              <th style={{
                padding: '12px', textAlign: 'right', width: '20%',
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: T.inkMuted, fontWeight: 500,
              }}>USD / oz</th>
              <th style={{
                padding: '12px', textAlign: 'right',
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: T.inkMuted, fontWeight: 500,
              }}>Source · Last</th>
              <th style={{
                padding: '12px', textAlign: 'right', width: '60px',
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: T.inkMuted, fontWeight: 500,
              }}>Trace</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <MetalRow
                key={r.node.id}
                name={r.name}
                node={r.node}
                value={r.value}
                dotColor={r.dot}
                freshnessNeuronId={r.freshId}
              />
            ))}
          </tbody>
        </table>

        {/* Derived market signals — MA, volatility, trend */}
        <MarketSignalsPanel />

        {/* Footnote + nav back */}
        <div style={{
          marginTop: 40, paddingTop: 20,
          borderTop: `1px solid ${T.hairline}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{
            fontFamily: '"EB Garamond", Georgia, serif', fontSize: 14,
            fontStyle: 'italic', color: T.inkMuted, maxWidth: 620, lineHeight: 1.7,
          }}>
            Click the <span style={{ color: T.blue, fontFamily: T.mono }}>?</span> next to any price
            to see the full chain — every API response, every feed proposer, every timestamp.
            Press <span style={{ fontFamily: T.mono, fontSize: 12 }}>ESC</span> to close.
          </div>
          <button
            onClick={() => window.navigate('/')}
            style={{
              background: 'transparent', border: `1px solid ${T.hairline}`,
              color: T.gold, padding: '10px 20px', borderRadius: 2,
              fontFamily: T.display, fontSize: 12, letterSpacing: '0.18em',
              textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            ← Home
          </button>
        </div>

      </main>

      <Footer />
    </div>
  );
}
