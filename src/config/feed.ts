/*
 * つながりのフィード（テスト用の預置データ）。
 * バックエンドがないので、「ほかの人の写真」と「ほかの人の見え方」はここで模擬する（docs/01-app-spec.md 7.3）。
 * 写真は public/samples/ の仮イラスト。本物の写真に差し替えるときは photo と aspect を変えるだけでよい。
 * 座標は写真の幅・高さを 1 とした割合。
 *
 * カードは 3 種類：
 * - view：だれかが描いた形をそのまま見る（大部分はこれ）
 * - ask ：「先に描く、それから見る」。描くまでは写真と問いかけだけ（ときどき混ざる）
 * - odai：今月のお題。いつも 1 枚目。ask と同じく、描くとほかの人の見え方がひらく
 */
import type { PlacedSticker, Point } from '../data/storage';
import type { PenStyle } from '../lib/pen';

export type SampleTrace = { id: string; name: string; outline: Point[]; details: Point[][]; outlinePen?: PenStyle; detailPens?: PenStyle[] };

type Base = { id: string; photo: string; aspect: number };
export type ViewItem = Base & {
  kind: 'view';
  trace: SampleTrace;
  /** 自分が投稿した形のとき：写真は IndexedDB のこのキー（photo は空） */
  ownPhotoId?: string;
  /** 自分の投稿：写真に貼ったシールと、カードの縁どり（'' はいつもの） */
  stickers?: PlacedSticker[];
  card?: string;
};
export type AskItem = Base & { kind: 'ask'; traces: SampleTrace[] };
export type OdaiItem = Base & { kind: 'odai'; odaiTitle: string; traces: SampleTrace[] };
export type FeedItem = ViewItem | AskItem | OdaiItem;

import { SAMPLE_PHOTOS, samplePhotoURL } from './samplePhotos';
import bundled from './sampleTraces.json';

/** 写真の slug → 見え方。sampleTraces.json（書き出したものを入れる）＋ 開発版でその場で描いたもの */
export type TraceBook = Record<string, SampleTrace[]>;

/**
 * つながりの並び。お題がいつも先頭。
 *  - view：見え方 1 つにつき 1 枚。同じ写真の 2 つめ以降は後ろに回す。まだ見え方がない写真は ask にする
 *  - ask / odai：その写真の見え方を全部まとめて、描いたあとにひらく
 */
export function buildFeed(extra: TraceBook = {}): FeedItem[] {
  const book = bundled as TraceBook;
  const tracesOf = (slug: string) => [...(book[slug] ?? []), ...(extra[slug] ?? [])];
  const head: FeedItem[] = [], body: FeedItem[] = [], tail: FeedItem[] = [];
  for (const p of SAMPLE_PHOTOS) {
    const base = { photo: samplePhotoURL(p.slug), aspect: p.aspect };
    const traces = tracesOf(p.slug);
    if (p.kind === 'odai') head.push({ ...base, id: `odai-${p.slug}`, kind: 'odai', odaiTitle: p.odaiTitle ?? 'お題', traces });
    else if (p.kind === 'view' && traces.length) {
      traces.forEach((t, i) => (i === 0 ? body : tail).push({ ...base, id: `v-${p.slug}-${t.id}`, kind: 'view', trace: t }));
    } else body.push({ ...base, id: `a-${p.slug}`, kind: 'ask', traces });
  }
  return [...head, ...body, ...tail];
}
