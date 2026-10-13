// コレクションをつくる：形を選ぶ → テーマと瓶を決めて発表する。
import { useState } from 'preact/hooks';
import { Lock, X } from 'lucide-preact';
import { BOTTLE_MAX_SHAPES, BOTTLES, unlockedBottles } from '../config/bottles';
import type { Collection, Shape } from '../data/storage';
import { newId } from '../lib/path';
import { BottleIcon } from './BottleIcon';
import { ShapePickGrid } from './ShapePickGrid';

const THEME_MAX = 24;

type Props = {
  shapes: Shape[];
  publishedCount: number;
  onCreate: (c: Collection) => void;
  onClose: () => void;
};

export function CollectionCreate({ shapes, publishedCount, onCreate, onClose }: Props) {
  const [step, setStep] = useState<'pick' | 'theme'>('pick');
  const [picked, setPicked] = useState<string[]>([]);
  const [theme, setTheme] = useState('');
  const unlocked = unlockedBottles(publishedCount);
  const [bottleId, setBottleId] = useState(unlocked[unlocked.length - 1].id); // いちばん新しく解けた瓶を選んでおく

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= BOTTLE_MAX_SHAPES ? p : [...p, id]));

  const close = () => {
    if (picked.length && !confirm('つくりかけのコレクションは保存されません。やめますか？')) return;
    onClose();
  };

  const publish = () => {
    if (!theme.trim()) return;
    onCreate({ id: newId(), createdAt: new Date().toISOString(), theme: theme.trim(), shapeIds: picked, bottleId });
  };

  return (
    <div class="flow">
      <header class="flow-head">
        <button class="icon-btn" aria-label="やめる" onClick={close}><X size={20} strokeWidth={2.4} /></button>
        <ol class="flow-steps" aria-label="ステップ">
          <li class={step === 'pick' ? 'on' : 'done'}>形を選ぶ</li>
          <li class={step === 'theme' ? 'on' : ''}>テーマと瓶</li>
        </ol>
      </header>

      {step === 'pick' ? (
        <>
          <p class="flow-hint small">瓶に入れたい形を選んでください。</p>
          <ShapePickGrid shapes={shapes} picked={picked} onToggle={toggle} />
          <footer class="flow-foot">
            <button class="btn primary" onClick={() => setStep('theme')} disabled={picked.length === 0}>次へ</button>
          </footer>
        </>
      ) : (
        <>
          <p class="flow-hint small">テーマをつけて、入れる瓶を選びましょう。</p>
          <div class="theme-step">
            <input
              class="name-input"
              type="text"
              enterKeyHint="done"
              maxLength={THEME_MAX}
              placeholder="テーマ（例：雨の日に見つけた顔）"
              value={theme}
              onInput={(e) => setTheme((e.currentTarget as HTMLInputElement).value)}
            />
            <div class="bottle-pick" role="radiogroup" aria-label="瓶">
              {BOTTLES.map((b) => {
                const isOpen = unlocked.some((u) => u.id === b.id);
                return (
                  <button role="radio" aria-checked={bottleId === b.id} class={`bottle-choice${bottleId === b.id ? ' on' : ''}`}
                    disabled={!isOpen} onClick={() => setBottleId(b.id)} aria-label={isOpen ? b.name : 'まだ解けていない瓶'}>
                    <BottleIcon style={b} locked={!isOpen} />
                    <span class="small">{isOpen ? b.name : <Lock size={12} strokeWidth={2.6} />}</span>
                  </button>
                );
              })}
            </div>
            <p class="small muted">コレクションを発表するたびに、新しい瓶がひとつ解けます。</p>
          </div>
          <footer class="flow-foot">
            <button class="btn" onClick={() => setStep('pick')}>戻る</button>
            <button class="btn primary" onClick={publish} disabled={!theme.trim()}>発表する</button>
          </footer>
        </>
      )}
    </div>
  );
}
