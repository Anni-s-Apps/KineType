import fixWebmDuration from 'fix-webm-duration';

/**
 * Universal Video Duration Fixer for Chromium MediaRecorder output (MP4 & WebM)
 *
 * Problem: Chromium's MediaRecorder outputs streaming chunks where the container
 * header has duration set to 0 or only the first GOP / chunk duration (~2.0 seconds).
 * When opened in standard media players (Windows Media Player, VLC, QuickTime),
 * the scrubber timeline only displays 0:02 even though the video plays the entire length.
 *
 * Solution:
 * 1. For MP4 (fragmented or progressive):
 *    - Locate `moov` -> `mvhd` and write exact `movieTimescale * duration`
 *    - Locate all `moov` -> `trak` -> `tkhd` and write exact track duration
 *    - Locate all `moov` -> `trak` -> `mdia` -> `mdhd` and write exact media duration
 *    - Locate `moov` -> `mvex` -> `mehd` and write exact fragment duration
 *    - If `mvex` exists without `mehd`, inject a 16-byte `mehd` box into `mvex`
 * 2. For WebM (EBML):
 *    - Use fix-webm-duration to inject `Segment` -> `Info` -> `Duration`
 *    - Scan and override any dummy float64 / float32 duration tag to the exact target duration
 */

export function patchMp4BufferDuration(
  inputBuffer: ArrayBuffer,
  targetDurationSeconds: number
): ArrayBuffer {
  const uint8 = new Uint8Array(inputBuffer);
  const view = new DataView(uint8.buffer, uint8.byteOffset, uint8.byteLength);

  let movieTimescale = 1000;
  let moovOffset = -1;
  let moovSize = 0;
  let mvexOffset = -1;
  let mvexSize = 0;
  let hasMehd = false;

  function scanBoxes(start: number, end: number) {
    let p = start;
    while (p + 8 <= end) {
      const size = view.getUint32(p);
      let type = '';
      for (let i = 0; i < 4; i++) {
        type += String.fromCharCode(view.getUint8(p + 4 + i));
      }

      let boxSize = size;
      let headerSize = 8;
      if (size === 1) {
        if (p + 16 > end) break;
        boxSize = Number(view.getBigUint64(p + 8));
        headerSize = 16;
      } else if (size === 0) {
        boxSize = end - p;
      }

      if (boxSize < headerSize || p + boxSize > end) break;

      if (type === 'moov') {
        moovOffset = p;
        moovSize = boxSize;
        scanBoxes(p + headerSize, p + boxSize);
      } else if (type === 'mvex') {
        mvexOffset = p;
        mvexSize = boxSize;
        scanBoxes(p + headerSize, p + boxSize);
      } else if (type === 'trak' || type === 'mdia' || type === 'minf') {
        scanBoxes(p + headerSize, p + boxSize);
      } else if (type === 'mvhd') {
        const version = view.getUint8(p + 8);
        if (version === 0) {
          movieTimescale = view.getUint32(p + 20) || 1000;
          const targetUnits = Math.round(targetDurationSeconds * movieTimescale);
          view.setUint32(p + 24, targetUnits);
        } else if (version === 1) {
          movieTimescale = view.getUint32(p + 28) || 1000;
          const targetUnits = BigInt(Math.round(targetDurationSeconds * movieTimescale));
          view.setBigUint64(p + 32, targetUnits);
        }
      } else if (type === 'tkhd') {
        const version = view.getUint8(p + 8);
        if (version === 0) {
          const targetUnits = Math.round(targetDurationSeconds * movieTimescale);
          view.setUint32(p + 28, targetUnits);
        } else if (version === 1) {
          const targetUnits = BigInt(Math.round(targetDurationSeconds * movieTimescale));
          view.setBigUint64(p + 36, targetUnits);
        }
      } else if (type === 'mdhd') {
        const version = view.getUint8(p + 8);
        if (version === 0) {
          const mediaTimescale = view.getUint32(p + 20) || movieTimescale;
          const targetUnits = Math.round(targetDurationSeconds * mediaTimescale);
          view.setUint32(p + 24, targetUnits);
        } else if (version === 1) {
          const mediaTimescale = view.getUint32(p + 28) || movieTimescale;
          const targetUnits = BigInt(Math.round(targetDurationSeconds * mediaTimescale));
          view.setBigUint64(p + 32, targetUnits);
        }
      } else if (type === 'mehd') {
        hasMehd = true;
        const version = view.getUint8(p + 8);
        if (version === 0) {
          const targetUnits = Math.round(targetDurationSeconds * movieTimescale);
          view.setUint32(p + 12, targetUnits);
        } else if (version === 1) {
          const targetUnits = BigInt(Math.round(targetDurationSeconds * movieTimescale));
          view.setBigUint64(p + 12, targetUnits);
        }
      }

      p += boxSize;
    }
  }

  // Scan initial segment containing moov (usually within first 2MB)
  scanBoxes(0, Math.min(uint8.byteLength, 2 * 1024 * 1024));

  // If mvex was present without mehd, inject mehd box at start of mvex
  if (mvexOffset !== -1 && !hasMehd && moovOffset !== -1) {
    const mehdSize = 16;
    const targetUnits = Math.round(targetDurationSeconds * movieTimescale);
    const newBuf = new Uint8Array(uint8.byteLength + mehdSize);

    // Copy up to start of mvex payload (after 8-byte header)
    const insertPos = mvexOffset + 8;
    newBuf.set(uint8.subarray(0, insertPos), 0);

    // Build 16-byte mehd box
    const mehd = new DataView(new ArrayBuffer(16));
    mehd.setUint32(0, 16); // box size
    mehd.setUint8(4, 0x6d); // 'm'
    mehd.setUint8(5, 0x65); // 'e'
    mehd.setUint8(6, 0x68); // 'h'
    mehd.setUint8(7, 0x64); // 'd'
    mehd.setUint8(8, 0); // version 0
    mehd.setUint8(9, 0); // flags
    mehd.setUint8(10, 0);
    mehd.setUint8(11, 0);
    mehd.setUint32(12, targetUnits); // fragment_duration

    newBuf.set(new Uint8Array(mehd.buffer), insertPos);
    newBuf.set(uint8.subarray(insertPos), insertPos + mehdSize);

    // Update moov and mvex sizes
    const newView = new DataView(newBuf.buffer, newBuf.byteOffset, newBuf.byteLength);
    newView.setUint32(moovOffset, moovSize + mehdSize);
    newView.setUint32(mvexOffset, mvexSize + mehdSize);

    return newBuf.buffer;
  }

  return inputBuffer;
}

/**
 * Patch WebM buffer float64 / float32 Duration tags in EBML Info container
 */
export function patchWebmBufferFloatDuration(
  buffer: ArrayBuffer,
  targetDurationMs: number
): boolean {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const scanLimit = Math.min(bytes.length - 11, 128 * 1024);

  let patched = false;
  for (let i = 0; i <= scanLimit; i++) {
    // 0x4489 is EBML ID for Duration
    if (bytes[i] === 0x44 && bytes[i + 1] === 0x89) {
      if (bytes[i + 2] === 0x88 && i + 11 <= bytes.length) {
        // 8-byte float64
        view.setFloat64(i + 3, targetDurationMs, false);
        patched = true;
      } else if (bytes[i + 2] === 0x84 && i + 7 <= bytes.length) {
        // 4-byte float32
        view.setFloat32(i + 3, targetDurationMs, false);
        patched = true;
      }
    }
  }
  return patched;
}

/**
 * Fix duration for any recorded video Blob (MP4 or WebM)
 */
export async function fixVideoBlobDuration(
  rawBlob: Blob,
  targetDurationSeconds: number
): Promise<Blob> {
  if (!targetDurationSeconds || isNaN(targetDurationSeconds) || targetDurationSeconds <= 0) {
    return rawBlob;
  }

  const durationMs = targetDurationSeconds * 1000;

  try {
    const arrayBuffer = await rawBlob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Check MP4 signature: 'ftyp' at offset 4
    const isMp4 =
      rawBlob.type.includes('mp4') ||
      (bytes.length >= 8 &&
        bytes[4] === 0x66 && // 'f'
        bytes[5] === 0x74 && // 't'
        bytes[6] === 0x79 && // 'y'
        bytes[7] === 0x70); // 'p'

    // Check WebM signature: 0x1A 0x45 0xDF 0xA3 at offset 0
    const isWebm =
      rawBlob.type.includes('webm') ||
      (bytes.length >= 4 &&
        bytes[0] === 0x1a &&
        bytes[1] === 0x45 &&
        bytes[2] === 0xdf &&
        bytes[3] === 0xa3);

    if (isMp4) {
      console.log(`🎬 [Video Fixer] Detected MP4 container. Patching boxes for ${targetDurationSeconds.toFixed(2)}s...`);
      const patchedBuffer = patchMp4BufferDuration(arrayBuffer, targetDurationSeconds);
      return new Blob([patchedBuffer], { type: rawBlob.type || 'video/mp4' });
    }

    if (isWebm) {
      console.log(`🎬 [Video Fixer] Detected WebM container. Patching EBML duration for ${targetDurationSeconds.toFixed(2)}s (${durationMs.toFixed(0)}ms)...`);

      // 1. First run fix-webm-duration to inject missing Duration tag if absent
      let webmBlob: Blob = rawBlob;
      try {
        const fixerFn = (fixWebmDuration as any)?.default || fixWebmDuration;
        if (typeof fixerFn === 'function') {
          webmBlob = await new Promise<Blob>(resolve => {
            fixerFn(rawBlob, durationMs, (fixed: Blob) => resolve(fixed || rawBlob));
          });
        }
      } catch (e) {
        console.warn('⚠️ [Video Fixer] fix-webm-duration step error, falling back to direct byte scan:', e);
      }

      // 2. Second pass: ensure any float duration tag has the exact value
      try {
        const webmBuf = await webmBlob.arrayBuffer();
        patchWebmBufferFloatDuration(webmBuf, durationMs);
        return new Blob([webmBuf], { type: rawBlob.type || 'video/webm' });
      } catch (e) {
        return webmBlob;
      }
    }

    // Default fallback: try MP4 box patch first, then return
    const fallbackBuf = patchMp4BufferDuration(arrayBuffer, targetDurationSeconds);
    return new Blob([fallbackBuf], { type: rawBlob.type });
  } catch (err) {
    console.error('❌ [Video Fixer] Failed to patch video duration, using raw blob:', err);
    return rawBlob;
  }
}
