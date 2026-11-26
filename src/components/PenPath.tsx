// ペンの線（SVG）。lib/pen.ts の層をそのまま重ねる。太さは画面上の px（non-scaling-stroke）
import { penLayers, type PenStyle } from '../lib/pen';

export function PenPath({ d, pen, base, halo }: { d: string; pen?: PenStyle; base: number; halo: number }) {
  return (
    <>
      {penLayers(pen, base, halo).map((l) => (
        <path d={d} fill="none" stroke={l.color} stroke-width={l.width} stroke-opacity={l.opacity}
          stroke-dasharray={l.dash?.join(' ')} stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
      ))}
    </>
  );
}
