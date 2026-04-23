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
 * React bindings for LodeRuntime.
 *
 * Public API surface — the only three hooks React components should reach for:
 *
 *   useLodeValue(nodeId)       — read + auto-subscribe to an AST node's value
 *   useLodeMutation()          — propose a state change through the policy engine
 *   useLodeBrain()             — raw LodeBrain access (imperative)
 *
 * Plus one convenience helper:
 *
 *   useLodeNodeId(name)        — resolve a siteAST key ('goldPrice') into its
 *                                node UUID, so callers don't have to thread
 *                                the siteAST down through props.
 *
 * And one escape hatch:
 *
 *   useLode()                  — raw context (runtime + siteAST). Avoid unless
 *                                you need something the three hooks don't cover.
 *
 * Plus a brain-specific subscriber:
 *
 *   useLodeBrainActivation(id) — subscribe to a single neuron's activation,
 *                                returning { activation, spiking, recentSpike }.
 *                                Used for UI that reflects LIF dynamics
 *                                (freshness dots, coincidence banners, etc.).
 *
 * Type note: written as .jsx with JSDoc types for now; conversion to .tsx is
 * a mechanical refactor once TypeScript is installed on the project.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { LodeRuntime } from '@/lode/runtime';
import { buildSiteAST } from '@/lode/site-ast';
import { MarketDataSync } from '@/lode/market-data-sync';

const LodeContext = createContext(null);

export function LodeProvider({ children }) {
  // Lazy-init: React.useState's initializer runs once per mount. StrictMode's
  // double-render of initializers is harmless here because useState only
  // commits the *first* returned value — the second invocation's LodeRuntime
  // instance is discarded by React before it ever becomes visible to
  // anyone. The effect-based MarketDataSync startup handles its own
  // double-mount hygiene via its returned stop function.
  const [runtime] = useState(() => new LodeRuntime());
  const [siteAST] = useState(() => buildSiteAST(runtime));
  const syncStopRef = useRef(null);

  // Start MarketDataSync once, clean up on unmount (StrictMode-safe).
  useEffect(() => {
    if (!syncStopRef.current) {
      syncStopRef.current = MarketDataSync.start(runtime, siteAST);
    }
    return () => {
      if (syncStopRef.current) {
        syncStopRef.current();
        syncStopRef.current = null;
      }
    };
  }, [runtime, siteAST]);

  // Brain tick loop — requestAnimationFrame so it pauses when the tab is
  // backgrounded. The brain's LIF dynamics depend on being ticked at ~60Hz;
  // pausing when hidden is both correct and efficient.
  useEffect(() => {
    let frame;
    const tick = () => {
      runtime.brain.tick(16);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [runtime]);

  // Debug surface. `window.__lode` exposes both the runtime and the
  // siteAST for use in the browser console:
  //   window.__lode.runtime.trace.why(window.__lode.ast.goldPrice.id, 2650)
  // Kept off the context to avoid coupling it into production component code.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__lode = { runtime, ast: siteAST };
    }
  }, [runtime, siteAST]);

  return (
    <LodeContext.Provider value={{ runtime, siteAST }}>
      {children}
    </LodeContext.Provider>
  );
}

/** Escape hatch — returns the raw context. Prefer the specific hooks below. */
export function useLode() {
  const ctx = useContext(LodeContext);
  if (!ctx) throw new Error('useLode must be used within LodeProvider');
  return ctx;
}

/** Runtime-only convenience — for components that need runtime.why / runtime.brain
 *  but not siteAST. Equivalent to useLode().runtime. */
export function useLodeRuntime() {
  const ctx = useContext(LodeContext);
  if (!ctx) throw new Error('useLodeRuntime must be used within LodeProvider');
  return ctx.runtime;
}

// ───────────────────────────────────────────────────────────────────────
//  useLodeValue(nodeId)
//
//  The canonical read hook. Subscribes to runtime mutations via
//  useSyncExternalStore (React 18's official external-store API — no
//  tearing in concurrent rendering, no manual forceUpdate).
//
//  Accepts a node UUID, not a binding name, so the binding-resolution
//  indirection happens explicitly (via useLodeNodeId) at the call site.
//  That makes it trivial to pass arbitrary node IDs — useful for
//  generic components that don't know the binding name ahead of time.
//
//    const goldId = useLodeNodeId('goldPrice');
//    const price  = useLodeValue(goldId);
//
//  The runtime's evaluate() returns stable references per (node, version)
//  tuple, so this hook only re-renders the consumer when the specific
//  node's value actually changes.
// ───────────────────────────────────────────────────────────────────────
export function useLodeValue(nodeId) {
  const { runtime } = useLode();

  const subscribe = useCallback(
    (cb) => runtime.subscribe(cb),
    [runtime],
  );

  const getSnapshot = useCallback(() => {
    if (!nodeId) return undefined;
    if (!runtime.ast.has(nodeId)) return undefined;
    return runtime.evaluate(nodeId);
  }, [runtime, nodeId]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ───────────────────────────────────────────────────────────────────────
//  useLodeNodeId(name)
//
//  Resolves a siteAST key (e.g. 'goldPrice', 'silverPrice', 'rolexDatabase')
//  to the underlying node UUID. Returns `undefined` if the name is
//  unknown. Stable across renders because the siteAST is built once.
// ───────────────────────────────────────────────────────────────────────
export function useLodeNodeId(name) {
  const { siteAST } = useLode();
  return siteAST && siteAST[name] ? siteAST[name].id ?? siteAST[name] : undefined;
}

// ───────────────────────────────────────────────────────────────────────
//  useLodeMutation()
//
//  Returns the runtime.propose function bound to the runtime instance.
//  Memoized so the reference is stable across re-renders — safe to use
//  as a useEffect dependency.
//
//    const propose = useLodeMutation();
//    propose('set', 'XAUUSD', { newValue: 2651.00 }, 'user-override');
// ───────────────────────────────────────────────────────────────────────
export function useLodeMutation() {
  const { runtime } = useLode();
  return useMemo(() => runtime.propose.bind(runtime), [runtime]);
}

// ───────────────────────────────────────────────────────────────────────
//  useLodeBrain()
//
//  Returns the raw LodeBrain instance for imperative access —
//  spawnNeuron, connect, stimulate, getNeurons, getSynapses, etc.
//  Use useLodeBrainActivation(id) when you want a React-reactive read
//  of a specific neuron's state.
// ───────────────────────────────────────────────────────────────────────
export function useLodeBrain() {
  const { runtime } = useLode();
  return runtime.brain;
}

// ───────────────────────────────────────────────────────────────────────
//  useLodeBrainActivation(neuronId, { pollHz, recentSpikeWindowMs })
//
//  Returns a snapshot of a neuron's activation state for rendering.
//  Polls the brain at pollHz (default 8 Hz) — fast enough to feel live,
//  slow enough to avoid thrashing React.
//
//    { activation, spiking, recentSpike }
//
//  activation:    normalized membrane potential, 0..1. 1.0 means just
//                 stimulated and near threshold; 0.0 means at rest.
//  spiking:       did the neuron fire on the most recent tick?
//  recentSpike:   did it fire within `recentSpikeWindowMs`?
//                 Useful for banners/flashes that need to persist past
//                 the single-tick nature of a spike.
// ───────────────────────────────────────────────────────────────────────
export function useLodeBrainActivation(neuronId, { pollHz = 8, recentSpikeWindowMs = 1200 } = {}) {
  const { runtime } = useLode();
  const [snap, setSnap] = useState(() => readBrainSnapshot(runtime, neuronId, recentSpikeWindowMs));

  useEffect(() => {
    if (!neuronId) return;
    const interval = Math.max(16, Math.round(1000 / pollHz));
    const id = setInterval(() => {
      setSnap(readBrainSnapshot(runtime, neuronId, recentSpikeWindowMs));
    }, interval);
    return () => clearInterval(id);
  }, [runtime, neuronId, pollHz, recentSpikeWindowMs]);

  return snap;
}

// Legacy alias — some early components import `useBrainActivation` from
// the pre-lib LodeProvider path. Kept as an alias until all imports migrate.
export const useBrainActivation = useLodeBrainActivation;

// ───────────────────────────────────────────────────────────────────────
//  Dev Mode — gates every developer/owner surface on the live site.
//
//  When OFF (default for everyday users): the brain panel, market-event
//  banner, causal-trace `?` buttons, and shift-click trace-on-ticker are
//  all hidden. Site reads as a normal product.
//
//  When ON: all developer affordances unlock. Paired with Demiris's
//  "look what I got behind the door" investor moment — a clean consumer
//  site on the outside, the full Lode instrumentation underneath.
//
//  Three ways to toggle:
//    1. URL parameter: ?dev=1  (also persists to localStorage)
//    2. Keyboard shortcut: Ctrl+Alt+D  (Cmd+Opt+D on macOS)
//    3. Click the DEV indicator pill in the corner when it's showing
// ───────────────────────────────────────────────────────────────────────
const DevModeContext = createContext({ devMode: false, setDevMode: () => {} });

export function DevModeProvider({ children }) {
  const [devMode, setDevMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('dev')) {
        const v = params.get('dev');
        const on = v !== '0' && v !== 'off' && v !== 'false';
        localStorage.setItem('simpleton.devMode', on ? 'on' : 'off');
        return on;
      }
      return localStorage.getItem('simpleton.devMode') === 'on';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try { localStorage.setItem('simpleton.devMode', devMode ? 'on' : 'off'); } catch {}
  }, [devMode]);

  // Keyboard toggle — Ctrl+Alt+D or Cmd+Alt+D.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'd' || e.key === 'D' || e.code === 'KeyD')) {
        e.preventDefault();
        setDevMode((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <DevModeContext.Provider value={{ devMode, setDevMode }}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  return useContext(DevModeContext);
}

function readBrainSnapshot(runtime, neuronId, recentSpikeWindowMs) {
  if (!neuronId) return { activation: 0, spiking: false, recentSpike: false };
  const state = runtime.brain.neuronStates.get(neuronId);
  const node  = runtime.brain.ast.get(neuronId);
  if (!state || !node) return { activation: 0, spiking: false, recentSpike: false };

  const vRest   = -70;
  const vThresh = node.props.threshold ?? -55;
  const raw = (state.v - vRest) / (vThresh - vRest);
  const activation = Math.max(0, Math.min(1, raw));

  const spiking = runtime.brain.vals.get(neuronId) === 1.0;

  const now = runtime.brain.time;
  const windowTicks = recentSpikeWindowMs / 16;
  const recentSpike = runtime.brain.spikeHistory.some(
    (s) => s.neuron === neuronId && now - s.time <= windowTicks,
  );

  return { activation, spiking, recentSpike };
}
