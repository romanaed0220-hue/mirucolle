import { useState } from 'preact/hooks';
import { Dots, HalfCircle, Ring, Squiggle } from '../components/Deco';
import { ShapeDetail } from '../components/ShapeDetail';
import { hashOf, ShapeSticker } from '../components/ShapeSticker';
import { takeLastAddedId, useAppState } from '../data/store';
import type { Shape } from '../data/storage';
import { href } from '../router';

const BOTTLE = 'M15,2 h10 v10 c8,4 12,10 12,20 v18 a6,6 0 0 1 -6,6 h-22 a6,6 0 0 1 -6,-6 v-18 c0,-10 4,-16 12,-20 z';

function Bottle({ locked }: { locked?: boolean }) {
  return (
    <svg class="bottle" viewBox="0 0 40 58" aria-hidden="true">
      <path d={BOTTLE} fill={locked ? 'none' : 'var(--c-teal)'} stroke={locked ? 'var(--muted)' : 'var(--line)'}
        stroke-width="2" stroke-dasharray={locked ? '4 3' : undefined} />
    </svg>
  );
}

// 形をばらばらに散らす配置（id から決まるので毎回同じ位置）
const ROW = 118;
function place(shape: Shape, i: number) {
  const h = hashOf(shape.id);
  const left = i % 2 === 0 ? 4 + (h % 14) : 46 + (h % 12); // %
  const top = 16 + i * ROW + ((h >> 4) % 30); // px
  const size = 118 + ((h >> 8) % 34);
  const r0 = ((h >> 12) % 12) - 6;
  return { left, top, size, r0, r1: r0 + (((h >> 16) % 2) ? 4 : -4), delay: ((h >> 20) % 10) / 10 };
}

export function CollectScreen() {
  const { shapes } = useAppState();
  const [open, setOpen] = useState<Shape | null>(null);
  const [newId] = useState(takeLastAddedId);

  return (
    <div class="screen fill">
      <Dots x="70%" y="10px" cols={5} rows={4} />
      <HalfCircle x="14px" y="150px" s={46} color={4} rot={-20} />
      <Ring x="80%" y="58%" s={40} color={2} />
      {shapes.length === 0 && <Squiggle x="12%" y="36%" w={80} color={1} rot={10} />}

      {shapes.length === 0 ? (
        <div class="screen-inner center">
          <div>
            <p class="head empty-title">まだ形がありません</p>
            <p class="small muted empty-text">
              ここには、あなたが描いた形だけが浮かびます。<br />
              <a href={href('record')}>記録</a>から最初のひとつを。
            </p>
          </div>
        </div>
      ) : (
        <div class="float-field" style={{ height: `${shapes.length * ROW + 120}px` }}>
          {shapes.map((s, i) => {
            const p = place(s, i);
            return (
              <button
                class={`floater${s.id === newId ? ' is-new' : ''}`}
                style={{ left: `${p.left}%`, top: `${p.top}px`, '--r0': `${p.r0}deg`, '--r1': `${p.r1}deg`, animationDelay: `-${p.delay}s` }}
                onClick={() => setOpen(s)}
                aria-label={`${s.name}をひらく`}
              >
                <ShapeSticker shape={s} maxSide={p.size} uid={`c-${s.id}`} />
              </button>
            );
          })}
        </div>
      )}

      <div class="shelf">
        <span class="chip shelf-cap">コレクション</span>
        <div class="shelf-row">
          <Bottle locked /><Bottle locked /><Bottle locked /><Bottle locked />
        </div>
      </div>

      {open && <ShapeDetail shape={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
