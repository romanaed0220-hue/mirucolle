/*
 * 交換所（ポイントで交換できるもの）。docs/01-app-spec.md 5.2
 * もちものに出るのは シール・きせかえ・カード の 3 つだけ。
 * ペン・瓶・チケットは、それぞれの機能ができたらここに足す（使う場所に直接出る）。
 * 中身と値段は仮【未定】。
 */
export type ShopCategory = 'sticker' | 'theme' | 'card' | 'pen';

export const CATEGORIES: { id: ShopCategory; label: string; hint: string }[] = [
  { id: 'sticker', label: 'シール', hint: '投稿するとき、写真に貼れます' },
  { id: 'theme', label: 'きせかえ', hint: 'アプリ全体の色が変わります' },
  { id: 'card', label: 'カード', hint: 'つながりに投稿したときのカードの縁どり' },
  { id: 'pen', label: 'ペン', hint: '交換すると、描く画面のペンに出てきます' },
];

/** もちものに出す分類（ペン・瓶・チケットは使う場所に直接出る） */
export const ITEM_CATEGORIES = CATEGORIES.filter((c) => c.id !== 'pen');

export type ShopItem = { id: string; category: ShopCategory; name: string; price: number };

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'hoshi', category: 'sticker', name: 'ほし', price: 5 },
  { id: 'hana', category: 'sticker', name: 'はな', price: 5 },
  { id: 'obake', category: 'sticker', name: 'おばけ', price: 8 },
  { id: 'tasogare', category: 'theme', name: 'たそがれ', price: 15 },
  { id: 'hatsuyuki', category: 'theme', name: 'はつゆき', price: 15 },
  { id: 'shinya', category: 'theme', name: 'しんや', price: 20 },
  { id: 'stripe', category: 'card', name: 'しましま', price: 10 },
  { id: 'dots', category: 'card', name: 'みずたま', price: 10 },
  { id: 'nami', category: 'card', name: 'なみなみ', price: 12 },
  // ペンの質感（lib/pen.ts の PEN_KINDS と同じ id）
  { id: 'neon', category: 'pen', name: 'ネオン', price: 12 },
  { id: 'tenten', category: 'pen', name: 'てんてん', price: 8 },
  { id: 'kurobuchi', category: 'pen', name: 'くろぶち', price: 8 },
];

/** きせかえ・カードの「いつもの」（最初から持っている） */
export const DEFAULT_NAMES: Record<'theme' | 'card', string> = { theme: 'いつもの', card: 'いつもの' };

export const shopItemById = (id: string) => SHOP_ITEMS.find((i) => i.id === id);
