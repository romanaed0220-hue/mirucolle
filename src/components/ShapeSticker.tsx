// なぞった輪郭で写真を切り抜いた「形」。背景も枠もなく、黒の輪郭線と色のずらし影だけ。
import type { Shape } from '../data/storage';
import { usePhotoURL } from '../data/photos';
import { bounds, toSvgPath } from '../lib/path';

const SHADOWS = ['var(--deco-1)', 'var(--deco-2)', 'var(--deco-3)', 'var(--deco-4)', 'var(--deco-5)'];

export function hashOf(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 形の外接矩形（写真座標：幅 = aspect、高さ = 1）と余白 */
export function stickerBox(shape: Shape) {
  const b = bounds(shape.outline);
  const w = b.w * shape.aspect, h = b.h;
  const pad = Math.max(w, h) * 0.08;
  return { x: b.minX * shape.aspect - pad, y: b.minY - pad, w: w + pad * 2, h: h + pad * 2, unit: Math.max(w, h) };
}

export function ShapeSticker({ shape, maxSide, uid }: { shape: Shape; maxSide: number; uid: string }) {
  const url = usePhotoURL(shape.photoId);
  const box = stickerBox(shape);
  const outline = toSvgPath(shape.outline, shape.aspect, 1, true);
  const clipId = `clip-${uid}`;
  const shadow = SHADOWS[hashOf(shape.id) % SHADOWS.length];
  const scale = maxSide / Math.max(box.w, box.h);
  const off = box.unit * 0.045;

  return (
    <svg
      class="sticker"
      width={`${Math.round(box.w * scale)}px`}
      height={`${Math.round(box.h * scale)}px`}
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      role="img"
      aria-label={shape.name}
    >
      <defs>
        <clipPath id={clipId}><path d={outline} /></clipPath>
      </defs>
      <path d={outline} fill={shadow} transform={`translate(${off} ${off * 1.2})`} stroke="var(--line)" stroke-width="2.5" vector-effect="non-scaling-stroke" />
      <g clip-path={`url(#${clipId})`}>
        <rect x="0" y="0" width={shape.aspect} height="1" fill="var(--surface)" />
        {url && <image href={url} x="0" y="0" width={shape.aspect} height="1" preserveAspectRatio="none" />}
      </g>
      <path d={outline} fill="none" stroke="var(--c-ink)" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
      {shape.details.map((d) => (
        <path d={toSvgPath(d, shape.aspect, 1, false)} fill="none" stroke="var(--c-ink)" stroke-width="3.4"
          stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
