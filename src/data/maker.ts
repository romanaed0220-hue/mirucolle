/*
 * 開発版だけ：つながりのサンプル写真に「ほかの人の見え方」を描いておく帳面。
 * この端末の localStorage に入り、書き出した JSON を src/config/sampleTraces.json に入れると全員に出る。
 * 開発版のつながりには、ここで描いたものもその場で混ぜて見せる（確認用）。
 */
import { APP_ENV, STORAGE_PREFIX } from '../config/env';
import type { SampleTrace, TraceBook } from '../config/feed';

export const canMakeSamples = APP_ENV !== 'prod';
const KEY = `${STORAGE_PREFIX}:sample-maker`;

export function loadMakerBook(): TraceBook {
  if (!canMakeSamples) return {};
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export function saveMakerBook(book: TraceBook) {
  try { localStorage.setItem(KEY, JSON.stringify(book)); } catch (e) { console.error(e); }
}

export function addMakerTrace(book: TraceBook, slug: string, t: SampleTrace): TraceBook {
  const next = { ...book, [slug]: [...(book[slug] ?? []), t] };
  saveMakerBook(next);
  return next;
}

export function removeMakerTrace(book: TraceBook, slug: string, id: string): TraceBook {
  const list = (book[slug] ?? []).filter((t) => t.id !== id);
  const next = { ...book };
  if (list.length) next[slug] = list; else delete next[slug];
  saveMakerBook(next);
  return next;
}

/** 書き出し用のファイル（sampleTraces.json と同じ形：slug → 見え方の配列） */
export function makerExportFile(book: TraceBook): File {
  const d = new Date().toLocaleDateString('sv-SE').replace(/-/g, '');
  return new File([JSON.stringify(book)], `mirucolle-samples-${d}.json`, { type: 'application/json' });
}
