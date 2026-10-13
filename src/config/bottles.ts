/*
 * 瓶のスタイル（仮）。コレクションを 1 回発表するごとに、次のスタイルが 1 つ解ける。
 * 【未定】解放の条件とスタイルの数（docs/04 #5）。ここを変えるだけで調整できる。
 */
export type BottleStyle = {
  id: string;
  name: string;
  /** ガラスの色 */
  glass: string;
  /** 栓の色 */
  cap: string;
};

export const BOTTLES: BottleStyle[] = [
  { id: 'soda', name: 'ソーダ', glass: '#BFEDEB', cap: '#3DCCC7' },
  { id: 'peach', name: 'もも', glass: '#FFD6E2', cap: '#FF8FB1' },
  { id: 'lemon', name: 'レモン', glass: '#FFF1B8', cap: '#FFD23F' },
  { id: 'lilac', name: 'ライラック', glass: '#E6DCFF', cap: '#B79CFF' },
  { id: 'night', name: 'よぞら', glass: '#C9D6FF', cap: '#3A6FF7' },
];

/** 最初から使えるスタイルの数 */
export const BOTTLES_FREE = 1;

/** 発表した回数から、使えるスタイルを返す */
export function unlockedBottles(publishedCount: number): BottleStyle[] {
  return BOTTLES.slice(0, Math.min(BOTTLES.length, BOTTLES_FREE + publishedCount));
}

export const bottleById = (id: string) => BOTTLES.find((b) => b.id === id) ?? BOTTLES[0];

/** 1 つの瓶に入れられる形の上限（物理演算を軽く保つため） */
export const BOTTLE_MAX_SHAPES = 12;
