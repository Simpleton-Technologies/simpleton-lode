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
 * Backward-compatibility shim.
 *
 * The canonical hooks module moved to `@/lib/lode-context`. This file
 * re-exports its public API so existing imports keep working:
 *
 *   import { LodeProvider, useLode, useLodeValue } from '@/components/LodeProvider';
 *
 * New code should import from `@/lib/lode-context` directly.
 */
export {
  LodeProvider,
  useLode,
  useLodeValue,
  useLodeNodeId,
  useLodeMutation,
  useLodeBrain,
  useLodeBrainActivation,
  useBrainActivation,
} from '@/lib/lode-context';
