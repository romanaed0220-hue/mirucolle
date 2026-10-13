// 棚に並ぶ小さな瓶。瓶の絵は BottleView と同じ Blender の画像を縮小して使う。
// locked は未解放の剪影、empty は「つくる」用の点線の空き。
import type { BottleStyle } from '../config/bottles';
import JAR from '../config/jar.json';

const [VW, VH] = JAR.viewBox as [number, number];
const OUTLINE = JAR.silhouette.map((p) => p.join(',')).join(' ');
const IMG = (name: string) => `${import.meta.env.BASE_URL}jars/${name}.webp`;

export function BottleIcon({ style, locked, empty }: { style?: BottleStyle; locked?: boolean; empty?: boolean }) {
  if (locked || empty || !style) {
    return (
      <svg class="bottle" viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true">
        <polygon points={OUTLINE} fill={locked ? 'var(--line)' : 'none'} opacity={locked ? 0.12 : 1}
          stroke={locked ? 'none' : 'var(--muted)'} stroke-width="14" stroke-dasharray={empty ? '28 20' : undefined}
          stroke-linejoin="round" />
      </svg>
    );
  }
  return (
    <span class="bottle bottle-pic" aria-hidden="true">
      <img src={IMG(`jar-${style.id}-back`)} alt="" />
      <img src={IMG(`jar-${style.id}-front`)} alt="" />
      <img src={IMG('jar-lines')} alt="" />
    </span>
  );
}
