// シール（チャレンジの参加でもらえる／ポイントで交換する）。レアリティはつけない（仕様 5.2）
export type Sticker = { id: string; name: string };

export const STICKERS: Sticker[] = [
  { id: 'hitsuji', name: 'ひつじ' }, // お正月のお題の参加で
  { id: 'hoshi', name: 'ほし' },
  { id: 'hana', name: 'はな' },
  { id: 'obake', name: 'おばけ' },
];

export const stickerById = (id: string) => STICKERS.find((s) => s.id === id);
