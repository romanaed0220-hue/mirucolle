// 交換所ともちもので共用する部品
import { CATEGORIES, type ShopCategory } from '../config/shop';
import { PenPath } from './PenPath';

export function CategoryTabs({ value, onChange, cats = CATEGORIES }: { value: ShopCategory; onChange: (c: ShopCategory) => void; cats?: typeof CATEGORIES }) {
  return (
    <div class="cat-tabs" role="tablist">
      {cats.map((c) => (
        <button role="tab" aria-selected={value === c.id} class={value === c.id ? 'on' : ''} onClick={() => onChange(c.id)}>
          {c.label}
        </button>
      ))}
    </div>
  );
}

/** きせかえの見本：そのテーマの色だけで描いた小さな画面 */
export function ThemeSample({ id }: { id?: string }) {
  return (
    // いつもの色の上に、そのテーマを重ねる（いま使っているテーマの色が混ざらないように）
    <div data-theme="default" class="theme-sample-wrap" aria-hidden="true">
      <div class="theme-sample" data-theme={id}>
        <i class="ts-a" /><i class="ts-b" /><i class="ts-c" /><b class="ts-btn" />
      </div>
    </div>
  );
}

/** ペンの見本：その質感で描いた波線 */
export function PenSample({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 84 60" class="pen-sample" aria-hidden="true">
      <rect x="1" y="1" width="82" height="58" rx="10" fill="var(--page-outside)" stroke="var(--line)" stroke-width="2" />
      <PenPath d="M12 40 C 24 10, 36 10, 42 30 S 62 52, 72 20" pen={{ c: 'pink', w: 'M', k: id }} base={5} halo={4} />
    </svg>
  );
}
