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
import { TopNav } from '@/components/layout/TopNav';
import { Footer } from '@/components/layout/Footer';

const T = {
  bg:       '#0b0b12',
  ink:      '#f4efe2',
  inkMuted: '#9a937f',
  inkFaint: '#6b6552',
  gold:     '#c9a84c',
  hairline: 'rgba(244,239,226,0.10)',
  mono:     '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  body:     '"Inter", -apple-system, system-ui, sans-serif',
  serif:    '"EB Garamond", "Playfair Display", Georgia, serif',
  display:  '"Playfair Display", Georgia, serif',
};

// Human-readable labels for page names when we know them.
const PAGE_LABELS = {
  Login:               'Sign in',
  Account:             'Your account',
  Subscription:        'Membership',
  Portfolio:           'Portfolio',
  Feedback:            'Share feedback',
  UserGuide:           'User guide',
  Education:           'Education',
  Tutorials:           'Tutorials',
  CoinCalculator:      'Coin calculator',
  Database:            'Database',
  Diamonds:            'Diamond guide',
  LiveMarkets:         'Live markets',
  Tickers:             'Tickers',
  PriceBoard:          'Price board',
  MarketSignals:       'Market signals',
  MarketAnalysis:      'Market analysis',
  Cryptocurrency:      'Cryptocurrency',
  NewsHub:             'News hub',
  SimplicityWorkspace: 'Ask Simplicity',
  WhatIsThisWorth:     'What is this worth?',
  TermsOfService:      'Terms of service',
  PrivacyPolicy:       'Privacy policy',
  LegalDisclosure:     'Legal disclosure',
};

export default function ComingSoon({ pageName }) {
  const label = PAGE_LABELS[pageName] || pageName || 'This page';

  return (
    <div style={{ background: T.bg, color: T.ink, fontFamily: T.body, minHeight: '100vh' }}>
      <TopNav />

      <main style={{
        maxWidth: 680, margin: '0 auto',
        padding: '96px 32px 120px',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: T.mono, fontSize: 10, letterSpacing: '0.3em',
          color: T.gold, textTransform: 'uppercase', marginBottom: 28,
        }}>
          § In progress
        </div>

        <h1 style={{
          fontFamily: T.display, fontSize: 'clamp(36px, 5vw, 58px)',
          fontWeight: 400, lineHeight: 1.1, margin: '0 0 4px 0',
          letterSpacing: '-0.01em', color: T.ink,
        }}>
          {label}
        </h1>
        <h1 style={{
          fontFamily: T.display, fontSize: 'clamp(36px, 5vw, 58px)',
          fontWeight: 400, fontStyle: 'italic', color: T.gold,
          lineHeight: 1.1, margin: '0 0 32px 0', letterSpacing: '-0.01em',
        }}>
          is on the way.
        </h1>

        <div style={{ width: 60, height: 1, background: T.gold, margin: '0 auto 36px', opacity: 0.5 }} />

        <p style={{
          fontFamily: T.serif, fontSize: 17, fontStyle: 'italic',
          color: T.inkMuted, lineHeight: 1.75, margin: '0 0 48px 0',
        }}>
          This section isn&rsquo;t open yet — we&rsquo;re building it right.
          Come back soon, or start with what&rsquo;s live today.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.navigate('/')}
            style={{
              background: `linear-gradient(135deg, ${T.gold} 0%, #a8873a 100%)`,
              border: `1px solid ${T.gold}`, color: '#0b0b12',
              padding: '14px 28px', borderRadius: 2,
              fontFamily: T.display, fontSize: 13, fontWeight: 500,
              letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            ← Back to Home
          </button>
          <button
            onClick={() => window.navigate('/markets')}
            style={{
              background: 'transparent', border: `1px solid ${T.hairline}`,
              color: T.gold, padding: '14px 28px', borderRadius: 2,
              fontFamily: T.display, fontSize: 13, fontWeight: 500,
              letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Check Prices
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
