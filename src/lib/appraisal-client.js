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

/**
 * Appraisal client-side helpers: PDF rendering + email send.
 *
 * PDF generation uses html2pdf.js — takes a DOM node and returns a PDF
 * blob in the browser. Same HTML template that prints renders to the file,
 * so there's only one source of truth for the document.
 *
 * Email send is a thin POST to /api/send-appraisal. In dev that's the
 * Express server (simpleton-lode/server/lode-server.js); in prod it's
 * a Vercel serverless function (api/send-appraisal.js). Both accept the
 * same payload shape so switching deploy targets doesn't change the UI.
 */

// html2pdf.js is ~900KB — dynamic-imported below so it doesn't ship on
// first paint. Users who never generate a PDF never download the lib.
let _html2pdfPromise = null;
function loadHtml2Pdf() {
  if (!_html2pdfPromise) _html2pdfPromise = import('html2pdf.js').then(m => m.default || m);
  return _html2pdfPromise;
}

/**
 * Generate a PDF Blob from a DOM element. Returns { blob, base64, filename }.
 * html2pdf's default pipeline: html2canvas → jsPDF. Letter @ 12mm margin
 * matches the Print-to-PDF path so the document reads the same regardless
 * of which button the user clicked.
 */
export async function generateAppraisalPdf(docEl, { filename }) {
  if (!docEl) throw new Error('generateAppraisalPdf: DOM node required');

  const html2pdf = await loadHtml2Pdf();
  const opts = {
    margin:     [12, 12, 12, 12],          // mm
    filename:   filename || 'simpleton-appraisal.pdf',
    image:      { type: 'jpeg', quality: 0.92 },
    html2canvas:{ scale: 2, useCORS: true, backgroundColor: '#FBFAF4' },
    jsPDF:      { unit: 'mm', format: 'letter', orientation: 'portrait' },
    pagebreak:  { mode: ['css', 'legacy'] },
  };

  const blob = await html2pdf().from(docEl).set(opts).outputPdf('blob');
  const base64 = await blobToBase64(blob);
  return { blob, base64, filename: opts.filename };
}

export function downloadPdfBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'simpleton-appraisal.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a tick to start the download before we revoke the URL.
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload  = () => {
      const s = String(fr.result);
      const comma = s.indexOf(',');
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    fr.onerror = () => reject(new Error('Could not encode PDF for transport.'));
    fr.readAsDataURL(blob);
  });
}

/**
 * POST an appraisal to /api/send-appraisal. The server is responsible for
 * calling Resend (or whichever provider is wired) — the client only knows
 * about this endpoint. Payload stays stable across deploy targets.
 *
 *   body: {
 *     record,                // the appraisal record (shape per registry)
 *     pdfBase64,             // PDF attachment (base64, no data: prefix)
 *     pdfFilename,           // e.g. 'SMPL-2026-0100.pdf'
 *     to,                    // owner email
 *     tosAccepted: { version, acceptedAt, userAgent }
 *   }
 *
 * Returns { ok: true, messageId } on success, throws on failure.
 */
export async function emailAppraisal(payload) {
  const res = await fetch('/api/send-appraisal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await res.json() : { text: await res.text() };

  if (!res.ok) {
    const msg = body?.error || body?.text || `Send failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}
