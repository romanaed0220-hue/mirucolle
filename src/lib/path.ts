import type { Point } from '../data/storage';

/** 点列をなめらかな SVG パスに（中点を通る二次ベジェ） */
export function toSvgPath(pts: Point[], sx: number, sy: number, closed: boolean): string {
  if (pts.length === 0) return '';
  const p = pts.map(([x, y]) => [x * sx, y * sy] as const);
  if (p.length < 3) return `M${p.map((q) => q.join(',')).join(' L')}`;
  const mid = (a: readonly number[], b: readonly number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const n = p.length;
  let d: string;
  if (closed) {
    const start = mid(p[n - 1], p[0]);
    d = `M${start[0]},${start[1]}`;
    for (let i = 0; i < n; i++) {
      const m = mid(p[i], p[(i + 1) % n]);
      d += ` Q${p[i][0]},${p[i][1]} ${m[0]},${m[1]}`;
    }
    return d + ' Z';
  }
  d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 1; i < n - 1; i++) {
    const m = mid(p[i], p[i + 1]);
    d += ` Q${p[i][0]},${p[i][1]} ${m[0]},${m[1]}`;
  }
  return d + ` L${p[n - 1][0]},${p[n - 1][1]}`;
}

/** Canvas に同じなめらかさで描く。begin=false なら現在のパスに足す（穴あき塗りなど） */
export function tracePath(ctx: CanvasRenderingContext2D, pts: Point[], sx: number, sy: number, closed: boolean, begin = true) {
  if (begin) ctx.beginPath();
  if (pts.length === 0) return;
  const p = pts.map(([x, y]) => [x * sx, y * sy] as const);
  if (p.length < 3) {
    ctx.moveTo(p[0][0], p[0][1]);
    for (const q of p.slice(1)) ctx.lineTo(q[0], q[1]);
    if (p.length === 1) ctx.lineTo(p[0][0] + 0.1, p[0][1]);
    return;
  }
  const mid = (a: readonly number[], b: readonly number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const n = p.length;
  if (closed) {
    const s = mid(p[n - 1], p[0]);
    ctx.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) {
      const m = mid(p[i], p[(i + 1) % n]);
      ctx.quadraticCurveTo(p[i][0], p[i][1], m[0], m[1]);
    }
    ctx.closePath();
    return;
  }
  ctx.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < n - 1; i++) {
    const m = mid(p[i], p[i + 1]);
    ctx.quadraticCurveTo(p[i][0], p[i][1], m[0], m[1]);
  }
  ctx.lineTo(p[n - 1][0], p[n - 1][1]);
}

export function bounds(pts: Point[]) {
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

export const round4 = (v: number) => Math.round(v * 10000) / 10000;

export const newId = () =>
  (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
