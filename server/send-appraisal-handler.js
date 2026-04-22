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
 * Appraisal email send — shared handler (SendGrid).
 *
 * Called from both:
 *   - The dev Express server (server/lode-server.js)
 *   - The Vercel serverless function (api/send-appraisal.js)
 *
 * One implementation means Lane-1 send behaves identically in local dev
 * and production. To swap providers later, replace the sgMail.send()
 * call — the rest of the contract (payload shape, error shape, audit
 * logging) stays constant.
 *
 * Required env vars:
 *   SENDGRID_API_KEY       API key with "Mail Send" permission
 *                          (SendGrid → Settings → API Keys)
 *   APPRAISAL_FROM         Verified sender. Either:
 *                            'appraisal@simpletontechnologies.com'
 *                          or the "Name <email>" form:
 *                            'Simpleton Technologies <appraisal@simpletontechnologies.com>'
 *                          The email address here must be authenticated
 *                          in SendGrid (either by Domain Authentication
 *                          covering the whole domain, or by Single Sender
 *                          Verification on that exact address).
 *
 * Optional env vars:
 *   APPRAISAL_REPLY_TO     reply-to for outbound appraisal emails
 *   APPRAISAL_BCC          archive copy to Demiris's own inbox
 *   VERIFY_BASE_URL        overrides the verify link in the email body
 *                          (defaults to https://simpletonapp.com/lookup)
 */

const sgMail = require('@sendgrid/mail');

const DEFAULT_VERIFY_URL = 'https://simpletonapp.com/lookup';

function badRequest(message) {
  const e = new Error(message);
  e.status = 400;
  return e;
}

function serverError(message) {
  const e = new Error(message);
  e.status = 500;
  return e;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Parse a sender string in either bare ("a@b.com") or named
 * ("Display Name <a@b.com>") form into the shape SendGrid expects
 * for the `from` field.
 */
function parseSender(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const m = /^\s*(.+?)\s*<\s*([^>]+?)\s*>\s*$/.exec(s);
  if (m) return { name: m[1], email: m[2] };
  return { email: s };
}

function buildEmailHtml({ record, verifyUrl }) {
  const ownerName = escapeHtml(record?.owner?.name || 'the owner');
  const title     = escapeHtml(record?.title || 'Reference Report');
  const id        = escapeHtml(record?.id || '');
  const fp        = escapeHtml(record?.fingerprint || '');
  const valueLine = record?.valueAtIssue
    ? `$${Number(record.valueAtIssue).toLocaleString()} USD (${escapeHtml(record?.valueContext || '')})`
    : '';

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBFAF4;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1C1A15;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #C8C0AA;border-radius:3px;">
        <tr><td style="padding:28px 32px 14px 32px;border-bottom:1px solid #E5DFD1;">
          <div style="display:inline-block;vertical-align:middle;width:30px;height:30px;background:#1A5FCF;color:#fff;border-radius:5px;text-align:center;line-height:30px;font-weight:700;">S</div>
          <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:16px;font-weight:600;">Simpleton Technologies</span>
          <div style="font-family:monospace;font-size:9px;letter-spacing:0.22em;color:#C9A84C;margin-top:4px;text-transform:uppercase;">Smart Enough to Be Called Simpleton</div>
        </td></tr>
        <tr><td style="padding:24px 32px 12px 32px;">
          <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;">Hi ${ownerName},</p>
          <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;">Your Simpleton reference report is attached as a PDF. A short summary:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 14px 0;border-top:1px solid #E5DFD1;border-bottom:1px solid #E5DFD1;">
            <tr><td style="padding:8px 0;font-size:12px;color:#807565;width:120px;">Subject</td><td style="padding:8px 0;font-size:13px;color:#1C1A15;font-weight:500;">${title}</td></tr>
            <tr><td style="padding:8px 0;font-size:12px;color:#807565;border-top:1px solid #F3F0E5;">Reference</td><td style="padding:8px 0;font-size:13px;color:#1C1A15;font-family:monospace;border-top:1px solid #F3F0E5;">${id}</td></tr>
            ${valueLine ? `<tr><td style="padding:8px 0;font-size:12px;color:#807565;border-top:1px solid #F3F0E5;">Reference value</td><td style="padding:8px 0;font-size:13px;color:#1C1A15;font-weight:600;border-top:1px solid #F3F0E5;">${valueLine}</td></tr>` : ''}
            <tr><td style="padding:8px 0;font-size:12px;color:#807565;border-top:1px solid #F3F0E5;">Fingerprint</td><td style="padding:8px 0;font-size:12px;color:#1C1A15;font-family:monospace;border-top:1px solid #F3F0E5;">${fp}</td></tr>
          </table>
          <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;">
            Verify this report any time at
            <a href="${verifyUrl}" style="color:#1A5FCF;text-decoration:underline;">${verifyUrl.replace(/^https?:\/\//,'')}</a>.
          </p>
          <p style="margin:0 0 12px 0;font-size:12px;color:#807565;font-style:italic;line-height:1.7;">
            This is a self-serve reference report — not signed, not certified. For a signed certified appraisal by Demiris Brown, GIA Graduate Gemologist, reply to this email and request the certified lane.
          </p>
        </td></tr>
        <tr><td style="padding:14px 32px 24px 32px;border-top:2px solid #C8C0AA;font-size:10px;color:#B2A794;letter-spacing:0.08em;">
          © Ladale Industries LLC · Simpleton Technologies
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Send an appraisal via SendGrid.
 *
 * @param {Object} body
 *   body.record        — appraisal record (shape per registry)
 *   body.pdfBase64     — PDF attachment, base64 (no data: prefix)
 *   body.pdfFilename   — attachment filename, e.g. 'SMPL-2026-0100.pdf'
 *   body.to            — recipient email (owner)
 *   body.tosAccepted   — { version, acceptedAt, userAgent } audit block
 *
 * @returns {Promise<{ ok: true, id: string, messageId: string }>}
 */
async function sendAppraisalEmail(body) {
  const { record, pdfBase64, pdfFilename, to, tosAccepted } = body || {};

  if (!process.env.SENDGRID_API_KEY) {
    throw serverError(
      'Server not configured: SENDGRID_API_KEY missing. Add it to .env and restart, or set it in your deployment env.'
    );
  }
  const from = parseSender(process.env.APPRAISAL_FROM);
  if (!from) {
    throw serverError(
      'Server not configured: APPRAISAL_FROM missing. Set a SendGrid-verified sender in .env, e.g. ' +
      "APPRAISAL_FROM='Simpleton Technologies <appraisal@simpletontechnologies.com>'."
    );
  }
  if (!to || !/\S+@\S+\.\S+/.test(String(to))) {
    throw badRequest('Recipient email required.');
  }
  if (!record?.id) throw badRequest('Record id required.');
  if (!pdfBase64)  throw badRequest('PDF attachment required.');
  if (!tosAccepted?.version) throw badRequest('Missing TOS acceptance metadata.');

  const replyTo = process.env.APPRAISAL_REPLY_TO || undefined;
  const bcc = process.env.APPRAISAL_BCC || undefined;
  const verifyUrl = process.env.VERIFY_BASE_URL || DEFAULT_VERIFY_URL;

  const subject = `Your Simpleton reference report — ${record.id}`;
  const html    = buildEmailHtml({ record, verifyUrl });

  // Audit line — every send leaves a console trace with who/what/when.
  // Low-effort but useful while the persistent send log hasn't shipped.
  console.log('[send-appraisal]', JSON.stringify({
    at: new Date().toISOString(),
    id: record.id,
    to,
    from: from.email,
    tosVersion: tosAccepted.version,
    tosAcceptedAt: tosAccepted.acceptedAt,
  }));

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to,
    from,                                    // { email, name? }
    replyTo: replyTo,
    bcc: bcc || undefined,
    subject,
    html,
    attachments: [
      {
        content: pdfBase64,                  // SendGrid wants raw base64
        filename: pdfFilename || `${record.id}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
    headers: {
      'X-Appraisal-Id':          record.id,
      'X-Appraisal-Fingerprint': record.fingerprint || '',
      'X-TOS-Version':           tosAccepted.version,
    },
    // Transactional categories make these easy to filter in SendGrid's
    // Activity feed (and, later, Webhook events for delivery / bounce).
    categories: ['appraisal', record.lane || 'uncertified'],
    mailSettings: { sandboxMode: { enable: false } },
    trackingSettings: {
      // Disable click-tracking on transactional appraisal emails —
      // rewriting the verify URL through SendGrid's tracker makes the
      // "verify at simpletonapp.com/lookup" line read as a tracker link,
      // which hurts the credibility signal.
      clickTracking: { enable: false, enableText: false },
      openTracking:  { enable: false },
    },
  };

  try {
    const [response] = await sgMail.send(msg);
    const messageId =
      response?.headers?.['x-message-id'] ||
      response?.headers?.['X-Message-Id'] ||
      `sg-${Date.now()}`;
    return { ok: true, id: messageId, messageId };
  } catch (err) {
    // SendGrid wraps API errors with a `response.body.errors` array. Surface
    // the first error message rather than the opaque top-level string.
    const sgErr =
      err?.response?.body?.errors?.[0]?.message ||
      err?.message ||
      'SendGrid rejected the send.';
    const wrapped = new Error(sgErr);
    wrapped.status = 502;
    throw wrapped;
  }
}

module.exports = { sendAppraisalEmail };
