// 写真の上のシール。表示だけのときと、かざる画面で動かせるときの両方で使う
import { useRef } from 'preact/hooks';
import type { PlacedSticker } from '../data/storage';
import { round4 } from '../lib/path';
import { StickerArt } from './StickerArt';

type Props = {
  items?: PlacedSticker[];
  editable?: boolean;
  selected?: number | null;
  onSelect?: (i: number | null) => void;
  onChange?: (i: number, next: PlacedSticker) => void;
};

const clamp = (v: number) => round4(Math.min(1, Math.max(0, v)));

export function StickerLayer({ items, editable, selected, onSelect, onChange }: Props) {
  const layerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ i: number; id: number; dx: number; dy: number } | null>(null);
  if (!items?.length && !editable) return null;

  const down = (i: number) => (e: PointerEvent) => {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    const r = layerRef.current!.getBoundingClientRect();
    const it = items![i];
    drag.current = { i, id: e.pointerId, dx: it.x - (e.clientX - r.left) / r.width, dy: it.y - (e.clientY - r.top) / r.height };
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch { /* 合成イベント */ }
    onSelect?.(i);
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    e.preventDefault();
    const r = layerRef.current!.getBoundingClientRect();
    const it = items![d.i];
    onChange?.(d.i, { ...it, x: clamp((e.clientX - r.left) / r.width + d.dx), y: clamp((e.clientY - r.top) / r.height + d.dy) });
  };
  const up = (e: PointerEvent) => {
    if (drag.current?.id === e.pointerId) drag.current = null;
  };

  return (
    <div ref={layerRef} class={`sticker-layer${editable ? ' editable' : ''}`}
      onPointerDown={editable ? () => onSelect?.(null) : undefined}>
      {(items ?? []).map((s, i) => (
        <div class={`placed${selected === i ? ' sel' : ''}`}
          style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.s * 100}%`, transform: `translate(-50%, -50%) rotate(${s.r}deg)` }}
          onPointerDown={down(i)} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <StickerArt id={s.id} />
        </div>
      ))}
    </div>
  );
}
