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

// ----------------------------------------------------------------------
// AST Node with Content-Addressed Identity
// ----------------------------------------------------------------------
export class AstNode {
  constructor(type, props = {}, children = [], metadata = {}) {
    this.type = type;
    this.props = { ...props };
    this.children = [...children];
    this.metadata = {
      ownerId: metadata.ownerId || 'system',
      inferredType: metadata.inferredType || null,
      annotations: metadata.annotations || []
    };
    this.id = crypto.randomUUID();
    this.version = 0;
  }

  update(newProps, newChildren) {
    const newNode = new AstNode(
      this.type,
      { ...this.props, ...newProps },
      newChildren ?? this.children,
      this.metadata
    );
    newNode.id = this.id;
    newNode.version = this.version + 1;
    return newNode;
  }
}

// ----------------------------------------------------------------------
// Dependency Graph
// ----------------------------------------------------------------------
export class DependencyGraph {
  constructor() {
    this.dependents = new Map();
    this.dependencies = new Map();
    this.parentMap = new Map();
  }

  addDependency(dependentId, dependencyId) {
    if (!this.dependents.has(dependencyId)) this.dependents.set(dependencyId, new Set());
    this.dependents.get(dependencyId).add(dependentId);
    if (!this.dependencies.has(dependentId)) this.dependencies.set(dependentId, new Set());
    this.dependencies.get(dependentId).add(dependencyId);
  }

  setParent(childId, parentId) { this.parentMap.set(childId, parentId); }
  getParent(childId) { return this.parentMap.get(childId); }

  removeNode(exprId) {
    if (this.dependencies.has(exprId)) {
      for (const dep of this.dependencies.get(exprId)) this.dependents.get(dep)?.delete(exprId);
      this.dependencies.delete(exprId);
    }
    if (this.dependents.has(exprId)) {
      for (const dep of this.dependents.get(exprId)) this.dependencies.get(dep)?.delete(exprId);
      this.dependents.delete(exprId);
    }
    this.parentMap.delete(exprId);
  }

  getTransitiveDependents(exprId, visited = new Set()) {
    if (visited.has(exprId)) return [];
    visited.add(exprId);
    const direct = this.dependents.get(exprId) || new Set();
    let all = [...direct];
    for (const dep of direct) all = all.concat(this.getTransitiveDependents(dep, visited));
    return all;
  }

  topologicalSort(exprIds) {
    const subgraph = new Map();
    const inDegree = new Map();
    for (const id of exprIds) { subgraph.set(id, new Set()); inDegree.set(id, 0); }
    for (const id of exprIds) {
      const deps = this.dependencies.get(id) || new Set();
      for (const dep of deps) {
        if (subgraph.has(dep)) {
          subgraph.get(id).add(dep);
          inDegree.set(id, inDegree.get(id) + 1);
        }
      }
    }
    const queue = [];
    for (const [id, deg] of inDegree) if (deg === 0) queue.push(id);
    const sorted = [];
    while (queue.length) {
      const cur = queue.shift();
      sorted.push(cur);
      for (const [id, deps] of subgraph) {
        if (deps.has(cur)) {
          deps.delete(cur);
          inDegree.set(id, inDegree.get(id) - 1);
          if (inDegree.get(id) === 0) queue.push(id);
        }
      }
    }
    for (const deps of subgraph.values()) if (deps.size > 0) throw new Error('Cycle detected');
    return sorted;
  }
}

// ----------------------------------------------------------------------
// Causal Trace
// ----------------------------------------------------------------------
export class CausalTrace {
  constructor() {
    this.entries = [];
    this.valueKeyToEntryIdx = new Map();
    this.nextSeq = 0;
  }

  makeValueKey(exprId, version) { return `${exprId}@v${version}#${this.nextSeq++}`; }

  recordEvaluation(exprId, version, value, inputKeys = []) {
    const valueKey = this.makeValueKey(exprId, version);
    const entry = { type: 'evaluation', exprId, version, value, valueKey, inputKeys, timestamp: Date.now() };
    const idx = this.entries.length;
    this.entries.push(entry);
    this.valueKeyToEntryIdx.set(valueKey, idx);
    return valueKey;
  }

  recordMutation(proposal) {
    this.entries.push({ type: 'mutation', proposal, timestamp: Date.now() });
  }

  why(valueKey) {
    const idx = this.valueKeyToEntryIdx.get(valueKey);
    if (idx === undefined) return null;
    const chain = [];
    this._buildChain(idx, chain, new Set());
    return chain;
  }

  _buildChain(idx, chain, visited) {
    if (visited.has(idx)) return;
    visited.add(idx);
    const entry = this.entries[idx];
    chain.push(entry);
    if (entry.type === 'evaluation' && entry.inputKeys) {
      for (const inputKey of entry.inputKeys) {
        const inputIdx = this.valueKeyToEntryIdx.get(inputKey);
        if (inputIdx !== undefined) this._buildChain(inputIdx, chain, visited);
      }
    }
  }

  whyExprValue(exprId, value) {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const e = this.entries[i];
      if (e.type === 'evaluation' && e.exprId === exprId && e.value === value) return this.why(e.valueKey);
    }
    return null;
  }
}

// ----------------------------------------------------------------------
// Policy Engine
// ----------------------------------------------------------------------
export class PolicyEngine {
  constructor(rules = []) { this.rules = rules; this.auditLog = []; }

  evaluate(proposal, context) {
    for (const rule of this.rules) {
      const result = rule(proposal, context);
      if (!result.allowed) {
        this.auditLog.push({ proposal, decision: result, time: new Date().toISOString() });
        return result;
      }
    }
    const decision = { allowed: true };
    this.auditLog.push({ proposal, decision, time: new Date().toISOString() });
    return decision;
  }
}

export const typeSafetyRule = (proposal, context) => {
  const expr = context.ast.get(proposal.targetId);
  if (!expr) return { allowed: true };
  if (proposal.type === 'set') {
    const newType = typeof proposal.payload.newValue;
    const expected = expr.metadata.inferredType;
    if (expected && expected !== newType) {
      return { allowed: false, reason: `Type mismatch: expected ${expected}, got ${newType}` };
    }
  }
  return { allowed: true };
};

export const ownershipRule = (proposal, context) => {
  const owner = context.ast.get(proposal.targetId)?.metadata.ownerId;
  if (owner && owner !== proposal.proposerId && owner !== 'system') {
    return { allowed: false, reason: 'Ownership violation' };
  }
  return { allowed: true };
};

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

// ----------------------------------------------------------------------
// LodeRuntime
// ----------------------------------------------------------------------
export class LodeRuntime {
  constructor() {
    this.ast = new Map();
    this.values = new Map();
    this.env = new Map();
    this.depGraph = new DependencyGraph();
    this.policy = new PolicyEngine([typeSafetyRule, ownershipRule]);
    this.trace = new CausalTrace();
    this.brain = new LodeBrain();
    this.subscribers = new Set();
    this._evalCache = new Map();
  }

  _invalidateEvalCache(id) {
    for (const key of this._evalCache.keys()) if (key.startsWith(id + '@')) this._evalCache.delete(key);
  }

  evaluate(id) {
    const node = this.ast.get(id);
    if (!node) throw new Error(`Node ${id} not found`);
    const cacheKey = `${id}@v${node.version}`;
    if (this._evalCache.has(cacheKey)) return this._evalCache.get(cacheKey);

    const version = node.version;
    const inputKeys = this._collectInputKeys(id);
    let value;

    switch (node.type) {
      case 'literal': value = node.props.value; break;
      case 'identifier': value = this.values.get(this.env.get(node.props.name)); break;
      case 'market-data': case 'diamond-index': case 'rolex-database': case 'coin-database':
      case 'preference': case 'current-route':
        value = node.props.value ?? node.props; break;
      default: value = node.props;
    }

    this._evalCache.set(cacheKey, value);
    this.trace.recordEvaluation(id, version, value, inputKeys);
    return value;
  }

  _collectInputKeys(id) {
    const node = this.ast.get(id);
    if (!node) return [];
    const keys = [];
    for (const childId of node.children) {
      for (let i = this.trace.entries.length - 1; i >= 0; i--) {
        const e = this.trace.entries[i];
        if (e.type === 'evaluation' && e.exprId === childId) { keys.push(e.valueKey); break; }
      }
    }
    return keys;
  }

  reEvaluateAll() {
    const defNodes = [...this.ast.values()].filter(n =>
      n.type === 'defvar' || n.type === 'market-data' || n.type === 'preference' ||
      n.type === 'diamond-index' || n.type === 'rolex-database' || n.type === 'current-route'
    );
    for (const node of defNodes) { this.values.set(node.id, this.evaluate(node.id)); }
  }

  async propose(type, targetId, payload, proposer = 'system') {
    const proposal = { type, targetId, payload, proposer };
    const context = {
      ast: this.ast, env: this.env, depGraph: this.depGraph, valueStore: this.values,
      getOwner: (id) => this.ast.get(id)?.metadata.ownerId || 'system'
    };
    const decision = this.policy.evaluate(proposal, context);
    if (!decision.allowed) return { success: false, reason: decision.reason };

    if (type === 'set') {
      const bindingName = payload.bindingName;
      const bindingId = this.env.get(bindingName) || targetId;
      const node = this.ast.get(bindingId);
      if (!node) return { success: false, reason: 'Node not found' };

      let updatedNode;
      if (typeof payload.newValue === 'object' && payload.newValue !== null && !Array.isArray(payload.newValue)) {
        updatedNode = node.update(payload.newValue);
      } else {
        updatedNode = node.update({ value: payload.newValue });
      }
      this.ast.set(bindingId, updatedNode);
      this.values.set(bindingId, payload.newValue);
      this._invalidateEvalCache(bindingId);

      this.trace.recordMutation(proposal);
      const affected = this.depGraph.getTransitiveDependents(bindingId);
      affected.push(bindingId);
      this._reEvaluateSet(affected);
      this.notifySubscribers();
      return { success: true };
    }
    return { success: false, reason: 'Unsupported mutation type' };
  }

  _reEvaluateSet(affectedIds) {
    const order = this.depGraph.topologicalSort(affectedIds);
    for (const id of order) {
      const node = this.ast.get(id);
      if (!node) continue;
      if (node.type === 'defvar' || node.type === 'market-data' || node.type === 'preference' ||
          node.type === 'diamond-index' || node.type === 'rolex-database') {
        this._invalidateEvalCache(id);
        this.values.set(id, this.evaluate(id));
      }
    }
  }

  subscribe(fn) { this.subscribers.add(fn); return () => this.subscribers.delete(fn); }
  notifySubscribers() { this.subscribers.forEach(fn => fn()); }
  define(name, nodeId) { this.env.set(name, nodeId); }
  why(exprId, value) { return this.trace.whyExprValue(exprId, value); }
}
