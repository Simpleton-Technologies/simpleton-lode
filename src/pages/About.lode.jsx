/**
 * LodeRuntime™ and Lode Architecture™
 * Copyright © 2025 Demiris Brown. All Rights Reserved.
 * (full header — contact Founder@simpletontechnologies.com)
 */

import React from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { Footer } from '@/components/layout/Footer';
import { UnsplashImage } from '@/components/UnsplashImage';
import { useUnsplash } from '@/lib/useUnsplash';

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

export default function About() {
  // Three image slots — each pulls from a different generic search bucket
  // so even if Unsplash returns the same top result twice they won't collide.
  const hero      = useUnsplash('vintage paper documents craftsmanship', { perPage: 5, orientation: 'landscape' });
  const workshop  = useUnsplash('jeweler workbench loupe', { perPage: 5, orientation: 'portrait' });
  const archive   = useUnsplash('antique ledger leather', { perPage: 5, orientation: 'landscape' });

  const heroPhoto     = hero.photos[0];
  const workshopPhoto = workshop.photos[0];
  const archivePhoto  = archive.photos[0];

  return (
    <div style={{ background: T.bg, color: T.ink, fontFamily: T.body, minHeight: '100vh' }}>
      <TopNav />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 32px 96px' }}>

        {/* Section rail */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          borderTop: `1px solid ${T.hairline}`, paddingTop: 16, marginBottom: 40,
        }}>
          <div style={{
            fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: T.gold,
          }}>
            § ABOUT · The House Behind The Numbers
          </div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: T.display, fontSize: 'clamp(36px, 5vw, 60px)',
          fontWeight: 400, lineHeight: 1.08, margin: '0 0 6px 0', letterSpacing: '-0.01em',
        }}>
          Built for the moment
        </h1>
        <h1 style={{
          fontFamily: T.display, fontSize: 'clamp(36px, 5vw, 60px)',
          fontWeight: 400, fontStyle: 'italic', color: T.gold,
          lineHeight: 1.08, margin: '2px 0 24px 0', letterSpacing: '-0.01em',
        }}>
          someone hands you a heirloom.
        </h1>

        <p style={{
          fontFamily: T.serif, fontSize: 17, fontStyle: 'italic', color: T.inkMuted,
          maxWidth: 680, lineHeight: 1.75, margin: '0 0 48px 0',
        }}>
          Live market data, transparent grading logic, and signed
          appraisals for precious metals, diamonds, Rolex, and coins —
          delivered with the formality of a Sotheby's catalog and the
          honesty of a watchmaker's bench.
        </p>

        {/* Hero image */}
        {heroPhoto && (
          <div style={{
            position: 'relative', width: '100%',
            aspectRatio: '21 / 9', marginBottom: 56,
            border: `1px solid ${T.panelBord}`, borderRadius: 3,
            overflow: 'hidden',
          }}>
            <UnsplashImage
              photo={heroPhoto}
              size="regular"
              alt="Documents and craftsmanship — the materials of a signed appraisal"
              captionPlacement="overlay"
              rounded={0}
              style={{ width: '100%', height: '100%' }}
              imgStyle={{ width: '100%', height: '100%' }}
            />
          </div>
        )}

        {/* Two-up: portrait + body copy */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 320px) 1fr',
          gap: 40, alignItems: 'start',
          marginBottom: 64,
        }}>
          {workshopPhoto ? (
            <div style={{ aspectRatio: '3 / 4', overflow: 'hidden', borderRadius: 3 }}>
              <UnsplashImage
                photo={workshopPhoto}
                size="regular"
                alt="A jeweler's workbench — where claims become evidence"
                captionColor="rgba(244,239,226,0.55)"
                captionLinkColor="rgba(244,239,226,0.85)"
                style={{ width: '100%', height: '100%' }}
                imgStyle={{ width: '100%', height: '100%' }}
              />
            </div>
          ) : <div />}

          <div>
            <div style={{
              fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
              color: T.gold, textTransform: 'uppercase', marginBottom: 12,
            }}>
              The discipline
            </div>
            <h2 style={{
              fontFamily: T.display, fontSize: 28, fontWeight: 400,
              lineHeight: 1.2, margin: '0 0 16px 0',
            }}>
              We don't guess. We grade, cite, and sign.
            </h2>
            <p style={{
              fontFamily: T.serif, fontSize: 16, lineHeight: 1.8,
              color: T.inkMuted, margin: '0 0 14px 0',
            }}>
              Every appraisal we deliver carries a serial number, a
              live market reference, and a signature. The math is
              shown — not buried in a back office. The references are
              cited — not paraphrased. The conclusion is signed —
              because conviction lives or dies on the name attached.
            </p>
            <p style={{
              fontFamily: T.serif, fontSize: 16, lineHeight: 1.8,
              color: T.inkMuted, margin: 0,
            }}>
              That's the standard the trade used to hold itself to
              before the spreadsheet replaced the loupe. We brought it
              back, wired it to live data, and made it run in real time.
            </p>
          </div>
        </section>

        {/* Archive band */}
        <section style={{
          padding: '32px 28px',
          border: `1px solid ${T.panelBord}`, borderRadius: 3,
          background: T.panel, marginBottom: 56,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr minmax(260px, 380px)',
            gap: 32, alignItems: 'center',
          }}>
            <div>
              <div style={{
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
                color: T.gold, textTransform: 'uppercase', marginBottom: 10,
              }}>
                The archive
              </div>
              <h3 style={{
                fontFamily: T.display, fontSize: 22, fontWeight: 400,
                margin: '0 0 12px 0', lineHeight: 1.3,
              }}>
                Every appraisal is preserved. Every preserved appraisal can be verified.
              </h3>
              <p style={{
                fontFamily: T.serif, fontStyle: 'italic',
                fontSize: 14, color: T.inkMuted, lineHeight: 1.75, margin: 0,
              }}>
                Each document we sign is committed to a tamper-evident
                ledger and surfaced through a public lookup. Insurance
                adjusters, estate attorneys, and resale platforms can
                confirm authenticity without us in the loop.
              </p>
            </div>
            {archivePhoto && (
              <div style={{ aspectRatio: '4 / 3', overflow: 'hidden', borderRadius: 3 }}>
                <UnsplashImage
                  photo={archivePhoto}
                  size="regular"
                  alt="An archival ledger — every signed appraisal preserved"
                  captionColor="rgba(244,239,226,0.55)"
                  captionLinkColor="rgba(244,239,226,0.85)"
                  style={{ width: '100%', height: '100%' }}
                  imgStyle={{ width: '100%', height: '100%' }}
                />
              </div>
            )}
          </div>
        </section>

        {/* Founder line + CTA */}
        <section style={{
          paddingTop: 28, borderTop: `1px solid ${T.hairline}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ maxWidth: 540 }}>
            <div style={{
              fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
              color: T.gold, textTransform: 'uppercase', marginBottom: 8,
            }}>
              Founder
            </div>
            <p style={{
              fontFamily: T.serif, fontStyle: 'italic',
              fontSize: 15, color: T.inkMuted, lineHeight: 1.75, margin: 0,
            }}>
              Demiris Brown — builder of LodeRuntime™ and the Simpleton
              appraisal stack. Reach the desk at{' '}
              <a href="mailto:Founder@simpletontechnologies.com"
                 style={{ color: T.gold, textDecoration: 'underline' }}>
                Founder@simpletontechnologies.com
              </a>.
            </p>
          </div>
          <button
            onClick={() => window.navigate('/jewelry-appraisal')}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.gold; e.currentTarget.style.color = '#0b0b12'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.gold; }}
            style={{
              background: 'transparent', border: `1px solid ${T.gold}`, color: T.gold,
              padding: '12px 22px', borderRadius: 2, whiteSpace: 'nowrap',
              fontFamily: T.display, fontSize: 12, fontWeight: 500,
              letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Request an appraisal →
          </button>
        </section>

      </main>
      <Footer />
    </div>
  );
}
