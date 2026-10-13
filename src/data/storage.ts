/*
 * ローカル保存（localStorage）。スキーマにバージョン番号を持たせ、
 * 構造を変えるときは SCHEMA_VERSION を上げて migrations に変換関数を足す。
 * テスターの既存データを消さないための仕組み（docs/01-app-spec.md 7.3）。
 *
 * 写真などの大きいデータはここに入れない（photos.ts / IndexedDB 側で扱う）。
 */
import { STORAGE_PREFIX } from '../config/env';

export const SCHEMA_VERSION = 6;

/** 写真上の座標。写真の幅・高さを 1 とした割合（0〜1） */
export type Point = [number, number];

export interface Shape {
  id: string;
  createdAt: string;
  name: string;
  /** IndexedDB の写真キー */
  photoId: string;
  /** 写真の縦横比（幅 / 高さ） */
  aspect: number;
  /** なぞった閉じた輪郭 */
  outline: Point[];
  /** 描き足した線（目・手足など）。1 本ずつの配列 */
  details: Point[][];
  /** つながりに投稿した日時（ISO）。未投稿なら undefined */
  postedAt?: string;
}

/** つながりで、ほかの人の写真（またはお題）に自分が描いた見え方 */
export interface MyTrace {
  createdAt: string;
  name: string;
  outline: Point[];
  details: Point[][];
}

/** コレクション：形をいくつか選んでテーマをつけ、瓶に入れて発表したもの */
export interface Collection {
  id: string;
  createdAt: string;
  theme: string;
  shapeIds: string[];
  /** 瓶のスタイル（config/bottles.ts の id） */
  bottleId: string;
}

export interface AppState {
  version: typeof SCHEMA_VERSION;
  /** 初回起動日時（ISO） */
  firstOpenedAt: string;
  /** アプリを開いた日（YYYY-MM-DD、重複なし）。使用記録エクスポート用 */
  openedDays: string[];
  /** 自分の形（新しい順） */
  shapes: Shape[];
  /** つながりの投稿 id → 自分の見え方。これがある投稿は「描いたので、ほかの人の見え方がひらいている」 */
  myTraces: Record<string, MyTrace>;
  /** 発表したコレクション（古い順） */
  collections: Collection[];
  /** これまでに発表した回数（瓶の解放に使う。コレクションを消しても減らない） */
  publishCount: number;
}

const KEY = `${STORAGE_PREFIX}:state`;

// from バージョン → from+1 バージョンへの変換。例：migrations[1] は v1 → v2
const migrations: Record<number, (s: any) => any> = {
  // v2：形（shapes）を追加
  1: (s) => ({ ...s, shapes: [] }),
  // v3：つながりで描いた見え方（myTraces）を追加
  2: (s) => ({ ...s, myTraces: {} }),
  // v4：形に postedAt（つながりへの投稿）を追加。省略可の項目なので既存データはそのまま
  3: (s) => s,
  // v5：コレクション（collections）を追加
  4: (s) => ({ ...s, collections: [] }),
  // v6：発表した回数（publishCount）を追加。今あるコレクションの数から始める
  5: (s) => ({ ...s, publishCount: (s.collections ?? []).length }),
};

function initialState(): AppState {
  return { version: SCHEMA_VERSION, firstOpenedAt: new Date().toISOString(), openedDays: [], shapes: [], myTraces: {}, collections: [], publishCount: 0 };
}

function migrate(raw: any): AppState {
  let s = raw;
  let v: number = typeof s?.version === 'number' ? s.version : 0;
  if (v > SCHEMA_VERSION) {
    // 新しい版で保存されたデータを古い版で開いた。壊さないようにそのまま使う
    return s as AppState;
  }
  while (v < SCHEMA_VERSION) {
    const step = migrations[v];
    if (!step) throw new Error(`migration v${v} → v${v + 1} がありません`);
    s = step(s);
    v += 1;
    s.version = v;
  }
  return s as AppState;
}

export function loadState(): AppState {
  try {
    const text = localStorage.getItem(KEY);
    if (!text) return initialState();
    return migrate(JSON.parse(text));
  } catch (e) {
    console.error('[storage] 読み込みに失敗。初期状態で起動します', e);
    return initialState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[storage] 保存に失敗', e);
  }
}

export function recordOpen(state: AppState): AppState {
  const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD（端末のローカル日付）
  if (state.openedDays.includes(today)) return state;
  return { ...state, openedDays: [...state.openedDays, today] };
}
