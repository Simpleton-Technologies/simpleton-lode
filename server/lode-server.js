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

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

// Boot the nervous system first — sets global.nervousSystem and starts
// the 1 Hz brain tick loop. Must be required before any route handlers
// so that signal() is available from the moment the server accepts requests.
require('./nervous-system');

const { sendAppraisalEmail } = require('./send-appraisal-handler');

const app = express();
app.use(cors());
// 20mb ceiling — PDFs run ~300KB, photos are already resized client-side,
// and this keeps us clear of Resend's 40MB attachment limit with headroom.
app.use(express.json({ limit: '20mb' }));

// ───────────────────────────────────────────────────────────────────────
//  Founder dashboard — static HTML served at /founder/dashboard
//  Gated: the API it calls (/api/founder/pulse) requires FOUNDER_KEY.
//  The HTML itself is not auth-protected (it's useless without the key).
// ───────────────────────────────────────────────────────────────────────
app.use('/founder', express.static(path.join(__dirname, 'public/founder')));

// ───────────────────────────────────────────────────────────────────────
//  Mock market data (replace with real feeds later)
// ───────────────────────────────────────────────────────────────────────
const marketCache = {
  XAUUSD: 2650.30,
  XAGUSD: 31.45,
  XPTUSD: 980.20,
  XPDUSD: 1050.75,
};

app.get('/api/market/:symbol', (req, res) => {
  const { symbol } = req.params;
  const price = marketCache[symbol] || 0;
  const fluctuation = (Math.random() - 0.5) * 2;
  res.json({ symbol, price: price + fluctuation });
});

app.get('/api/diamond-index', (req, res) => {
  res.json({ value: 12500 + Math.random() * 500 });
});

app.get('/api/rolex/market', (req, res) => {
  res.json({
    models: [
      { ref: '116500LN', name: 'Daytona', marketPrice: 28500 },
      { ref: '126610LN', name: 'Submariner Date', marketPrice: 14500 },
    ],
    lastUpdated: new Date().toISOString(),
  });
});

// ───────────────────────────────────────────────────────────────────────
//  GET /api/founder/pulse
//
//  Protected by FOUNDER_KEY header — the single number that tells you
//  everything. Returns 94 (default healthy) until the nervous system is
//  wired; once global.nervousSystem exists, returns live state.
//
//  Usage: curl -H "Authorization: Bearer $FOUNDER_KEY" /api/founder/pulse
// ───────────────────────────────────────────────────────────────────────
app.get('/api/founder/pulse', (req, res) => {
  const authHeader  = req.headers.authorization;
  const founderKey  = process.env.FOUNDER_KEY;

  if (!founderKey) {
    return res.status(500).json({ error: 'FOUNDER_KEY not configured on server' });
  }
  if (!authHeader || authHeader !== `Bearer ${founderKey}`) {
    return res.status(401).json({ error: 'Invalid or missing founder key' });
  }

  const ns = global.nervousSystem;

  const pulse = ns ? ns.pulse : 94;

  const painNodes = ns
    ? Array.from(ns.painNodes.values()).filter(p => !p.healed)
    : [];

  const recentHeals = ns ? ns.recentHeals(3_600_000) : [];

  const brainActivity = ns?.brain?.getState?.() || {
    neuronCount:      0,
    activeNeurons:    0,
    averagePotential: 0,
  };

  res.json({
    pulse,
    status:           pulse > 90 ? 'healthy' : pulse > 70 ? 'warning' : 'critical',
    activePain:       painNodes.length,
    painDetails:      painNodes.map(p => ({
      nodeId:     p.node?.id || 'unknown',
      violations: p.violations || [],
      timestamp:  p.timestamp,
    })),
    recentHeals,
    recentHealsCount: recentHeals.length,
    brainActivity,
    timestamp: Date.now(),
  });
});

// ───────────────────────────────────────────────────────────────────────
//  POST /api/send-appraisal
//
//  Body: { record, pdfBase64, pdfFilename, to, tosAccepted }
//  Delegates to the shared handler (also used by the Vercel serverless
//  function in /api/send-appraisal.js) so the email-send logic has one
//  implementation regardless of deploy target.
// ───────────────────────────────────────────────────────────────────────
app.post('/api/send-appraisal', async (req, res) => {
  try {
    const result = await sendAppraisalEmail(req.body);
    res.json(result);
  } catch (err) {
    const status = err?.status || 500;
    console.error('[send-appraisal]', err?.message || err);
    res.status(status).json({ error: err?.message || 'Send failed.' });
  }
});

const PORT = process.env.PORT || 3033;
app.listen(PORT, () => console.log(`Lode Server on ${PORT}`));
