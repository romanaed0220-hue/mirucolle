/*
 * ローカル保存（localStorage）。スキーマにバージョン番号を持たせ、
 * 構造を変えるときは SCHEMA_VERSION を上げて migrations に変換関数を足す。
 * テスターの既存データを消さないための仕組み（docs/01-app-spec.md 7.3）。
 *
 * 写真などの大きいデータはここに入れない（IndexedDB 側で扱う）。
 */
import { STORAGE_PREFIX } from '../config/env';

export const SCHEMA_VERSION = 1;

export interface AppState {
  version: typeof SCHEMA_VERSION;
  /** 初回起動日時（ISO） */
  firstOpenedAt: string;
  /** アプリを開いた日（YYYY-MM-DD、重複なし）。使用記録エクスポート用 */
  openedDays: string[];
}

const KEY = `${STORAGE_PREFIX}:state`;

// from バージョン → from+1 バージョンへの変換。例：migrations[1] は v1 → v2
const migrations: Record<number, (s: any) => any> = {};

function initialState(): AppState {
  return { version: SCHEMA_VERSION, firstOpenedAt: new Date().toISOString(), openedDays: [] };
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
