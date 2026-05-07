/**
 * LodeRuntime™ and Lode Architecture™
 * Copyright © 2025 Demiris Brown. All Rights Reserved.
 * (full header — contact Founder@simpletontechnologies.com)
 *
 * Unsplash API proxy.
 *
 * Why a proxy: the Unsplash Access Key counts toward our rate limit and
 * must stay server-side per Unsplash's API guidelines. The browser never
 * sees it — it talks to /api/unsplash/* and we forward.
 *
 * Compliance notes (https://help.unsplash.com/en/articles/2511245):
 *   1. Hot-link photo.urls.* — never rehost the bytes.
 *   2. Attribution must read "Photo by [Name] on Unsplash" with both the
 *      photographer profile and unsplash.com hyperlinked, and both links
 *      must carry ?utm_source=APP_NAME&utm_medium=referral.
 *   3. When a photo is "selected" for display in our app, ping
 *      photo.links.download_location with our Client-ID. This endpoint is
 *      a counter, not a download — it tells the photographer their work
 *      is being seen.
 */

const fetch = require('node-fetch');

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';
const APP_NAME   = process.env.UNSPLASH_APP_NAME   || 'simpleton-platform';
const UTM        = `utm_source=${encodeURIComponent(APP_NAME)}&utm_medium=referral`;

// 6h TTL keeps us well under the 50/hr demo quota even if every visitor
// triggers a fresh /search/photos call. Production tier (5000/hr) gives
// plenty of headroom; this cache mostly exists to be a good citizen.
const SEARCH_TTL_MS = 6 * 60 * 60 * 1000;
const searchCache = new Map();

function cacheGet(key) {
  const hit = searchCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > SEARCH_TTL_MS) {
    searchCache.delete(key);
    return null;
  }
  return hit.data;
}

function cacheSet(key, data) {
  searchCache.set(key, { at: Date.now(), data });
}

// Trim the Unsplash payload to exactly what the browser needs. Keeps the
// response small, avoids leaking fields we don't display, and forces us
// to build the attribution URLs (with UTM) here so the client can't ship
// a non-compliant link by accident.
function shapePhoto(p) {
  const username = p.user?.username || '';
  const name     = p.user?.name || username || 'Unknown';

  return {
    id:          p.id,
    description: p.alt_description || p.description || '',
    color:       p.color || null,
    blur_hash:   p.blur_hash || null,
    width:       p.width,
    height:      p.height,
    urls: {
      thumb:   p.urls?.thumb,
      small:   p.urls?.small,
      regular: p.urls?.regular,
      full:    p.urls?.full,
    },
    photographer: {
      name,
      username,
      profile_url: username
        ? `https://unsplash.com/@${username}?${UTM}`
        : `https://unsplash.com/?${UTM}`,
    },
    unsplash_url: `https://unsplash.com/?${UTM}`,
    photo_url:    p.links?.html ? `${p.links.html}?${UTM}` : null,
    // The download_location MUST be preserved verbatim — it carries an
    // ixid query param that ties the ping to the originating search.
    download_location: p.links?.download_location || null,
  };
}

async function searchPhotos({ query, perPage = 9, orientation }) {
  if (!query) throw new Error('query required');
  const cacheKey = `${query}|${perPage}|${orientation || ''}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    query,
    per_page:    String(Math.min(Math.max(perPage, 1), 30)),
    content_filter: 'high',
  });
  if (orientation) params.set('orientation', orientation);

  const r = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: {
      Authorization:    `Client-ID ${ACCESS_KEY}`,
      'Accept-Version': 'v1',
    },
  });

  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw Object.assign(new Error(`Unsplash ${r.status}: ${body.slice(0, 200)}`), { status: r.status });
  }

  const json   = await r.json();
  const photos = (json.results || []).map(shapePhoto);
  cacheSet(cacheKey, photos);
  return photos;
}

// Fire-and-forget. Unsplash docs say this should be async and must not
// block UI — a failure to ping is logged but never bubbled to the user.
async function trackDownload(downloadLocation) {
  if (!downloadLocation) return;
  try {
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
    });
  } catch (err) {
    console.warn('[unsplash] track-download failed:', err.message);
  }
}

function attach(app) {
  app.get('/api/unsplash/search', async (req, res) => {
    if (!ACCESS_KEY) {
      return res.status(500).json({ error: 'UNSPLASH_ACCESS_KEY not configured' });
    }
    try {
      const photos = await searchPhotos({
        query:       String(req.query.q || '').trim(),
        perPage:     parseInt(req.query.per_page, 10) || 6,
        orientation: ['landscape', 'portrait', 'squarish'].includes(req.query.orientation)
          ? req.query.orientation : undefined,
      });
      res.json({ photos, app_name: APP_NAME });
    } catch (err) {
      res.status(err.status || 502).json({ error: err.message });
    }
  });

  // POST so we can ship the download_location in the body without it
  // ending up in access logs / the browser's referrer header.
  app.post('/api/unsplash/track', async (req, res) => {
    if (!ACCESS_KEY) {
      return res.status(500).json({ error: 'UNSPLASH_ACCESS_KEY not configured' });
    }
    trackDownload(req.body?.download_location);
    res.json({ ok: true });
  });
}

module.exports = { attach, searchPhotos, trackDownload };
