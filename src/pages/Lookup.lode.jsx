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
import { TopNav } from '@/components/layout/TopNav';
import { Footer } from '@/components/layout/Footer';
import { lookupAppraisal, listDemoIds } from '@/lib/appraisal-registry';

// ───────────────────────────────────────────────────────────────────────
//  Design tokens — cream-paper document aesthetic.
//
//  The Lookup page is a verification surface — an insurance adjuster,
//  estate attorney, dealer, or owner should be able to paste a reference
//  ID and get a receipt back. It reads as a paper document, not a web
//  widget. Same cream palette the Home § KNOW / § OWN sections use, so
//  the verification card looks like a Simpleton report even before any
//  PDF gets generated.
// ───────────────────────────────────────────────────────────────────────
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
  gold:      '#C9A84C',
  goldDeep:  '#A8873A',
  hairline:  '#E5DFD1',
  hairlineBold: '#C8C0AA',
  good:      '#2E7D4F',
  rose:      '#B22B3B',
  mono:      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  body:      '"Inter", -apple-system, system-ui, sans-serif',
  serif:     '"EB Garamond", "Playfair Display", Georgia, serif',
  display:   '"Playfair Display", Georgia, serif',
};

function formatUSD(n) {
  if (!isFinite(n) || n < 0) return '$0';
  return '$' + Math.round(n).toLocaleString();
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch (_) { return iso; }
}

export default function Lookup() {
  const { siteAST } = useLode();

  const [input, setInput]       = useState('');
  const [result, setResult]     = useState(null);   // null = idle
  const [submittedAt, setSubmittedAt] = useState(null);

  const demoIds = useMemo(() => listDemoIds(), []);

  const runLookup = (raw) => {
    const r = lookupAppraisal(raw);
    setResult(r);
    setSubmittedAt(new Date());
    if (siteAST.userInteractionNeuron) {
      try { window.__lode?.runtime?.brain?.stimulate(siteAST.userInteractionNeuron, 12); } catch (_) {}
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!input.trim()) return;
    runLookup(input.trim());
  };

  return (
    <div style={{ background: '#0b0b12', minHeight: '100vh' }}>
      <TopNav />

      <main style={{ background: P.bg, color: P.ink, padding: '56px 32px 96px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Section rail */}
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            borderTop: `1px solid ${P.hairline}`, paddingTop: 14, marginBottom: 40,
          }}>
            <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: P.blue }}>
              § PRINT · Verify
            </div>
            <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.08em', color: P.inkMuted }}>
              Appraisal verification registry
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: P.display, fontSize: 'clamp(34px, 4.8vw, 58px)',
            fontWeight: 500, lineHeight: 1.08, margin: '0 0 4px 0',
            letterSpacing: '-0.012em', color: P.ink,
          }}>
            Look up an appraisal.
          </h1>
          <h1 style={{
            fontFamily: P.display, fontSize: 'clamp(34px, 4.8vw, 58px)',
            fontWeight: 400, fontStyle: 'italic', color: P.blue,
            lineHeight: 1.08, margin: '2px 0 20px 0', letterSpacing: '-0.012em',
          }}>
            Confirm the signature.
          </h1>

          <p style={{
            fontFamily: P.serif, fontSize: 16, fontStyle: 'italic',
            color: P.inkMuted, maxWidth: 680, lineHeight: 1.75, margin: '0 0 36px 0',
          }}>
            Insurance adjusters, estate attorneys, dealers, and owners — paste
            the reference ID from the report. Certified records return the
            signer, issue date, and the item specs on file. Uncertified
            (self-serve) records are clearly labeled as such.
          </p>

          {/* Lookup form */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
              padding: 16, background: P.bgPaper,
              border: `1px solid ${P.hairlineBold}`, borderRadius: 3,
              marginBottom: 28,
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="SMPL-2026-0001"
              autoCapitalize="characters"
              spellCheck={false}
              style={{
                padding: '14px 16px',
                background: '#fff',
                border: `1px solid ${P.hairlineBold}`,
                borderRadius: 2,
                color: P.ink,
                fontFamily: P.mono, fontSize: 16, fontWeight: 500,
                outline: 'none',
                letterSpacing: '0.04em',
              }}
              onFocus={(e) => { e.target.style.borderColor = P.blue; }}
              onBlur={(e)  => { e.target.style.borderColor = P.hairlineBold; }}
            />
            <button
              type="submit"
              style={{
                padding: '14px 24px',
                background: P.blue, color: '#fff',
                border: 0, borderRadius: 2,
                fontFamily: P.display, fontSize: 13, fontWeight: 500,
                letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = P.blueDeep; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = P.blue; }}
            >
              Verify
            </button>
          </form>

          {/* Demo-IDs row — quick access so visitors can try it without
              a real report in hand. Labeled as samples so no one assumes
              these are marketing tricks. */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.18em', color: P.inkMuted, textTransform: 'uppercase', marginBottom: 8 }}>
              Try a sample record
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {demoIds.map(id => (
                <button
                  key={id}
                  onClick={() => { setInput(id); runLookup(id); }}
                  style={{
                    padding: '6px 10px',
                    background: 'transparent',
                    border: `1px solid ${P.hairlineBold}`,
                    borderRadius: 2,
                    color: P.blue, cursor: 'pointer',
                    fontFamily: P.mono, fontSize: 11, fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = P.blueSoft; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          {/* Result surface */}
          {result && result.found === false && (
            <NotFound queriedId={result.queriedId} />
          )}

          {result && result.found && (
            <VerificationCard record={result.record} lookedUpAt={submittedAt} />
          )}

          {!result && (
            <InstructionCard />
          )}

          {/* Secondary nav */}
          <div style={{
            marginTop: 56, paddingTop: 20, borderTop: `1px solid ${P.hairline}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 16,
          }}>
            <div style={{ fontFamily: P.serif, fontSize: 13, fontStyle: 'italic', color: P.inkMuted }}>
              Don&rsquo;t have a reference yet?{' '}
              <button
                onClick={() => window.navigate('/jewelry-appraisal')}
                style={{ background: 'transparent', border: 0, color: P.blue, cursor: 'pointer', fontFamily: P.serif, fontSize: 13, fontStyle: 'italic', textDecoration: 'underline' }}
              >
                Request a signed appraisal →
              </button>
            </div>
            <button
              onClick={() => window.navigate('/')}
              style={{
                background: 'transparent', border: `1px solid ${P.hairlineBold}`,
                color: P.blue, padding: '10px 20px', borderRadius: 2,
                fontFamily: P.display, fontSize: 12, letterSpacing: '0.18em',
                textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              ← Home
            </button>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
//  Instruction card — shown when no lookup has been run yet.
// ───────────────────────────────────────────────────────────────────────
function InstructionCard() {
  return (
    <div style={{
      padding: 24, border: `1px dashed ${P.hairlineBold}`, borderRadius: 3,
      background: '#fff',
    }}>
      <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em', color: P.inkMuted, textTransform: 'uppercase', marginBottom: 10 }}>
        What you&rsquo;ll see on a verification
      </div>
      <ul style={{ margin: 0, paddingLeft: 20, color: P.inkMuted, fontFamily: P.serif, fontSize: 14, lineHeight: 1.8, fontStyle: 'italic' }}>
        <li>Issue date and current status (active, superseded, revoked).</li>
        <li>Signer — for certified records, the appraiser and their credential.</li>
        <li>Item type, title, and the specs of record (4Cs for stones, reference/caliber for watches, mint/grade for coins).</li>
        <li>Value at issue and the value context (retail replacement, wholesale, estate).</li>
        <li>A short fingerprint. Certified records will carry a digital signature when the signing workflow ships.</li>
      </ul>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
//  Not-found state.
// ───────────────────────────────────────────────────────────────────────
function NotFound({ queriedId }) {
  return (
    <div style={{
      padding: '24px 28px',
      background: '#fff',
      border: `1px solid ${P.hairlineBold}`,
      borderLeft: `3px solid ${P.rose}`,
      borderRadius: 3,
    }}>
      <div style={{
        fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: P.rose, marginBottom: 8,
      }}>
        No record on file
      </div>
      <div style={{ fontFamily: P.display, fontSize: 22, color: P.ink, marginBottom: 8 }}>
        {queriedId || '—'}
      </div>
      <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.inkMuted, lineHeight: 1.75, margin: 0 }}>
        No appraisal matches that reference. Check the ID on the original
        report — Simpleton IDs follow the format <span style={{ fontFamily: P.mono, fontStyle: 'normal' }}>SMPL-YYYY-NNNN</span>.
        If the report is signed by another firm, verify with that firm directly.
      </p>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
//  Verification card — the "receipt" shape.
// ───────────────────────────────────────────────────────────────────────
function VerificationCard({ record, lookedUpAt }) {
  const isCertified = record.lane === 'certified';
  const statusColor =
    record.status === 'active'     ? P.good :
    record.status === 'superseded' ? P.gold :
    P.rose;

  const lookedUpLabel = lookedUpAt
    ? lookedUpAt.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: false }) + ' CT'
    : '—';

  return (
    <article style={{
      background: '#fff',
      border: `1px solid ${P.hairlineBold}`,
      borderRadius: 3,
      padding: '28px 28px 24px',
      boxShadow: '0 1px 0 rgba(0,0,0,0.03), 0 8px 24px rgba(28,26,21,0.04)',
      position: 'relative',
    }}>

      {/* Top band — lane + status */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        flexWrap: 'wrap', gap: 12,
        paddingBottom: 14, borderBottom: `1px solid ${P.hairline}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{
            fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: isCertified ? P.blue : P.inkMuted,
          }}>
            {isCertified ? 'Certified · Signed' : 'Self-serve · Uncertified'}
          </span>
          <span style={{
            fontFamily: P.mono, fontSize: 10, letterSpacing: '0.12em',
            color: statusColor, textTransform: 'uppercase',
          }}>
            · {record.status}
          </span>
        </div>
        <div style={{ fontFamily: P.mono, fontSize: 10, color: P.inkMuted, letterSpacing: '0.08em' }}>
          Looked up {lookedUpLabel}
        </div>
      </div>

      {/* Title + ID */}
      <div style={{ padding: '18px 0 20px', borderBottom: `1px solid ${P.hairline}` }}>
        <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.18em', color: P.inkMuted, textTransform: 'uppercase', marginBottom: 6 }}>
          Reference · {record.id}
        </div>
        <h2 style={{
          fontFamily: P.display, fontSize: 28, fontWeight: 500,
          margin: 0, color: P.ink, letterSpacing: '-0.008em',
        }}>
          {record.title}
        </h2>
        <div style={{
          fontFamily: P.mono, fontSize: 10, color: P.inkFaint,
          letterSpacing: '0.08em', marginTop: 6, textTransform: 'uppercase',
        }}>
          Issued {formatDate(record.issuedAt)}
        </div>
      </div>

      {/* Specs table */}
      <div style={{ padding: '18px 0 20px', borderBottom: `1px solid ${P.hairline}` }}>
        <div style={{
          fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em',
          color: P.inkMuted, textTransform: 'uppercase', marginBottom: 10,
        }}>
          Specifications on file
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {record.specs.map((s, i) => (
              <tr key={s.label + i}>
                <td style={{
                  padding: '7px 0', width: '38%',
                  color: P.inkMuted, fontFamily: P.body, fontSize: 13,
                  borderBottom: i === record.specs.length - 1 ? '0' : `1px solid ${P.hairline}`,
                }}>
                  {s.label}
                </td>
                <td style={{
                  padding: '7px 0',
                  color: P.ink, fontFamily: P.mono, fontSize: 13, fontWeight: 500,
                  borderBottom: i === record.specs.length - 1 ? '0' : `1px solid ${P.hairline}`,
                }}>
                  {s.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Value */}
      <div style={{ padding: '18px 0 20px', borderBottom: `1px solid ${P.hairline}` }}>
        <div style={{
          fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em',
          color: P.inkMuted, textTransform: 'uppercase', marginBottom: 6,
        }}>
          Value at issue
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <div style={{
            fontFamily: P.display, fontSize: 36, fontWeight: 500,
            color: P.ink, letterSpacing: '-0.01em', lineHeight: 1,
          }}>
            {formatUSD(record.valueAtIssue)}
          </div>
          <div style={{
            fontFamily: P.mono, fontSize: 11, letterSpacing: '0.08em',
            color: P.inkMuted, textTransform: 'uppercase',
          }}>
            USD · {record.valueContext}
          </div>
        </div>
      </div>

      {/* Signer block */}
      <div style={{ padding: '18px 0 4px' }}>
        <div style={{
          fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em',
          color: P.inkMuted, textTransform: 'uppercase', marginBottom: 10,
        }}>
          {isCertified ? 'Signed by' : 'Status'}
        </div>

        {isCertified ? (
          <div>
            <div style={{
              fontFamily: P.display, fontSize: 20, color: P.ink,
              letterSpacing: '-0.005em',
            }}>
              {record.signer}
            </div>
            <div style={{
              fontFamily: P.serif, fontStyle: 'italic', fontSize: 13,
              color: P.inkMuted, marginTop: 4, lineHeight: 1.65,
            }}>
              {record.signerStatement}
            </div>
          </div>
        ) : (
          <div style={{
            fontFamily: P.serif, fontStyle: 'italic', fontSize: 14,
            color: P.inkMuted, lineHeight: 1.7, maxWidth: 640,
          }}>
            {record.signerStatement} This record is generated from user-supplied
            specifications and is not reviewed by a gemologist. For a signed
            valuation, request a certified appraisal.
          </div>
        )}

        <div style={{
          marginTop: 20, padding: '10px 12px',
          background: P.bgSubtle, border: `1px solid ${P.hairline}`,
          borderRadius: 2,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.18em', color: P.inkFaint, textTransform: 'uppercase' }}>
            Record fingerprint
          </div>
          <div style={{ fontFamily: P.mono, fontSize: 12, color: P.ink, letterSpacing: '0.08em' }}>
            {record.fingerprint}
          </div>
        </div>

        <p style={{
          marginTop: 14, fontSize: 11, color: P.inkFaint,
          fontFamily: P.serif, fontStyle: 'italic', lineHeight: 1.7,
        }}>
          This is a public verification stub. The full appraisal document is
          retained in the owner&rsquo;s account. When the digital-signature
          workflow ships, certified records will carry a PKCS#7 signature
          verifiable against a public key published on this page.
        </p>
      </div>
    </article>
  );
}
