/**
 * LodeRuntime™ and Lode Architecture™
 * Copyright © 2025 Demiris Brown. All Rights Reserved.
 * (full header — contact Founder@simpletontechnologies.com)
 */

import React from 'react';
import { useLode, useLodeValue } from '@/lib/lode-context';

export default function RolexArchive() {
  const { siteAST } = useLode();
  const db = useLodeValue(siteAST.rolexDatabase.id) ?? siteAST.rolexDatabase.props;
  const models = db?.models || [];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 32 }}>Rolex Archive</h1>
      <p style={{ color: '#807565' }}>
        {models.length} model{models.length === 1 ? '' : 's'} · last updated {db?.lastUpdated || 'never'}
      </p>

      {models.length === 0 ? (
        <p style={{ color: '#807565', fontSize: 13 }}>Waiting for first sync from /api/rolex/market…</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr style={{ background: '#1C1A15', color: '#FBFAF4', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Reference</th>
              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Model</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Market</th>
            </tr>
          </thead>
          <tbody>
            {models.map(m => (
              <tr key={m.ref} style={{ borderBottom: '1px solid #E5DFD1' }}>
                <td style={{ padding: 12, fontFamily: 'ui-monospace, Menlo, monospace' }}>{m.ref}</td>
                <td style={{ padding: 12 }}>{m.name}</td>
                <td style={{ padding: 12, textAlign: 'right' }}>${(m.marketPrice || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        onClick={() => window.navigate('/')}
        style={{ marginTop: 16, padding: '6px 12px', background: '#1A5FCF', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer' }}
      >
        ← Home
      </button>
    </div>
  );
}
