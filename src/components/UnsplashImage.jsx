/**
 * LodeRuntime™ and Lode Architecture™
 * Copyright © 2025 Demiris Brown. All Rights Reserved.
 * (full header — contact Founder@simpletontechnologies.com)
 *
 * UnsplashImage — renders a hot-linked Unsplash photo with the exact
 * "Photo by [Name] on Unsplash" attribution Unsplash requires, both
 * links carrying ?utm_source=APP&utm_medium=referral, and fires the
 * download_location ping once the image enters the viewport.
 *
 * Reference: https://help.unsplash.com/en/articles/2511315-guideline-attribution
 *            https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download
 */

import React, { useEffect, useRef } from 'react';
import { trackUnsplashDownload } from '@/lib/useUnsplash';

export function UnsplashImage({
  photo,
  size       = 'regular',     // thumb | small | regular | full
  alt,
  style      = {},
  imgStyle   = {},
  className,
  rounded    = 2,
  // Caption styling overrides — pages that sit on dark backgrounds need
  // a light caption color; the default is tuned for cream/light surfaces.
  captionColor      = 'rgba(0,0,0,0.55)',
  captionLinkColor  = 'rgba(0,0,0,0.85)',
  captionPlacement  = 'below', // 'below' | 'overlay'
}) {
  const ref = useRef(null);

  // Fire the Unsplash view-counter ping when the image actually appears
  // on screen — that's the "selection" event from the photographer's
  // perspective. Dedupe across the session is handled inside the helper.
  useEffect(() => {
    if (!photo?.download_location || !ref.current) return;
    const node = ref.current;
    const obs  = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          trackUnsplashDownload(photo.download_location);
          obs.disconnect();
          break;
        }
      }
    }, { threshold: 0.25 });
    obs.observe(node);
    return () => obs.disconnect();
  }, [photo?.download_location]);

  if (!photo) return null;

  const src        = photo.urls?.[size] || photo.urls?.regular;
  const altText    = alt || photo.description || `Photo by ${photo.photographer.name} on Unsplash`;
  const linkProps  = { target: '_blank', rel: 'noopener noreferrer' };

  const captionStyle = captionPlacement === 'overlay'
    ? {
        position: 'absolute', bottom: 8, left: 10,
        background: 'rgba(0,0,0,0.55)', color: '#fff',
        padding: '4px 8px', borderRadius: 2,
        fontSize: 10, letterSpacing: '0.04em',
        fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
      }
    : {
        marginTop: 6,
        fontSize: 10, letterSpacing: '0.06em',
        fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
        color: captionColor,
      };

  const captionLinkStyle = captionPlacement === 'overlay'
    ? { color: '#fff', textDecoration: 'underline' }
    : { color: captionLinkColor, textDecoration: 'underline' };

  return (
    <figure
      className={className}
      style={{
        margin: 0, position: 'relative',
        ...style,
      }}
    >
      <img
        ref={ref}
        src={src}
        alt={altText}
        loading="lazy"
        style={{
          display: 'block', width: '100%', height: '100%',
          objectFit: 'cover',
          background: photo.color || '#1a1a1a',
          borderRadius: rounded,
          ...imgStyle,
        }}
      />
      <figcaption style={captionStyle}>
        Photo by{' '}
        <a href={photo.photographer.profile_url} {...linkProps} style={captionLinkStyle}>
          {photo.photographer.name}
        </a>{' '}
        on{' '}
        <a href={photo.unsplash_url} {...linkProps} style={captionLinkStyle}>
          Unsplash
        </a>
      </figcaption>
    </figure>
  );
}

export default UnsplashImage;
