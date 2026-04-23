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
 * Simpleton Diamond Index — parametric reference pricing.
 *
 * We do NOT ship the Rapaport grid. The Rap Report is copyrighted; any
 * client-side copy is a distribution problem no matter how it's framed.
 * This module ships a transparent parametric model with every multiplier
 * visible to the consumer. When a licensed feed is wired in (server-side),
 * swap BASE_REF_PER_CT + the factor tables — the shape is stable.
 *
 * Every factor below reflects standard industry relationships, not a
 * specific proprietary table. Numbers shown on-page cite "Simpleton
 * Diamond Index · Reference Pricing · educational" — not a trade quote.
 */

// Anchor: 1.00ct, Round, G, VS1, Excellent cut, no fluor, GIA. USD per ct.
export const BASE_REF_PER_CT = 5500;

export const SHAPES = [
  { key: 'round',    label: 'Round Brilliant' },
  { key: 'princess', label: 'Princess' },
  { key: 'emerald',  label: 'Emerald' },
  { key: 'asscher',  label: 'Asscher' },
  { key: 'oval',     label: 'Oval' },
  { key: 'radiant',  label: 'Radiant' },
  { key: 'cushion',  label: 'Cushion' },
  { key: 'pear',     label: 'Pear' },
  { key: 'marquise', label: 'Marquise' },
  { key: 'heart',    label: 'Heart' },
];

export const SHAPE_FACTOR = {
  round: 1.00, princess: 0.75, emerald: 0.72, asscher: 0.72,
  oval: 0.80, radiant: 0.75, cushion: 0.75, pear: 0.73,
  marquise: 0.70, heart: 0.68,
};

export const COLORS = ['D','E','F','G','H','I','J','K','L','M'];
export const COLOR_FACTOR = {
  D: 1.45, E: 1.30, F: 1.18, G: 1.00, H: 0.90,
  I: 0.80, J: 0.70, K: 0.55, L: 0.45, M: 0.40,
};

export const CLARITIES = ['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1','I2','I3'];
export const CLARITY_FACTOR = {
  FL: 1.50, IF: 1.35, VVS1: 1.20, VVS2: 1.12, VS1: 1.00, VS2: 0.92,
  SI1: 0.82, SI2: 0.72, I1: 0.55, I2: 0.40, I3: 0.28,
};

export const CUTS = ['Excellent','Very Good','Good','Fair','Poor'];
export const CUT_FACTOR = {
  'Excellent': 1.00, 'Very Good': 0.92, 'Good': 0.82, 'Fair': 0.68, 'Poor': 0.50,
};

export const FLUORESCENCE = ['None','Faint','Medium','Strong','Very Strong'];
export const FLUOR_FACTOR = {
  'None': 1.00, 'Faint': 1.00, 'Medium': 0.94, 'Strong': 0.85, 'Very Strong': 0.78,
};

export const LABS = ['GIA','AGS','IGI','EGL'];
export const LAB_FACTOR = {
  GIA: 1.00, AGS: 1.00, IGI: 0.92, EGL: 0.70,
};

// Piecewise carat curve — [carat, factor] anchor points.
const CARAT_ANCHORS = [
  [0.18, 0.22], [0.30, 0.32], [0.50, 0.52], [0.70, 0.72],
  [1.00, 1.00], [1.50, 1.15], [2.00, 1.35], [3.00, 1.70],
  [5.00, 2.20], [10.00, 3.00],
];

export function caratFactor(ct) {
  if (ct <= CARAT_ANCHORS[0][0]) return CARAT_ANCHORS[0][1];
  if (ct >= CARAT_ANCHORS[CARAT_ANCHORS.length - 1][0]) return CARAT_ANCHORS[CARAT_ANCHORS.length - 1][1];
  for (let i = 1; i < CARAT_ANCHORS.length; i++) {
    const [c1, f1] = CARAT_ANCHORS[i - 1];
    const [c2, f2] = CARAT_ANCHORS[i];
    if (ct <= c2) {
      const t = (ct - c1) / (c2 - c1);
      return f1 + t * (f2 - f1);
    }
  }
  return 1.00;
}

/**
 * Compute a Simpleton Diamond Index reference estimate.
 *
 * Returns a structured object with the full factor breakdown so the
 * caller can render "show the math" rows. Non-round shapes neutralize
 * cut to 1.00 (fancy shapes are graded on polish/symmetry, not an
 * overall cut grade in the GIA sense).
 */
export function computeDiamondReference({ shape, carat, color, clarity, cut, fluor, lab }) {
  const ct = Number(carat) || 0;
  const isRound = shape === 'round';
  const sF  = SHAPE_FACTOR[shape]  ?? 1;
  const cF  = COLOR_FACTOR[color]  ?? 1;
  const clF = CLARITY_FACTOR[clarity] ?? 1;
  const caF = caratFactor(ct);
  const cutF = isRound ? (CUT_FACTOR[cut] ?? 1) : 1.00;
  const flF = FLUOR_FACTOR[fluor] ?? 1;
  const laF = LAB_FACTOR[lab] ?? 1;

  const perCtWholesale = BASE_REF_PER_CT * cF * clF * caF * sF * cutF * flF * laF;
  const wholesale = perCtWholesale * ct;

  return {
    parsedCarat: ct,
    isRound,
    factors: {
      shape: sF, color: cF, clarity: clF, carat: caF,
      cut: cutF, fluor: flF, lab: laF,
    },
    perCtWholesale,
    wholesale,
    retailLow: wholesale * 1.40,
    retailHigh: wholesale * 2.20,
  };
}
