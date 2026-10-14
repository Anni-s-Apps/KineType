import { Palette } from '../styles/types';

export interface GraphicContext {
  c: CanvasRenderingContext2D;
  W: number;
  H: number;
  t: number;
  isLandscape: boolean;
  songTitle: string;
  C: Palette;
  isPlaying: boolean;
}

export interface GraphicItem {
  id: string;
  label: string;
  icon: string;
  desc: string;
}

export const GRAPHIC_OPTIONS: GraphicItem[] = [
  { id: 'corners', label: 'Viewfinder Corners', icon: '◰', desc: 'Cinematic crop ticks & crosshairs' },
  { id: 'waveform', label: 'Audio Waveform / EQ', icon: 'ılı', desc: 'Real-time pulsing frequency bars' },
  { id: 'particles', label: 'Floating Dust & Embers', icon: '✧', desc: 'Organic floating warm particles' },
  { id: 'stars', label: 'Aesthetic Stars', icon: '✦', desc: 'Geometric star accents & pulses' },
  { id: 'vinyl', label: 'Spinning Vinyl Badge', icon: '◎', desc: 'Rotating retro record in corner' },
  { id: 'nowPlaying', label: 'Now Playing Card', icon: '♫', desc: 'Floating luxury track badge' },
];

export const renderGraphicsOverlay = (
  activeGraphics: string[],
  ctx: GraphicContext
) => {
  const { c, W, H, t, isLandscape, songTitle, C } = ctx;

  // 1. Viewfinder Corners (Cinematic Crop Marks)
  if (activeGraphics.includes('corners')) {
    c.save();
    c.strokeStyle = 'rgba(26,18,9,0.32)';
    c.lineWidth = 2;
    const pad = isLandscape ? 40 : 48;
    const len = isLandscape ? 40 : 50;

    // Top-Left
    c.beginPath();
    c.moveTo(pad, pad + len);
    c.lineTo(pad, pad);
    c.lineTo(pad + len, pad);
    c.stroke();

    // Top-Right
    c.beginPath();
    c.moveTo(W - pad - len, pad);
    c.lineTo(W - pad, pad);
    c.lineTo(W - pad, pad + len);
    c.stroke();

    // Bottom-Left
    c.beginPath();
    c.moveTo(pad, H - pad - len);
    c.lineTo(pad, H - pad);
    c.lineTo(pad + len, H - pad);
    c.stroke();

    // Bottom-Right
    c.beginPath();
    c.moveTo(W - pad - len, H - pad);
    c.lineTo(W - pad, H - pad);
    c.lineTo(W - pad, H - pad - len);
    c.stroke();

    // Subtle edge crosshairs
    const chSize = 7;
    c.lineWidth = 1.2;
    c.strokeStyle = 'rgba(26,18,9,0.22)';
    // Top center +
    c.beginPath();
    c.moveTo(W * 0.5 - chSize, pad);
    c.lineTo(W * 0.5 + chSize, pad);
    c.moveTo(W * 0.5, pad - chSize);
    c.lineTo(W * 0.5, pad + chSize);
    c.stroke();
    c.restore();
  }

  // 2. Audio Waveform / Live EQ Bars
  if (activeGraphics.includes('waveform')) {
    c.save();
    const barCount = isLandscape ? 40 : 28;
    const barW = isLandscape ? 6 : 5;
    const gap = isLandscape ? 8 : 7;
    const totalW = barCount * (barW + gap) - gap;
    const startX = (W - totalW) * 0.5;
    const eqY = isLandscape ? H - 80 : H - 160;

    for (let i = 0; i < barCount; i++) {
      // Dynamic frequency height simulating audio beat
      const freq = Math.sin(t * 8 + i * 0.45) * 0.5 + 0.5;
      const beat = Math.sin(t * 4 + i * 0.2) * Math.cos(t * 6 - i * 0.3);
      const h = 8 + Math.abs(freq * beat) * (isLandscape ? 45 : 55);

      c.fillStyle = i % 4 === 0 ? C.signal : 'rgba(26,18,9,0.45)';
      c.fillRect(startX + i * (barW + gap), eqY - h * 0.5, barW, h);
    }
    c.restore();
  }

  // 3. Floating Dust & Embers
  if (activeGraphics.includes('particles')) {
    c.save();
    const count = 30;
    for (let i = 0; i < count; i++) {
      // Procedural drift
      const px = ((i * 127.3 + t * (12 + (i % 5) * 6)) % (W + 60)) - 30;
      const py = ((i * 311.7 - t * (16 + (i % 4) * 5)) % (H + 60));
      const finalY = py < 0 ? py + H + 60 : py;
      const alpha = 0.12 + 0.18 * Math.sin(t * 2 + i * 1.5);
      const r = 1.2 + (i % 3) * 1.2;

      c.fillStyle = i % 5 === 0 ? `rgba(201,79,0,${Math.max(0, alpha * 1.5)})` : `rgba(26,18,9,${Math.max(0, alpha)})`;
      c.beginPath();
      c.arc(px, finalY, r, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  // 4. Aesthetic Geometric Stars (✦, ✧, ✳)
  if (activeGraphics.includes('stars')) {
    c.save();
    c.font = '22px "Cormorant Garamond", serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    const starPoints = isLandscape
      ? [
          { x: W * 0.15, y: H * 0.22, sym: '✦' },
          { x: W * 0.85, y: H * 0.26, sym: '✧' },
          { x: W * 0.18, y: H * 0.72, sym: '✳' },
          { x: W * 0.82, y: H * 0.76, sym: '✦' },
        ]
      : [
          { x: W * 0.16, y: H * 0.18, sym: '✦' },
          { x: W * 0.84, y: H * 0.22, sym: '✧' },
          { x: W * 0.18, y: H * 0.70, sym: '✳' },
          { x: W * 0.82, y: H * 0.74, sym: '✦' },
        ];

    starPoints.forEach((sp, idx) => {
      const pulseK = 0.6 + 0.4 * Math.sin(t * 3.5 + idx * 1.6);
      c.fillStyle = idx % 2 === 0 ? `rgba(201,79,0,${pulseK * 0.85})` : `rgba(26,18,9,${pulseK * 0.45})`;
      c.save();
      c.translate(sp.x, sp.y);
      c.rotate(t * 0.8 + idx);
      c.scale(pulseK, pulseK);
      c.fillText(sp.sym, 0, 0);
      c.restore();
    });
    c.restore();
  }

  // 5. Spinning Vinyl Record in top corner
  if (activeGraphics.includes('vinyl')) {
    c.save();
    const vx = isLandscape ? W - 90 : W - 80;
    const vy = isLandscape ? 75 : 85;
    const vr = isLandscape ? 38 : 34;

    c.translate(vx, vy);
    c.rotate(t * 2.5); // Spin speed

    // Outer vinyl ring
    c.beginPath();
    c.arc(0, 0, vr, 0, Math.PI * 2);
    c.fillStyle = C.ink;
    c.fill();

    // Grooves
    c.strokeStyle = 'rgba(232,220,200,0.25)';
    c.lineWidth = 1;
    [0.85, 0.7, 0.55].forEach(k => {
      c.beginPath();
      c.arc(0, 0, vr * k, 0, Math.PI * 2);
      c.stroke();
    });

    // Center vinyl label
    c.beginPath();
    c.arc(0, 0, vr * 0.38, 0, Math.PI * 2);
    c.fillStyle = C.signal;
    c.fill();

    // Spindle hole
    c.beginPath();
    c.arc(0, 0, 3, 0, Math.PI * 2);
    c.fillStyle = C.paper;
    c.fill();

    c.restore();
  }

  // 6. Luxury "NOW PLAYING" Floating Card
  if (activeGraphics.includes('nowPlaying')) {
    c.save();
    const cardX = isLandscape ? 60 : 54;
    const cardY = isLandscape ? 55 : 65;
    const cardW = isLandscape ? 280 : 250;
    const cardH = 46;

    // Card background
    c.fillStyle = 'rgba(237,228,204,0.85)';
    c.strokeStyle = 'rgba(26,18,9,0.18)';
    c.lineWidth = 1.2;
    c.beginPath();
    const r = 12;
    c.moveTo(cardX + r, cardY);
    c.lineTo(cardX + cardW - r, cardY);
    c.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
    c.lineTo(cardX + cardW, cardY + cardH - r);
    c.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
    c.lineTo(cardX + r, cardY + cardH);
    c.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
    c.lineTo(cardX, cardY + r);
    c.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
    c.closePath();
    c.fill();
    c.stroke();

    // Pulsing dot
    const dotPulse = Math.sin(t * 6) * 0.4 + 0.6;
    c.fillStyle = `rgba(201,79,0,${dotPulse})`;
    c.beginPath();
    c.arc(cardX + 18, cardY + cardH * 0.5, 4, 0, Math.PI * 2);
    c.fill();

    // Text inside card
    c.font = '700 12px "IBM Plex Mono", monospace';
    c.fillStyle = C.signal;
    c.fillText('NOW PLAYING', cardX + 30, cardY + 20);

    c.font = '500 13px "Archivo", sans-serif';
    c.fillStyle = C.ink;
    const shortTitle = songTitle.length > 18 ? songTitle.slice(0, 18) + '...' : songTitle;
    c.fillText(shortTitle, cardX + 30, cardY + 36);

    c.restore();
  }
};
