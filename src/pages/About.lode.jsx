/**
 * LodeRuntime™ and Lode Architecture™
 * Copyright © 2025 Demiris Brown. All Rights Reserved.
 * (full header — contact Founder@simpletontechnologies.com)
 */

import React from 'react';

export default function About() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 32 }}>About Simpleton Technologies</h1>
      <p>Live market data, grading logic, and signed appraisals for precious metals, diamonds, Rolex, and coins — built on LodeRuntime™ and Lode Architecture™.</p>
      <button
        onClick={() => window.navigate('/')}
        style={{ marginTop: 16, padding: '6px 12px', background: '#1A5FCF', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer' }}
      >
        ← Home
      </button>
    </div>
  );
}
