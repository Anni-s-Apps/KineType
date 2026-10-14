import { StyleRenderContext, TimedWord, clamp } from './types';

/**
 * Spiral Style (Full-Canvas Edge-to-Edge Typography):
 * True full-canvas multi-ring Archimedean spiral filling the entire screen from center to corners.
 * 
 * Features:
 *  - 100% Canvas Coverage: Extends continuous coils from center all the way to the far corners
 *  - Clean Center Core: Smooth distance fade prevents any letter collisions near the origin
 *  - Zero Jhatka: Continuous Smoothstep velocity matching between words
 *  - Constant scale: Never shrinks down into a dot
 *  - Radiant terracotta ribbon badge on active word with crisp white lettering
 */
export const renderSpiral = (ctx: StyleRenderContext) => {
  const { c, W, H, t, curLine, activeWord, words, fontSize, fmt, C, isLandscape } = ctx;

  const songWords = words && words.length > 0 ? words : (curLine ? curLine.words : []);
  if (!songWords.length) return;

  // 1. Dimensions: Full Diagonal Canvas Reach
  const maxCanvasR = Math.hypot(W * 0.5, H * 0.5) + 60; // Covers all 4 screen corners
  const baseSz = Math.min(fontSize * (isLandscape ? 0.68 : 0.78), 52);
  const coilSpacing = baseSz * 1.70; // Radial gap between successive spiral rings (~85px)
  const b = coilSpacing / (Math.PI * 2); // Archimedean growth per radian
  const rInner = Math.max(75, baseSz * 1.4); // Clean inner vortex radius (no collisions)
  const Rfocal = Math.min(W, H) * (isLandscape ? 0.32 : 0.30); // Constant focal radius

  c.font = `800 ${baseSz}px "Archivo", sans-serif`;
  const spaceW = c.measureText(' ').width * 2.8;

  // 2. Measure Cumulative Trajectory for the Song
  interface MeasuredChar {
    ch: string;
    w: number;
    s: number;
  }

  interface MeasuredWord {
    word: TimedWord;
    text: string;
    chars: MeasuredChar[];
    sStart: number;
    sEnd: number;
    sMid: number;
    tMid: number;
    origIdx: number;
  }

  const baseMeasured: MeasuredWord[] = [];
  let cumS = 0;

  for (let i = 0; i < songWords.length; i++) {
    const w = songWords[i];
    const text = fmt(w.word);
    const chars: MeasuredChar[] = [];
    const sStart = cumS;

    for (let ci = 0; ci < text.length; ci++) {
      const ch = text[ci];
      const cw = c.measureText(ch).width;
      chars.push({ ch, w: cw, s: cumS + cw * 0.5 });
      cumS += cw;
    }

    const sEnd = cumS;
    const sMid = (sStart + sEnd) * 0.5;
    const tMid = (w.start + w.end) * 0.5;

    baseMeasured.push({
      word: w,
      text,
      chars,
      sStart,
      sEnd,
      sMid,
      tMid,
      origIdx: i,
    });

    cumS += spaceW;
  }

  const totalSongTrajectory = cumS;

  // 3. Continuous Zero-Jhatka Smoothstep Camera Tracking
  let camS = baseMeasured[0].sMid;
  let activeWordIdx = 0;

  if (t <= baseMeasured[0].tMid) {
    camS = baseMeasured[0].sMid;
    activeWordIdx = 0;
  } else if (t >= baseMeasured[baseMeasured.length - 1].tMid) {
    camS = baseMeasured[baseMeasured.length - 1].sMid;
    activeWordIdx = baseMeasured.length - 1;
  } else {
    for (let i = 0; i < baseMeasured.length - 1; i++) {
      const mwA = baseMeasured[i];
      const mwB = baseMeasured[i + 1];

      if (t >= mwA.tMid && t <= mwB.tMid) {
        activeWordIdx = t < (mwA.word.end + 0.05) ? i : i + 1;
        const dur = Math.max(0.01, mwB.tMid - mwA.tMid);
        const a = clamp((t - mwA.tMid) / dur);
        // Smoothstep C² velocity continuity (eliminates all start-stop jerking)
        const smoothA = a * a * (3 - 2 * a);
        camS = mwA.sMid + (mwB.sMid - mwA.sMid) * smoothA;
        break;
      }
    }
  }

  const activeMw = baseMeasured[activeWordIdx] || baseMeasured[0];
  const wordAge = Math.max(0, t - activeMw.word.start);

  // 4. Calculate Exact Full-Canvas Arc Window (Center to Canvas Corners)
  const dThetaMin = (rInner - Rfocal) / b;
  const dSMin = dThetaMin * Rfocal;
  const dThetaMax = (maxCanvasR - Rfocal) / b;
  const dSMax = dThetaMax * Rfocal;

  // 5. Draw Full-Canvas Ambient Guide Grooves
  c.save();
  c.lineWidth = 1.2;
  c.strokeStyle = 'rgba(26, 18, 9, 0.07)';

  const steps = 360;
  c.beginPath();
  for (let s = 0; s <= steps; s++) {
    const dTh = dThetaMin + (s / steps) * (dThetaMax - dThetaMin);
    const r = Rfocal + b * dTh;
    if (r < rInner) continue;
    const phi = -Math.PI * 0.5 + dTh;
    const x = Math.cos(phi) * r;
    const y = Math.sin(phi) * r;
    if (s === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();

  // 6. Active Word Highlight Ribbon Pill
  const isCur = t >= activeMw.word.start && t < activeMw.word.end + 0.15;
  if (isCur) {
    c.save();
    const popK = clamp(wordAge / 0.16);
    const popScale = 1 + 0.12 * Math.sin(popK * Math.PI) * Math.exp(-popK * 2.5);

    c.shadowColor = C.signal;
    c.shadowBlur = 36;
    c.strokeStyle = C.signal;
    c.lineWidth = baseSz * 1.40 * popScale;
    c.lineCap = 'round';

    const dSStart = activeMw.sStart - camS;
    const dSEnd = activeMw.sEnd - camS;
    const ribbonSteps = 16;

    c.beginPath();
    for (let rs = 0; rs <= ribbonSteps; rs++) {
      const curDs = dSStart + (rs / ribbonSteps) * (dSEnd - dSStart);
      const dTh = curDs / Rfocal;
      const r = Rfocal + b * dTh;
      const phi = -Math.PI * 0.5 + dTh;
      const rx = Math.cos(phi) * r;
      const ry = Math.sin(phi) * r;
      if (rs === 0) c.moveTo(rx, ry);
      else c.lineTo(rx, ry);
    }
    c.stroke();
    c.shadowBlur = 0;

    // Floating diamond star above active word
    const midDTh = (activeMw.sMid - camS) / Rfocal;
    const midR = Rfocal + b * midDTh + baseSz * 1.05;
    const midPhi = -Math.PI * 0.5 + midDTh;
    c.font = `italic 700 ${Math.round(baseSz * 0.38)}px "Cormorant Garamond", serif`;
    c.fillStyle = C.signal;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('✧', Math.cos(midPhi) * midR, Math.sin(midPhi) * midR);
    c.restore();
  }

  // 7. Render Continuous Full-Canvas Typography Stream
  const minTile = Math.floor((camS + dSMin) / totalSongTrajectory);
  const maxTile = Math.ceil((camS + dSMax) / totalSongTrajectory);

  c.textAlign = 'center';
  c.textBaseline = 'middle';

  for (let tile = minTile; tile <= maxTile; tile++) {
    const tileOffset = tile * totalSongTrajectory;

    for (let i = 0; i < baseMeasured.length; i++) {
      const mw = baseMeasured[i];
      const wordS = mw.sMid + tileOffset;
      const wordDs = wordS - camS;

      if (wordDs < dSMin - 120 || wordDs > dSMax + 120) continue;

      const isThisWordActive = tile === 0 && i === activeWordIdx && isCur;
      const isSpoken = tile < 0 || (tile === 0 && t >= mw.word.start);

      for (let ci = 0; ci < mw.chars.length; ci++) {
        const sc = mw.chars[ci];
        const charS = sc.s + tileOffset;
        const ds = charS - camS;

        if (ds < dSMin || ds > dSMax) continue;

        const dTheta = ds / Rfocal;
        const r = Rfocal + b * dTheta;
        if (r < rInner) continue;

        // Smooth fade near inner center vortex to prevent collision:
        let alpha = 1;
        if (r < rInner + 70) {
          const innerProg = clamp((r - rInner) / 70);
          alpha = innerProg * innerProg;
        } else if (r > maxCanvasR - 90) {
          // Smooth fade at outer canvas edge:
          alpha = clamp((maxCanvasR - r) / 90) * 0.32;
        } else {
          alpha = isSpoken ? 1.0 : 0.35;
        }

        if (alpha <= 0.01) continue; // Skip this character, NEVER return!

        const phi = -Math.PI * 0.5 + dTheta;
        const x = Math.cos(phi) * r;
        const y = Math.sin(phi) * r;

        // Tangent rotation
        const pitchAngle = Math.atan2(b, r);
        const rot = phi + Math.PI * 0.5 + pitchAngle;

        c.save();
        c.globalAlpha = alpha;
        c.translate(x, y);
        c.rotate(rot);

        if (isThisWordActive) {
          // Active word text: crisp white with micro scale-punch
          const popK = clamp(wordAge / 0.16);
          const popScale = 1 + 0.10 * Math.sin(popK * Math.PI) * Math.exp(-popK * 2.5);
          c.scale(popScale, popScale);

          c.fillStyle = '#ffffff';
          c.font = `900 ${baseSz * 1.06}px "Archivo", sans-serif`;
          c.fillText(sc.ch, 0, 0);
        } else if (isSpoken) {
          // Spoken words: rich obsidian ink
          c.fillStyle = C.ink;
          c.font = `800 ${baseSz}px "Archivo", sans-serif`;
          c.fillText(sc.ch, 0, 0);
        } else {
          // Upcoming words: soft warm graphite
          c.fillStyle = 'rgba(26, 18, 9, 0.35)';
          c.font = `700 ${baseSz}px "Archivo", sans-serif`;
          c.fillText(sc.ch, 0, 0);
        }

        c.restore();
      }
    }
  }

  // 8. Clean Center Core Vortex (Paper Aperture - Zero Clutter)
  c.save();
  const vortexGrad = c.createRadialGradient(0, 0, rInner * 0.3, 0, 0, rInner + 20);
  vortexGrad.addColorStop(0, C.paper);
  vortexGrad.addColorStop(0.75, C.paper);
  vortexGrad.addColorStop(1, 'rgba(244, 237, 216, 0)');
  c.fillStyle = vortexGrad;
  c.beginPath();
  c.arc(0, 0, rInner + 20, 0, Math.PI * 2);
  c.fill();

  // Minimal origin star at center
  c.font = `italic 700 16px "Cormorant Garamond", serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = C.ash;
  c.fillText('✦', 0, 0);
  c.restore();

  // 9. Fixed Focal Spotlight Marker at Top (-PI/2)
  c.save();
  const playheadY = -Rfocal - baseSz * 0.86;
  c.font = `italic 700 14px "Cormorant Garamond", serif`;
  c.fillStyle = C.signal;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('▼', 0, playheadY);
  c.restore();
};
