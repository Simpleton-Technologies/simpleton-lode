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

import React, { useEffect, useState } from 'react';
import { useLode, useLodeBrainActivation, useDevMode } from '@/lib/lode-context';

/**
 * MarketEventBanner
 *
 * Renders a thin banner at the very top of the viewport whenever the
 * `marketEventNeuron` fires. That neuron sits downstream of the four
 * per-metal freshness neurons — it spikes only when multiple metals
 * move within the coincidence window. Native spiking-network behavior:
 * coincidence detection, no custom event-correlation logic.
 *
 * The banner is visible for the `holdMs` duration after each spike,
 * then fades. Because `recentSpike` uses the brain's spike history
 * (not a React timer), the banner's lifecycle is driven by the
 * runtime's own clock — consistent with how every other reactive
 * surface on the site works.
 */
export function MarketEventBanner({ holdMs = 4500 } = {}) {
  const { devMode } = useDevMode();
  const { siteAST } = useLode();
  const neuronId = siteAST?.marketEventNeuron;
  const { recentSpike, spiking } = useLodeBrainActivation(neuronId, {
    pollHz: 8,
    recentSpikeWindowMs: holdMs,
  });

  const [visible, setVisible] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState(null);

  // Show the banner for `holdMs` from the most-recent spike, then hide.
  useEffect(() => {
    if (spiking || recentSpike) {
      setVisible(true);
      setLastSeenAt(Date.now());
    } else if (visible && lastSeenAt && Date.now() - lastSeenAt > holdMs) {
      setVisible(false);
    }
  }, [spiking, recentSpike, visible, lastSeenAt, holdMs]);

  if (!neuronId) return null;
  // Gated — civilian view never sees the coincidence banner. In mock mode
  // the four-metal burst would fire this every 5s, which is noise; in a
  // real prod feed it only fires on genuine market-wide moves, at which
  // point dev mode is the right place to see it.
  if (!devMode) return null;

  return (
    <div
      aria-hidden={!visible}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 30,
        background: 'linear-gradient(90deg, rgba(201,168,76,0.0) 0%, rgba(201,168,76,0.95) 50%, rgba(201,168,76,0.0) 100%)',
        color: '#0b0b12',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease',
        pointerEvents: visible ? 'auto' : 'none',
        padding: '8px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        fontWeight: 600,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: '#0b0b12' }} />
      Market-wide event · three or more metals moved simultaneously
      <span style={{ width: 6, height: 6, borderRadius: 999, background: '#0b0b12' }} />
    </div>
  );
}
