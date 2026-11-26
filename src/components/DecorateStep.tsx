// かざる：写真にシールを貼り、投稿したときのカードの縁どりを選ぶ（どちらもしなくてよい）
import { useState } from 'preact/hooks';
import { Minus, Plus, RotateCw, Trash2 } from 'lucide-preact';
import { SHOP_ITEMS, DEFAULT_NAMES } from '../config/shop';
import { stickerById } from '../config/stickers';
import type { PlacedSticker, Point } from '../data/storage';
import { useAppState } from '../data/store';
import { toSvgPath } from '../lib/path';
import type { PenStyle } from '../lib/pen';
import { useFit } from '../lib/useFit';
import { CardSample } from './CardFrame';
import { PenPath } from './PenPath';
import { StickerArt } from './StickerArt';
import { StickerLayer } from './StickerLayer';

type Props = {
  photoURL: string;
  aspect: number;
  outline: Point[];
  details: Point[][];
  outlinePen?: PenStyle;
  detailPens?: PenStyle[];
  stickers: PlacedSticker[];
  onStickers: (s: PlacedSticker[]) => void;
  card: string;
  onCard: (id: string) => void;
};

const MIN_S = 0.12, MAX_S = 0.6;

export function DecorateStep(p: Props) {
  const { stickers: mine, owned } = useAppState();
  const [ref, size] = useFit<HTMLDivElement>(p.aspect, 8);
  const [sel, setSel] = useState<number | null>(null);
  const [tab, setTab] = useState<'sticker' | 'card'>('sticker');
  const cards = ['', ...SHOP_ITEMS.filter((i) => i.category === 'card' && owned.includes(i.id)).map((i) => i.id)];

  const add = (id: string) => {
    const r = Math.round(Math.random() * 24 - 12);
    const off = (p.stickers.length % 4) * 0.06; // 重ならないよう少しずつずらす
    p.onStickers([...p.stickers, { id, x: 0.5 + off, y: 0.5 + off, s: 0.28, r }]);
    setSel(p.stickers.length);
  };
  const patch = (i: number, next: PlacedSticker) => p.onStickers(p.stickers.map((s, j) => (j === i ? next : s)));
  const cur = sel !== null ? p.stickers[sel] : null;

  return (
    <>
      <div class="decorate-stage" ref={ref}>
        <div class="decorate-photo" style={{ width: `${size.w}px`, height: `${size.h}px` }}>
          <img src={p.photoURL} alt="" draggable={false} />
          <svg viewBox={`0 0 ${p.aspect} 1`} preserveAspectRatio="none" aria-hidden="true">
            <PenPath d={toSvgPath(p.outline, p.aspect, 1, true)} pen={p.outlinePen} base={3} halo={4} />
            {p.details.map((d, i) => <PenPath d={toSvgPath(d, p.aspect, 1, false)} pen={p.detailPens?.[i]} base={5} halo={4} />)}
          </svg>
          <StickerLayer items={p.stickers} editable selected={sel} onSelect={setSel} onChange={patch} />
        </div>
      </div>

      {cur && sel !== null ? (
        <div class="deco-tools" role="toolbar" aria-label="選んだシール">
          <span class="small deco-tools-name">{stickerById(cur.id)?.name}</span>
          <button class="icon-btn" aria-label="ちいさく" onClick={() => patch(sel, { ...cur, s: Math.round(Math.max(MIN_S, cur.s * 0.85) * 1000) / 1000 })}><Minus size={18} strokeWidth={2.6} /></button>
          <button class="icon-btn" aria-label="おおきく" onClick={() => patch(sel, { ...cur, s: Math.round(Math.min(MAX_S, cur.s * 1.18) * 1000) / 1000 })}><Plus size={18} strokeWidth={2.6} /></button>
          <button class="icon-btn" aria-label="まわす" onClick={() => patch(sel, { ...cur, r: (cur.r + 15) % 360 })}><RotateCw size={18} strokeWidth={2.6} /></button>
          <button class="icon-btn" aria-label="はがす" onClick={() => { p.onStickers(p.stickers.filter((_, j) => j !== sel)); setSel(null); }}><Trash2 size={18} strokeWidth={2.4} /></button>
          <button class="btn deco-done" onClick={() => setSel(null)}>OK</button>
        </div>
      ) : (
        <div class="deco-panel">
          <div class="deco-tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'sticker'} class={tab === 'sticker' ? 'on' : ''} onClick={() => setTab('sticker')}>シール</button>
            <button role="tab" aria-selected={tab === 'card'} class={tab === 'card' ? 'on' : ''} onClick={() => setTab('card')}>カード</button>
          </div>
          {tab === 'sticker' ? (
            mine.length ? (
              <div class="deco-tray">
                {mine.map((id) => (
                  <button class="deco-item" aria-label={`${stickerById(id)?.name}を貼る`} onClick={() => add(id)}><StickerArt id={id} /></button>
                ))}
              </div>
            ) : (
              <p class="small muted deco-empty">シールはまだありません。お題に参加したり、マイページの交換所で交換したりすると使えます。</p>
            )
          ) : (
            <div class="deco-tray">
              {cards.map((id) => (
                <button class={`deco-card${p.card === id ? ' on' : ''}`} aria-pressed={p.card === id} onClick={() => p.onCard(id)}>
                  <CardSample id={id || undefined} />
                  <span>{id ? SHOP_ITEMS.find((i) => i.id === id)?.name : DEFAULT_NAMES.card}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
