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

import React, { useMemo, useState } from 'react';
import { useLode, useLodeValue } from '@/lib/lode-context';
import { WhyButton } from '@/components/CausalTraceViewer';
import { TopNav } from '@/components/layout/TopNav';
import { Footer } from '@/components/layout/Footer';

const T = {
  bg:        '#0b0b12',
  ink:       '#f4efe2',
  inkMuted:  '#9a937f',
  inkFaint:  '#6b6552',
  gold:      '#c9a84c',
  goldDeep:  '#a8873a',
  blue:      '#5b9cff',
  hairline:  'rgba(244,239,226,0.10)',
  panel:     'rgba(244,239,226,0.03)',
  panelBord: 'rgba(244,239,226,0.08)',
  mono:      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  body:      '"Inter", -apple-system, system-ui, sans-serif',
  serif:     '"EB Garamond", "Playfair Display", Georgia, serif',
  display:   '"Playfair Display", Georgia, serif',
};

// 1 troy ounce = 31.1034768 grams. Kitco/Rapaport spot is per troy oz.
const GRAMS_PER_TROY_OZ = 31.1034768;

// Per-metal purity presets. Values are decimal fineness (0..1).
const PURITY_PRESETS = {
  gold: [
    { label: '24K',    fineness: 1.000 },
    { label: '22K',    fineness: 0.9167 },
    { label: '18K',    fineness: 0.750 },
    { label: '14K',    fineness: 0.583 },
    { label: '10K',    fineness: 0.417 },
  ],
  silver: [
    { label: '.999 Fine', fineness: 0.999 },
    { label: 'Sterling (.925)', fineness: 0.925 },
    { label: 'Coin (.900)', fineness: 0.900 },
    { label: '.800',     fineness: 0.800 },
  ],
  platinum: [
    { label: '.999 Fine', fineness: 0.999 },
    { label: '950',     fineness: 0.950 },
    { label: '900',     fineness: 0.900 },
    { label: '850',     fineness: 0.850 },
  ],
  palladium: [
    { label: '.999 Fine', fineness: 0.999 },
    { label: '950',     fineness: 0.950 },
    { label: '900',     fineness: 0.900 },
  ],
};

const METAL_OPTIONS = [
  { key: 'gold',      label: 'Gold',      symbol: 'AU', dot: '#fbbf24' },
  { key: 'silver',    label: 'Silver',    symbol: 'AG', dot: '#94a3b8' },
  { key: 'platinum',  label: 'Platinum',  symbol: 'PT', dot: '#a78bfa' },
  { key: 'palladium', label: 'Palladium', symbol: 'PD', dot: '#f4a97b' },
];

function formatUSD(n) {
  if (!isFinite(n) || n < 0) return '$0.00';
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Calculator() {
  const { siteAST } = useLode();

  // Subscribe to all 4 metal spots so the form updates live.
  const spot = {
    gold:      useLodeValue(siteAST.goldPrice.id),
    silver:    useLodeValue(siteAST.silverPrice.id),
    platinum:  useLodeValue(siteAST.platinumPrice.id),
    palladium: useLodeValue(siteAST.palladiumPrice.id),
  };
  const spotNodeId = {
    gold:      siteAST.goldPrice.id,
    silver:    siteAST.silverPrice.id,
    platinum:  siteAST.platinumPrice.id,
    palladium: siteAST.palladiumPrice.id,
  };

  // Form state. Defaults: 14K gold, 1 gram.
  const [metalKey, setMetalKey] = useState('gold');
  const [weight, setWeight]     = useState('');
  const [unit, setUnit]         = useState('g');         // 'g' or 'ozt'
  const [fineness, setFineness] = useState(0.583);       // default 14K

  const metalMeta = METAL_OPTIONS.find(m => m.key === metalKey);
  const purities  = PURITY_PRESETS[metalKey];

  // Compute melt value.
  // Formula: weight_g × (spot_per_troy_oz / GRAMS_PER_TROY_OZ) × fineness
  // All math visible in the breakdown — this is the "show your work" section.
  const { weightG, pricePerGram, melt, parsedWeight } = useMemo(() => {
    const w = parseFloat(weight);
    const parsed = isFinite(w) && w > 0 ? w : 0;
    const wg = unit === 'ozt' ? parsed * GRAMS_PER_TROY_OZ : parsed;
    const perOz = spot[metalKey] ?? 0;
    const perG  = perOz / GRAMS_PER_TROY_OZ;
    return {
      weightG: wg,
      pricePerGram: perG,
      melt: wg * perG * fineness,
      parsedWeight: parsed,
    };
  }, [weight, unit, fineness, metalKey, spot]);

  const ts = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false }) + ' CT';

  return (
    <div style={{ background: T.bg, color: T.ink, fontFamily: T.body, minHeight: '100vh' }}>
      <TopNav />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 32px 96px' }}>

        {/* Section rail */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          borderTop: `1px solid ${T.hairline}`, paddingTop: 16, marginBottom: 40,
        }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.gold }}>
            § PRICE · Precious Metals
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em', color: T.inkMuted }}>
            Live spot · melt-value math
          </div>
        </div>

        {/* Headline — reusing the voice brief */}
        <h1 style={{
          fontFamily: T.display, fontSize: 'clamp(36px, 5vw, 60px)',
          fontWeight: 400, lineHeight: 1.08, margin: '0 0 6px 0',
          letterSpacing: '-0.01em',
        }}>
          Stop guessing.
        </h1>
        <h1 style={{
          fontFamily: T.display, fontSize: 'clamp(36px, 5vw, 60px)',
          fontWeight: 400, fontStyle: 'italic', color: T.gold,
          lineHeight: 1.08, margin: '2px 0 20px 0',
          letterSpacing: '-0.01em',
        }}>
          Know what it&rsquo;s worth.
        </h1>

        <p style={{
          fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', color: T.inkMuted,
          maxWidth: 680, lineHeight: 1.75, margin: '0 0 48px 0',
        }}>
          Pick the metal, tell us the weight and purity. The number you see is the melt value
          at today&rsquo;s spot — your floor. Craftsmanship, rarity, and collector premium sit on top of this.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.1fr)',
          gap: 40,
          alignItems: 'start',
        }}>
          {/* ═════════════════ FORM (left) ═════════════════ */}
          <section>

            {/* Metal selector */}
            <Label>Metal</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 24 }}>
              {METAL_OPTIONS.map(m => {
                const selected = m.key === metalKey;
                return (
                  <button
                    key={m.key}
                    onClick={() => {
                      setMetalKey(m.key);
                      // Reset fineness to a sensible default for the new metal.
                      const p = PURITY_PRESETS[m.key];
                      if (p && !p.find(x => x.fineness === fineness)) {
                        setFineness(m.key === 'gold' ? 0.583 : p[0].fineness);
                      }
                    }}
                    style={{
                      padding: '12px 14px', textAlign: 'left',
                      background: selected ? 'rgba(201,168,76,0.08)' : T.panel,
                      border: `1px solid ${selected ? T.gold : T.panelBord}`,
                      borderRadius: 3,
                      color: T.ink, cursor: 'pointer',
                      fontFamily: T.body,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: m.dot }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{m.label}</div>
                        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.inkMuted, letterSpacing: '0.08em' }}>
                          {m.symbol}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Weight + unit */}
            <Label>Weight</Label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder="e.g. 20"
                style={{
                  flex: 1,
                  padding: '13px 16px',
                  background: T.panel,
                  border: `1px solid ${T.panelBord}`,
                  borderRadius: 3,
                  color: T.ink,
                  fontFamily: T.mono, fontSize: 18, fontWeight: 500,
                  outline: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = T.gold; }}
                onBlur={(e)  => { e.target.style.borderColor = T.panelBord; }}
              />
              <div style={{ display: 'flex', gap: 0, border: `1px solid ${T.panelBord}`, borderRadius: 3, overflow: 'hidden' }}>
                {['g', 'ozt'].map(u => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    style={{
                      padding: '0 16px',
                      background: u === unit ? 'rgba(201,168,76,0.08)' : 'transparent',
                      color: u === unit ? T.gold : T.inkMuted,
                      border: 0,
                      fontFamily: T.mono, fontSize: 12, letterSpacing: '0.08em',
                      cursor: 'pointer',
                      minWidth: 56,
                    }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* Purity preset buttons */}
            <Label>Purity</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {purities.map(p => {
                const selected = Math.abs(p.fineness - fineness) < 0.0001;
                return (
                  <button
                    key={p.label}
                    onClick={() => setFineness(p.fineness)}
                    style={{
                      padding: '8px 14px',
                      background: selected ? 'rgba(201,168,76,0.12)' : 'transparent',
                      border: `1px solid ${selected ? T.gold : T.panelBord}`,
                      borderRadius: 2,
                      color: selected ? T.gold : T.ink,
                      fontFamily: T.mono, fontSize: 11, letterSpacing: '0.06em', fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {p.label} · <span style={{ opacity: 0.7 }}>{p.fineness.toFixed(3)}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom fineness slider */}
            <div style={{
              padding: 12, background: T.panel, border: `1px solid ${T.panelBord}`, borderRadius: 3,
              marginBottom: 24,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', fontFamily: T.mono,
                fontSize: 10, color: T.inkMuted, letterSpacing: '0.08em',
              }}>
                <span>Or custom fineness</span>
                <span style={{ color: T.ink }}>{fineness.toFixed(4)}</span>
              </div>
              <input
                type="range"
                min={0} max={1} step={0.001}
                value={fineness}
                onChange={(e) => setFineness(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: T.gold, marginTop: 6 }}
              />
            </div>

          </section>

          {/* ═════════════════ RESULT (right) ═════════════════ */}
          <section style={{
            padding: '28px 28px 24px',
            border: `1px solid ${T.hairline}`,
            borderRadius: 4,
            background: 'linear-gradient(180deg, rgba(201,168,76,0.04) 0%, rgba(201,168,76,0.0) 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: T.gold,
              }}>
                Melt Value
              </div>
              <WhyButton nodeId={spotNodeId[metalKey]} label={`${metalMeta.symbol} spot`} />
            </div>

            <div style={{
              fontFamily: T.display, fontSize: 'clamp(40px, 5vw, 64px)',
              fontWeight: 400, color: T.ink, lineHeight: 1.0,
              margin: '12px 0 6px 0', letterSpacing: '-0.015em',
            }}>
              {formatUSD(melt)}
            </div>

            <div style={{
              fontFamily: T.serif, fontStyle: 'italic', fontSize: 14,
              color: T.inkMuted, marginBottom: 28,
            }}>
              {metalMeta.label} · {parsedWeight ? `${parsedWeight} ${unit}` : 'enter a weight'} · {(fineness * 100).toFixed(2)}% fine
            </div>

            {/* Breakdown — show the math */}
            <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 20 }}>
              <div style={{
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: T.inkMuted, marginBottom: 12,
              }}>
                Show the math
              </div>

              <BreakdownRow
                label="Spot (per troy oz)"
                value={formatUSD(spot[metalKey] || 0)}
                cite={`Kitco · ${ts}`}
              />
              <BreakdownRow
                label="÷ grams per troy oz"
                value={GRAMS_PER_TROY_OZ.toFixed(5)}
                cite="constant"
              />
              <BreakdownRow
                label="= price per gram"
                value={formatUSD(pricePerGram)}
                cite="derived"
                emphasize
              />
              <BreakdownRow
                label={`× weight (${unit})`}
                value={parsedWeight ? `${parsedWeight} ${unit}${unit === 'ozt' ? `  (${weightG.toFixed(2)} g)` : ''}` : '—'}
                cite="input"
              />
              <BreakdownRow
                label="× fineness"
                value={fineness.toFixed(4)}
                cite={`${(fineness * 100).toFixed(2)}% fine`}
              />
              <BreakdownRow
                label="= melt value"
                value={formatUSD(melt)}
                cite="result"
                emphasize
              />
            </div>

            <p style={{
              marginTop: 20, fontSize: 12, color: T.inkFaint,
              fontFamily: T.serif, fontStyle: 'italic', lineHeight: 1.7,
            }}>
              Melt value is the floor — the scrap-metal price at today&rsquo;s spot. Pieces in good condition with craftsmanship or brand (signed jewelry, historic mint, named maker) trade above this; damaged or heavily refinished pieces trade at it.
            </p>
          </section>
        </div>

        {/* Back nav */}
        <div style={{ marginTop: 48, paddingTop: 20, borderTop: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', color: T.inkMuted }}>
            Need something more than melt?{' '}
            <button
              onClick={() => window.navigate('/jewelry-appraisal')}
              style={{ background: 'transparent', border: 0, color: T.gold, cursor: 'pointer', fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', textDecoration: 'underline' }}
            >
              Request a signed appraisal →
            </button>
          </div>
          <button
            onClick={() => window.navigate('/')}
            style={{
              background: 'transparent', border: `1px solid ${T.hairline}`,
              color: T.gold, padding: '10px 20px', borderRadius: 2,
              fontFamily: T.display, fontSize: 12, letterSpacing: '0.18em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            ← Home
          </button>
        </div>

      </main>

      <Footer />
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{
      fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
      textTransform: 'uppercase', color: T.inkMuted, marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function BreakdownRow({ label, value, cite, emphasize }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline',
      padding: '8px 0', borderBottom: `1px solid ${T.hairline}`,
      gap: 16,
    }}>
      <div>
        <div style={{
          fontFamily: T.body, fontSize: 13,
          color: emphasize ? T.ink : T.inkMuted,
          fontWeight: emphasize ? 600 : 400,
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: T.mono, fontSize: 10, color: T.inkFaint,
          letterSpacing: '0.04em', marginTop: 1,
        }}>
          {cite}
        </div>
      </div>
      <div style={{
        fontFamily: T.mono, fontSize: emphasize ? 16 : 13,
        color: emphasize ? T.gold : T.ink,
        fontWeight: emphasize ? 600 : 400,
        whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
    </div>
  );
}
