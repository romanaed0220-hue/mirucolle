// 棚に並ぶ小さな瓶。locked は未解放の剪影、empty は「つくる」用の空き。
import type { BottleStyle } from '../config/bottles';

const BODY = 'M15,12 h10 c8,4 12,10 12,20 v18 a6,6 0 0 1 -6,6 h-22 a6,6 0 0 1 -6,-6 v-18 c0,-10 4,-16 12,-20 z';
const NECK = 'M15,4 h10 v8 h-10 z';

export function BottleIcon({ style, locked, empty }: { style?: BottleStyle; locked?: boolean; empty?: boolean }) {
  if (locked || empty || !style) {
    return (
      <svg class="bottle" viewBox="0 0 40 58" aria-hidden="true">
        <path d={`${NECK} ${BODY}`} fill={locked ? 'var(--line)' : 'none'} opacity={locked ? 0.12 : 1}
          stroke={locked ? 'none' : 'var(--muted)'} stroke-width="2" stroke-dasharray={empty ? '4 3' : undefined} />
      </svg>
    );
  }
  return (
    <svg class="bottle" viewBox="0 0 40 58" aria-hidden="true">
      <g>
        <path d={BODY} fill={style.glass} stroke="var(--line)" stroke-width="2" />
        <path d={NECK} fill={style.cap} stroke="var(--line)" stroke-width="2" />
        <path d="M9,28 v16" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8" />
      </g>
    </svg>
  );
}
