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

// Step 6 swap (2026-04-22): this file is now a thin barrel that imports
// the runtime from the unified @loderuntime/core package. Previously it
// contained a 464-line fork of the runtime; that fork has been replaced
// in favor of the single canonical implementation at
//   /Users/mr.dee/Desktop/LodeRuntime/packages/core/runtime.js
// linked as a file: dependency in package.json.
//
// The core class is called `LivingRuntime`. This module re-exports it as
// `LodeRuntime` so every existing consumer keeps resolving. LodeBrain is
// also re-exported from ./brain.js so consumers who import brain from
// here continue to work; the canonical location for brain is ./brain.js.
//
// Design choices confirmed in STEP_5_PREFLIGHT and STEP_2/STEP_3 reports:
//  - content-hash IDs (core's primary identity)
//  - trackingId (core step 3) for stable React keys
//  - 6 custom node types (market-data, diamond-index, rolex-database,
//    coin-database, preference, current-route) — registered by the
//    LodeProvider at runtime-construction time, not baked into the kernel.

export {
  LivingRuntime as LodeRuntime,
  AstNode,
  DependencyGraph,
  Environment,
  PolicyEngine,
  ExecutionContext,
  CausalTrace,
  SelfModificationExecutor,
  EffectScheduler,
  deepEqual,
  typeSafetyRule,
  ownershipRule,
  scopeRule,
  noExternalDependentsRule,
} from '@loderuntime/core';

// LodeBrain stays with simpleton-lode as a domain module (step 5).
// Re-exported here for legacy-path consumers; canonical path is ./brain.js.
export { LodeBrain, NEURON_PARAMS, STDP_PARAMS } from './brain.js';
