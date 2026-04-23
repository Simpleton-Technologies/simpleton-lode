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

import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLode, useLodeMutation, useLodeValue } from '@/lib/lode-context';

/**
 * LodeLocationBridge
 *
 * Keeps wouter's URL state and Lode's `currentRoute` AST node in sync
 * in both directions. Mount once at the app root.
 *
 *   URL  →  AST    (browser back button, deep link, typed URL)
 *   AST  →  URL    (programmatic navigation via propose())
 *
 * Each direction tags the mutation with a distinct proposer so the
 * causal trace can distinguish user clicks (via NavLink: 'user'),
 * programmatic navigation ('router'), and URL-initiated navigation
 * ('browser'). That three-way provenance is the kind of audit detail
 * that is hard to retrofit into a conventional app.
 */
export function LodeLocationBridge() {
  const { runtime, siteAST } = useLode();
  const [location, setLocation] = useLocation();
  const propose = useLodeMutation();
  const route = useLodeValue('currentRoute');

  // URL → AST. When wouter's location changes (from any source), if
  // Lode's AST doesn't already reflect it, record the change through
  // policy. No-op if the mutation came from Lode itself (route.path
  // will already match).
  useEffect(() => {
    const routePath = route && typeof route === 'object' ? route.path : route;
    if (location !== routePath) {
      // Look up the page name from the route nodes in the AST.
      const router = siteAST?.router;
      let pageName = 'Home';
      if (router) {
        const match = router.children
          .map((id) => runtime.ast.get(id))
          .filter(Boolean)
          .find((r) => r.props.path === location);
        if (match) pageName = match.props.page;
      }
      propose(
        'set',
        'currentRoute',
        { newValue: { path: location, page: pageName } },
        'browser',
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // AST → URL. When Lode mutates currentRoute (from any proposer
  // other than 'browser'), push the new path into the browser's
  // history via wouter. The 'browser' tag avoids a redirect loop
  // with the other direction.
  useEffect(() => {
    const routePath = route && typeof route === 'object' ? route.path : route;
    if (routePath && routePath !== location) {
      setLocation(routePath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  return null;
}
