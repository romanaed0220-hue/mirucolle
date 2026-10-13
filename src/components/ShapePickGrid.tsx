// 形を選ぶグリッド（コレクションをつくる・瓶に形を入れる で共用）
import { Check } from 'lucide-preact';
import type { Shape } from '../data/storage';
import { ShapeSticker } from './ShapeSticker';

export function ShapePickGrid({ shapes, picked, onToggle }: { shapes: Shape[]; picked: string[]; onToggle: (id: string) => void }) {
  return (
    <div class="pick-grid">
      {shapes.map((s) => {
        const on = picked.includes(s.id);
        return (
          <button class={`pick${on ? ' on' : ''}`} aria-pressed={on} onClick={() => onToggle(s.id)}>
            <ShapeSticker shape={s} maxSide={84} uid={`p-${s.id}`} />
            <span class="pick-name">{s.name}</span>
            {on && <span class="pick-check"><Check size={14} strokeWidth={3} /></span>}
          </button>
        );
      })}
    </div>
  );
}
