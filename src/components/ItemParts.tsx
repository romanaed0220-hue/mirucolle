// 交換所ともちもので共用する部品
import { CATEGORIES, type ShopCategory } from '../config/shop';

export function CategoryTabs({ value, onChange }: { value: ShopCategory; onChange: (c: ShopCategory) => void }) {
  return (
    <div class="cat-tabs" role="tablist">
      {CATEGORIES.map((c) => (
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
