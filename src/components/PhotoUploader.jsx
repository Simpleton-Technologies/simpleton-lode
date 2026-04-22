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

import React, { useRef, useState } from 'react';
import { processPhoto } from '@/lib/image-utils';

const MAX_PHOTOS = 5;

const T = {
  ink: '#f4efe2',
  inkMuted: '#9a937f',
  inkFaint: '#6b6552',
  gold: '#c9a84c',
  rose: '#f43f5e',
  hairline: 'rgba(244,239,226,0.10)',
  panel: 'rgba(244,239,226,0.03)',
  panelBord: 'rgba(244,239,226,0.08)',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  body: '"Inter", -apple-system, system-ui, sans-serif',
  serif: '"EB Garamond", "Playfair Display", Georgia, serif',
};

/**
 * PhotoUploader — drag-drop or click-to-select. Up to MAX_PHOTOS photos.
 * Each photo is resized to ~1600px longest edge + compressed to JPEG
 * on upload, yielding a ~200–400KB dataURL that's fine to embed in the
 * PDF and the registry record.
 *
 * Props:
 *   photos — array of { dataURL, width, height, bytes, caption?, label? }
 *   onChange(photos) — fires with the full updated list
 *
 * The first photo is treated as the "hero" image (used as the header of
 * the PDF when a photo is present). Subsequent photos render as detail
 * thumbnails on the report.
 */
export function PhotoUploader({ photos = [], onChange }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError]       = useState(null);
  const [busy, setBusy]         = useState(false);

  const addFiles = async (files) => {
    setError(null);
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`Max ${MAX_PHOTOS} photos per report.`);
      return;
    }
    const next = [...photos];
    setBusy(true);
    try {
      const slice = Array.from(files).slice(0, room);
      for (const f of slice) {
        try {
          const processed = await processPhoto(f);
          next.push({ ...processed, name: f.name });
        } catch (err) {
          setError(err.message || 'Could not process one of the photos.');
        }
      }
      onChange?.(next);
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = (idx) => {
    const next = photos.filter((_, i) => i !== idx);
    onChange?.(next);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          width: '100%',
          padding: '22px 18px',
          background: dragOver ? 'rgba(201,168,76,0.06)' : T.panel,
          border: `1px dashed ${dragOver ? T.gold : T.panelBord}`,
          borderRadius: 3,
          color: T.ink, cursor: 'pointer',
          fontFamily: T.body,
          textAlign: 'center',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.22em', color: T.gold, textTransform: 'uppercase' }}>
          {busy ? 'Processing…' : dragOver ? 'Drop photos' : 'Drag photos or click to select'}
        </div>
        <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.inkMuted, marginTop: 6 }}>
          JPEG or PNG, up to {MAX_PHOTOS} photos, resized client-side (~500KB each)
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/heif"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          style={{ display: 'none' }}
        />
      </button>

      {error && (
        <div style={{
          marginTop: 8, padding: '8px 12px',
          fontFamily: T.mono, fontSize: 11, color: T.rose,
          border: `1px solid rgba(244,63,94,0.3)`, borderRadius: 2,
          background: 'rgba(244,63,94,0.06)',
        }}>
          {error}
        </div>
      )}

      {photos.length > 0 && (
        <div style={{
          marginTop: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
          gap: 8,
        }}>
          {photos.map((p, idx) => (
            <div
              key={idx}
              style={{
                position: 'relative',
                border: `1px solid ${idx === 0 ? T.gold : T.panelBord}`,
                borderRadius: 3,
                overflow: 'hidden',
                aspectRatio: '1 / 1',
                background: '#000',
              }}
            >
              <img
                src={p.dataURL}
                alt={p.name || `Photo ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(0deg, rgba(0,0,0,0.75), transparent)',
                padding: '14px 6px 4px',
                fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em',
                color: '#fff', textTransform: 'uppercase',
              }}>
                {idx === 0 ? 'Hero' : `Detail ${idx}`} · {Math.round(p.bytes / 1024)}KB
              </div>
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                title="Remove"
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.7)', color: '#fff',
                  border: `1px solid rgba(255,255,255,0.2)`,
                  cursor: 'pointer', lineHeight: 1,
                  fontFamily: T.mono, fontSize: 11, fontWeight: 600,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
