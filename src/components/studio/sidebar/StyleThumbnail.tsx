import React, { useRef, useEffect } from 'react';
import { renderMotionStyle } from '../styles';
import { C, TimedWord, TimedLine } from '../styles/types';

interface Props {
  id: string;
}

const DEMO_WORDS: TimedWord[] = [
  { word: 'BETTER', start: 0.1, end: 0.45 },
  { word: 'ON', start: 0.45, end: 0.8 },
  { word: 'MY', start: 0.8, end: 1.15 },
  { word: 'OWN', start: 1.15, end: 1.55 },
  { word: 'TONIGHT', start: 1.55, end: 1.95 },
  { word: 'RUNNING', start: 1.95, end: 2.35 },
  { word: 'FREE', start: 2.35, end: 2.75 },
];

const DEMO_LINE: TimedLine = {
  i: 0,
  text: 'BETTER ON MY OWN TONIGHT RUNNING FREE',
  start: 0.0,
  end: 2.8,
  words: DEMO_WORDS,
};

const roundRectHelper = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  if (typeof c.roundRect === 'function') {
    c.beginPath();
    c.roundRect(x, y, w, h, r);
  } else {
    c.beginPath();
    c.rect(x, y, w, h);
  }
};

export const StyleThumbnail: React.FC<Props> = ({ id }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina-sharp thumbnail frame
    const W_thumb = 220;
    const H_thumb = 135;
    canvas.width = W_thumb;
    canvas.height = H_thumb;

    // Virtual video space matching aspect ratio
    const virtualW = 600;
    const virtualH = 370;
    const scale = W_thumb / virtualW;

    const startTime = performance.now();
    const duration = 2.7;

    const render = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const t = elapsed % duration;

      const activeWord =
        DEMO_WORDS.find(w => t >= w.start && t < w.end) || DEMO_WORDS[0];

      // Clean background
      ctx.fillStyle = '#f8f4ec';
      ctx.fillRect(0, 0, W_thumb, H_thumb);

      // Translate to center kinetic zone just like main canvas!
      ctx.save();
      ctx.translate(W_thumb * 0.5, H_thumb * 0.46);
      ctx.scale(scale, scale);

      // Call the exact real motion style engine
      renderMotionStyle(id, {
        c: ctx,
        W: virtualW,
        H: virtualH,
        t,
        curLine: DEMO_LINE,
        activeWord,
        lines: [DEMO_LINE],
        words: DEMO_WORDS,
        fontSize: 68,
        uppercase: true,
        isLandscape: true,
        C,
        fmt: (s: string) => s.toUpperCase(),
        roundRect: roundRectHelper,
      });

      ctx.restore();

      // Soft paper frame border
      ctx.strokeStyle = 'rgba(28,21,13,0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, W_thumb, H_thumb);

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [id]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block pointer-events-none"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
};
