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

import React, { useEffect, useRef } from 'react';

/**
 * CosmicBackground — fixed starfield canvas rendered behind all other
 * content (z-index 0). Stars drift slowly and twinkle at different phases
 * to suggest depth without demanding attention. Respects
 * prefers-reduced-motion by rendering static stars.
 *
 * Designed to be placed at the top of the page tree. Opaque sections
 * (e.g. cream paper) will naturally cover the stars; transparent or
 * alpha'd dark sections will let them show through.
 */
export function CosmicBackground({
  starCount = 160,
  inkColor = 'rgba(244, 239, 226, ',   // warm cream, alpha appended at draw
  goldColor = 'rgba(201, 168, 76, ',   // luxury gold punctuation
  goldFraction = 0.08,                  // ~8% of stars tinted gold
  zIndex = 0,
} = {}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const prefersReducedMotion =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

    let stars = [];
    let raf = null;
    let w = 0, h = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const build = () => {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        const depth = Math.random();             // 0 = far, 1 = near
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.3 + depth * 1.4,                  // 0.3–1.7 px
          baseAlpha: 0.07 + depth * 0.32,        // far dim, near bright
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.25 + Math.random() * 0.8,
          driftX: (Math.random() - 0.5) * (0.006 + depth * 0.02),
          driftY: (Math.random() - 0.5) * (0.004 + depth * 0.015),
          gold: Math.random() < goldFraction,
        });
      }
    };

    resize();
    build();

    let t = 0;
    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (!prefersReducedMotion) {
          s.x += s.driftX;
          s.y += s.driftY;
          if (s.x < -2) s.x = w + 2;
          else if (s.x > w + 2) s.x = -2;
          if (s.y < -2) s.y = h + 2;
          else if (s.y > h + 2) s.y = -2;
        }
        const twinkle = prefersReducedMotion
          ? s.baseAlpha
          : s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.phase) * s.baseAlpha * 0.55;
        const a = Math.max(0, twinkle);
        ctx.beginPath();
        ctx.fillStyle = (s.gold ? goldColor : inkColor) + a.toFixed(3) + ')';
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    if (prefersReducedMotion) {
      // Paint once and bail from the RAF loop.
      draw();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    const onResize = () => { resize(); build(); };
    window.addEventListener('resize', onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [starCount, inkColor, goldColor, goldFraction]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        pointerEvents: 'none',
        background: 'transparent',
      }}
    />
  );
}
