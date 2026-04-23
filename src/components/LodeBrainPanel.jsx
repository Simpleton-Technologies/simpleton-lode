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
import { useLode, useDevMode } from '@/lib/lode-context';

// Minimal stub: floating diagnostic panel showing brain spike activity.
// Click the "🧠" pill bottom-right to toggle details.
export function LodeBrainPanel() {
  const { devMode } = useDevMode();
  const { runtime } = useLode();
  const [, forceUpdate] = useState({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Poll the brain at 4Hz to visualize activity without flooding React renders.
    const id = setInterval(() => forceUpdate({}), 250);
    return () => clearInterval(id);
  }, []);

  // Gated — civilian users never see the brain panel.
  if (!devMode) return null;

  const neurons = runtime.brain.getNeurons();
  const synapses = runtime.brain.getSynapses();
  const recent = runtime.brain.spikeHistory.slice(-30);

  return (
    <div style={{
      position: 'fixed', bottom: 12, right: 12, zIndex: 9999,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11,
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: '#1A5FCF', color: '#fff', border: 'none',
          padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}
      >
        🧠 {neurons.length}·{synapses.length}·{recent.length}
      </button>

      {open && (
        <div style={{
          marginTop: 8, background: '#FBFAF4', color: '#1C1A15',
          border: '1px solid #E5DFD1', borderRadius: 6,
          padding: 12, width: 280, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>LodeBrain</div>
          <div>neurons: {neurons.length}</div>
          <div>synapses: {synapses.length}</div>
          <div>spike buffer: {runtime.brain.spikeHistory.length}</div>
          <div>time: {runtime.brain.time.toFixed(1)}ms</div>
          <div style={{ marginTop: 8, color: '#807565' }}>
            recent spikes ({recent.length}):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 4 }}>
            {recent.map((s, i) => (
              <span key={i} title={`neuron ${s.neuron.slice(0,8)} @ ${s.time.toFixed(1)}ms`}
                    style={{ width: 6, height: 6, background: '#1A5FCF', borderRadius: 999 }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
