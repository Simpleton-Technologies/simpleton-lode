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

import React, { useEffect, useRef, useState } from 'react';

/**
 * MouseGlow — a soft luminous halo that follows the cursor (with easing,
 * so it has a little "weight") and intensifies on press. Uses mix-blend
 * "screen" to feel luminescent on dark, discreet on light.
 *
 * Disabled on coarse pointers (touch) and when prefers-reduced-motion is on.
 */
export function MouseGlow({
  size = 360,
  tintWarm = 'rgba(201, 168, 76, 0.18)',   // gold core
  tintCool = 'rgba(27, 109, 239, 0.10)',   // subtle blue halo beyond
  zIndex = 9998,
  lerp = 0.16,
} = {}) {
  const ref = useRef(null);
  const rippleRef = useRef(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (coarse || reduced) { setEnabled(false); return; }

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx, y = ty;
    let raf;
    let pressed = false;
    let visible = false;

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible && ref.current) {
        ref.current.style.opacity = '1';
        visible = true;
      }
    };

    const onLeave = () => {
      if (ref.current) {
        ref.current.style.opacity = '0';
        visible = false;
      }
    };

    const onDown = (e) => {
      pressed = true;
      if (ref.current) {
        ref.current.style.transform = `translate(${x - size/2}px, ${y - size/2}px) scale(1.18)`;
        ref.current.style.filter = 'brightness(1.55) saturate(1.2)';
      }
      // Spawn a one-shot ripple at click point.
      if (rippleRef.current) {
        const r = rippleRef.current;
        r.style.left = (e.clientX - 20) + 'px';
        r.style.top  = (e.clientY - 20) + 'px';
        r.style.animation = 'none';
        // Force reflow so the animation restarts.
        // eslint-disable-next-line no-unused-expressions
        r.offsetHeight;
        r.style.animation = 'lodeRipple 650ms cubic-bezier(0.22, 1, 0.36, 1) forwards';
      }
    };

    const onUp = () => {
      pressed = false;
      if (ref.current) {
        ref.current.style.filter = '';
      }
    };

    const tick = () => {
      x += (tx - x) * lerp;
      y += (ty - y) * lerp;
      if (ref.current) {
        const scale = pressed ? 1.18 : 1;
        ref.current.style.transform =
          `translate(${x - size/2}px, ${y - size/2}px) scale(${scale})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, [size, lerp]);

  if (!enabled) return null;

  return (
    <>
      <style>{`
        @keyframes lodeRipple {
          0%   { transform: scale(0.4); opacity: 0.55; }
          100% { transform: scale(6);   opacity: 0;    }
        }
      `}</style>
      <div
        ref={ref}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0, top: 0,
          width: size, height: size,
          pointerEvents: 'none',
          zIndex,
          opacity: 0,                           // fade in on first move
          transition: 'opacity 0.35s ease, filter 0.18s ease',
          mixBlendMode: 'screen',
          willChange: 'transform, filter, opacity',
          background: `
            radial-gradient(circle at center, ${tintWarm} 0%, transparent 45%),
            radial-gradient(circle at center, ${tintCool} 0%, transparent 62%)
          `,
          borderRadius: '50%',
          filter: 'blur(4px)',
        }}
      />
      <div
        ref={rippleRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          width: 40, height: 40,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: zIndex + 1,
          mixBlendMode: 'screen',
          background: `radial-gradient(circle, ${tintWarm} 0%, transparent 70%)`,
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      />
    </>
  );
}
