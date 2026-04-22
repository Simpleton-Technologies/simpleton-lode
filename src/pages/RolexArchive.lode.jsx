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
  hairline:  'rgba(244,239,226,0.10)',
  panel:     'rgba(244,239,226,0.03)',
  panelBord: 'rgba(244,239,226,0.08)',
  mono:      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  body:      '"Inter", -apple-system, system-ui, sans-serif',
  serif:     '"EB Garamond", "Playfair Display", Georgia, serif',
  display:   '"Playfair Display", Georgia, serif',
};

const P = {
  bg:          '#FBFAF4',
  bgSubtle:    '#F3F0E5',
  ink:         '#1C1A15',
  inkMuted:    '#807565',
  inkFaint:    '#B2A794',
  blue:        '#1A5FCF',
  hairline:    '#E5DFD1',
  hairlineBold:'#C8C0AA',
  mono:        '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  serif:       '"EB Garamond", "Playfair Display", Georgia, serif',
  display:     '"Playfair Display", Georgia, serif',
};

// ───────────────────────────────────────────────────────────────────────
//  Static reference enrichment — publicly known facts about Rolex
//  references. Published in Rolex press materials, authorized dealer
//  catalogs, and collector reference databases. Not trade-secret.
// ───────────────────────────────────────────────────────────────────────
const REF_DATA = {
  '116500LN':   { intro: 2016, case: '40mm', movement: 'Cal. 4130', category: 'Sport',  bezel: 'Tachymeter ceramic' },
  '126500LN':   { intro: 2023, case: '40mm', movement: 'Cal. 4131', category: 'Sport',  bezel: 'Tachymeter ceramic' },
  '126610LN':   { intro: 2020, case: '41mm', movement: 'Cal. 3235', category: 'Sport',  bezel: '60-min uni-directional' },
  '116610LN':   { intro: 2010, case: '40mm', movement: 'Cal. 3135', category: 'Sport',  bezel: '60-min uni-directional' },
  '126710BLNR': { intro: 2018, case: '40mm', movement: 'Cal. 3285', category: 'Sport',  bezel: 'GMT Batgirl' },
  '126570':     { intro: 2021, case: '42mm', movement: 'Cal. 3235', category: 'Sport',  bezel: 'GMT bidirectional' },
  '116710LN':   { intro: 2007, case: '40mm', movement: 'Cal. 3186', category: 'Sport',  bezel: 'GMT bidirectional' },
  '228239':     { intro: 2019, case: '40mm', movement: 'Cal. 3235', category: 'Dressy', bezel: 'Fluted' },
  '128239':     { intro: 2019, case: '36mm', movement: 'Cal. 3235', category: 'Dressy', bezel: 'Fluted' },
  '126333':     { intro: 2021, case: '41mm', movement: 'Cal. 3235', category: 'Sport',  bezel: 'Fluted Rolesor' },
};

function enrichModel(m) {
  const ref = String(m.ref || '').replace(/\s/g, '');
  return { ...m, ...(REF_DATA[ref] || {}) };
}

function formatUSD(n) {
  if (!isFinite(n) || n <= 0) return '—';
  return '$' + Math.round(n).toLocaleString();
}

export default function RolexArchive() {
  const { siteAST } = useLode();

  const raw    = useLodeValue(siteAST.rolexDatabase.id);
  const db     = (raw && typeof raw === 'object' && raw.models) ? raw : siteAST.rolexDatabase.props;
  const models = (db?.models || []).map(enrichModel);

  const lastUpdated = db?.lastUpdated
    ? new Date(db.lastUpdated).toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: false,
      })
    : null;

  const feedReady = models.length > 0;

  return (
    <div style={{ background: T.bg, color: T.ink, fontFamily: T.body, minHeight: '100vh' }}>
      <TopNav />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 32px 96px' }}>

        {/* Section rail */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          borderTop: `1px solid ${T.hairline}`, paddingTop: 16, marginBottom: 40,
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.gold }}>
            § KNOW · The Serial Tells a Story
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {feedReady && lastUpdated && (
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.inkFaint, letterSpacing: '0.06em' }}>
                Simpleton feed · {lastUpdated} CT
              </span>
            )}
            <WhyButton nodeId={siteAST.rolexDatabase.id} label="Rolex DB" />
          </div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: T.display, fontSize: 'clamp(36px, 5vw, 60px)',
          fontWeight: 400, lineHeight: 1.08, margin: '0 0 6px 0', letterSpacing: '-0.01em',
        }}>
          Reference archive.
        </h1>
        <h1 style={{
          fontFamily: T.display, fontSize: 'clamp(36px, 5vw, 60px)',
          fontWeight: 400, fontStyle: 'italic', color: T.gold,
          lineHeight: 1.08, margin: '2px 0 20px 0', letterSpacing: '-0.01em',
        }}>
          The serial tells a story.
        </h1>

        <p style={{
          fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', color: T.inkMuted,
          maxWidth: 680, lineHeight: 1.75, margin: '0 0 48px 0',
        }}>
          Reference, movement, production era, and current market —
          the four numbers that tell you what a Rolex is worth before
          a dealer opens their mouth.
        </p>

        {/* Feed initializing state */}
        {!feedReady && (
          <div style={{
            padding: '32px 28px', border: `1px dashed ${T.panelBord}`,
            borderRadius: 3, background: T.panel, textAlign: 'center',
          }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', color: T.gold, textTransform: 'uppercase', marginBottom: 8 }}>
              Feed initializing
            </div>
            <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.inkMuted, margin: 0, lineHeight: 1.7 }}>
              Waiting for first sync from the Rolex market feed.
              Start the Express server and models will appear automatically.
            </p>
          </div>
        )}

        {/* Reference table — cream paper */}
        {feedReady && (
          <div style={{
            background: P.bg, color: P.ink,
            border: `1px solid ${P.hairlineBold}`, borderRadius: 2,
            boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 8px 24px rgba(28,26,21,0.06)',
            overflowX: 'auto',
          }}>
            {/* Column header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr 130px 80px 70px 120px',
              padding: '10px 20px',
              background: P.bgSubtle,
              borderBottom: `1px solid ${P.hairlineBold}`,
              fontFamily: P.mono, fontSize: 9, letterSpacing: '0.22em',
              color: P.inkMuted, textTransform: 'uppercase',
              minWidth: 700,
            }}>
              <span>Reference</span>
              <span>Model</span>
              <span>Movement</span>
              <span>Case</span>
              <span>Era</span>
              <span style={{ textAlign: 'right' }}>Market</span>
            </div>

            {/* Rows */}
            {models.map((m, idx) => (
              <div
                key={m.ref || idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 130px 80px 70px 120px',
                  padding: '16px 20px',
                  borderBottom: idx < models.length - 1 ? `1px solid ${P.hairline}` : 'none',
                  alignItems: 'center',
                  minWidth: 700,
                }}
              >
                <div>
                  <div style={{ fontFamily: P.mono, fontSize: 12, fontWeight: 600, color: P.ink }}>{m.ref}</div>
                  {m.category && (
                    <div style={{ fontFamily: P.mono, fontSize: 9, color: P.inkFaint, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
                      {m.category}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontFamily: P.display, fontSize: 16, fontWeight: 500, color: P.ink }}>{m.name}</div>
                  {m.bezel && (
                    <div style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 12, color: P.inkMuted, marginTop: 2 }}>
                      {m.bezel}
                    </div>
                  )}
                </div>

                <div style={{ fontFamily: P.mono, fontSize: 11, color: P.inkMuted }}>{m.movement || '—'}</div>
                <div style={{ fontFamily: P.mono, fontSize: 11, color: P.inkMuted }}>{m.case || '—'}</div>
                <div style={{ fontFamily: P.mono, fontSize: 11, color: P.inkMuted }}>{m.intro ? `${m.intro}–` : '—'}</div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: P.mono, fontSize: 15, fontWeight: 600, color: P.blue }}>
                    {formatUSD(m.marketPrice)}
                  </div>
                  <div style={{ fontFamily: P.mono, fontSize: 9, color: P.inkFaint, marginTop: 2, letterSpacing: '0.08em' }}>
                    USD · dealer
                  </div>
                </div>
              </div>
            ))}

            {/* Table footer */}
            <div style={{
              padding: '12px 20px', borderTop: `2px solid ${P.hairlineBold}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
            }}>
              <div style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 12, color: P.inkMuted, lineHeight: 1.6, maxWidth: 620 }}>
                Reference prices reflect current secondary market. Condition, papers, and box materially affect realized value — always verify the serial on the case back.
              </div>
              <div style={{ fontFamily: P.mono, fontSize: 10, color: P.inkFaint, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                {models.length} reference{models.length === 1 ? '' : 's'} · Simpleton feed
              </div>
            </div>
          </div>
        )}

        {/* Serial decoder callout */}
        <div style={{
          marginTop: 32, padding: '22px 28px',
          border: `1px solid ${T.hairline}`, borderRadius: 3, background: T.panel,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', color: T.gold, textTransform: 'uppercase', marginBottom: 6 }}>
              What the serial actually says
            </div>
            <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.inkMuted, lineHeight: 1.75, margin: 0 }}>
              Rolex serial numbers encode the production year. The reference decodes the family,
              case size, bezel type, and movement generation. Two Submariners at the same price
              can be years apart in condition value — a dealer knows this; now so do you.
            </p>
          </div>
          <button
            onClick={() => window.navigate('/jewelry-appraisal')}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.gold; e.currentTarget.style.color = '#0b0b12'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.gold; }}
            style={{
              background: 'transparent', border: `1px solid ${T.gold}`, color: T.gold,
              padding: '12px 20px', borderRadius: 2, whiteSpace: 'nowrap',
              fontFamily: T.display, fontSize: 12, fontWeight: 500,
              letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Get an appraisal →
          </button>
        </div>

        {/* Nav */}
        <div style={{ marginTop: 48, paddingTop: 20, borderTop: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', color: T.inkMuted }}>
            Need the full picture on a specific piece?{' '}
            <button onClick={() => window.navigate('/jewelry-appraisal')}
              style={{ background: 'transparent', border: 0, color: T.gold, cursor: 'pointer', fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', textDecoration: 'underline' }}>
              Request a signed appraisal →
            </button>
          </div>
          <button onClick={() => window.navigate('/')}
            style={{
              background: 'transparent', border: `1px solid ${T.hairline}`,
              color: T.gold, padding: '10px 20px', borderRadius: 2,
              fontFamily: T.display, fontSize: 12, letterSpacing: '0.18em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}>
            ← Home
          </button>
        </div>

      </main>
      <Footer />
    </div>
  );
}
