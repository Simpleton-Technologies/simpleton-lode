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

import React, { useEffect } from 'react';
import { useLode, useLodeValue, useLodeNodeId } from '@/lib/lode-context';
import { CosmicBackground } from '@/components/CosmicBackground';
import { MouseGlow } from '@/components/MouseGlow';
import { TopNav } from '@/components/layout/TopNav';
import { Footer } from '@/components/layout/Footer';

// ───────────────────────────────────────────────────────────────────────
//  Design tokens — shared language with the rest of the site
// ───────────────────────────────────────────────────────────────────────
// Dark cinematic tokens (hero, Simplicity, appraisal CTA, trust, footer).
const T = {
  bg: '#0b0b12',
  // Slightly alpha'd so the starfield canvas (z-index 0) twinkles through
  // the hero's atmospheric gradient instead of being blocked by solid fill.
  bgGradient: 'radial-gradient(ellipse at 30% 20%, rgba(24,24,39,0.85) 0%, rgba(11,11,18,0.55) 60%)',
  ink: '#f4efe2',
  inkMuted: '#9a937f',
  gold: '#c9a84c',
  goldDeep: '#a8873a',
  goldGlow: 'rgba(201,168,76,0.25)',
  rose: '#f43f5e',
  roseGlow: 'rgba(244,63,94,0.15)',
  hairline: 'rgba(244,239,226,0.10)',
  display: '"Playfair Display", Georgia, serif',
  body: '"Inter", -apple-system, system-ui, sans-serif',
  serif: '"EB Garamond", "Playfair Display", Georgia, serif',
};

// Cream-paper tokens (SimpliFaxs-inspired; used on "document" sections:
// features grid, pricing tiers). Warm neutrals that read as fine stationery
// against the dark showroom, with the SimpliFaxs blue as punctuation.
const P = {
  bg:        '#FBFAF4',
  bgSubtle:  '#F3F0E5',
  bgPaper:   '#F7F3E8',
  ink:       '#1C1A15',
  inkMuted:  '#807565',
  inkFaint:  '#B2A794',
  blue:      '#1A5FCF',
  blueDeep:  '#0B3F9E',
  blueSoft:  '#E0E9FA',
  blueLine:  '#BFD0F1',
  gold:      '#C9A84C',      // bridge back to the dark theme's accent
  goldDeep:  '#A8873A',
  goldSoft:  '#F3E8C6',
  hairline:  '#E5DFD1',
  hairlineBold: '#C8C0AA',
};

// Icon glyphs (unicode) — replaces lucide-react until the icon pack is ported.
const Icon = {
  Arrow:    (p) => <span style={{ display: 'inline-flex', ...p.style }}>→</span>,
  Chevron:  (p) => <span style={{ display: 'inline-flex', color: p.color, ...p.style }}>›</span>,
  Calc:     () => <span>🧮</span>,
  Gem:      () => <span>💎</span>,
  Doc:      () => <span>📄</span>,
  Db:       () => <span>🗂</span>,
  Watch:    () => <span>⌚</span>,
  Chart:    () => <span>📈</span>,
  Sparkle:  () => <span>✦</span>,
  Brain:    () => <span>🧠</span>,
  Scroll:   () => <span>📜</span>,
  Award:    () => <span>🏆</span>,
  Radio:    () => <span>📡</span>,
  Cpu:      () => <span>◆</span>,
  Shield:   () => <span>🛡</span>,
};

// ───────────────────────────────────────────────────────────────────────
//  The Simpleton Method — four movements.
//  Know it. Price it. Print it. Own it.
//  Each card lives inside exactly one movement. Nothing competes.
// ───────────────────────────────────────────────────────────────────────
const knowFeatures = [
  { icon: Icon.Watch, title: 'The Serial Tells a Story.',
    desc: 'Reference decode, production year, condition-adjusted value, and a document you can hand the customer.',
    href: '/rolex',    accent: '#a78bfa' },
  { icon: Icon.Db,    title: 'Every Coin Has a Number.',
    desc: 'Mint, date, composition, melt value, collector premium, and the auction history behind each issue.',
    href: '/database', accent: '#34d399' },
  { icon: Icon.Gem,   title: 'Read a Diamond.',
    desc: 'The Four Cs, certificate decoding, and the reasons two stones at the same carat can be worth four times apart.',
    href: '/diamonds', accent: '#60a5fa' },
];

const priceFeatures = [
  { icon: Icon.Calc,  title: 'Precious Metals.',
    desc: 'Live spot for gold, silver, platinum, and palladium. Purity, weight, and melt math done for you.',
    href: '/calculator',          accent: '#c9a84c' },
  { icon: Icon.Gem,   title: 'Diamonds.',
    desc: 'Rapaport-indexed pricing with per-carat tables — understand why the number is the number.',
    href: '/diamond-calculator',  accent: '#60a5fa' },
  { icon: Icon.Db,    title: 'Coins.',
    desc: 'Face, melt, numismatic premium — the three numbers that decide whether a coin goes to the dealer or the collector.',
    href: '/coin-calculator',     accent: '#34d399' },
];

// ───────────────────────────────────────────────────────────────────────
//  VerbSection — shared cream-paper section used for § KNOW, § PRICE,
//  and § OWN. Takes mono section label, editorial lead/italic pair, and
//  a list of feature items. Items render as an editorial grid (no card
//  boxes, thin hairlines only) — Tiffany / LV rhythm.
// ───────────────────────────────────────────────────────────────────────
function VerbSection({ mono, meta, lead, leadItalic, items, basis, rightLink }) {
  return (
    <section style={{
      background: P.bg, color: P.ink,
      padding: '96px 32px 104px',
      position: 'relative',
      boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.35), inset 0 -1px 0 rgba(0,0,0,0.35)',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 400,
        background: `radial-gradient(ellipse at top, ${P.blueSoft} 0%, transparent 70%)`,
        opacity: 0.5, pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto' }}>
        {/* Mono section rail — left: § / right: meta */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          borderTop: `1px solid ${P.hairline}`, paddingTop: 16, marginBottom: 48,
        }}>
          <div style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: P.blue,
          }}>
            {mono}
          </div>
          <div style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 10, letterSpacing: '0.08em', color: P.inkMuted,
          }}>
            {meta}
          </div>
        </div>

        {/* Editorial two-line headline — solid + italic blue pair */}
        <h2 style={{
          fontFamily: T.display, fontSize: 'clamp(32px, 4.5vw, 54px)',
          fontWeight: 500, color: P.ink, lineHeight: 1.08, margin: 0,
          letterSpacing: '-0.012em', maxWidth: 820,
        }}>
          {lead}
        </h2>
        <h2 style={{
          fontFamily: T.display, fontSize: 'clamp(32px, 4.5vw, 54px)',
          fontWeight: 400, fontStyle: 'italic', color: P.blue,
          lineHeight: 1.08, margin: '4px 0 56px 0', letterSpacing: '-0.012em',
        }}>
          {leadItalic}
        </h2>

        {/* Editorial grid — no cards, hairline separators only */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 0,
          borderTop: `1px solid ${P.hairline}`,
        }}>
          {items.map((f, idx) => {
            const F = f.icon;
            return (
              <button
                key={f.title}
                onClick={() => window.navigate(f.href)}
                className="feature-item"
                style={{
                  padding: '40px 28px 36px', textAlign: 'left',
                  border: 0,
                  borderRight: `1px solid ${P.hairline}`,
                  borderBottom: `1px solid ${P.hairline}`,
                  background: 'transparent',
                  color: P.ink, cursor: 'pointer',
                  position: 'relative', minHeight: 240,
                  display: 'flex', flexDirection: 'column',
                  transition: 'background 0.25s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(28,26,21,0.025)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 10, color: P.blue, marginBottom: 18,
                  letterSpacing: '0.04em',
                }}>
                  § {basis}.{idx + 1}
                </div>

                <div style={{ fontSize: 20, marginBottom: 18, color: f.accent, lineHeight: 1 }}>
                  <F />
                </div>

                <h3 style={{
                  fontFamily: T.display, fontSize: 22, fontWeight: 500,
                  color: P.ink, marginBottom: 10, letterSpacing: '-0.008em', lineHeight: 1.2,
                }}>
                  {f.title}
                </h3>
                <p style={{
                  fontFamily: T.body, fontSize: 13.5, color: P.inkMuted,
                  lineHeight: 1.65, flex: 1, margin: 0,
                }}>
                  {f.desc}
                </p>

                <div style={{
                  marginTop: 24,
                  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                  fontSize: 10, letterSpacing: '0.12em',
                  color: P.blue, textTransform: 'uppercase',
                }}>
                  Open →
                </div>
              </button>
            );
          })}
        </div>

        {rightLink && (
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <button
              onClick={() => window.navigate(rightLink.path)}
              onMouseEnter={(e) => { e.currentTarget.style.color = P.blueDeep; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = P.blue; }}
              style={{
                background: 'transparent', border: 0, cursor: 'pointer',
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: P.blue, padding: 0,
                transition: 'color 0.2s ease',
              }}
            >
              {rightLink.label}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  // ── Lode bindings ─────────────────────────────────────────────────
  // useLodeNodeId resolves a siteAST key to its node UUID;
  // useLodeValue subscribes via useSyncExternalStore and returns the
  // current evaluated value, auto-updating when the node changes.
  // No manual forceUpdate scaffolding, no runtime.values.get() calls.
  const goldId      = useLodeNodeId('goldPrice');
  const silverId    = useLodeNodeId('silverPrice');
  const platinumId  = useLodeNodeId('platinumPrice');
  const palladiumId = useLodeNodeId('palladiumPrice');

  const prices = {
    gold:      useLodeValue(goldId)      ?? 0,
    silver:    useLodeValue(silverId)    ?? 0,
    platinum:  useLodeValue(platinumId)  ?? 0,
    palladium: useLodeValue(palladiumId) ?? 0,
  };
  const pricesReady = prices.gold > 0 || prices.silver > 0 || prices.platinum > 0;

  // Brain + siteAST only used for imperative stimulate calls, so keep
  // the escape-hatch useLode() reference. Nothing else needs it.
  const { runtime, siteAST } = useLode();

  // Preload editorial fonts.
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,700&family=Inter:wght@300;400;500;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch(_) {} };
  }, []);

  const openSimplicity = () => {
    // Navigate to the Simplicity workspace; also stimulate the user-interaction neuron.
    if (siteAST.userInteractionNeuron) {
      runtime.brain.stimulate(siteAST.userInteractionNeuron, 25);
    }
    window.navigate('/simplicity');
  };

  return (
    <div style={{ background: T.bg, color: T.ink, fontFamily: T.body, minHeight: '100vh', position: 'relative' }}>
      {/* Ambient layers — behind all content, ignore pointer events */}
      <CosmicBackground />
      <MouseGlow />

      {/* Content wrapper — positioned with z-index so it paints above the
          starfield canvas (which sits at z-index 0). */}
      <div style={{ position: 'relative', zIndex: 1 }}>

      <style>{`
        @keyframes homeFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes homeShimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes homePulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .home-fade-up   { animation: homeFadeUp 0.9s ease-out both; }
        .home-fade-up-2 { animation: homeFadeUp 0.9s ease-out 0.15s both; }
        .home-fade-up-3 { animation: homeFadeUp 0.9s ease-out 0.30s both; }
        .home-fade-up-4 { animation: homeFadeUp 0.9s ease-out 0.45s both; }
        .gold-shimmer {
          background: linear-gradient(90deg, ${T.gold} 0%, #e8d5a0 40%, ${T.gold} 80%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: homeShimmer 4s linear infinite;
        }
        .feature-card { transition: all 0.35s cubic-bezier(0.4,0,0.2,1); }
        .feature-card:hover { transform: translateY(-4px); border-color: rgba(201,168,76,0.35) !important; }
        .feature-card:hover .feature-arrow { opacity: 1; transform: translateX(0); }
        .feature-arrow { opacity: 0; transform: translateX(-6px); transition: all 0.3s ease; }
        .cta-gold { transition: all 0.3s ease; }
        .cta-gold:hover { box-shadow: 0 6px 30px ${T.goldGlow}; transform: translateY(-1px); }
        .cta-outline { transition: all 0.3s ease; }
        .cta-outline:hover { background: rgba(201,168,76,0.08) !important; border-color: ${T.gold} !important; }
        .plan-card { transition: all 0.3s ease; }
        .plan-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.4); }
      `}</style>

      <TopNav />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  1. CINEMATIC HERO                                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: T.bgGradient, position: 'relative', overflow: 'hidden', paddingTop: 80, paddingBottom: 40 }}>
        <div style={{ position: 'absolute', top: '10%', left: '20%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(244,63,94,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          {/* Headline — Demiris's line.
              Tagline "Smart enough to be called Simpleton" lives in the
              TopNav eyebrow and Footer brand block. The hero tells visitors
              what the site DOES in one arc: know what it's worth, then
              (when it matters) put that knowledge on paper. */}
          <h1 className="home-fade-up" style={{
            fontFamily: T.display, fontSize: 'clamp(42px, 7vw, 86px)',
            fontWeight: 400, lineHeight: 1.05, margin: 0,
            letterSpacing: '-0.01em', color: T.ink,
          }}>
            Know what it&rsquo;s worth.
          </h1>
          <h1 className="home-fade-up-2" style={{
            fontFamily: T.display, fontSize: 'clamp(42px, 7vw, 86px)',
            fontWeight: 400, fontStyle: 'italic', lineHeight: 1.05,
            margin: '4px 0 0 0', letterSpacing: '-0.01em',
          }}>
            <span className="gold-shimmer">Prove it on paper.</span>
          </h1>

          {/* Divider */}
          <div className="home-fade-up-3" style={{ width: 80, height: 1, background: T.gold, margin: '40px auto', opacity: 0.5 }} />

          {/* Tagline — what it actually is */}
          <p className="home-fade-up-3" style={{
            fontFamily: T.serif, fontSize: 'clamp(16px, 2.2vw, 21px)',
            fontStyle: 'italic', color: T.inkMuted,
            maxWidth: 680, margin: '0 auto 48px',
            lineHeight: 1.7, fontWeight: 400,
          }}>
            Live market data, grading logic, and signed appraisals — all in one app.
          </p>

          {/* CTAs — dual-audience verbs, no onboarding tone */}
          <div className="home-fade-up-4" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
            <button
              className="cta-gold"
              onClick={() => window.navigate('/markets')}
              style={{
                background: `linear-gradient(135deg, ${T.gold} 0%, ${T.goldDeep} 100%)`,
                border: `1px solid ${T.gold}`, color: '#0b0b12',
                padding: '16px 36px', borderRadius: 2,
                fontFamily: T.display, fontSize: 14, fontWeight: 500,
                letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              Check a Price <Icon.Arrow />
            </button>
            <button
              className="cta-outline"
              onClick={() => window.navigate('/jewelry-appraisal')}
              style={{
                background: 'transparent', border: `1px solid ${T.hairline}`, color: T.gold,
                padding: '16px 36px', borderRadius: 2,
                fontFamily: T.display, fontSize: 14, fontWeight: 500,
                letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              Request an Appraisal <Icon.Arrow />
            </button>
          </div>

          {/* Live Pricing Strip */}
          {pricesReady && (
            <div className="home-fade-up-4" style={{
              display: 'inline-flex', alignItems: 'center', gap: 32,
              padding: '14px 32px',
              border: `1px solid ${T.hairline}`, borderRadius: 2,
              background: 'rgba(244,239,226,0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.gold, animation: 'homePulse 1.8s ease-in-out infinite' }} />
                <span style={{ fontSize: 10, letterSpacing: '0.2em', color: T.inkMuted, textTransform: 'uppercase' }}>Live</span>
              </div>
              {[
                { label: 'AU', value: prices.gold,     color: '#fbbf24' },
                { label: 'AG', value: prices.silver,   color: '#94a3b8' },
                { label: 'PT', value: prices.platinum, color: '#a78bfa' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, opacity: 0.7 }} />
                  <span style={{ fontSize: 11, letterSpacing: '0.12em', color: T.inkMuted }}>{m.label}</span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, fontWeight: 600, color: T.ink }}>
                    ${m.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  § 02 · KNOW — Understand what you have                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <VerbSection
        mono="§ 02 · Know"
        meta="Understand what you have"
        lead="What is it?"
        leadItalic="Know what you're holding."
        items={knowFeatures}
        basis="2"
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  § 03 · PRICE — What it's worth today                           */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <VerbSection
        mono="§ 03 · Price"
        meta="What it's worth today"
        lead="What's it worth?"
        leadItalic="Price it like a pro."
        items={priceFeatures}
        basis="3"
        rightLink={{ label: 'Live Markets · Tickers · Signals →', path: '/markets' }}
      />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  3. SIMPLICITY SHOWCASE                                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 32px', background: 'linear-gradient(180deg, rgba(244,63,94,0.03) 0%, transparent 100%)', borderTop: `1px solid ${T.hairline}`, borderBottom: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 2,
            border: '1px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.06)',
            fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase',
            color: T.rose, marginBottom: 28,
          }}>
            <Icon.Sparkle /> The Voice of Simpleton
          </div>

          <h2 style={{ fontFamily: T.display, fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, lineHeight: 1.15, margin: '0 0 20px 0' }}>
            Meet{' '}
            <span style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Simplicity
            </span>
          </h2>

          <p style={{ fontFamily: T.serif, fontSize: 18, fontStyle: 'italic', color: T.inkMuted, lineHeight: 1.8, maxWidth: 560, margin: '0 auto 36px' }}>
            Ask what moved gold today. Ask what VS2 means. Ask whether the coin in your drawer is melt or collector. Simplicity answers — and shows her sources.
          </p>

          <button
            onClick={openSimplicity}
            className="cta-outline"
            style={{
              background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
              color: '#fb7185', padding: '16px 36px', borderRadius: 2,
              fontFamily: T.display, fontSize: 14, fontWeight: 500,
              letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 12,
            }}
          >
            <Icon.Brain /> Ask Simplicity <Icon.Arrow />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  4. SIGNED APPRAISAL — editorial centered moment, no box         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{
        maxWidth: 820, margin: '0 auto',
        padding: '112px 32px 112px',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* thin hairline above, thin hairline below — Tiffany editorial rhythm */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 1, background: T.gold, opacity: 0.45,
        }} />

        <div style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10, letterSpacing: '0.3em', color: T.gold,
          textTransform: 'uppercase', marginBottom: 28,
        }}>
          § 04 · Print — Prove It on Paper
        </div>

        <h2 style={{
          fontFamily: T.display, fontSize: 'clamp(32px, 4.5vw, 54px)',
          fontWeight: 400, color: T.ink, lineHeight: 1.1,
          margin: '0 0 20px 0', letterSpacing: '-0.01em',
        }}>
          Know it. Price it. <span style={{ fontStyle: 'italic', color: T.gold }}>Print it.</span>
        </h2>

        <p style={{
          fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', color: T.inkMuted,
          maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.75, fontWeight: 400,
        }}>
          Photograph the piece. Simplicity drafts the report. Demiris Brown, GIA Graduate Gemologist, reviews and signs it. Five templates, printable, QR-verified — for insurance, estate, a trade, or your own peace of mind.
        </p>

        <button
          onClick={() => window.navigate('/jewelry-appraisal')}
          style={{
            background: 'transparent',
            border: `1px solid ${T.gold}`,
            color: T.gold,
            padding: '14px 34px',
            borderRadius: 0,
            fontFamily: T.display, fontSize: 13, fontWeight: 500,
            letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 14,
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.gold;
            e.currentTarget.style.color = '#0b0b12';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = T.gold;
          }}
        >
          Request an Appraisal <Icon.Arrow />
        </button>

        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 1, background: T.gold, opacity: 0.45,
        }} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  5. TRUST & CREDENTIALS                                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: `1px solid ${T.hairline}`, borderBottom: `1px solid ${T.hairline}`, padding: '40px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
          {[
            { I: Icon.Award, label: 'GIA Graduate Gemologist' },
            { I: Icon.Radio, label: 'Live Market Data' },
            { I: Icon.Cpu,   label: 'Cited Sources' },
            { I: Icon.Shield,label: 'Secure & Private' },
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkMuted }}>
              <span style={{ color: T.gold }}><t.I /></span>
              {t.label}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  § 05 · OWN — Decide what to do with it                         */}
      {/*  The second-sheet preview: every appraisal ships with a         */}
      {/*  decision guide, not just a price.                              */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section style={{
        background: P.bg, color: P.ink,
        padding: '96px 32px 104px',
        position: 'relative',
        boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.35), inset 0 -1px 0 rgba(0,0,0,0.35)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Mono rail */}
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            borderTop: `1px solid ${P.hairline}`, paddingTop: 16, marginBottom: 48,
          }}>
            <div style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: P.blue,
            }}>
              § 05 · Own
            </div>
            <div style={{
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
              fontSize: 10, letterSpacing: '0.08em', color: P.inkMuted,
            }}>
              Every appraisal ships with a decision guide
            </div>
          </div>

          {/* Editorial headline */}
          <h2 style={{
            fontFamily: T.display, fontSize: 'clamp(32px, 4.5vw, 54px)',
            fontWeight: 500, color: P.ink, lineHeight: 1.08, margin: 0,
            letterSpacing: '-0.012em', maxWidth: 820,
          }}>
            Now what?
          </h2>
          <h2 style={{
            fontFamily: T.display, fontSize: 'clamp(32px, 4.5vw, 54px)',
            fontWeight: 400, fontStyle: 'italic', color: P.blue,
            lineHeight: 1.08, margin: '4px 0 24px 0', letterSpacing: '-0.012em',
          }}>
            Make the right call.
          </h2>

          <p style={{
            fontFamily: T.serif, fontSize: 16, fontStyle: 'italic',
            color: P.inkMuted, lineHeight: 1.75, maxWidth: 720, margin: '0 0 40px 0',
          }}>
            Every appraisal comes with a second sheet — your options ranked by net return, with the expected range from each channel for the piece you actually own.
          </p>

          {/* Options table — Tiffany / Bloomberg editorial rhythm */}
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            fontFamily: T.body, fontSize: 13.5, color: P.ink,
            borderTop: `1px solid ${P.hairline}`,
          }}>
            <thead>
              <tr style={{
                background: P.bgSubtle, color: P.ink,
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
              }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, width: '28%' }}>Channel</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, width: '22%' }}>% of retail</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Best for</th>
              </tr>
            </thead>
            <tbody>
              {[
                { ch: 'Pawn shop',        sub: 'instant cash',              pct: '30–45%',  best: 'Fast liquidity, short redemption window' },
                { ch: 'Metal dealer',     sub: 'melt only',                 pct: '80–92%',  best: 'Pure metal with no craftsmanship premium' },
                { ch: 'Marketplace',      sub: 'eBay · Facebook · Chrono24', pct: '50–72%',  best: 'Mid-tier items, patient seller' },
                { ch: 'Private consignment', sub: 'dealer-brokered',        pct: '60–80%',  best: 'Expertise priced in, less effort' },
                { ch: 'Auction',          sub: "Sotheby's · Heritage",      pct: '80–110%', best: 'Premium pieces, time horizon, fee tolerance' },
              ].map((r, i) => (
                <tr key={r.ch} style={{ borderBottom: `1px solid ${P.hairline}` }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 500, color: P.ink }}>{r.ch}</div>
                    <div style={{
                      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                      fontSize: 10, color: P.inkMuted, marginTop: 2, letterSpacing: '0.04em',
                    }}>{r.sub}</div>
                  </td>
                  <td style={{
                    padding: '16px',
                    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                    fontSize: 13, color: P.blue, fontWeight: 600,
                  }}>
                    {r.pct}
                  </td>
                  <td style={{ padding: '16px', color: P.inkMuted, lineHeight: 1.5 }}>
                    {r.best}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
            <div style={{
              fontFamily: T.serif, fontSize: 13, fontStyle: 'italic',
              color: P.inkMuted, maxWidth: 620,
            }}>
              Your sheet is item-specific — red flags, negotiation scripts, and a recommended route for the piece you scanned.
            </div>
            <button
              onClick={() => window.navigate('/what-is-this-worth')}
              onMouseEnter={(e) => { e.currentTarget.style.color = P.blueDeep; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = P.blue; }}
              style={{
                background: 'transparent', border: 0, cursor: 'pointer',
                fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: P.blue, padding: 0,
                transition: 'color 0.2s ease',
              }}
            >
              See a Sample Decision Guide →
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  FOOTER (shared component)                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Footer />
      </div>
    </div>
  );
}
