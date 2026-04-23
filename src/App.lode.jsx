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

import React, { useEffect } from 'react';
import { LodeProvider, useLode, DevModeProvider } from '@/lib/lode-context';
import { LodeRouter } from '@/components/LodeRouter';
import { LodeBrainPanel } from '@/components/LodeBrainPanel';
import { MarketEventBanner } from '@/components/MarketEventBanner';
import { LodeLocationBridge } from '@/components/LodeLocationBridge';
import { TraceProvider } from '@/components/CausalTraceViewer';
import { DevModeIndicator } from '@/components/DevModeIndicator';
import { PageGlow } from '@/components/page-glow';
import { WelcomeNotification } from '@/components/welcome-notification';
import { Toaster } from '@/components/ui/toaster';

// Page components (Lode-aware)
import Home from '@/pages/Home.lode';
import About from '@/pages/About.lode';
import SimpletonMarkets from '@/pages/SimpletonMarkets.lode';
import Calculator from '@/pages/Calculator.lode';
import DiamondCalculator from '@/pages/DiamondCalculator.lode';
import RolexArchive from '@/pages/RolexArchive.lode';
import Lookup from '@/pages/Lookup.lode';
import JewelryAppraisal from '@/pages/JewelryAppraisal.lode';

const componentMap = {
  Home,
  About,
  SimpletonMarkets,
  Calculator,
  DiamondCalculator,
  RolexArchive,
  Lookup,
  JewelryAppraisal,
};

function AppContent() {
  const { runtime, siteAST } = useLode();

  useEffect(() => {
    window.__siteAST = siteAST;
    window.__runtime = runtime;
  }, [siteAST, runtime]);

  return (
    <div style={{ minHeight: '100vh', background: '#0b0b12', color: '#f4efe2' }}>
      {/* Mount-once bridge — keeps wouter's URL and Lode's currentRoute
          AST node synchronized in both directions. */}
      <LodeLocationBridge />
      <WelcomeNotification />
      <MarketEventBanner />
      <PageGlow />
      <LodeBrainPanel />
      <LodeRouter
        routerNodeId={siteAST.router.id}
        currentRouteNodeId={siteAST.currentRoute.id}
        componentMap={componentMap}
      />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <LodeProvider>
      <DevModeProvider>
        <TraceProvider>
          <AppContent />
          <DevModeIndicator />
        </TraceProvider>
      </DevModeProvider>
    </LodeProvider>
  );
}
