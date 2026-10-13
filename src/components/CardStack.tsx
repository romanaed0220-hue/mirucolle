/*
 * 重なったカード。いちばん上を指で左右に払うと飛んでいき、下のカードが出てくる。
 * 左右どちらに払っても「次へ」だけ（好き／きらいの意味はつけない）。
 */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

type Props<T> = {
  items: T[];
  index: number;
  keyOf: (item: T) => string;
  render: (item: T, next: () => void) => ComponentChildren;
  onIndex: (i: number) => void;
  end: ComponentChildren;
};

const FLY_MS = 260;
const DEPTH = 3; // 見えている枚数

export function CardStack<T>({ items, index, keyOf, render, onIndex, end }: Props<T>) {
  const topRef = useRef<HTMLDivElement>(null);
  const flying = useRef(false);
  const indexRef = useRef(index);
  indexRef.current = index;

  const flyOut = (dir: 1 | -1) => {
    const el = topRef.current;
    if (!el || flying.current) return;
    flying.current = true;
    el.style.transition = `transform ${FLY_MS}ms ease-in`;
    el.style.transform = `translate(${dir * 130}%, 40px) rotate(${dir * 18}deg)`;
    window.setTimeout(() => {
      flying.current = false;
      onIndex(indexRef.current + 1);
    }, FLY_MS);
  };

  // 指で払う
  useEffect(() => {
    const el = topRef.current;
    if (!el) return;
    let start: { x: number; y: number; t: number; id: number } | null = null;
    let dragging = false;
    let dx = 0;
    let suppressClick = false;

    const down = (e: PointerEvent) => {
      if (flying.current || start) return;
      start = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
      dragging = false;
      dx = 0;
    };
    const move = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (!dragging) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
        dragging = true;
        try { el.setPointerCapture(e.pointerId); } catch { /* 合成イベントでは失敗する */ }
        el.style.transition = 'none';
      }
      e.preventDefault();
      el.style.transform = `translate(${dx}px, ${dy * 0.15}px) rotate(${dx / 18}deg)`;
    };
    const up = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const dt = performance.now() - start.t;
      start = null;
      if (!dragging) return;
      dragging = false;
      suppressClick = true;
      const fast = Math.abs(dx) / Math.max(dt, 1) > 0.6;
      if (Math.abs(dx) > el.offsetWidth * 0.28 || (fast && Math.abs(dx) > 60)) {
        flyOut(dx > 0 ? 1 : -1);
      } else {
        el.style.transition = 'transform .2s ease-out';
        el.style.transform = '';
      }
    };
    // 払った直後の指離しで、カード内のボタンが押されないように
    const click = (e: MouseEvent) => {
      if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; }
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', click, true);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('click', click, true);
    };
  }, [index]);

  const visible = items.slice(index, index + DEPTH);
  return (
    <div class="stack">
      {index >= items.length - 1 && <div class="stack-card stack-end" data-depth={Math.max(0, items.length - index)}>{end}</div>}
      {visible
        .map((item, d) => (
          <div
            key={keyOf(item)}
            ref={d === 0 ? topRef : undefined}
            class="stack-card"
            data-depth={d}
            aria-hidden={d !== 0}
            inert={d !== 0}
          >
            {render(item, () => flyOut(1))}
          </div>
        ))
        .reverse()}
    </div>
  );
}
