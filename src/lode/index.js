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

// Barrel export — lets consumers do:
//   import { LodeRuntime, buildSiteAST, MarketDataSync } from '@/lode';
//
// The public API surface is minimal by design:
//   • LodeRuntime           — the orchestrator (AST, policy, trace, brain)
//   • AstNode               — content-addressed node primitive
//   • PolicyEngine + rules  — for custom policy rules if needed
//   • buildSiteAST          — constructs the Simpleton site's AST
//   • MarketDataSync        — wires live market data into the AST
//
// React bindings (useLodeValue / useLodeMutation / useLodeBrain / etc.)
// live in `@/components/LodeProvider` — they consume this runtime but
// are not part of it. LodeRuntime has no React dependency.

export {
  LodeRuntime,
  AstNode,
  DependencyGraph,
  CausalTrace,
  PolicyEngine,
  typeSafetyRule,
  ownershipRule,
} from './runtime.js';

// LodeBrain was extracted to its own module on 2026-04-22 (step 5).
export {
  LodeBrain,
  NEURON_PARAMS,
  STDP_PARAMS,
} from './brain.js';

export { buildSiteAST } from './site-ast.js';
export { MarketDataSync } from './market-data-sync.js';
