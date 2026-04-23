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
 * Simpleton Nervous System — server-side (CommonJS, Railway/Render).
 *
 * Extends the existing LodeRuntime with health awareness:
 *   - A single Pulse number (0–100) the founder can read from anywhere.
 *   - Pain nodes: AstNodes that track active errors/timeouts/failures.
 *   - A server-side LIF brain tick loop (1 Hz) — separate from the
 *     browser's 60 Hz RAF loop. Server brain monitors API health;
 *     browser brain drives the UI dots.
 *   - `signal(event, metadata)` — the single entry point. Route handlers,
 *     market sync, email send — all call this on error or success.
 *   - `heal(nodeId)` — marks a pain node resolved (founder can also
 *     dismiss from the dashboard).
 *
 * Mounted as global.nervousSystem in lode-server.js so any Express
 * route or module can call global.nervousSystem.signal(...) without
 * importing the module directly.
 *
 * Note: this creates its own LodeRuntime + LodeBrain instances.
 * They are intentionally separate from the browser's instances —
 * the server monitors its own state (API health, error rates, pain
 * nodes); the browser monitors the UI (freshness dots, coincidence
 * detection). Two nervous systems, same framework, different concerns.
 */

// Runtime ships as ES modules in src/lode/. On the server we load it
// via a lightweight inline re-implementation so we don't need to bundle
// or convert the whole Vite project to CommonJS. The classes here are
// deliberately minimal — just enough for the nervous system to function.
// When the Lode npm package ships, swap these for the real import.

class NSAstNode {
  constructor(type, props = {}) {
    this.type   = type;
    this.props  = { ...props };
    this.id     = `ns-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.version = 0;
  }
}

class NSBrain {
  constructor() {
    this.neurons      = new Map();
    this.neuronStates = new Map();
    this.vals         = new Map();
    this.spikeHistory = [];
    this.time         = 0;
  }

  spawnNeuron(label) {
    const id = `nrn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.neurons.set(id, { id, label });
    this.neuronStates.set(id, { v: -70.0 });
    this.vals.set(id, 0.0);
    return id;
  }

  stimulate(neuronId, current) {
    const state = this.neuronStates.get(neuronId);
    if (state) state.v = Math.min(-30, state.v + current);
  }

  tick() {
    this.time += 1;
    for (const [id, state] of this.neuronStates) {
      // LIF decay toward rest (-70)
      state.v += (-70 - state.v) * 0.1;
      const spiking = state.v >= -30;
      this.vals.set(id, spiking ? 1.0 : 0.0);
      if (spiking) {
        state.v = -75;
        this.spikeHistory.push({ neuron: id, time: this.time });
        if (this.spikeHistory.length > 100) this.spikeHistory.shift();
      }
    }
  }

  getState() {
    let potentialSum = 0;
    let activeCount  = 0;
    for (const [id, state] of this.neuronStates) {
      potentialSum += state.v;
      if (this.vals.get(id) === 1.0) activeCount++;
    }
    const count = this.neuronStates.size;
    return {
      neuronCount:      count,
      activeNeurons:    activeCount,
      averagePotential: count > 0 ? potentialSum / count : 0,
    };
  }
}

class SimpletonNervousSystem {
  constructor() {
    this.brain     = new NSBrain();
    this.painNodes = new Map();
    this.healLog   = [];
    this.pulse     = 94; // Start healthy

    // Spawn a monitoring neuron per concern
    this._neurons = {
      apiHealth:   this.brain.spawnNeuron('api-health'),
      marketData:  this.brain.spawnNeuron('market-data'),
      emailSend:   this.brain.spawnNeuron('email-send'),
      appraisal:   this.brain.spawnNeuron('appraisal'),
    };

    this._startTick();
  }

  _startTick() {
    this._tickInterval = setInterval(() => {
      this.brain.tick();
      this._recalculatePulse();
    }, 1000);

    // Clean shutdown — don't leave orphaned intervals on Railway restart.
    process.once('SIGTERM', () => this._stop());
    process.once('SIGINT',  () => this._stop());
  }

  _stop() {
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────

  /**
   * signal(event, metadata) — the single entry point.
   *
   * Call this from any Express route or service on error or notable event.
   * Events that register as pain: 'error', 'timeout', 'api-failure',
   * 'email-failed', 'market-stale'.
   *
   * @example
   *   global.nervousSystem?.signal('api-failure', {
   *     source: 'sendgrid',
   *     message: err.message,
   *   });
   */
  signal(event, metadata = {}) {
    const node = new NSAstNode('signal', { event, ...metadata, timestamp: Date.now() });

    // Stimulate the relevant neuron
    const neuronKey = this._neuronForEvent(event);
    if (neuronKey) this.brain.stimulate(this._neurons[neuronKey], 20);

    // Register pain on failure events
    const isPain = ['error','timeout','api-failure','email-failed','market-stale'].includes(event);
    if (isPain) {
      this.painNodes.set(node.id, {
        node,
        violations: [{ type: event, message: metadata.message || event }],
        timestamp:  Date.now(),
        healed:     false,
      });
      console.warn(`[nervous-system] pain registered: ${event} — ${metadata.message || ''}`);
    }

    return node;
  }

  /**
   * heal(nodeId) — mark a pain node resolved.
   * Called automatically by self-healing playbooks; can also be
   * triggered manually from the founder dashboard.
   */
  heal(nodeId) {
    const pain = this.painNodes.get(nodeId);
    if (!pain) return false;

    pain.healed = true;
    this.healLog.unshift({
      method:     'manual',
      targetNode: nodeId,
      timestamp:  Date.now(),
    });
    if (this.healLog.length > 50) this.healLog.pop();

    console.log(`[nervous-system] healed: ${nodeId}`);
    return true;
  }

  /**
   * recentHeals(windowMs) — heals within the last N milliseconds.
   * Used by /api/founder/pulse.
   */
  recentHeals(windowMs = 3_600_000) {
    const cutoff = Date.now() - windowMs;
    return this.healLog.filter(h => h.timestamp >= cutoff);
  }

  // ─── Internal ─────────────────────────────────────────────────────────

  _recalculatePulse() {
    const activePain = [...this.painNodes.values()].filter(p => !p.healed).length;
    const { activeNeurons, neuronCount } = this.brain.getState();
    const brainLoad = neuronCount > 0 ? activeNeurons / neuronCount : 0;

    this.pulse = Math.max(0, Math.min(100,
      100 - (activePain * 5) - (brainLoad * 20)
    ));
  }

  _neuronForEvent(event) {
    if (event.includes('email'))   return 'emailSend';
    if (event.includes('market'))  return 'marketData';
    if (event.includes('appraisal')) return 'appraisal';
    return 'apiHealth';
  }
}

// Mount as singleton — persistent across requests on Railway.
const nervousSystem = new SimpletonNervousSystem();
global.nervousSystem = nervousSystem;

module.exports = nervousSystem;
