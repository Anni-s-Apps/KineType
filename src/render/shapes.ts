export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  headLength = 20,
  headAngle = Math.PI / 6
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  
  // Draw line
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Draw arrow head
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - headAngle),
    toY - headLength * Math.sin(angle - headAngle)
  );
  ctx.lineTo(
    toX - headLength * Math.cos(angle + headAngle),
    toY - headLength * Math.sin(angle + headAngle)
  );
  ctx.closePath();
  ctx.fill();
}

export function drawCheckmark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  progress = 1
) {
  const p1 = { x: cx - size * 0.35, y: cy };
  const p2 = { x: cx - size * 0.05, y: cy + size * 0.3 };
  const p3 = { x: cx + size * 0.4, y: cy - size * 0.35 };

  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);

  if (progress <= 0.5) {
    const t = progress / 0.5;
    ctx.lineTo(p1.x + (p2.x - p1.x) * t, p1.y + (p2.y - p1.y) * t);
  } else {
    ctx.lineTo(p2.x, p2.y);
    const t = (progress - 0.5) / 0.5;
    ctx.lineTo(p2.x + (p3.x - p2.x) * t, p2.y + (p3.y - p2.y) * t);
  }
  ctx.stroke();
}

export function drawCross(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  const half = size * 0.35;
  ctx.beginPath();
  ctx.moveTo(cx - half, cy - half);
  ctx.lineTo(cx + half, cy + half);
  ctx.moveTo(cx + half, cy - half);
  ctx.lineTo(cx - half, cy + half);
  ctx.stroke();
}

export function drawCodeCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  code: string,
  title = 'script.ts',
  lang = 'typescript'
) {
  // Background
  ctx.fillStyle = '#0f172a';
  drawRoundedRect(ctx, x, y, w, h, 16);
  ctx.fill();

  // Border
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#334155';
  ctx.stroke();

  // Top header bar
  ctx.fillStyle = '#1e293b';
  drawRoundedRect(ctx, x, y, w, 40, 16);
  ctx.fill();
  ctx.fillRect(x, y + 24, w, 16); // square bottom of header

  // Window dots (red, yellow, green)
  const dotY = y + 20;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(x + 20, dotY, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#eab308';
  ctx.beginPath(); ctx.arc(x + 38, dotY, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#22c55e';
  ctx.beginPath(); ctx.arc(x + 56, dotY, 6, 0, Math.PI * 2); ctx.fill();

  // Title
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 14px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, x + w / 2, y + 25);

  // Code lines
  const lines = code.split('\n');
  const startY = y + 70;
  const lineHeight = 24;
  ctx.textAlign = 'left';

  lines.forEach((line, i) => {
    if (startY + i * lineHeight > y + h - 15) return;
    
    // Line number
    ctx.fillStyle = '#475569';
    ctx.font = '400 13px "JetBrains Mono", monospace';
    ctx.fillText(String(i + 1).padStart(2, ' '), x + 20, startY + i * lineHeight);

    // Code text
    ctx.fillStyle = line.includes('const') || line.includes('function') || line.includes('import') 
      ? '#38bdf8' 
      : line.includes('"') || line.includes("'") 
      ? '#4ade80' 
      : line.includes('//')
      ? '#64748b'
      : '#f8fafc';
    ctx.fillText(line, x + 55, startY + i * lineHeight);
  });
}
