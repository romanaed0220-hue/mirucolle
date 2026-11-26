// 交換所：ポイントでシール・きせかえ・カードと交換する
import { useState } from 'preact/hooks';
import { Check } from 'lucide-preact';
import { CardSample } from '../components/CardFrame';
import { CategoryTabs, ThemeSample } from '../components/ItemParts';
import { StickerArt } from '../components/StickerArt';
import { CATEGORIES, SHOP_ITEMS, type ShopCategory, type ShopItem } from '../config/shop';
import { exchange, useAppState } from '../data/store';

export function ShopScreen() {
  const { points, stickers, owned } = useAppState();
  const [cat, setCat] = useState<ShopCategory>('sticker');
  const has = (i: ShopItem) => (i.category === 'sticker' ? stickers : owned).includes(i.id);

  const onExchange = (i: ShopItem) => {
    if (!confirm(`「${i.name}」を ${i.price} ポイントと交換しますか？`)) return;
    exchange(i);
  };

  return (
    <div class="screen">
      <div class="screen-inner items-screen">
        <div class="card points-card">
          <span class="small">もっているポイント</span>
          <span class="head points-num">{points}</span>
        </div>
        <p class="small muted">ポイントは、お題に参加するともらえます。</p>

        <CategoryTabs value={cat} onChange={setCat} />
        <p class="small muted">{CATEGORIES.find((c) => c.id === cat)?.hint}</p>

        <ul class="item-grid">
          {SHOP_ITEMS.filter((i) => i.category === cat).map((i) => {
            const got = has(i);
            return (
              <li class="card item">
                <div class="item-pic">
                  {i.category === 'sticker' && <StickerArt id={i.id} />}
                  {i.category === 'theme' && <ThemeSample id={i.id} />}
                  {i.category === 'card' && <CardSample id={i.id} />}
                </div>
                <p class="item-name">{i.name}</p>
                {got ? (
                  <span class="item-state"><Check size={14} strokeWidth={2.8} />交換ずみ</span>
                ) : (
                  <button class="btn item-btn" disabled={points < i.price} onClick={() => onExchange(i)}>
                    {i.price} pt
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
