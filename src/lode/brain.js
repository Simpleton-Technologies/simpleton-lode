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

// LodeBrain — simpleton-lode-owned domain module.
// Extracted from src/lode/runtime.js lines 219–345 on 2026-04-22 (step 5 of
// the LodeRuntime reconciliation). Brain stays with simpleton-lode per the
// "only packages/core is shippable" rule in LodeRuntime/CLAUDE.md.
//
// Note: there is an intentional module-level circular import with runtime.js
// (this file imports AstNode + CausalTrace from there; runtime.js imports
// LodeBrain from here). ESM handles this safely because AstNode and
// CausalTrace are only accessed at method-call time, never at module load.
// Step 6 breaks this cycle by swapping runtime.js for @loderuntime/core
// and keeping brain.js in its own lane.

import { AstNode, CausalTrace } from './runtime.js';

// ----------------------------------------------------------------------
// LIF Brain
// ----------------------------------------------------------------------
export const NEURON_PARAMS = { v_rest: -70.0, v_thresh: -55.0, v_reset: -75.0, tau: 10.0, refractory: 2.0 };
export const STDP_PARAMS = { A_plus: 0.008, A_minus: 0.006, tau_plus: 20.0, tau_minus: 20.0, w_min: -1.0, w_max: 1.0 };

class LIFNeuronState {
  constructor() { this.v = NEURON_PARAMS.v_rest; this.lastSpikeTime = -Infinity; this.refractUntil = -Infinity; }
}

function stdpWeightUpdate(deltaT) {
  if (deltaT > 0) return STDP_PARAMS.A_plus * Math.exp(-deltaT / STDP_PARAMS.tau_plus);
  else return -STDP_PARAMS.A_minus * Math.exp(deltaT / STDP_PARAMS.tau_minus);
}

export class LodeBrain {
  constructor() {
    this.ast = new Map();
    this.neuronStates = new Map();
    this.spikeHistory = [];
    this.time = 0;
    this.vals = new Map();
    this.trace = new CausalTrace();
  }

  spawnNeuron(props = {}) {
    const threshold = props.threshold ?? NEURON_PARAMS.v_thresh;
    const neuron = new AstNode('neuron', { threshold, ...props }, [], { inferredType: 'number' });
    this.ast.set(neuron.id, neuron);
    this.neuronStates.set(neuron.id, new LIFNeuronState());
    return neuron.id;
  }

  connect(preId, postId, weight = 0.5) {
    const syn = new AstNode('synapse', { weight }, [preId, postId], { inferredType: 'number' });
    this.ast.set(syn.id, syn);
    this.ast.get(postId).children.push(syn.id);
    return syn.id;
  }

  stimulate(neuronId, current) {
    const state = this.neuronStates.get(neuronId);
    if (state) state.v += current;
  }

  tick(dt = 1.0) {
    this.time += dt;
    const spikes = [];
    for (const [id, node] of this.ast) {
      if (node.type !== 'neuron') continue;
      const state = this.neuronStates.get(id);
      if (!state) continue;
      if (this.time < state.refractUntil) { state.v = NEURON_PARAMS.v_reset; continue; }
      let I = 0;
      for (const synId of node.children) {
        const syn = this.ast.get(synId);
        const preState = this.neuronStates.get(syn.children[0]);
        if (preState && preState.lastSpikeTime > this.time - 5) I += syn.props.weight;
      }
      const dv = (-(state.v - NEURON_PARAMS.v_rest) + I) / NEURON_PARAMS.tau * dt;
      state.v += dv;
      if (state.v >= node.props.threshold) {
        spikes.push(id);
        state.v = NEURON_PARAMS.v_reset;
        state.lastSpikeTime = this.time;
        state.refractUntil = this.time + NEURON_PARAMS.refractory;
        this.spikeHistory.push({ neuron: id, time: this.time });
        if (this.spikeHistory.length > 200) this.spikeHistory.shift();
        this.vals.set(id, 1.0);
      } else {
        this.vals.set(id, 0.0);
      }
    }

    if (spikes.length) {
      const recent = this.spikeHistory.filter(s => this.time - s.time < 50);
      for (const [synId, syn] of this.ast) {
        if (syn.type !== 'synapse') continue;
        const [pre, post] = syn.children;
        const preSpikes = recent.filter(s => s.neuron === pre);
        const postSpikes = recent.filter(s => s.neuron === post);
        let deltaW = 0;
        for (const preS of preSpikes) for (const postS of postSpikes) deltaW += stdpWeightUpdate(postS.time - preS.time);
        if (deltaW !== 0) {
          let newW = Math.min(STDP_PARAMS.w_max, Math.max(STDP_PARAMS.w_min, syn.props.weight + deltaW));
          const newSyn = new AstNode('synapse', { weight: newW }, [pre, post]);
          newSyn.id = synId; newSyn.version = syn.version + 1;
          this.ast.set(synId, newSyn);
          this.trace.recordMutation({ type: 'stdp', synId, oldWeight: syn.props.weight, newWeight: newW });
        }
      }
    }

    if (this.time % 500 < dt) {
      for (const [id, node] of this.ast) {
        if (node.type === 'synapse' && Math.abs(node.props.weight) < 0.02) this.ast.delete(id);
      }
    }
    return spikes;
  }

  getNeurons() {
    return [...this.ast.values()].filter(n => n.type === 'neuron');
  }

  getSynapses() {
    return [...this.ast.values()].filter(n => n.type === 'synapse');
  }

  getState() {
    const neurons = this.getNeurons();
    let potentialSum = 0;
    let activeCount = 0;
    for (const n of neurons) {
      const s = this.neuronStates.get(n.id);
      if (s) {
        potentialSum += s.v;
        if (this.vals.get(n.id) === 1.0) activeCount++;
      }
    }
    return {
      neuronCount:      neurons.length,
      activeNeurons:    activeCount,
      averagePotential: neurons.length > 0 ? potentialSum / neurons.length : 0,
    };
  }
}
