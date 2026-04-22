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

import { AstNode } from './runtime.js';

export function buildSiteAST(runtime) {
  // --------------------------------------------------------------------
  // Market Data LodeBits (real-time)
  // --------------------------------------------------------------------
  const goldPrice      = new AstNode('market-data', { symbol: 'XAUUSD', name: 'Gold',      value: 0, currency: 'USD', unit: 'oz' });
  const silverPrice    = new AstNode('market-data', { symbol: 'XAGUSD', name: 'Silver',    value: 0, currency: 'USD', unit: 'oz' });
  const platinumPrice  = new AstNode('market-data', { symbol: 'XPTUSD', name: 'Platinum',  value: 0, currency: 'USD', unit: 'oz' });
  const palladiumPrice = new AstNode('market-data', { symbol: 'XPDUSD', name: 'Palladium', value: 0, currency: 'USD', unit: 'oz' });

  const diamondIndex   = new AstNode('diamond-index',   { carat: 1.0, clarity: 'VS1', color: 'G', cut: 'Excellent', value: 0 });
  const rolexDatabase  = new AstNode('rolex-database',  { models: [], lastUpdated: null });
  const coinDatabase   = new AstNode('coin-database',   { coins: [],  lastUpdated: null });

  // --------------------------------------------------------------------
  // Freshness Neurons (per-metal decay for TopNav dots)
  //
  // Each neuron fires when its metal's price updates; its membrane
  // potential (v) then decays per LIF dynamics (tau=10ms, threshold
  // = -30mV). The TopNav reads the normalized activation through the
  // useLodeBrainActivation hook — the dot fades as potential decays.
  // Zero client-side timers; the fade IS the LIF decay.
  // --------------------------------------------------------------------
  const goldFreshnessNeuron      = runtime.brain.spawnNeuron({ threshold: -30, label: 'gold-freshness' });
  const silverFreshnessNeuron    = runtime.brain.spawnNeuron({ threshold: -30, label: 'silver-freshness' });
  const platinumFreshnessNeuron  = runtime.brain.spawnNeuron({ threshold: -30, label: 'platinum-freshness' });
  const palladiumFreshnessNeuron = runtime.brain.spawnNeuron({ threshold: -30, label: 'palladium-freshness' });

  // --------------------------------------------------------------------
  // Coincidence Detector (MarketEventBanner)
  //
  // Spikes only when 3+ metals move within the recent-activity window.
  // Each freshness → coincidence synapse carries weight 0.45; the neuron's
  // threshold (-52mV) ensures a single metal cannot cross it alone.
  // Native spiking-network capability — coincidence detection is hard
  // to do cleanly in conventional event systems.
  // --------------------------------------------------------------------
  const marketEventNeuron = runtime.brain.spawnNeuron({ threshold: -52, label: 'market-event' });
  runtime.brain.connect(goldFreshnessNeuron,      marketEventNeuron, 0.45);
  runtime.brain.connect(silverFreshnessNeuron,    marketEventNeuron, 0.45);
  runtime.brain.connect(platinumFreshnessNeuron,  marketEventNeuron, 0.45);
  runtime.brain.connect(palladiumFreshnessNeuron, marketEventNeuron, 0.45);

  // --------------------------------------------------------------------
  // Routes — navigation AST. Full 33-route keep-list per approved nav.
  // --------------------------------------------------------------------
  const routeDefinitions = [
    { path: '/',                   page: 'Home' },
    { path: '/about',              page: 'About' },
    { path: '/login',              page: 'Login' },
    { path: '/account',            page: 'Account' },
    { path: '/subscription',       page: 'Subscription' },
    { path: '/portfolio',          page: 'Portfolio' },
    { path: '/feedback',           page: 'Feedback' },
    { path: '/user-guide',         page: 'UserGuide' },
    { path: '/education',          page: 'Education' },
    { path: '/tutorials',          page: 'Tutorials' },
    { path: '/calculator',         page: 'Calculator' },
    { path: '/diamond-calculator', page: 'DiamondCalculator' },
    { path: '/coin-calculator',    page: 'CoinCalculator' },
    { path: '/database',           page: 'Database' },
    { path: '/diamonds',           page: 'Diamonds' },
    { path: '/rolex',              page: 'RolexArchive' },
    { path: '/lookup',             page: 'Lookup' },
    { path: '/jewelry-appraisal',  page: 'JewelryAppraisal' },
    { path: '/what-is-this-worth', page: 'WhatIsThisWorth' },
    { path: '/markets',            page: 'SimpletonMarkets' },
    { path: '/live',               page: 'LiveMarkets' },
    { path: '/tickers',            page: 'Tickers' },
    { path: '/price-board',        page: 'PriceBoard' },
    { path: '/market-signals',     page: 'MarketSignals' },
    { path: '/market-analysis',    page: 'MarketAnalysis' },
    { path: '/cryptocurrency',     page: 'Cryptocurrency' },
    { path: '/crypto',             page: 'Cryptocurrency' },
    { path: '/news-hub',           page: 'NewsHub' },
    { path: '/news',               page: 'NewsHub' },
    { path: '/simplicity',         page: 'SimplicityWorkspace' },
    { path: '/terms-of-service',   page: 'TermsOfService' },
    { path: '/privacy-policy',     page: 'PrivacyPolicy' },
    { path: '/legal-disclosure',   page: 'LegalDisclosure' },
  ];
  const routeNodes = routeDefinitions.map(def => new AstNode('route', def));
  const router = new AstNode('router', {}, routeNodes.map(r => r.id));
  const currentRoute = new AstNode('current-route', { path: '/', page: 'Home' });
  runtime.define('currentRoute', currentRoute.id);

  // --------------------------------------------------------------------
  // User Preferences
  // --------------------------------------------------------------------
  const themePref        = new AstNode('preference', { key: 'theme',        value: 'dark'  }, [], { ownerId: 'user' });
  const highContrastPref = new AstNode('preference', { key: 'highContrast', value: false });
  const reduceMotionPref = new AstNode('preference', { key: 'reduceMotion', value: false });
  runtime.define('theme',        themePref.id);
  runtime.define('highContrast', highContrastPref.id);
  runtime.define('reduceMotion', reduceMotionPref.id);

  // --------------------------------------------------------------------
  // Global Awareness Neurons
  // --------------------------------------------------------------------
  const siteActivityNeuron    = runtime.brain.spawnNeuron({ threshold: -55, label: 'site-activity' });
  const marketUpdateNeuron    = runtime.brain.spawnNeuron({ threshold: -50, label: 'market-update' });
  const userInteractionNeuron = runtime.brain.spawnNeuron({ threshold: -55, label: 'user-interaction' });

  runtime.brain.connect(marketUpdateNeuron,    siteActivityNeuron, 0.7);
  runtime.brain.connect(userInteractionNeuron, siteActivityNeuron, 0.5);

  // --------------------------------------------------------------------
  // Register Bindings for MarketDataSync + hook consumers
  //
  // Without these, MarketDataSync's propose('set', nodeId, { bindingName })
  // calls would fail with "Binding not found". The bindings also let
  // React components look up nodes by human-readable names via the
  // useLodeNodeId hook.
  // --------------------------------------------------------------------
  runtime.define('XAUUSD',       goldPrice.id);
  runtime.define('XAGUSD',       silverPrice.id);
  runtime.define('XPTUSD',       platinumPrice.id);
  runtime.define('XPDUSD',       palladiumPrice.id);
  runtime.define('diamondIndex', diamondIndex.id);
  runtime.define('rolexDB',      rolexDatabase.id);

  // --------------------------------------------------------------------
  // Add all to AST store
  // --------------------------------------------------------------------
  const allNodes = [
    goldPrice, silverPrice, platinumPrice, palladiumPrice,
    diamondIndex, rolexDatabase, coinDatabase,
    router, currentRoute,
    themePref, highContrastPref, reduceMotionPref,
    ...routeNodes,
  ];
  allNodes.forEach(node => runtime.ast.set(node.id, node));
  routeNodes.forEach(route => runtime.depGraph.setParent(route.id, router.id));

  return {
    // Market data
    goldPrice, silverPrice, platinumPrice, palladiumPrice,
    diamondIndex, rolexDatabase, coinDatabase,
    // Routing
    router, currentRoute,
    // Preferences
    themePref, highContrastPref, reduceMotionPref,
    // Global awareness neurons
    siteActivityNeuron, marketUpdateNeuron, userInteractionNeuron,
    // Per-metal freshness + coincidence
    goldFreshnessNeuron, silverFreshnessNeuron, platinumFreshnessNeuron, palladiumFreshnessNeuron,
    marketEventNeuron,
  };
}
