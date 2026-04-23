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

// Vercel serverless handler — deploy this directory as-is and Vercel
// routes POST /api/send-appraisal to this function. Same payload contract
// as the Express route; shares the same underlying handler so there's
// one implementation of the email-send logic.
//
// Required env vars (set in Vercel → Project → Settings → Environment):
//   RESEND_API_KEY      — Resend API key
//   APPRAISAL_FROM      — verified sender, e.g.
//                         'Simpleton Technologies <appraisal@simpletontechnologies.com>'
//   APPRAISAL_REPLY_TO  — (optional) reply-to address
//   APPRAISAL_BCC       — (optional) archive copy to Demiris
//   VERIFY_BASE_URL     — (optional) verify link base, defaults to simpletonapp.com/lookup

const { sendAppraisalEmail } = require('../server/send-appraisal-handler');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Vercel's Node runtime parses JSON bodies up to ~4.5MB by default.
    // For larger payloads we'd stream; the PDFs we generate run ~300KB,
    // comfortably under that cap even with 5 resized photos attached.
    const result = await sendAppraisalEmail(req.body);
    return res.status(200).json(result);
  } catch (err) {
    const status = err?.status || 500;
    console.error('[send-appraisal]', err?.message || err);
    return res.status(status).json({ error: err?.message || 'Send failed.' });
  }
};
