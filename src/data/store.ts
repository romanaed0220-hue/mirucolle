// アプリ全体の状態。画面をまたいで共有し、変更のたびに localStorage へ保存する。
import { useEffect, useState } from 'preact/hooks';
import { newId } from '../lib/path';
import { loadState, recordOpen, saveState, type AppState, type ChallengeEntry, type Collection, type MyTrace, type Shape } from './storage';

let state: AppState = recordOpen(loadState());
saveState(state);

const listeners = new Set<(s: AppState) => void>();

function update(next: AppState) {
  state = next;
  saveState(state);
  listeners.forEach((l) => l(state));
}

export function useAppState(): AppState {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    setS(state);
    return () => { listeners.delete(setS); };
  }, []);
  return s;
}

/** 直前に保存した形の id（収集で「いま来た」演出に使う）。一度読んだら消える */
let lastAddedId: string | null = null;
export function takeLastAddedId() {
  const id = lastAddedId;
  lastAddedId = null;
  return id;
}

export function addShape(shape: Shape) {
  lastAddedId = shape.id;
  update({ ...state, shapes: [shape, ...state.shapes] });
}

export function setMyTrace(postId: string, trace: MyTrace) {
  update({ ...state, myTraces: { ...state.myTraces, [postId]: trace } });
}

/** 形をつながりに投稿する／取り消す */
export function setPosted(shapeId: string, posted: boolean) {
  update({
    ...state,
    shapes: state.shapes.map((s) => (s.id === shapeId ? { ...s, postedAt: posted ? new Date().toISOString() : undefined } : s)),
  });
}

export function addCollection(c: Collection) {
  update({ ...state, collections: [...state.collections, c], publishCount: state.publishCount + 1 });
}

/** コレクション（瓶）を消す。中の形そのものは収集に残る */
export function deleteCollection(collectionId: string) {
  update({ ...state, collections: state.collections.filter((c) => c.id !== collectionId) });
}

/** コレクション（瓶）を編集する：テーマと中身の形 */
export function updateCollection(collectionId: string, patch: { theme: string; shapeIds: string[] }) {
  update({
    ...state,
    collections: state.collections.map((c) => (c.id === collectionId ? { ...c, ...patch } : c)),
  });
}

/** チャレンジに参加する：作品を残し、シールとポイントを受け取る */
export function joinChallenge(entry: ChallengeEntry, reward: { stickerId?: string; points: number }) {
  update({
    ...state,
    challengeEntries: [...state.challengeEntries, entry],
    stickers: reward.stickerId && !state.stickers.includes(reward.stickerId) ? [...state.stickers, reward.stickerId] : state.stickers,
    points: state.points + reward.points,
  });
}

/** 参加作品を収集にも入れる（写真は同じものを使う） */
export function copyEntryToCollect(challengeId: string): string | null {
  const entry = state.challengeEntries.find((e) => e.challengeId === challengeId);
  if (!entry || entry.shapeId) return entry?.shapeId ?? null;
  const shape: Shape = {
    id: newId(), createdAt: new Date().toISOString(), name: entry.name, photoId: entry.photoId,
    aspect: entry.aspect, outline: entry.outline, details: entry.details,
    outlinePen: entry.outlinePen, detailPens: entry.detailPens,
  };
  lastAddedId = shape.id;
  update({
    ...state,
    shapes: [shape, ...state.shapes],
    challengeEntries: state.challengeEntries.map((e) => (e === entry ? { ...e, shapeId: shape.id } : e)),
  });
  return shape.id;
}

/** 交換所でポイントと交換する。シールは stickers に、それ以外は owned に入る。足りなければ false */
export function exchange(item: { id: string; category: string; price: number }): boolean {
  if (state.points < item.price) return false;
  const isSticker = item.category === 'sticker';
  if (isSticker ? state.stickers.includes(item.id) : state.owned.includes(item.id)) return false;
  update({
    ...state,
    points: state.points - item.price,
    stickers: isSticker ? [...state.stickers, item.id] : state.stickers,
    owned: isSticker ? state.owned : [...state.owned, item.id],
  });
  return true;
}

/** きせかえ・カードを使う（undefined でいつものに戻す） */
export function equip(slot: 'theme' | 'card', id: string | undefined) {
  update({ ...state, equipped: { ...state.equipped, [slot]: id } });
}
