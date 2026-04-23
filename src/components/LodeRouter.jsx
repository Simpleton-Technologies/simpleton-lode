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

import React, { useEffect, useState } from 'react';
import { useLode } from '@/lib/lode-context';
import ComingSoon from '@/pages/ComingSoon.lode';

export function LodeRouter({ routerNodeId, currentRouteNodeId, componentMap }) {
  const { runtime, siteAST } = useLode();
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = runtime.subscribe(() => forceUpdate({}));
    return unsubscribe;
  }, [runtime]);

  const currentRoute = runtime.astStore.get(currentRouteNodeId);
  const currentValue = runtime.valueStore.get(currentRouteNodeId) || currentRoute?.props;
  const pageName = currentValue?.page;

  const PageComponent = componentMap[pageName]
    || (() => <ComingSoon pageName={pageName} />);

  // Expose navigation function globally (for links)
  window.navigate = (path) => {
    const router = runtime.astStore.get(routerNodeId);
    const route = router.children
      .map(id => runtime.astStore.get(id))
      .find(r => r.props.path === path);
    if (route) {
      runtime.proposeMutation('set', currentRouteNodeId, {
        bindingName: 'currentRoute',
        newValue: { path, page: route.props.page }
      }, 'router');
      if (siteAST?.userInteractionNeuron) {
        runtime.brain.stimulate(siteAST.userInteractionNeuron, 25);
      }
    }
  };

  return <PageComponent />;
}
