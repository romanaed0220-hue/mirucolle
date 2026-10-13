import { useState } from 'preact/hooks';
import { Plus } from 'lucide-preact';
import { BottleIcon } from '../components/BottleIcon';
import { BottleView } from '../components/BottleView';
import { CollectionCreate } from '../components/CollectionCreate';
import { BOTTLES, bottleById, unlockedBottles } from '../config/bottles';
import { Dots, HalfCircle, Ring, Squiggle } from '../components/Deco';
import { Portal } from '../components/Portal';
import { ShapeDetail } from '../components/ShapeDetail';
import { hashOf, ShapeSticker } from '../components/ShapeSticker';
import { addCollection, deleteCollection, takeLastAddedId, updateCollection, useAppState } from '../data/store';
import type { Shape } from '../data/storage';
import { requestOrientationPermission } from '../lib/orientation';
import { href } from '../router';

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
  const { shapes, collections, publishCount } = useAppState();
  const [creating, setCreating] = useState(false);
  const [bottleOpenId, setBottleOpenId] = useState<string | null>(null);
  const bottleOpen = collections.find((c) => c.id === bottleOpenId) ?? null;
  const lockedCount = BOTTLES.length - unlockedBottles(publishCount).length;
  const [openId, setOpenId] = useState<string | null>(null);
  const open = shapes.find((s) => s.id === openId) ?? null;
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
                onClick={() => setOpenId(s.id)}
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
          {collections.map((c) => (
            <button class="shelf-bottle" onClick={() => { requestOrientationPermission(); setBottleOpenId(c.id); }} aria-label={`コレクション「${c.theme}」をひらく`}>
              <BottleIcon style={bottleById(c.bottleId)} />
              <span class="shelf-label">{c.theme}</span>
            </button>
          ))}
          <button class="shelf-bottle make" onClick={() => setCreating(true)} disabled={shapes.length === 0}
            aria-label="コレクションをつくる">
            <span class="shelf-plus"><BottleIcon empty /><Plus size={18} strokeWidth={3} /></span>
            <span class="shelf-label">つくる</span>
          </button>
          {Array.from({ length: lockedCount }, () => (
            <span class="shelf-bottle" aria-hidden="true"><BottleIcon locked /><span class="shelf-label">&nbsp;</span></span>
          ))}
        </div>
        {shapes.length === 0 && <p class="small muted shelf-note">形を記録すると、コレクションをつくれます。</p>}
      </div>

      {open && <Portal><ShapeDetail shape={open} onClose={() => setOpenId(null)} /></Portal>}
      {creating && (
        <Portal>
          <CollectionCreate
            shapes={shapes}
            publishedCount={publishCount}
            onClose={() => setCreating(false)}
            onCreate={(c) => {
              requestOrientationPermission(); // 「発表する」のタップの中で傾きの許可を取る
              addCollection(c);
              setCreating(false);
              setBottleOpenId(c.id);
            }}
          />
        </Portal>
      )}
      {bottleOpen && (
        <Portal>
          <BottleView
            collection={bottleOpen}
            shapes={bottleOpen.shapeIds.map((id) => shapes.find((s) => s.id === id)).filter((s): s is Shape => !!s)}
            allShapes={shapes}
            onSave={(patch) => updateCollection(bottleOpen.id, patch)}
            onDelete={() => { deleteCollection(bottleOpen.id); setBottleOpenId(null); }}
            onClose={() => setBottleOpenId(null)}
          />
        </Portal>
      )}
    </div>
  );
}
