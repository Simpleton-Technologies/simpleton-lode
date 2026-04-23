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

import React, { useMemo, useRef, useState } from 'react';
import { useLode } from '@/lib/lode-context';
import { TopNav } from '@/components/layout/TopNav';
import { Footer } from '@/components/layout/Footer';
import { PhotoUploader } from '@/components/PhotoUploader';
import {
  SHAPES, COLORS, CLARITIES, CUTS, FLUORESCENCE, LABS,
  computeDiamondReference,
} from '@/lib/diamond-index';
import { addRecord, generateRecordId, computeFingerprint } from '@/lib/appraisal-registry';
import { generateAppraisalPdf, downloadPdfBlob, emailAppraisal } from '@/lib/appraisal-client';

// Current TOS version — bump when the legal copy is revised so records
// carry a stable reference to which version the owner accepted.
const TOS_VERSION = '2026-04-20.v1';
const TOS_COPY = `I understand this is a self-serve reference report — not a certified or signed appraisal. It is generated from specifications I provide and has not been reviewed in-hand by a gemologist. This report is not suitable as a binding valuation for insurance, donation, inheritance, or litigation without an independent review by a qualified appraiser. I acknowledge that Ladale Industries LLC and Simpleton Technologies make no representations as to the accuracy of the valuation and accept no liability for decisions made based on this report.`;

// Dark tokens for chrome.
const T = {
  bg:        '#0b0b12',
  ink:       '#f4efe2',
  inkMuted:  '#9a937f',
  inkFaint:  '#6b6552',
  gold:      '#c9a84c',
  rose:      '#f43f5e',
  good:      '#3ccf91',
  hairline:  'rgba(244,239,226,0.10)',
  panel:     'rgba(244,239,226,0.03)',
  panelBord: 'rgba(244,239,226,0.08)',
  mono:      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  body:      '"Inter", -apple-system, system-ui, sans-serif',
  serif:     '"EB Garamond", "Playfair Display", Georgia, serif',
  display:   '"Playfair Display", Georgia, serif',
};

// Cream tokens for the document surface.
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
  hairline:  '#E5DFD1',
  hairlineBold: '#C8C0AA',
  mono:      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  body:      '"Inter", -apple-system, system-ui, sans-serif',
  serif:     '"EB Garamond", "Playfair Display", Georgia, serif',
  display:   '"Playfair Display", Georgia, serif',
};

const VALUE_CONTEXTS = [
  { key: 'retail replacement', label: 'Retail replacement', desc: 'For insurance — what to replace it with at a retail jeweler.' },
  { key: 'estate',              label: 'Estate',              desc: 'For probate / inheritance — what a willing buyer and seller settle at.' },
  { key: 'fair market',         label: 'Fair market',         desc: 'For donation / tax — IRS fair-market value.' },
  { key: 'wholesale',           label: 'Wholesale',           desc: 'For a trade — what the trade pays cash today.' },
];

function formatUSD(n) {
  if (!isFinite(n) || n < 0) return '$0';
  return '$' + Math.round(n).toLocaleString();
}

function formatDate(d) {
  try {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return d.toString(); }
}

export default function JewelryAppraisal() {
  const { siteAST } = useLode();

  const [step, setStep]         = useState('select');
  const [laneType, setLaneType] = useState(null);

  const [form, setForm] = useState({
    shape: 'round', carat: '1.00', color: 'G', clarity: 'VS1',
    cut: 'Excellent', fluor: 'None', lab: 'GIA',
    labReport: '',
    ownerName: '',
    ownerEmail: '',
    valueContext: 'retail replacement',
    notes: '',
  });

  const [photos, setPhotos]     = useState([]);
  const [tosAccepted, setTos]   = useState(false);
  const [generated, setGenerated] = useState(null);
  const [sending, setSending]   = useState(false);
  const [sendResult, setSendResult] = useState(null); // { ok, messageId } | { error }
  const [pdfBusy, setPdfBusy]   = useState(false);

  const docRef = useRef(null);

  const handleField = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    if (siteAST.userInteractionNeuron) {
      try { window.__lode?.runtime?.brain?.stimulate(siteAST.userInteractionNeuron, 2); } catch (_) {}
    }
  };

  const reference = useMemo(() => {
    if (laneType !== 'diamond') return null;
    return computeDiamondReference({
      shape: form.shape,
      carat: parseFloat(form.carat),
      color: form.color, clarity: form.clarity,
      cut: form.cut, fluor: form.fluor, lab: form.lab,
    });
  }, [laneType, form]);

  const hasRequiredFields = laneType === 'diamond'
    && form.ownerName.trim().length > 1
    && reference?.parsedCarat > 0;
  const canGenerate = hasRequiredFields && tosAccepted;

  const generate = () => {
    if (!canGenerate) return;

    const issuedAt = new Date().toISOString().slice(0, 10);
    const id = generateRecordId();
    const shapeLabel = SHAPES.find(s => s.key === form.shape)?.label || form.shape;

    const specs = [
      { label: 'Shape',        value: shapeLabel },
      { label: 'Carat',        value: `${reference.parsedCarat.toFixed(2)} ct` },
      { label: 'Color',        value: form.color },
      { label: 'Clarity',      value: form.clarity },
    ];
    if (reference.isRound) specs.push({ label: 'Cut', value: form.cut });
    specs.push({ label: 'Fluorescence', value: form.fluor });
    specs.push({
      label: 'Lab',
      value: form.labReport ? `${form.lab} · ${form.labReport}` : `${form.lab} (self-reported)`,
    });

    // Photos are stored as dataURLs directly on the record so the Lookup
    // page (same-browser) and the PDF template can both render them
    // without a separate fetch. When the backend DB + storage bucket
    // ship, photos become URLs and the record gets thinner.
    const recordPhotos = photos.map(p => ({
      dataURL: p.dataURL,
      width: p.width,
      height: p.height,
      bytes: p.bytes,
    }));

    const record = {
      id,
      issuedAt,
      lane: 'uncertified',
      signer: null,
      signerStatement: 'Self-serve reference valuation — not signed or certified.',
      itemType: 'diamond',
      title: `${reference.parsedCarat.toFixed(2)} ct ${shapeLabel} Diamond`,
      specs,
      valueAtIssue: Math.round(reference.wholesale),
      valueContext: form.valueContext,
      status: 'active',
      fingerprint: computeFingerprint({
        id, issuedAt, title: `${reference.parsedCarat.toFixed(2)} ct ${shapeLabel}`,
        specs, value: Math.round(reference.wholesale),
      }),
      owner: { name: form.ownerName.trim(), email: form.ownerEmail.trim() },
      notes: form.notes.trim(),
      photos: recordPhotos,
      tos: {
        version: TOS_VERSION,
        acceptedAt: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
      breakdown: {
        perCtWholesale: reference.perCtWholesale,
        retailLow: reference.retailLow,
        retailHigh: reference.retailHigh,
        factors: reference.factors,
      },
    };

    addRecord(record);
    setGenerated(record);
    setSendResult(null);
    setStep('preview');
  };

  const downloadPdf = async () => {
    if (!docRef.current || !generated) return;
    setPdfBusy(true);
    try {
      const { blob, filename } = await generateAppraisalPdf(docRef.current, {
        filename: `${generated.id}.pdf`,
      });
      downloadPdfBlob(blob, filename);
    } catch (err) {
      setSendResult({ error: err?.message || 'PDF generation failed.' });
    } finally {
      setPdfBusy(false);
    }
  };

  const sendEmail = async () => {
    if (!docRef.current || !generated) return;
    if (!generated.owner?.email) {
      setSendResult({ error: 'Need an owner email on the report to send.' });
      return;
    }
    setSending(true);
    setSendResult(null);
    try {
      const { base64, filename } = await generateAppraisalPdf(docRef.current, {
        filename: `${generated.id}.pdf`,
      });
      const res = await emailAppraisal({
        record: {
          // Don't ship photo dataURLs in the record body to the server —
          // they're already in the PDF attachment and re-sending them
          // 2× bloats the request. Keep the shape intact otherwise so
          // the server can key the record in its own store later.
          ...generated,
          photos: generated.photos?.map(p => ({
            width: p.width, height: p.height, bytes: p.bytes,
          })) || [],
        },
        pdfBase64: base64,
        pdfFilename: filename,
        to: generated.owner.email,
        tosAccepted: generated.tos,
      });
      setSendResult({ ok: true, messageId: res.messageId || res.id || 'sent' });
    } catch (err) {
      setSendResult({ error: err?.message || 'Email send failed.' });
    } finally {
      setSending(false);
    }
  };

  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/lookup`
    : '/lookup';

  return (
    <div style={{ background: T.bg, color: T.ink, fontFamily: T.body, minHeight: '100vh' }}>
      <div className="appraisal-chrome">
        <TopNav />
      </div>

      <main style={{ padding: '48px 32px 96px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>

          <div className="appraisal-chrome" style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
            color: T.inkMuted, textTransform: 'uppercase', marginBottom: 28,
          }}>
            <StepCrumb active={step === 'select'} done={step !== 'select'} onClick={() => setStep('select')}>1 · Lane</StepCrumb>
            <span style={{ color: T.inkFaint }}>→</span>
            <StepCrumb active={step === 'form'} done={step === 'preview'} onClick={() => { if (laneType) setStep('form'); }}>2 · Details</StepCrumb>
            <span style={{ color: T.inkFaint }}>→</span>
            <StepCrumb active={step === 'preview'} done={false} onClick={() => { if (generated) setStep('preview'); }}>3 · Generate</StepCrumb>
          </div>

          {/* STEP 1 — Lane selector */}
          {step === 'select' && (
            <section className="appraisal-chrome">
              <HeadlinePair lead="Put it on paper." italic="Start with what the piece is." />
              <p style={{ fontFamily: T.serif, fontSize: 16, fontStyle: 'italic', color: T.inkMuted, maxWidth: 680, lineHeight: 1.75, margin: '0 0 32px 0' }}>
                Self-serve reference appraisal — generates a downloadable PDF
                and can email it to the owner. For a signed certified appraisal,
                Demiris reviews in-hand and signs Lane 2.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
                <LaneCard
                  active={laneType === 'diamond'}
                  onClick={() => setLaneType('diamond')}
                  title="Diamond"
                  subtitle="Loose stone or center stone"
                  desc="Shape, 4Cs, fluorescence, grading lab. Photos attach to the report."
                  available
                />
                <LaneCard
                  title="Metal melt"
                  subtitle="Bullion, scrap, or melt-only jewelry"
                  desc="Gold, silver, platinum, palladium at today's spot."
                  status="Use the metals calculator"
                  onClick={() => window.navigate('/calculator')}
                />
                <LaneCard
                  title="Watch · Coin · Full jewelry"
                  subtitle="Mounted pieces, watches, coins"
                  desc="Requires in-hand review. Request certified lane."
                  status="Request certified →"
                  onClick={() => window.location.assign('mailto:appraisal@simpletontechnologies.com?subject=Certified%20appraisal%20request')}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  disabled={!laneType || laneType !== 'diamond'}
                  onClick={() => setStep('form')}
                  style={btnPrimary(laneType === 'diamond')}
                >
                  Continue →
                </button>
              </div>
            </section>
          )}

          {/* STEP 2 — Details form */}
          {step === 'form' && laneType === 'diamond' && (
            <section className="appraisal-chrome">
              <HeadlinePair lead="Describe the stone." italic="Add photos. Sign the disclosure." />

              <div style={{
                display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)',
                gap: 36, marginTop: 28,
              }}>
                {/* LEFT — specs + photos */}
                <div>
                  <DarkLabel>Shape</DarkLabel>
                  <ChipGrid>
                    {SHAPES.map(s => (
                      <DarkChip key={s.key} selected={s.key === form.shape} onClick={() => setForm({ ...form, shape: s.key })}>
                        {s.label}
                      </DarkChip>
                    ))}
                  </ChipGrid>

                  <DarkLabel>Carat</DarkLabel>
                  <DarkInput value={form.carat} onChange={handleField('carat')} placeholder="1.00" />

                  <DarkLabel>Color</DarkLabel>
                  <ChipRow>
                    {COLORS.map(c => (
                      <DarkChip key={c} selected={c === form.color} onClick={() => setForm({ ...form, color: c })}>{c}</DarkChip>
                    ))}
                  </ChipRow>

                  <DarkLabel>Clarity</DarkLabel>
                  <ChipRow>
                    {CLARITIES.map(c => (
                      <DarkChip key={c} selected={c === form.clarity} onClick={() => setForm({ ...form, clarity: c })}>{c}</DarkChip>
                    ))}
                  </ChipRow>

                  {form.shape === 'round' && (
                    <>
                      <DarkLabel>Cut</DarkLabel>
                      <ChipRow>
                        {CUTS.map(c => (
                          <DarkChip key={c} selected={c === form.cut} onClick={() => setForm({ ...form, cut: c })}>{c}</DarkChip>
                        ))}
                      </ChipRow>
                    </>
                  )}

                  <DarkLabel>Fluorescence</DarkLabel>
                  <ChipRow>
                    {FLUORESCENCE.map(f => (
                      <DarkChip key={f} selected={f === form.fluor} onClick={() => setForm({ ...form, fluor: f })}>{f}</DarkChip>
                    ))}
                  </ChipRow>

                  <DarkLabel>Grading lab</DarkLabel>
                  <ChipRow>
                    {LABS.map(l => (
                      <DarkChip key={l} selected={l === form.lab} onClick={() => setForm({ ...form, lab: l })}>{l}</DarkChip>
                    ))}
                  </ChipRow>

                  <DarkLabel>Lab report # (optional)</DarkLabel>
                  <DarkInput value={form.labReport} onChange={handleField('labReport')} placeholder="e.g. GIA 2255442887" />

                  <DarkLabel>Photos</DarkLabel>
                  <PhotoUploader photos={photos} onChange={setPhotos} />
                </div>

                {/* RIGHT — owner + context + TOS + preview */}
                <div>
                  <DarkLabel>Prepared for (name)</DarkLabel>
                  <DarkInput value={form.ownerName} onChange={handleField('ownerName')} placeholder="Full name on the report" />

                  <DarkLabel>Email (required if you want it mailed)</DarkLabel>
                  <DarkInput value={form.ownerEmail} onChange={handleField('ownerEmail')} placeholder="owner@example.com" />

                  <DarkLabel>Valuation context</DarkLabel>
                  <div style={{ display: 'grid', gap: 6, marginBottom: 20 }}>
                    {VALUE_CONTEXTS.map(c => (
                      <button
                        key={c.key}
                        onClick={() => setForm({ ...form, valueContext: c.key })}
                        style={{
                          padding: '10px 12px', textAlign: 'left',
                          background: form.valueContext === c.key ? 'rgba(201,168,76,0.10)' : T.panel,
                          border: `1px solid ${form.valueContext === c.key ? T.gold : T.panelBord}`,
                          borderRadius: 3,
                          color: T.ink, cursor: 'pointer',
                          fontFamily: T.body, fontSize: 13,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{c.label}</div>
                        <div style={{ color: T.inkMuted, fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>{c.desc}</div>
                      </button>
                    ))}
                  </div>

                  <DarkLabel>Notes (optional)</DarkLabel>
                  <textarea
                    value={form.notes}
                    onChange={handleField('notes')}
                    placeholder="Anything the report should mention — setting, provenance, recent cert, etc."
                    rows={3}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: T.panel, border: `1px solid ${T.panelBord}`, borderRadius: 3,
                      color: T.ink, fontFamily: T.body, fontSize: 13,
                      resize: 'vertical', outline: 'none', marginBottom: 24,
                    }}
                  />

                  {reference && reference.parsedCarat > 0 && (
                    <div style={{
                      padding: '14px 16px', marginBottom: 18,
                      border: `1px solid ${T.hairline}`, borderRadius: 3,
                      background: 'linear-gradient(180deg, rgba(201,168,76,0.05) 0%, rgba(201,168,76,0) 100%)',
                    }}>
                      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', color: T.gold, textTransform: 'uppercase' }}>
                        Live reference estimate
                      </div>
                      <div style={{ fontFamily: T.display, fontSize: 28, color: T.ink, margin: '4px 0 0' }}>
                        {formatUSD(reference.wholesale)}
                      </div>
                      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.inkMuted }}>
                        Retail range {formatUSD(reference.retailLow)} – {formatUSD(reference.retailHigh)}
                      </div>
                    </div>
                  )}

                  {/* TOS gate */}
                  <div style={{
                    padding: '14px 16px',
                    border: `1px solid ${tosAccepted ? 'rgba(60,207,145,0.35)' : T.panelBord}`,
                    borderRadius: 3,
                    background: tosAccepted ? 'rgba(60,207,145,0.04)' : T.panel,
                    cursor: 'pointer',
                  }} onClick={() => setTos(v => !v)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={tosAccepted}
                        onChange={(e) => setTos(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginTop: 3, accentColor: T.gold }}
                      />
                      <div style={{ fontFamily: T.serif, fontSize: 12, color: T.inkMuted, lineHeight: 1.6 }}>
                        {TOS_COPY}
                        <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', color: T.inkFaint, marginTop: 6 }}>
                          TOS version {TOS_VERSION}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 32, flexWrap: 'wrap' }}>
                <button onClick={() => setStep('select')} style={btnGhost()}>← Back</button>
                <button onClick={generate} disabled={!canGenerate} style={btnPrimary(canGenerate)}>
                  Generate reference report →
                </button>
              </div>

              {!canGenerate && hasRequiredFields && !tosAccepted && (
                <div style={{ marginTop: 12, fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.inkFaint, textAlign: 'right' }}>
                  Accept the disclosure above to continue.
                </div>
              )}
              {!hasRequiredFields && (
                <div style={{ marginTop: 12, fontFamily: T.serif, fontStyle: 'italic', fontSize: 12, color: T.inkFaint, textAlign: 'right' }}>
                  Name and a non-zero carat required.
                </div>
              )}
            </section>
          )}

          {/* STEP 3 — Preview + actions */}
          {step === 'preview' && generated && (
            <>
              <div className="appraisal-chrome" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 20, flexWrap: 'wrap', gap: 12,
              }}>
                <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.18em', color: T.inkMuted, textTransform: 'uppercase' }}>
                  Reference report · {generated.id}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => setStep('form')} style={btnGhost()}>← Edit</button>
                  <button onClick={() => window.navigate(`/lookup?id=${generated.id}`)} style={btnGhost()}>Verify in Lookup</button>
                  <button onClick={downloadPdf} disabled={pdfBusy} style={btnPrimary(!pdfBusy)}>
                    {pdfBusy ? 'Rendering…' : 'Download PDF'}
                  </button>
                  <button
                    onClick={sendEmail}
                    disabled={sending || !generated.owner?.email}
                    style={btnPrimary(!sending && !!generated.owner?.email)}
                    title={!generated.owner?.email ? 'No owner email on record' : 'Send the PDF to the owner'}
                  >
                    {sending ? 'Sending…' : 'Email to owner'}
                  </button>
                </div>
              </div>

              {/* Send status */}
              {sendResult?.ok && (
                <div className="appraisal-chrome" style={{
                  marginBottom: 16, padding: '10px 14px',
                  background: 'rgba(60,207,145,0.06)',
                  border: `1px solid rgba(60,207,145,0.35)`,
                  borderRadius: 3,
                  fontFamily: T.mono, fontSize: 11, color: T.good, letterSpacing: '0.06em',
                }}>
                  ✓ Emailed to {generated.owner?.email} · ref {sendResult.messageId}
                </div>
              )}
              {sendResult?.error && (
                <div className="appraisal-chrome" style={{
                  marginBottom: 16, padding: '10px 14px',
                  background: 'rgba(244,63,94,0.06)',
                  border: `1px solid rgba(244,63,94,0.35)`,
                  borderRadius: 3,
                  fontFamily: T.mono, fontSize: 11, color: T.rose, letterSpacing: '0.04em',
                }}>
                  ✗ {sendResult.error}
                </div>
              )}

              <div ref={docRef}>
                <ReferenceDocument record={generated} verifyUrl={verifyUrl} generatedAt={new Date()} />
              </div>

              <div className="appraisal-chrome" style={{
                marginTop: 36, padding: '20px 24px',
                border: `1px solid ${T.hairline}`, borderRadius: 3,
                background: T.panel,
              }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', color: T.gold, textTransform: 'uppercase', marginBottom: 8 }}>
                  Want this signed?
                </div>
                <p style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 14, color: T.inkMuted, lineHeight: 1.75, margin: 0 }}>
                  This is a self-serve reference. For a signed certified
                  appraisal (insurance binding, court-admissible, Demiris Brown,
                  GIA Graduate Gemologist), request certified lane at{' '}
                  <span style={{ fontFamily: T.mono, color: T.ink }}>appraisal@simpletontechnologies.com</span>.
                </p>
              </div>
            </>
          )}

        </div>
      </main>

      <div className="appraisal-chrome">
        <Footer />
      </div>

      <style>{`
        @media print {
          @page { size: Letter; margin: 12mm; }
          html, body { background: #fff !important; }
          .appraisal-chrome { display: none !important; }
          .appraisal-document {
            box-shadow: none !important;
            border: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .appraisal-document-inner { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
//  Reference Document — the printable/PDF surface (with photos)
// ───────────────────────────────────────────────────────────────────────
function ReferenceDocument({ record, verifyUrl, generatedAt }) {
  const shapeLabel = record.title;
  const issued = new Date(record.issuedAt + 'T00:00:00');
  const heroPhoto = record.photos?.[0];
  const detailPhotos = record.photos?.slice(1) || [];

  return (
    <article
      className="appraisal-document"
      style={{
        background: P.bg, color: P.ink,
        border: `1px solid ${P.hairlineBold}`,
        borderRadius: 2,
        maxWidth: 820, margin: '0 auto',
        boxShadow: '0 1px 0 rgba(0,0,0,0.03), 0 10px 30px rgba(28,26,21,0.08)',
      }}
    >
      <div className="appraisal-document-inner" style={{ padding: '40px 48px 36px' }}>

        {/* Letterhead */}
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          borderBottom: `1px solid ${P.hairline}`, paddingBottom: 18,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, background: P.blue, color: '#fff',
                borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 15,
              }}>S</div>
              <div>
                <div style={{ fontFamily: P.display, fontSize: 17, color: P.ink, letterSpacing: '-0.005em', fontWeight: 600 }}>
                  Simpleton Technologies
                </div>
                <div style={{ fontFamily: P.mono, fontSize: 9, letterSpacing: '0.22em', color: P.gold, textTransform: 'uppercase', marginTop: 2 }}>
                  Smart Enough to Be Called Simpleton
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.18em', color: P.inkMuted, textTransform: 'uppercase' }}>
              Reference Report
            </div>
            <div style={{ fontFamily: P.mono, fontSize: 14, color: P.ink, marginTop: 4, letterSpacing: '0.04em', fontWeight: 600 }}>
              {record.id}
            </div>
            <div style={{ fontFamily: P.mono, fontSize: 10, color: P.inkFaint, marginTop: 2, letterSpacing: '0.08em' }}>
              Issued {formatDate(issued)}
            </div>
          </div>
        </header>

        <div style={{
          marginTop: 18, marginBottom: 20,
          padding: '10px 12px',
          border: `1px dashed ${P.hairlineBold}`,
          background: P.bgSubtle,
          borderRadius: 2,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
        }}>
          <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em', color: P.inkMuted, textTransform: 'uppercase' }}>
            Self-serve · Uncertified · Not signed
          </div>
          <div style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 11, color: P.inkMuted }}>
            For a signed certified report, request the certified lane.
          </div>
        </div>

        {/* Hero photo (if present) */}
        {heroPhoto && (
          <div style={{
            marginBottom: 20,
            borderRadius: 2, overflow: 'hidden',
            border: `1px solid ${P.hairline}`,
            background: '#000',
          }}>
            <img
              src={heroPhoto.dataURL}
              alt="Subject"
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 420, objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Subject + prepared-for */}
        <section style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em', color: P.blue, textTransform: 'uppercase', marginBottom: 6 }}>
            Subject
          </div>
          <h2 style={{ fontFamily: P.display, fontSize: 26, fontWeight: 500, color: P.ink, margin: 0, letterSpacing: '-0.008em' }}>
            {shapeLabel}
          </h2>

          {record.owner?.name && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em', color: P.inkMuted, textTransform: 'uppercase', marginBottom: 4 }}>
                Prepared for
              </div>
              <div style={{ fontFamily: P.body, fontSize: 15, color: P.ink }}>{record.owner.name}</div>
              {record.owner.email && (
                <div style={{ fontFamily: P.mono, fontSize: 11, color: P.inkMuted, marginTop: 2 }}>{record.owner.email}</div>
              )}
            </div>
          )}
        </section>

        {/* Specifications */}
        <section style={{ borderTop: `1px solid ${P.hairline}`, paddingTop: 16, marginBottom: 20 }}>
          <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em', color: P.inkMuted, textTransform: 'uppercase', marginBottom: 10 }}>
            Specifications
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {record.specs.map((s, i) => (
                <tr key={s.label + i}>
                  <td style={{ padding: '7px 0', width: '38%', color: P.inkMuted, fontFamily: P.body, fontSize: 13, borderBottom: `1px solid ${P.hairline}` }}>{s.label}</td>
                  <td style={{ padding: '7px 0', color: P.ink, fontFamily: P.mono, fontSize: 13, fontWeight: 500, borderBottom: `1px solid ${P.hairline}` }}>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Valuation */}
        <section style={{ paddingTop: 10, marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em', color: P.inkMuted, textTransform: 'uppercase' }}>
              Reference valuation
            </div>
            <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.08em', color: P.inkFaint, textTransform: 'uppercase' }}>
              Basis: Simpleton Diamond Index
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 4, marginBottom: 10 }}>
            <div style={{
              fontFamily: P.display, fontSize: 44, fontWeight: 500,
              color: P.ink, letterSpacing: '-0.012em', lineHeight: 1,
            }}>
              {formatUSD(record.valueAtIssue)}
            </div>
            <div style={{ fontFamily: P.mono, fontSize: 11, letterSpacing: '0.12em', color: P.inkMuted, textTransform: 'uppercase' }}>
              USD · {record.valueContext}
            </div>
          </div>

          {record.breakdown && (
            <div style={{
              padding: '12px 14px',
              background: P.blueSoft,
              border: `1px solid rgba(26,95,207,0.18)`,
              borderRadius: 2,
              display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
            }}>
              <div>
                <div style={{ fontFamily: P.mono, fontSize: 9, letterSpacing: '0.22em', color: P.blueDeep, textTransform: 'uppercase' }}>
                  Typical retail range
                </div>
                <div style={{ fontFamily: P.mono, fontSize: 13, color: P.ink, fontWeight: 600, marginTop: 2 }}>
                  {formatUSD(record.breakdown.retailLow)} – {formatUSD(record.breakdown.retailHigh)}
                </div>
              </div>
              <div style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 12, color: P.inkMuted, alignSelf: 'center', maxWidth: 380 }}>
                1.4× wholesale (estate / trade) to 2.2× (luxury retail).
              </div>
            </div>
          )}
        </section>

        {/* Detail photos */}
        {detailPhotos.length > 0 && (
          <section style={{ borderTop: `1px solid ${P.hairline}`, paddingTop: 14, marginBottom: 20 }}>
            <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em', color: P.inkMuted, textTransform: 'uppercase', marginBottom: 10 }}>
              Additional photos
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 8,
            }}>
              {detailPhotos.map((ph, i) => (
                <div key={i} style={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${P.hairline}`, aspectRatio: '1 / 1', background: '#000' }}>
                  <img src={ph.dataURL} alt={`Detail ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Derivation */}
        {record.breakdown?.factors && (
          <section style={{ borderTop: `1px solid ${P.hairline}`, paddingTop: 14, marginBottom: 20 }}>
            <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em', color: P.inkMuted, textTransform: 'uppercase', marginBottom: 8 }}>
              Derivation
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: P.mono, fontSize: 11 }}>
              <tbody>
                <Row label="Base reference" value="$5,500 / ct" cite="1.00 ct · Round · G · VS1 · Excellent · GIA" />
                <Row label="× Color"      value={`${record.breakdown.factors.color.toFixed(2)}×`} />
                <Row label="× Clarity"    value={`${record.breakdown.factors.clarity.toFixed(2)}×`} />
                <Row label="× Carat curve" value={`${record.breakdown.factors.carat.toFixed(2)}×`} />
                <Row label="× Shape"      value={`${record.breakdown.factors.shape.toFixed(2)}×`} />
                <Row label="× Cut"        value={`${record.breakdown.factors.cut.toFixed(2)}×`} />
                <Row label="× Fluorescence" value={`${record.breakdown.factors.fluor.toFixed(2)}×`} />
                <Row label="× Lab"        value={`${record.breakdown.factors.lab.toFixed(2)}×`} />
                <Row label="= per-ct wholesale" value={formatUSD(record.breakdown.perCtWholesale)} emphasize />
                <Row label="× carats"     value={record.specs.find(s => s.label === 'Carat')?.value ?? '—'} />
                <Row label="= reference total" value={formatUSD(record.valueAtIssue)} emphasize />
              </tbody>
            </table>
          </section>
        )}

        {record.notes && (
          <section style={{ borderTop: `1px solid ${P.hairline}`, paddingTop: 14, marginBottom: 20 }}>
            <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em', color: P.inkMuted, textTransform: 'uppercase', marginBottom: 6 }}>
              Notes
            </div>
            <p style={{ fontFamily: P.serif, fontSize: 13, fontStyle: 'italic', color: P.inkMuted, lineHeight: 1.7, margin: 0 }}>
              {record.notes}
            </p>
          </section>
        )}

        {/* Status */}
        <section style={{ borderTop: `1px solid ${P.hairline}`, paddingTop: 14, marginBottom: 14 }}>
          <div style={{ fontFamily: P.mono, fontSize: 10, letterSpacing: '0.22em', color: P.inkMuted, textTransform: 'uppercase', marginBottom: 6 }}>
            Status
          </div>
          <p style={{ fontFamily: P.serif, fontSize: 13, fontStyle: 'italic', color: P.inkMuted, lineHeight: 1.7, margin: 0 }}>
            This is a self-serve reference report generated from user-supplied
            specifications. It is <strong style={{ color: P.ink, fontStyle: 'normal' }}>not signed, not certified</strong>, and not
            suitable as a binding valuation for insurance, donation,
            inheritance, or litigation without an independent review. Actual
            market outcomes depend on in-hand grading, specific inclusions,
            current market conditions, and the grading certificate itself.
            For a signed certified appraisal by Demiris Brown, GIA Graduate
            Gemologist, request the certified lane.
          </p>
        </section>

        {/* Footer */}
        <footer style={{
          marginTop: 18, paddingTop: 14,
          borderTop: `2px solid ${P.hairlineBold}`,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          fontFamily: P.mono, fontSize: 10, letterSpacing: '0.06em', color: P.inkMuted,
        }}>
          <div>
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.18em', color: P.inkFaint }}>Fingerprint</div>
            <div style={{ color: P.ink, fontWeight: 600, marginTop: 2 }}>{record.fingerprint}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.18em', color: P.inkFaint }}>Verify</div>
            <div style={{ color: P.blue, fontWeight: 600, marginTop: 2 }}>
              {verifyUrl.replace(/^https?:\/\//, '')}
            </div>
          </div>
          <div>
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.18em', color: P.inkFaint }}>Generated</div>
            <div style={{ color: P.ink, marginTop: 2 }}>
              {generatedAt.toISOString().replace('T', ' ').slice(0, 16)} UTC
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.18em', color: P.inkFaint }}>Issuer</div>
            <div style={{ color: P.ink, marginTop: 2 }}>Ladale Industries LLC</div>
          </div>
          {record.tos?.version && (
            <div style={{ gridColumn: '1 / -1', marginTop: 8, fontSize: 9, color: P.inkFaint, letterSpacing: '0.04em' }}>
              Owner accepted reference-report disclosure {record.tos.version} on {new Date(record.tos.acceptedAt).toISOString().slice(0, 19).replace('T', ' ')} UTC.
            </div>
          )}
        </footer>

      </div>
    </article>
  );
}

// ───────────────────────────────────────────────────────────────────────
//  UI primitives
// ───────────────────────────────────────────────────────────────────────
function HeadlinePair({ lead, italic }) {
  return (
    <>
      <h1 style={{ fontFamily: T.display, fontSize: 'clamp(30px, 4.2vw, 50px)', fontWeight: 400, lineHeight: 1.1, margin: '0 0 4px 0', letterSpacing: '-0.01em', color: T.ink }}>
        {lead}
      </h1>
      <h1 style={{ fontFamily: T.display, fontSize: 'clamp(30px, 4.2vw, 50px)', fontWeight: 400, fontStyle: 'italic', color: T.gold, lineHeight: 1.1, margin: '0 0 18px 0', letterSpacing: '-0.01em' }}>
        {italic}
      </h1>
    </>
  );
}

function DarkLabel({ children }) {
  return <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', color: T.inkMuted, textTransform: 'uppercase', margin: '14px 0 8px' }}>{children}</div>;
}

function DarkInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text" value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '11px 14px',
        background: T.panel, border: `1px solid ${T.panelBord}`, borderRadius: 3,
        color: T.ink, fontFamily: T.body, fontSize: 14, outline: 'none',
      }}
      onFocus={(e) => { e.target.style.borderColor = T.gold; }}
      onBlur={(e)  => { e.target.style.borderColor = T.panelBord; }}
    />
  );
}

function ChipRow({ children })  { return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>{children}</div>; }
function ChipGrid({ children }) { return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 4 }}>{children}</div>; }

function DarkChip({ children, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 12px',
      background: selected ? 'rgba(201,168,76,0.12)' : 'transparent',
      border: `1px solid ${selected ? T.gold : T.panelBord}`, borderRadius: 2,
      color: selected ? T.gold : T.ink,
      fontFamily: T.mono, fontSize: 11, letterSpacing: '0.06em', fontWeight: 600, cursor: 'pointer',
    }}>{children}</button>
  );
}

function LaneCard({ title, subtitle, desc, active, available, status, onClick }) {
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', padding: '18px 18px 20px',
      background: active ? 'rgba(201,168,76,0.06)' : T.panel,
      border: `1px solid ${active ? T.gold : T.panelBord}`, borderRadius: 3,
      color: T.ink, cursor: 'pointer', fontFamily: T.body,
      display: 'flex', flexDirection: 'column', gap: 8, minHeight: 160,
    }}>
      <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.22em', color: available ? T.gold : T.inkFaint, textTransform: 'uppercase' }}>
        {available ? 'Available now' : status || 'Coming soon'}
      </div>
      <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 500, color: T.ink }}>{title}</div>
      <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.08em', color: T.inkMuted }}>{subtitle}</div>
      <div style={{ fontFamily: T.serif, fontSize: 13, fontStyle: 'italic', color: T.inkMuted, lineHeight: 1.6, marginTop: 4 }}>{desc}</div>
    </button>
  );
}

function StepCrumb({ active, done, onClick, children }) {
  const color = active ? T.gold : done ? T.ink : T.inkFaint;
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: 0, padding: 0, cursor: onClick ? 'pointer' : 'default',
      color, fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: active ? 600 : 500,
    }}>{children}</button>
  );
}

function btnPrimary(enabled) {
  return {
    background: enabled ? `linear-gradient(135deg, #c9a84c 0%, #a8873a 100%)` : 'rgba(201,168,76,0.2)',
    border: `1px solid ${enabled ? '#c9a84c' : 'rgba(201,168,76,0.3)'}`,
    color: enabled ? '#0b0b12' : 'rgba(11,11,18,0.5)',
    padding: '12px 22px', borderRadius: 2,
    fontFamily: T.display, fontSize: 13, fontWeight: 500, letterSpacing: '0.18em',
    textTransform: 'uppercase', cursor: enabled ? 'pointer' : 'not-allowed',
  };
}

function btnGhost() {
  return {
    background: 'transparent', border: `1px solid ${T.hairline}`,
    color: T.gold, padding: '10px 18px', borderRadius: 2,
    fontFamily: T.display, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
  };
}

function Row({ label, value, cite, emphasize }) {
  return (
    <tr>
      <td style={{
        padding: '6px 0', borderBottom: `1px solid ${P.hairline}`,
        color: emphasize ? P.ink : P.inkMuted, fontWeight: emphasize ? 600 : 400,
      }}>
        <div>{label}</div>
        {cite && <div style={{ color: P.inkFaint, fontSize: 9, letterSpacing: '0.08em', marginTop: 1 }}>{cite}</div>}
      </td>
      <td style={{
        padding: '6px 0', borderBottom: `1px solid ${P.hairline}`, textAlign: 'right',
        color: emphasize ? P.blue : P.ink, fontWeight: emphasize ? 600 : 500,
      }}>
        {value}
      </td>
    </tr>
  );
}
