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
 * CausalTraceViewer — the pitch made visible.
 *
 * Renders the full causal lineage for any Lode value. For a given node
 * ID, walks the trace's entries backward and displays every mutation
 * (with proposer + timestamp) and every evaluation (with inputs) that
 * produced the current value.
 *
 * Opened via the TraceContext (see below). Any component can trigger
 * it by calling `useTraceViewer().open(nodeId)`. The `<WhyButton>`
 * component provides the standard discoverability affordance.
 *
 *   "Every framework gives you state and events. None of them can
 *    tell you why a value exists. LodeRuntime can."
 *
 * This component is that claim demonstrated on the live site.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLode, useDevMode } from '@/lib/lode-context';

// ───────────────────────────────────────────────────────────────────────
//  TraceContext — the open/close orchestration surface.
//  `useTraceViewer()` inside any component returns { open, close }.
// ───────────────────────────────────────────────────────────────────────
const TraceContext = createContext(null);

export function TraceProvider({ children }) {
  const [openNodeId, setOpenNodeId] = useState(null);
  const api = useMemo(() => ({
    open: (nodeId) => setOpenNodeId(nodeId),
    close: () => setOpenNodeId(null),
    isOpen: !!openNodeId,
    currentNodeId: openNodeId,
  }), [openNodeId]);

  return (
    <TraceContext.Provider value={api}>
      {children}
      {openNodeId && <CausalTraceViewer nodeId={openNodeId} onClose={() => setOpenNodeId(null)} />}
    </TraceContext.Provider>
  );
}

export function useTraceViewer() {
  const ctx = useContext(TraceContext);
  if (!ctx) throw new Error('useTraceViewer must be used within TraceProvider');
  return ctx;
}

// ───────────────────────────────────────────────────────────────────────
//  The viewer itself — a right-hand slide-in panel.
// ───────────────────────────────────────────────────────────────────────
const T = {
  bg:        '#0b0b12',
  panel:     '#131322',
  ink:       '#f4efe2',
  inkMuted:  '#9a937f',
  inkFaint:  '#6b6552',
  gold:      '#c9a84c',
  blue:      '#5b9cff',
  rose:      '#f43f5e',
  good:      '#3ccf91',
  hairline:  'rgba(244,239,226,0.10)',
  hairlineSoft: 'rgba(244,239,226,0.05)',
  mono:      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  body:      '"Inter", -apple-system, system-ui, sans-serif',
  display:   '"Playfair Display", Georgia, serif',
};

function CausalTraceViewer({ nodeId, onClose }) {
  const { runtime } = useLode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger the slide-in on mount; next frame avoids the initial
    // paint catching the "closed" transform.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Gather the node's metadata and its trace chain.
  const node = runtime.ast.get(nodeId);
  const entries = runtime.trace.entries;

  // Find the most recent evaluation for this node; the chain rolls
  // backward from there following inputKeys.
  const chain = useMemo(() => {
    for (let i = entries.length - 1; i >= 0; i--) {
      const e = entries[i];
      if (e.type === 'evaluation' && e.exprId === nodeId) {
        return runtime.trace.why(e.valueKey) || [];
      }
    }
    return [];
  }, [entries.length, nodeId, runtime]);

  // Mutations targeting this node — not part of the evaluation chain,
  // but part of the story. We pull them by proposal targetId + binding name.
  const mutationsForThisNode = useMemo(() => {
    return entries.filter((e) => {
      if (e.type !== 'mutation') return false;
      const p = e.proposal;
      if (!p) return false;
      if (p.targetId === nodeId) return true;
      // Binding-name mutations land on the binding target, not the UUID.
      // Check if the binding resolves to this node.
      const bindingName = p.payload?.bindingName;
      if (bindingName && runtime.env.get(bindingName) === nodeId) return true;
      return false;
    }).slice(-20).reverse(); // most recent first, cap at 20
  }, [entries.length, nodeId, runtime]);

  if (!node) return null;

  const currentValue = runtime.evaluate(nodeId);
  const nodeLabel = node.props.name || node.props.symbol || node.props.key || node.type;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9990,
          background: 'rgba(0,0,0,0.55)',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Causal trace"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 9991,
          width: 'min(560px, 94vw)',
          background: T.panel,
          color: T.ink,
          fontFamily: T.body,
          boxShadow: '-16px 0 60px rgba(0,0,0,0.5)',
          transform: mounted ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.45s cubic-bezier(0.22,1,0.36,1)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <header style={{
          padding: '28px 28px 20px',
          borderBottom: `1px solid ${T.hairline}`,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: T.blue,
          }}>
            <span>§ CAUSAL TRACE · why()</span>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'transparent', border: 0, color: T.inkMuted,
                cursor: 'pointer', fontFamily: T.mono, fontSize: 11,
                letterSpacing: '0.12em',
              }}
            >
              ESC · CLOSE
            </button>
          </div>

          <h2 style={{
            fontFamily: T.display, fontSize: 28, fontWeight: 400,
            margin: '14px 0 4px 0', lineHeight: 1.15,
          }}>
            Why is <span style={{ color: T.gold, fontStyle: 'italic' }}>{nodeLabel}</span> {renderValue(currentValue)}?
          </h2>

          <div style={{
            fontFamily: T.body, fontStyle: 'italic', color: T.inkMuted, fontSize: 13,
            lineHeight: 1.6,
          }}>
            Every framework tells you <em>what</em> the value is. Lode tells you <em>why</em>.
          </div>

          <div style={{
            marginTop: 16, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px',
            fontFamily: T.mono, fontSize: 11, color: T.inkMuted,
          }}>
            <span>node type</span>  <span style={{ color: T.ink }}>{node.type}</span>
            <span>node id</span>    <span style={{ color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis' }}>{nodeId.slice(0, 8)}…</span>
            <span>version</span>    <span style={{ color: T.ink }}>v{node.version}</span>
            <span>owner</span>      <span style={{ color: T.ink }}>{node.metadata.ownerId}</span>
          </div>
        </header>

        {/* Body — two sections: Mutations, Evaluation Chain */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 60px' }}>

          {/* Mutations */}
          <Section label="MUTATIONS · who changed this value">
            {mutationsForThisNode.length === 0 ? (
              <EmptyNote>No recorded mutations on this node yet.</EmptyNote>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mutationsForThisNode.map((m, i) => (
                  <MutationRow key={i} entry={m} />
                ))}
              </div>
            )}
          </Section>

          <div style={{ height: 28 }} />

          {/* Evaluation chain */}
          <Section label="EVALUATIONS · how the value was computed">
            {chain.length === 0 ? (
              <EmptyNote>No evaluation chain recorded for this node's current value yet.</EmptyNote>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {chain.map((e, i) => (
                  <EvaluationRow key={i} entry={e} />
                ))}
              </div>
            )}
          </Section>

          <div style={{
            marginTop: 40, paddingTop: 20,
            borderTop: `1px solid ${T.hairlineSoft}`,
            fontFamily: T.mono, fontSize: 10, color: T.inkFaint, letterSpacing: '0.08em',
          }}>
            This panel is powered by <span style={{ color: T.blue }}>runtime.trace.why(nodeId, value)</span> —
            a single call returns the full lineage. No logging was added. This IS the data structure.
          </div>
        </div>
      </aside>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────
//  Row renderers
// ───────────────────────────────────────────────────────────────────────

function Section({ label, children }) {
  return (
    <section>
      <div style={{
        fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em',
        color: T.inkFaint, textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        {label}
      </div>
      {children}
    </section>
  );
}

function EmptyNote({ children }) {
  return (
    <div style={{
      fontFamily: T.body, fontSize: 13, fontStyle: 'italic',
      color: T.inkFaint, padding: '8px 12px',
      border: `1px dashed ${T.hairline}`, borderRadius: 4,
    }}>
      {children}
    </div>
  );
}

function MutationRow({ entry }) {
  const p = entry.proposal || {};
  const proposer = p.proposer || 'system';
  const newValue = p.payload?.newValue;
  return (
    <div style={{
      padding: '10px 12px',
      border: `1px solid ${T.hairlineSoft}`,
      borderLeft: `2px solid ${T.rose}`,
      borderRadius: 3,
      background: 'rgba(244,63,94,0.04)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em',
        color: T.rose, textTransform: 'uppercase', marginBottom: 6,
      }}>
        <span>mutation · {p.type || 'set'}</span>
        <span style={{ color: T.inkFaint }}>{formatTime(entry.timestamp)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 14px', fontFamily: T.mono, fontSize: 11 }}>
        <span style={{ color: T.inkMuted }}>proposer</span>
        <span style={{ color: T.ink }}>{proposer}</span>
        <span style={{ color: T.inkMuted }}>binding</span>
        <span style={{ color: T.ink }}>{p.payload?.bindingName || p.targetId?.slice(0, 8) + '…'}</span>
        <span style={{ color: T.inkMuted }}>new value</span>
        <span style={{ color: T.gold }}>{renderValue(newValue)}</span>
      </div>
    </div>
  );
}

function EvaluationRow({ entry }) {
  if (entry.type !== 'evaluation') return null;
  return (
    <div style={{
      padding: '10px 12px',
      border: `1px solid ${T.hairlineSoft}`,
      borderLeft: `2px solid ${T.blue}`,
      borderRadius: 3,
      background: 'rgba(91,156,255,0.04)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em',
        color: T.blue, textTransform: 'uppercase', marginBottom: 6,
      }}>
        <span>evaluation · v{entry.version}</span>
        <span style={{ color: T.inkFaint }}>{formatTime(entry.timestamp)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 14px', fontFamily: T.mono, fontSize: 11 }}>
        <span style={{ color: T.inkMuted }}>expr id</span>
        <span style={{ color: T.ink }}>{entry.exprId?.slice(0, 8)}…</span>
        <span style={{ color: T.inkMuted }}>value</span>
        <span style={{ color: T.ink }}>{renderValue(entry.value)}</span>
        {entry.inputKeys && entry.inputKeys.length > 0 && (
          <>
            <span style={{ color: T.inkMuted }}>from inputs</span>
            <span style={{ color: T.inkMuted, fontSize: 10 }}>
              {entry.inputKeys.length} upstream value{entry.inputKeys.length === 1 ? '' : 's'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function renderValue(v) {
  if (v === null || v === undefined) return <span style={{ color: T.inkFaint }}>—</span>;
  if (typeof v === 'number') return <span>{formatNumber(v)}</span>;
  if (typeof v === 'string') return <span>"{v}"</span>;
  if (typeof v === 'boolean') return <span>{String(v)}</span>;
  if (Array.isArray(v)) return <span>[{v.length} items]</span>;
  if (typeof v === 'object') {
    try {
      const keys = Object.keys(v).slice(0, 3).join(', ');
      return <span>{`{ ${keys}${Object.keys(v).length > 3 ? ', …' : ''} }`}</span>;
    } catch { return <span>{'{}'}</span>; }
  }
  return <span>{String(v)}</span>;
}

function formatNumber(n) {
  if (typeof n !== 'number') return String(n);
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false });
}

// ───────────────────────────────────────────────────────────────────────
//  <WhyButton nodeId="...">
//  Tiny discoverability affordance — drop next to any rendered number.
// ───────────────────────────────────────────────────────────────────────
export function WhyButton({ nodeId, label = 'why?', size = 18, style }) {
  const { devMode } = useDevMode();
  const { open } = useTraceViewer();
  if (!nodeId) return null;
  // Gated — civilian users don't need a "?" icon next to every price.
  // They'd be confused by what a "causal trace" is. Only owners/devs
  // see these affordances.
  if (!devMode) return null;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); open(nodeId); }}
      aria-label={`Show causal trace for ${label}`}
      title={`why?  →  trace.why(${label})`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size,
        padding: 0,
        background: 'transparent',
        border: `1px solid rgba(91,156,255,0.35)`,
        borderRadius: 999,
        color: 'rgba(91,156,255,0.85)',
        fontFamily: T.mono, fontSize: Math.round(size * 0.55), fontWeight: 600,
        cursor: 'pointer',
        letterSpacing: 0, lineHeight: 1,
        transition: 'all 0.18s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(91,156,255,0.14)';
        e.currentTarget.style.color = '#5b9cff';
        e.currentTarget.style.borderColor = 'rgba(91,156,255,0.7)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'rgba(91,156,255,0.85)';
        e.currentTarget.style.borderColor = 'rgba(91,156,255,0.35)';
      }}
    >
      ?
    </button>
  );
}

export default CausalTraceViewer;
