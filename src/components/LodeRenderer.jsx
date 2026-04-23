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

export function LodeRenderer({ nodeId, componentMap, children }) {
  const { runtime } = useLode();
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = runtime.subscribe(() => forceUpdate({}));
    return unsubscribe;
  }, [runtime]);

  const node = runtime.astStore.get(nodeId);
  if (!node) return null;

  const Component = componentMap[node.type];
  if (Component) {
    const value = runtime.evaluate(nodeId);
    return <Component node={node} value={value} runtime={runtime} />;
  }

  return children;
}
