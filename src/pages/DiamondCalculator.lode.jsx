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
import { useLode } from '@/lib/lode-context';
import { WhyButton } from '@/components/CausalTraceViewer';
import { TopNav } from '@/components/layout/TopNav';
import { Footer } from '@/components/layout/Footer';
import {
  BASE_REF_PER_CT,
  SHAPES, COLORS, CLARITIES, CUTS, FLUORESCENCE, LABS,
  computeDiamondReference,
} from '@/lib/diamond-index';

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

// Pricing logic lives in '@/lib/diamond-index'. Shared with the appraisal
// page so both surfaces stay in lockstep. If the formula changes, it
// changes in one place.

function formatUSD(n) {
  if (!isFinite(n) || n < 0) return '$0';
  return '$' + Math.round(n).toLocaleString();
}

export default function DiamondCalculator() {
  const { siteAST } = useLode();

  // Form state — anchored on a "typical" center stone.
  const [shape, setShape]     = useState('round');
  const [carat, setCarat]     = useState('1.00');
  const [color, setColor]     = useState('G');
  const [clarity, setClarity] = useState('VS1');
  const [cut, setCut]         = useState('Excellent');
  const [fluor, setFluor]     = useState('None');
  const [lab, setLab]         = useState('GIA');

  const {
    parsedCarat, factors, perCtWholesale, wholesale, retailLow, retailHigh,
  } = useMemo(() => computeDiamondReference({
    shape, carat: parseFloat(carat), color, clarity, cut, fluor, lab,
  }), [shape, carat, color, clarity, cut, fluor, lab]);
  const { shape: shapeF, color: colorF, clarity: clarityF, carat: caratF, cut: cutF, fluor: fluorF, lab: labF } = factors;

  const cutApplies = shape === 'round';

  // Stimulate the user-interaction neuron on meaningful interactions —
  // feeds the siteActivity aggregator so the brain sees real engagement,
  // not just page load. Only fires when a form control changes.
  const pulse = () => {
    if (siteAST.userInteractionNeuron) {
      // Lightweight stimulate; we don't need a full propose() for UI signals.
      // runtime.brain.stimulate(id, 4) is fine and doesn't go through policy.
      // Ref via window to avoid a useLode() -> runtime re-render dep.
      try { window.__lode?.runtime?.brain?.stimulate(siteAST.userInteractionNeuron, 4); } catch (_) {}
    }
  };

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
            § PRICE · Diamond Reference
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em', color: T.inkMuted }}>
            Simpleton Diamond Index · educational
          </div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: T.display, fontSize: 'clamp(36px, 5vw, 60px)',
          fontWeight: 400, lineHeight: 1.08, margin: '0 0 6px 0',
          letterSpacing: '-0.01em',
        }}>
          Read a diamond.
        </h1>
        <h1 style={{
          fontFamily: T.display, fontSize: 'clamp(36px, 5vw, 60px)',
          fontWeight: 400, fontStyle: 'italic', color: T.gold,
          lineHeight: 1.08, margin: '2px 0 20px 0',
          letterSpacing: '-0.01em',
        }}>
          See why the number is the number.
        </h1>

        <p style={{
          fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', color: T.inkMuted,
          maxWidth: 720, lineHeight: 1.75, margin: '0 0 48px 0',
        }}>
          Pick the 4Cs, shape, and lab. The reference number is a transparent
          parametric estimate — every multiplier visible — anchored on industry
          norms. For a certified valuation, request a signed appraisal.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 1fr) minmax(340px, 1.1fr)',
          gap: 40,
          alignItems: 'start',
        }}>
          {/* ═════════════════ FORM (left) ═════════════════ */}
          <section>

            <Label>Shape</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 24 }}>
              {SHAPES.map(s => (
                <Chip
                  key={s.key}
                  selected={s.key === shape}
                  onClick={() => { setShape(s.key); pulse(); }}
                >
                  {s.label}
                </Chip>
              ))}
            </div>

            <Label>Carat weight</Label>
            <input
              type="text"
              inputMode="decimal"
              value={carat}
              onChange={(e) => { setCarat(e.target.value.replace(/[^\d.]/g, '')); pulse(); }}
              placeholder="1.00"
              style={{
                width: '100%', padding: '13px 16px',
                background: T.panel, border: `1px solid ${T.panelBord}`, borderRadius: 3,
                color: T.ink, fontFamily: T.mono, fontSize: 18, fontWeight: 500,
                outline: 'none', marginBottom: 24, boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = T.gold; }}
              onBlur={(e)  => { e.target.style.borderColor = T.panelBord; }}
            />

            <Label>Color</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
              {COLORS.map(c => (
                <Chip key={c} selected={c === color} onClick={() => { setColor(c); pulse(); }}>
                  {c}
                </Chip>
              ))}
            </div>

            <Label>Clarity</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
              {CLARITIES.map(c => (
                <Chip key={c} selected={c === clarity} onClick={() => { setClarity(c); pulse(); }}>
                  {c}
                </Chip>
              ))}
            </div>

            <Label>Cut {cutApplies ? '' : '(round only)'}</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24, opacity: cutApplies ? 1 : 0.45 }}>
              {CUTS.map(c => (
                <Chip
                  key={c}
                  selected={c === cut}
                  disabled={!cutApplies}
                  onClick={() => { if (cutApplies) { setCut(c); pulse(); } }}
                >
                  {c}
                </Chip>
              ))}
            </div>

            <Label>Fluorescence</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
              {FLUORESCENCE.map(f => (
                <Chip key={f} selected={f === fluor} onClick={() => { setFluor(f); pulse(); }}>
                  {f}
                </Chip>
              ))}
            </div>

            <Label>Grading lab</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {LABS.map(l => (
                <Chip key={l} selected={l === lab} onClick={() => { setLab(l); pulse(); }}>
                  {l}
                </Chip>
              ))}
            </div>
            <p style={{
              fontFamily: T.serif, fontSize: 12, fontStyle: 'italic',
              color: T.inkFaint, margin: '6px 0 0', lineHeight: 1.6,
            }}>
              GIA and AGS set the baseline. IGI trades at a modest discount.
              EGL (especially EGL-USA) is widely discounted by the trade for
              historical grade-inflation; independent re-grading is standard practice before any transaction.
            </p>

          </section>

          {/* ═════════════════ RESULT (right) ═════════════════ */}
          <section style={{
            padding: '28px 28px 24px',
            border: `1px solid ${T.hairline}`,
            borderRadius: 4,
            background: 'linear-gradient(180deg, rgba(91,156,255,0.04) 0%, rgba(91,156,255,0.0) 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: T.gold,
              }}>
                Reference Estimate
              </div>
              <WhyButton nodeId={siteAST.diamondIndex.id} label="Diamond Index" />
            </div>

            <div style={{
              fontFamily: T.display, fontSize: 'clamp(40px, 5vw, 60px)',
              fontWeight: 400, color: T.ink, lineHeight: 1.0,
              margin: '12px 0 6px 0', letterSpacing: '-0.015em',
            }}>
              {formatUSD(wholesale)}
            </div>

            <div style={{
              fontFamily: T.serif, fontStyle: 'italic', fontSize: 14,
              color: T.inkMuted, marginBottom: 20,
            }}>
              {parsedCarat ? `${parsedCarat.toFixed(2)}ct` : '—'} · {SHAPES.find(s => s.key === shape)?.label} · {color}/{clarity}{cutApplies ? ` · ${cut}` : ''} · {lab}
            </div>

            {/* Retail range band */}
            <div style={{
              padding: '12px 14px',
              background: 'rgba(91,156,255,0.06)',
              border: `1px solid rgba(91,156,255,0.15)`,
              borderRadius: 3, marginBottom: 24,
            }}>
              <div style={{
                fontFamily: T.mono, fontSize: 9, letterSpacing: '0.22em',
                color: T.blue, textTransform: 'uppercase', marginBottom: 4,
              }}>
                Typical retail range
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 15, color: T.ink, fontWeight: 600 }}>
                {formatUSD(retailLow)} – {formatUSD(retailHigh)}
              </div>
              <div style={{
                fontFamily: T.serif, fontSize: 12, fontStyle: 'italic',
                color: T.inkMuted, marginTop: 4,
              }}>
                1.4× wholesale (estate / trade) to 2.2× (luxury retail).
              </div>
            </div>

            {/* Breakdown — show the math */}
            <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: 18 }}>
              <div style={{
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: T.inkMuted, marginBottom: 12,
              }}>
                Show the math
              </div>

              <BreakdownRow
                label="Base reference"
                value={`${formatUSD(BASE_REF_PER_CT)} / ct`}
                cite="1.00ct · Round · G · VS1 · Excellent · GIA"
              />
              <BreakdownRow label="× Color"      value={`${color} → ${colorF.toFixed(2)}×`} cite="color-scale" />
              <BreakdownRow label="× Clarity"    value={`${clarity} → ${clarityF.toFixed(2)}×`} cite="clarity-scale" />
              <BreakdownRow label="× Carat scale" value={`${parsedCarat ? parsedCarat.toFixed(2) : '—'}ct → ${caratF.toFixed(2)}×`} cite="piecewise curve" />
              <BreakdownRow label="× Shape"      value={`${SHAPES.find(s => s.key === shape)?.label} → ${shapeF.toFixed(2)}×`} cite="shape-factor" />
              {cutApplies && (
                <BreakdownRow label="× Cut"      value={`${cut} → ${cutF.toFixed(2)}×`} cite="cut grade" />
              )}
              <BreakdownRow label="× Fluorescence" value={`${fluor} → ${fluorF.toFixed(2)}×`} cite="fluor adj" />
              <BreakdownRow label="× Lab"        value={`${lab} → ${labF.toFixed(2)}×`} cite="grading lab" />
              <BreakdownRow
                label="= per-carat wholesale"
                value={formatUSD(perCtWholesale)}
                cite="derived"
                emphasize
              />
              <BreakdownRow
                label={`× weight (${parsedCarat ? parsedCarat.toFixed(2) : '—'}ct)`}
                value={parsedCarat ? `${parsedCarat.toFixed(2)} ct` : '—'}
                cite="input"
              />
              <BreakdownRow
                label="= wholesale estimate"
                value={formatUSD(wholesale)}
                cite="result"
                emphasize
              />
            </div>

            <p style={{
              marginTop: 18, fontSize: 12, color: T.inkFaint,
              fontFamily: T.serif, fontStyle: 'italic', lineHeight: 1.7,
            }}>
              Reference pricing only — <strong style={{ color: T.inkMuted, fontStyle: 'normal' }}>not a trade quote</strong>.
              Actual offers depend on in-hand grading, current market conditions,
              specific inclusions, and the certificate itself. For a certified
              valuation, request a signed appraisal.
            </p>
          </section>
        </div>

        {/* Back nav + CTA */}
        <div style={{ marginTop: 48, paddingTop: 20, borderTop: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', color: T.inkMuted }}>
            Want this signed and certified?{' '}
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

function Chip({ children, selected, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '8px 12px',
        background: selected ? 'rgba(201,168,76,0.12)' : 'transparent',
        border: `1px solid ${selected ? T.gold : T.panelBord}`,
        borderRadius: 2,
        color: selected ? T.gold : T.ink,
        fontFamily: T.mono, fontSize: 11, letterSpacing: '0.06em', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        textAlign: 'center',
      }}
    >
      {children}
    </button>
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
        fontFamily: T.mono, fontSize: emphasize ? 15 : 13,
        color: emphasize ? T.gold : T.ink,
        fontWeight: emphasize ? 600 : 400,
        whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
    </div>
  );
}
