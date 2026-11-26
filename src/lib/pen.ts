/*
 * ペン（なぞる・描き足す線の見た目）。1 本ごとに、描いたときのペンを覚えておく。
 * 色と太さは最初から使える。質感（ネオン など）は交換所で交換すると、描く画面に出てくる（仕様 5.2）。
 * 同じ定義を Canvas（描く画面・共有画像）と SVG（詳細・つながり）の両方で使い、見た目をそろえる。
 */
export type PenWidth = 'S' | 'M' | 'L';
export type PenStyle = { c: string; w: PenWidth; k?: string };

export const PEN_COLORS: { id: string; name: string; hex: string }[] = [
  { id: 'ink', name: 'くろ', hex: '#1A1A1A' },
  { id: 'white', name: 'しろ', hex: '#FFFFFF' },
  { id: 'pink', name: 'ピンク', hex: '#FF8FB1' },
  { id: 'yellow', name: 'きいろ', hex: '#FFD23F' },
  { id: 'teal', name: 'みどり', hex: '#3DCCC7' },
  { id: 'blue', name: 'あお', hex: '#3A6FF7' },
];

export const PEN_WIDTHS: { id: PenWidth; name: string; scale: number }[] = [
  { id: 'S', name: 'ほそい', scale: 0.6 },
  { id: 'M', name: 'ふつう', scale: 1 },
  { id: 'L', name: 'ふとい', scale: 1.8 },
];

/** 質感（交換所の「ペン」。config/shop.ts と同じ id） */
export const PEN_KINDS: { id: string; name: string }[] = [
  { id: 'neon', name: 'ネオン' },
  { id: 'tenten', name: 'てんてん' },
  { id: 'kurobuchi', name: 'くろぶち' },
];

export const DEFAULT_PEN: PenStyle = { c: 'ink', w: 'M' };

/** 1 本の線を重ねて描くための層（下から順に） */
export type PenLayer = { color: string; width: number; opacity: number; dash?: number[] };

/**
 * @param base  ふつうの太さ（px）
 * @param halo  写真の上で見えるように下に敷くふちの太さ（px、両側の合計）。0 ならふちなし
 */
export function penLayers(style: PenStyle | undefined, base: number, halo: number): PenLayer[] {
  const s = style ?? DEFAULT_PEN;
  const hex = PEN_COLORS.find((c) => c.id === s.c)?.hex ?? PEN_COLORS[0].hex;
  const w = base * (PEN_WIDTHS.find((x) => x.id === s.w)?.scale ?? 1);
  const edge = s.c === 'white' ? '#1A1A1A' : '#FFFFFF';
  const layers: PenLayer[] = [];
  switch (s.k) {
    case 'neon':
      layers.push({ color: hex, width: w + Math.max(halo, 4) * 2.4, opacity: 0.32 });
      layers.push({ color: hex, width: w, opacity: 1 });
      layers.push({ color: '#FFFFFF', width: Math.max(1, w * 0.4), opacity: 0.9 });
      break;
    case 'tenten': {
      // 丸い点が並ぶ線（線端が round なので、長さほぼ 0 の破線が点になる）
      const dot = w * 1.5;
      const dash = [0.01, dot * 1.8];
      if (halo) layers.push({ color: edge, width: dot + halo, opacity: 1, dash });
      layers.push({ color: hex, width: dot, opacity: 1, dash });
      break;
    }
    case 'kurobuchi':
      layers.push({ color: '#1A1A1A', width: w + Math.max(halo, 3) * 1.3, opacity: 1 });
      layers.push({ color: hex, width: w, opacity: 1 });
      break;
    default:
      if (halo) layers.push({ color: edge, width: w + halo, opacity: 1 });
      layers.push({ color: hex, width: w, opacity: 1 });
  }
  return layers;
}

/** いまのパスを、ペンの層で描く（Canvas） */
export function strokeWithPen(ctx: CanvasRenderingContext2D, style: PenStyle | undefined, base: number, halo: number) {
  for (const l of penLayers(style, base, halo)) {
    ctx.globalAlpha = l.opacity;
    ctx.strokeStyle = l.color;
    ctx.lineWidth = l.width;
    ctx.setLineDash(l.dash ?? []);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
}
