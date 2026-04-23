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

import React from 'react';
import { useLocation } from 'wouter';
import { useLodeMutation } from '@/lib/lode-context';

/**
 * NavLink — anchors every in-app navigation event through Lode's
 * policy engine and causal trace. Wouter handles the URL + history;
 * Lode tags the mutation with `proposer: 'user'` so `trace.why()`
 * can replay the navigation that produced the current page.
 *
 * Usage:
 *   <NavLink href="/rolex">Rolex Archive</NavLink>
 *
 *   <NavLink href="/markets" className="custom" activeClassName="is-active">
 *     Prices
 *   </NavLink>
 *
 * Props:
 *   href              destination path
 *   children          link contents (any JSX)
 *   className         applied always
 *   activeClassName   appended when current location matches href
 *   activePrefix      if true, matches when location.startsWith(href)
 *                     (useful for highlighting section parents)
 *   style             inline styles
 *   onClick           extra onClick handler (called after navigate)
 */
export function NavLink({
  href,
  children,
  className = '',
  activeClassName = 'active',
  activePrefix = false,
  style,
  onClick,
  ...rest
}) {
  const [location, setLocation] = useLocation();
  const propose = useLodeMutation();

  const isActive = activePrefix
    ? location === href || location.startsWith(href + '/')
    : location === href;

  const handleClick = (e) => {
    // Respect modifier keys (cmd-click opens in new tab) and default
    // anchor semantics when meaningful; otherwise intercept.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setLocation(href);
    propose(
      'set',
      'currentRoute',
      { newValue: { path: href, page: pageNameFromHref(href) } },
      'user',
    );
    if (onClick) onClick(e);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`${className} ${isActive ? activeClassName : ''}`.trim()}
      style={style}
      {...rest}
    >
      {children}
    </a>
  );
}

// Best-effort route → page-name derivation from the href.
// The LodeLocationBridge will re-resolve this against the router
// AST for accuracy; this is only used for the optimistic mutation
// we dispatch from the click handler.
function pageNameFromHref(href) {
  const path = (href || '/').split('?')[0].split('#')[0];
  const map = {
    '/': 'Home',
    '/about': 'About',
    '/markets': 'SimpletonMarkets',
    '/diamond-calculator': 'DiamondCalculator',
    '/coin-calculator': 'CoinCalculator',
    '/calculator': 'Calculator',
    '/database': 'Database',
    '/diamonds': 'Diamonds',
    '/rolex': 'RolexArchive',
    '/lookup': 'Lookup',
    '/jewelry-appraisal': 'JewelryAppraisal',
    '/what-is-this-worth': 'WhatIsThisWorth',
    '/live': 'LiveMarkets',
    '/tickers': 'Tickers',
    '/price-board': 'PriceBoard',
    '/market-signals': 'MarketSignals',
    '/market-analysis': 'MarketAnalysis',
    '/cryptocurrency': 'Cryptocurrency',
    '/crypto': 'Cryptocurrency',
    '/news-hub': 'NewsHub',
    '/news': 'NewsHub',
    '/simplicity': 'SimplicityWorkspace',
    '/login': 'Login',
    '/account': 'Account',
    '/subscription': 'Subscription',
    '/portfolio': 'Portfolio',
    '/feedback': 'Feedback',
    '/user-guide': 'UserGuide',
    '/education': 'Education',
    '/tutorials': 'Tutorials',
    '/terms-of-service': 'TermsOfService',
    '/privacy-policy': 'PrivacyPolicy',
    '/legal-disclosure': 'LegalDisclosure',
  };
  return map[path] || 'Unknown';
}
