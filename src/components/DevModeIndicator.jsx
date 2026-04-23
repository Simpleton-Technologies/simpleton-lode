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
 * DevModeIndicator — small floating pill that appears only when dev mode
 * is ON. Shows the user that developer surfaces are unlocked and offers
 * a one-click exit back to civilian view.
 *
 * Paired with the keyboard shortcut and ?dev=1 URL param in
 * DevModeProvider, this is the only UI affordance ever visible to
 * everyday users — and only because they toggled dev mode on.
 */

import React from 'react';
import { useDevMode } from '@/lib/lode-context';

export function DevModeIndicator() {
  const { devMode, setDevMode } = useDevMode();
  if (!devMode) return null;

  return (
    <button
      onClick={() => setDevMode(false)}
      aria-label="Exit dev mode"
      title="Dev mode on · click to exit (Ctrl+Alt+D toggles)"
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        zIndex: 9995,
        padding: '4px 10px 4px 8px',
        background: 'rgba(91, 156, 255, 0.18)',
        border: '1px solid rgba(91, 156, 255, 0.55)',
        borderRadius: 999,
        color: '#5b9cff',
        cursor: 'pointer',
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontSize: 10,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(91, 156, 255, 0.28)';
        e.currentTarget.style.borderColor = 'rgba(91, 156, 255, 0.85)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(91, 156, 255, 0.18)';
        e.currentTarget.style.borderColor = 'rgba(91, 156, 255, 0.55)';
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: 999,
        background: '#5b9cff',
        animation: 'devPulse 1.6s ease-in-out infinite',
      }} />
      DEV · click to exit
      <style>{`
        @keyframes devPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </button>
  );
}
