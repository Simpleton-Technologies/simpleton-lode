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
 * Appraisal Registry — in-memory demo store.
 *
 * This file holds a small set of sample records so the public Lookup page
 * can return real-shaped results while the certified appraisal backend
 * is still being built. Record shape is the same shape the server will
 * return when Lane 1 / Lane 2 ship — the Lookup page does not care whether
 * the source is this file or an API, so we keep the shape stable now.
 *
 * Record shape:
 *   id              — public reference ID (format: SMPL-YYYY-NNNN)
 *   issuedAt        — ISO date (report date on the page)
 *   lane            — 'certified' (Demiris-signed) | 'uncertified' (self-serve)
 *   signer          — full name + credentials, or null for uncertified
 *   signerStatement — one-line qualification shown on the verify card
 *   itemType        — 'diamond' | 'watch' | 'jewelry' | 'coin'
 *   title           — human-readable item title for the header line
 *   specs           — array of { label, value } rows for the spec table
 *   valueAtIssue    — numeric USD at the time of appraisal
 *   valueContext    — 'retail replacement' | 'wholesale' | 'estate' | 'fair market'
 *   status          — 'active' | 'superseded' | 'revoked'
 *   fingerprint     — short hash that identifies the record
 *                     (real records will carry a PKCS7 signature when
 *                      the signing workflow ships; for now this is a
 *                      stable placeholder derived from the record itself)
 */

const demoRecords = [
  {
    id: 'SMPL-2026-0001',
    issuedAt: '2026-03-14',
    lane: 'certified',
    signer: 'Demiris Brown · GIA Graduate Gemologist',
    signerStatement: 'In-hand examination; grading verified against GIA report.',
    itemType: 'diamond',
    title: '1.02 ct Round Brilliant Diamond',
    specs: [
      { label: 'Shape',        value: 'Round Brilliant' },
      { label: 'Carat',        value: '1.02 ct' },
      { label: 'Color',        value: 'G' },
      { label: 'Clarity',      value: 'VS1' },
      { label: 'Cut',          value: 'Excellent' },
      { label: 'Polish',       value: 'Excellent' },
      { label: 'Symmetry',     value: 'Excellent' },
      { label: 'Fluorescence', value: 'None' },
      { label: 'Lab',          value: 'GIA · Report 2255442887' },
    ],
    valueAtIssue: 7800,
    valueContext: 'retail replacement',
    status: 'active',
    fingerprint: 'A91F-3C02-6E4D',
  },
  {
    id: 'SMPL-2026-0014',
    issuedAt: '2026-04-02',
    lane: 'certified',
    signer: 'Demiris Brown · GIA Graduate Gemologist',
    signerStatement: 'In-hand examination; service records reviewed.',
    itemType: 'watch',
    title: 'Rolex Submariner · Ref. 116610LN',
    specs: [
      { label: 'Reference',        value: '116610LN' },
      { label: 'Caliber',          value: '3135 (Automatic)' },
      { label: 'Serial range',     value: '2014–2016 production' },
      { label: 'Condition',        value: 'Excellent · original bezel insert' },
      { label: 'Papers',           value: 'Card present' },
      { label: 'Box',              value: 'Present (outer + inner)' },
      { label: 'Service',          value: 'Last RSC 2022' },
    ],
    valueAtIssue: 13400,
    valueContext: 'retail replacement',
    status: 'active',
    fingerprint: '7B88-22F1-90AC',
  },
  {
    id: 'SMPL-2026-0042',
    issuedAt: '2026-04-18',
    lane: 'uncertified',
    signer: null,
    signerStatement: 'Self-serve reference valuation — not signed or certified.',
    itemType: 'coin',
    title: '1 oz American Gold Eagle (2015)',
    specs: [
      { label: 'Denomination', value: '$50 (face)' },
      { label: 'Weight',       value: '1 troy oz gold (0.9167 fineness)' },
      { label: 'Actual gold',  value: '31.10 g fine' },
      { label: 'Mint',         value: 'West Point (no mint mark)' },
      { label: 'Grade',        value: 'Self-assessed BU' },
    ],
    valueAtIssue: 2685,
    valueContext: 'wholesale (melt + typical AGE premium)',
    status: 'active',
    fingerprint: 'D2F4-001A-5B6E',
  },
];

const registry = new Map(demoRecords.map(r => [r.id.toUpperCase(), r]));

// ───────────────────────────────────────────────────────────────────────
//  localStorage persistence
//
//  In-memory is fine for demos but owner-generated records vanish on
//  refresh, which is a bad first impression for real customers. Until
//  the backend DB ships, we persist user-generated records to localStorage
//  under a versioned key. Demo records (SMPL-2026-0001 / 0014 / 0042) are
//  always present from code; overlay persisted records on top of them.
//
//  NOTE: localStorage is per-browser — a record generated on one device
//  isn't visible on another. The Lookup page uses the SAME registry so
//  a same-session / same-browser verification works immediately. Cross-
//  device verification requires the backend registry (next milestone).
// ───────────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'simpleton.appraisal-registry.v1';

function loadFromStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !Array.isArray(parsed.records)) return;
    for (const rec of parsed.records) {
      if (rec?.id) registry.set(rec.id.toUpperCase(), rec);
    }
    // Advance the sequence counter past any persisted IDs so new records
    // don't collide with ones saved in a prior session.
    let maxSeq = nextSeq - 1;
    for (const rec of parsed.records) {
      const m = /^SMPL-\d{4}-(\d{4})$/.exec(rec.id || '');
      if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
    }
    nextSeq = maxSeq + 1;
  } catch (_) { /* corrupt storage — ignore, fall back to in-memory */ }
}

function saveToStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    // Only persist records that aren't in the demo set (demo records are
    // always present from code). This keeps the storage payload small and
    // avoids stale-demo-data problems if we ever update the demo records.
    const demoIds = new Set(demoRecords.map(r => r.id.toUpperCase()));
    const ownRecords = [...registry.values()].filter(r => !demoIds.has(r.id.toUpperCase()));
    const payload = { version: 1, savedAt: new Date().toISOString(), records: ownRecords };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // Most likely cause: quota exceeded (photos make records fat).
    // Not fatal — the record stays in memory for this session.
    console.warn('[registry] persist failed:', err?.name || err);
  }
}

let nextSeq = 100; // demo records occupy 0001 / 0014 / 0042; leave room

// Hydrate at module load. Safe on SSR (checks for window).
loadFromStorage();

export function generateRecordId(year = new Date().getFullYear()) {
  const seq = String(nextSeq++).padStart(4, '0');
  return `SMPL-${year}-${seq}`;
}

/**
 * Non-cryptographic short hash of a stringified payload, formatted as
 * XXXX-XXXX-XXXX (12 hex chars). Deterministic for identical input.
 * Used only for the fingerprint line on self-serve records; certified
 * records will carry a real signature when the signing workflow ships.
 */
export function computeFingerprint(payload) {
  const s = JSON.stringify(payload);
  // FNV-1a 32-bit × 3 rounds to produce a 96-bit-ish hex string.
  const fnv = (input, seed = 0x811c9dc5) => {
    let h = seed;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).toUpperCase().padStart(8, '0');
  };
  const a = fnv(s, 0x811c9dc5).slice(0, 4);
  const b = fnv(s, 0xabadf00d).slice(0, 4);
  const c = fnv(s, 0xdeadbeef).slice(0, 4);
  return `${a}-${b}-${c}`;
}

export function addRecord(record) {
  if (!record?.id) throw new Error('addRecord: record.id required');
  registry.set(record.id.toUpperCase(), record);
  saveToStorage();
  return record;
}

export function listOwnRecords() {
  const demoIds = new Set(demoRecords.map(r => r.id.toUpperCase()));
  return [...registry.values()]
    .filter(r => !demoIds.has(r.id.toUpperCase()))
    .sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''));
}

export function clearOwnRecords() {
  const demoIds = new Set(demoRecords.map(r => r.id.toUpperCase()));
  for (const id of [...registry.keys()]) {
    if (!demoIds.has(id)) registry.delete(id);
  }
  saveToStorage();
}

/** Normalize user input so "smpl 2026 0001" and "SMPL-2026-0001" both resolve. */
function normalizeId(input) {
  if (!input) return '';
  const cleaned = String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Pattern is SMPL + 4-digit year + 4-digit seq. If the user typed only
  // the digits (e.g. "20260001"), prepend SMPL- to keep matching forgiving.
  if (/^\d{8}$/.test(cleaned)) {
    return `SMPL-${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  if (/^SMPL\d{4}\d{4}$/.test(cleaned)) {
    return `SMPL-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
  }
  return cleaned.replace(/^SMPL(\d{4})(\d{4})$/, 'SMPL-$1-$2');
}

export function lookupAppraisal(rawId) {
  const id = normalizeId(rawId);
  const record = registry.get(id);
  if (!record) return { found: false, queriedId: id || rawId };
  return { found: true, record, queriedId: id };
}

export function listDemoIds() {
  return [...registry.keys()];
}
