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

const T = {
  ink: '#f4efe2',
  inkMuted: '#9a937f',
  inkFaint: '#6b6552',
  gold: '#c9a84c',
  goldDeep: '#a8873a',
  hairline: 'rgba(244,239,226,0.10)',
  hairlineStrong: 'rgba(244,239,226,0.18)',
  body: '"Inter", -apple-system, system-ui, sans-serif',
  serif: '"EB Garamond", "Playfair Display", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  display: '"Playfair Display", Georgia, serif',
};

// Link + heading helpers keep the footer's type rhythm consistent across
// all four sitemap columns.
const FHead = ({ children }) => (
  <div style={{
    fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
    textTransform: 'uppercase', color: T.gold, marginBottom: 18,
  }}>
    {children}
  </div>
);

const FLink = ({ path, children }) => (
  <button
    onClick={() => window.navigate(path)}
    onMouseEnter={(e) => { e.currentTarget.style.color = T.ink; }}
    onMouseLeave={(e) => { e.currentTarget.style.color = T.inkMuted; }}
    style={{
      background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
      color: T.inkMuted, fontFamily: T.body, fontSize: 13,
      textAlign: 'left', letterSpacing: '-0.005em',
      transition: 'color 0.15s ease',
      lineHeight: 1.9,
    }}
  >
    {children}
  </button>
);

const LegalLink = ({ path, children }) => (
  <button
    onClick={() => window.navigate(path)}
    onMouseEnter={(e) => { e.currentTarget.style.color = T.inkMuted; }}
    onMouseLeave={(e) => { e.currentTarget.style.color = T.inkFaint; }}
    style={{
      background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
      color: T.inkFaint, fontFamily: T.mono, fontSize: 10,
      letterSpacing: '0.08em',
      transition: 'color 0.15s ease',
    }}
  >
    {children}
  </button>
);

/**
 * Three-band footer, Tiffany / LV / JPMorgan pattern:
 *
 *   Band A  — brand block + 4 sitemap columns
 *   Band B  — credentials rail (GIA, data partners, region/currency)
 *   Band C  — legal micro-strip (© + terms/privacy/disclosures)
 *
 * No CTAs. No marketing. The footer's job is reference — tells the visitor
 * what's in the site and who stands behind it. Credibility shown through
 * structure, not declared.
 */
export function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${T.hairline}`,
      background: 'transparent',
      color: T.inkMuted,
      fontFamily: T.body,
    }}>

      {/* ═════════════ Band A — brand + sitemap ═════════════ */}
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        padding: '64px 32px 48px',
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 1.3fr) repeat(4, minmax(140px, 1fr))',
        gap: 40,
        alignItems: 'start',
      }}>
        {/* Brand block */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 28, height: 28, background: '#1A5FCF', color: '#fff',
              borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14,
            }}>S</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.ink, fontFamily: T.body }}>
              Simpleton<span style={{ color: T.gold, fontSize: 11, verticalAlign: 'super' }}>™</span>
            </div>
          </div>
          <div style={{
            fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
            color: T.gold, textTransform: 'uppercase', marginBottom: 14,
          }}>
            Smart Enough to Be Called Simpleton
          </div>
          <p style={{
            fontFamily: T.serif, fontStyle: 'italic', fontSize: 14,
            lineHeight: 1.75, color: T.inkMuted, margin: 0, maxWidth: 320,
          }}>
            Live market data, grading logic, and signed appraisals — all in one app.
          </p>
        </div>

        {/* Know — understand what you have */}
        <div>
          <FHead>Know</FHead>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FLink path="/simplicity">Ask Simplicity</FLink>
            <FLink path="/rolex">Rolex Archive</FLink>
            <FLink path="/database">Coin Library</FLink>
            <FLink path="/diamonds">Diamond Education</FLink>
            <FLink path="/education">Lessons</FLink>
            <FLink path="/news">News</FLink>
          </div>
        </div>

        {/* Price — what it's worth today */}
        <div>
          <FHead>Price</FHead>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FLink path="/markets">Live Markets</FLink>
            <FLink path="/tickers">Tickers</FLink>
            <FLink path="/price-board">Price Board</FLink>
            <FLink path="/calculator">Metals Calculator</FLink>
            <FLink path="/diamond-calculator">Diamond Calculator</FLink>
            <FLink path="/coin-calculator">Coin Calculator</FLink>
            <FLink path="/market-signals">Market Signals</FLink>
          </div>
        </div>

        {/* Print — put it on paper */}
        <div>
          <FHead>Print</FHead>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FLink path="/jewelry-appraisal">Request an Appraisal</FLink>
            <FLink path="/lookup">Verify a Report</FLink>
          </div>
        </div>

        {/* Own — decide what to do with it */}
        <div>
          <FHead>Own</FHead>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FLink path="/what-is-this-worth">What Is This Worth?</FLink>
            <FLink path="/about">About Simpleton</FLink>
            <FLink path="/subscription">Membership</FLink>
            <FLink path="/account">Account</FLink>
            <FLink path="/feedback">Feedback</FLink>
          </div>
        </div>
      </div>

      {/* ═════════════ Band B — credentials rail ═════════════ */}
      <div style={{
        borderTop: `1px solid ${T.hairline}`,
        background: 'rgba(0,0,0,0.18)',
      }}>
        <div style={{
          maxWidth: 1240, margin: '0 auto',
          padding: '18px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 20,
        }}>
          {/* Credentials */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em',
              color: T.inkMuted, textTransform: 'uppercase',
            }}>
              ◆ GIA Graduate Gemologist
            </span>
            <span style={{
              fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em',
              color: T.inkMuted, textTransform: 'uppercase',
            }}>
              ◆ Sources Cited on Every Number
            </span>
            <span style={{
              fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em',
              color: T.inkMuted, textTransform: 'uppercase',
            }}>
              ◆ Secure · Encrypted · Private
            </span>
          </div>

          {/* Region / currency */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', color: T.inkFaint }}>
              United States · English · USD ($)
            </span>
          </div>
        </div>
      </div>

      {/* ═════════════ Band C — legal micro-strip ═════════════ */}
      <div style={{
        borderTop: `1px solid ${T.hairline}`,
      }}>
        <div style={{
          maxWidth: 1240, margin: '0 auto',
          padding: '16px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
            fontFamily: T.mono, fontSize: 10, color: T.inkFaint, letterSpacing: '0.04em',
          }}>
            <span>© 2025 Simpleton Technologies · A Ladale Industries company</span>
            <LegalLink path="/terms-of-service">Terms</LegalLink>
            <LegalLink path="/privacy-policy">Privacy</LegalLink>
            <LegalLink path="/legal-disclosure">Disclosures</LegalLink>
          </div>
          <div style={{
            fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em', color: T.inkFaint,
          }}>
            Built on LodeRuntime™
          </div>
        </div>
      </div>
    </footer>
  );
}
