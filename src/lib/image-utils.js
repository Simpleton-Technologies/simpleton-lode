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

/**
 * Image utilities for appraisal photo handling — client-side only, no deps.
 *
 * Browser photos from phones are frequently 12MP+ (4-8 MB). Dropping those
 * straight into a dataURL blows through localStorage and makes PDF export
 * crawl. These helpers resize + re-encode to JPEG so uploads stay under
 * a few hundred KB per photo while preserving appraiser-grade detail.
 *
 * HEIC (iPhone camera default) doesn't decode reliably across browsers —
 * Safari yes, Chrome no. We catch that case and surface a clear error
 * rather than silently corrupting the record. Owners on iPhone can save
 * the photo as JPEG from the Files app or Share → "Most Compatible."
 */

const MAX_DIMENSION = 1600;   // longest edge, in CSS pixels
const JPEG_QUALITY  = 0.85;   // balance of fidelity + filesize
const MAX_BYTES     = 500_000; // ~500KB target per photo

/**
 * Read a File into an HTMLImageElement, resized to MAX_DIMENSION on the
 * longest edge, and re-encoded as a JPEG dataURL.
 *
 * Returns { dataURL, width, height, bytes, mimeType } or throws if the
 * file is an unsupported image format (HEIC on Chrome, corrupt file, etc.).
 */
export async function processPhoto(file) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    throw new Error('Not an image file.');
  }

  // HEIC / HEIF can't be decoded on Chrome/Firefox. Fail loud, not silent.
  if (/heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name || '')) {
    // Safari 17+ may still decode HEIC via createImageBitmap; try once.
    try {
      const bitmap = await createImageBitmap(file);
      return await encodeFromBitmap(bitmap);
    } catch {
      throw new Error('HEIC/HEIF photos need to be saved as JPEG first. On iPhone: Share → "Most Compatible".');
    }
  }

  const dataURL = await readAsDataURL(file);
  const img = await loadImage(dataURL);
  return encodeFromImage(img);
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload  = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('Could not read file.'));
    fr.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('Image data looks corrupt.'));
    img.src = src;
  });
}

async function encodeFromImage(img) {
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, MAX_DIMENSION);
  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  return finalizeCanvas(canvas);
}

async function encodeFromBitmap(bitmap) {
  const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_DIMENSION);
  const canvas = document.createElement('canvas');
  canvas.width  = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  return finalizeCanvas(canvas);
}

function fitWithin(w, h, max) {
  if (w <= max && h <= max) return { width: w, height: h };
  const scale = max / Math.max(w, h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

async function finalizeCanvas(canvas) {
  // Iterate quality down if the encoded result overshoots our budget.
  // Most photos will pass the first try at 0.85 quality; heavy ones step
  // down to 0.75 and then 0.65 — still fine for appraisal documentation.
  let quality = JPEG_QUALITY;
  let dataURL = canvas.toDataURL('image/jpeg', quality);
  let bytes = estimateDataURLBytes(dataURL);

  while (bytes > MAX_BYTES && quality > 0.5) {
    quality -= 0.1;
    dataURL = canvas.toDataURL('image/jpeg', quality);
    bytes = estimateDataURLBytes(dataURL);
  }

  return {
    dataURL,
    width: canvas.width,
    height: canvas.height,
    bytes,
    mimeType: 'image/jpeg',
  };
}

function estimateDataURLBytes(dataURL) {
  const comma = dataURL.indexOf(',');
  if (comma < 0) return dataURL.length;
  // Base64 encodes 3 bytes → 4 chars (+ padding).
  const b64 = dataURL.slice(comma + 1);
  return Math.floor((b64.length * 3) / 4);
}
