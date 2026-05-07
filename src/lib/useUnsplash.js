/**
 * LodeRuntime™ and Lode Architecture™
 * Copyright © 2025 Demiris Brown. All Rights Reserved.
 * (full header — contact Founder@simpletontechnologies.com)
 *
 * useUnsplash — fetch attribution-ready photos from our /api/unsplash
 * proxy. Returns { photos, loading, error }. Never reads the Access Key
 * directly; the server holds it.
 */

import { useEffect, useRef, useState } from 'react';

export function useUnsplash(query, { perPage = 6, orientation } = {}) {
  const [photos,  setPhotos]  = useState([]);
  const [loading, setLoading] = useState(Boolean(query));
  const [error,   setError]   = useState(null);
  const lastQuery = useRef(null);

  useEffect(() => {
    if (!query) {
      setPhotos([]); setLoading(false); setError(null);
      return;
    }
    const key = `${query}|${perPage}|${orientation || ''}`;
    if (lastQuery.current === key) return;
    lastQuery.current = key;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ q: query, per_page: String(perPage) });
    if (orientation) params.set('orientation', orientation);

    fetch(`/api/unsplash/search?${params}`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((data) => {
        if (cancelled) return;
        setPhotos(data.photos || []);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [query, perPage, orientation]);

  return { photos, loading, error };
}

// Fire the Unsplash "view counter" ping. Per Unsplash API guidelines we
// must call download_location when a photo is selected for display in
// our app. Dedupe per session per photo so refreshes don't burn quota.
const TRACKED_KEY = '__unsplash_tracked__';
const tracked = new Set();

export function trackUnsplashDownload(downloadLocation) {
  if (!downloadLocation || tracked.has(downloadLocation)) return;
  tracked.add(downloadLocation);

  // Also persist across same-tab navigations so a user clicking around
  // multiple pages doesn't re-fire pings for repeat photos.
  try {
    const seen = JSON.parse(sessionStorage.getItem(TRACKED_KEY) || '[]');
    if (seen.includes(downloadLocation)) return;
    seen.push(downloadLocation);
    sessionStorage.setItem(TRACKED_KEY, JSON.stringify(seen.slice(-100)));
  } catch { /* sessionStorage may be blocked — proceed anyway */ }

  fetch('/api/unsplash/track', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ download_location: downloadLocation }),
    keepalive: true,
  }).catch(() => { /* fire-and-forget */ });
}
