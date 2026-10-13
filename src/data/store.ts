// アプリ全体の状態。画面をまたいで共有し、変更のたびに localStorage へ保存する。
import { useEffect, useState } from 'preact/hooks';
import { loadState, recordOpen, saveState, type AppState, type MyTrace, type Shape } from './storage';

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
