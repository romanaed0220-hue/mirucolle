// もちもの：シール・きせかえ・カード。きせかえとカードは「使う」を選べる
// （ペン・瓶・チケットはここに出さない。使う場所に直接出る：仕様 5.2）
import { useState } from 'preact/hooks';
import { CardSample } from '../components/CardFrame';
import { CategoryTabs, ThemeSample } from '../components/ItemParts';
import { StickerArt } from '../components/StickerArt';
import { CATEGORIES, DEFAULT_NAMES, SHOP_ITEMS, type ShopCategory } from '../config/shop';
import { stickerById } from '../config/stickers';
import { equip, useAppState } from '../data/store';
import { href } from '../router';

export function ItemsScreen() {
  const { stickers, owned, equipped } = useAppState();
  const [cat, setCat] = useState<ShopCategory>('sticker');

  return (
    <div class="screen">
      <div class="screen-inner items-screen">
        <CategoryTabs value={cat} onChange={setCat} />
        <p class="small muted">{CATEGORIES.find((c) => c.id === cat)?.hint}</p>

        {cat === 'sticker' ? (
          stickers.length === 0 ? (
            <Empty />
          ) : (
            <ul class="item-grid">
              {stickers.map((id) => (
                <li class="card item">
                  <div class="item-pic"><StickerArt id={id} /></div>
                  <p class="item-name">{stickerById(id)?.name}</p>
                </li>
              ))}
            </ul>
          )
        ) : (
          <ul class="item-grid">
            {[undefined, ...SHOP_ITEMS.filter((i) => i.category === cat && owned.includes(i.id)).map((i) => i.id)].map((id) => {
              const slot = cat as 'theme' | 'card';
              const using = equipped[slot] === id;
              return (
                <li class={`card item${using ? ' using' : ''}`}>
                  <div class="item-pic">{slot === 'theme' ? <ThemeSample id={id} /> : <CardSample id={id} />}</div>
                  <p class="item-name">{id ? SHOP_ITEMS.find((i) => i.id === id)?.name : DEFAULT_NAMES[slot]}</p>
                  {using ? <span class="item-state on">使用中</span> : <button class="btn item-btn" onClick={() => equip(slot, id)}>使う</button>}
                </li>
              );
            })}
          </ul>
        )}
        <a class="btn block items-shop" href={href('shop')}>交換所へ</a>
      </div>
    </div>
  );
}

function Empty() {
  return <p class="small muted items-empty">まだありません。お題に参加したり、交換所でポイントと交換したりすると、ここに入ります。</p>;
}
