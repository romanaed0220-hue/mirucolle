/*
 * つながりのフィード（テスト用の預置データ）。
 * バックエンドがないので、「ほかの人の写真」と「ほかの人の見え方」はここで模擬する（docs/01-app-spec.md 7.3）。
 * 写真は public/samples/ の仮イラスト。本物の写真に差し替えるときは photo と aspect を変えるだけでよい。
 * 座標は写真の幅・高さを 1 とした割合。
 */
import type { Point } from '../data/storage';

export type SampleTrace = { id: string; name: string; outline: Point[]; details: Point[][] };
export type FeedPost = {
  id: string;
  kind: 'odai' | 'post';
  photo: string;
  aspect: number;
  /** お題の見出し（kind = odai のとき） */
  odaiTitle?: string;
  traces: SampleTrace[];
};

const BASE = import.meta.env.BASE_URL;
const W = 600, H = 800; // 仮イラストの大きさ（px）。下の座標はこの px で書いて、割合に直す

/** 少しゆがんだ楕円（手でなぞったような輪郭） */
function blob(cx: number, cy: number, rx: number, ry: number, wobble = 0.08, freq = 3, phase = 0, n = 40): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2;
    const k = 1 + wobble * Math.sin(t * freq + phase) + wobble * 0.5 * Math.sin(t * (freq + 2) + phase * 2);
    return [r4((cx + rx * k * Math.cos(t)) / W), r4((cy + ry * k * Math.sin(t)) / H)] as Point;
  });
}
const dot = (x: number, y: number): Point[] => [[r4(x / W), r4(y / H)], [r4((x + 1.5) / W), r4(y / H)]];
/** (x1,y)→(x2,y) をふくらませた弧（bend > 0 で下にふくらむ） */
function arc(x1: number, x2: number, y: number, bend: number): Point[] {
  return Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    return [r4((x1 + (x2 - x1) * t) / W), r4((y + Math.sin(t * Math.PI) * bend) / H)] as Point;
  });
}
const line = (pts: [number, number][]): Point[] => pts.map(([x, y]) => [r4(x / W), r4(y / H)]);
function r4(v: number) { return Math.round(v * 10000) / 10000; }

export const FEED: FeedPost[] = [
  {
    id: 'odai-2026-10',
    kind: 'odai',
    odaiTitle: '10月のお題：木のこぶ',
    photo: `${BASE}samples/odai-bark.svg`,
    aspect: W / H,
    traces: [
      { id: 'o1', name: 'おどろくおじさん', outline: blob(300, 370, 140, 170, 0.06, 4, 1), details: [] },
      { id: 'o2', name: 'ふくろう', outline: blob(302, 340, 95, 110, 0.12, 2, 0.5), details: [arc(270, 335, 300, 18)] },
      { id: 'o3', name: 'ひとりぼっちの卵', outline: blob(450, 640, 60, 78, 0.05, 3, 2), details: [dot(440, 625), dot(465, 625)] },
      { id: 'o4', name: '森のおばけ', outline: blob(300, 420, 160, 300, 0.1, 5, 0.3), details: [] },
    ],
  },
  {
    id: 'p-sky',
    kind: 'post',
    photo: `${BASE}samples/sky.svg`,
    aspect: W / H,
    traces: [
      { id: 's1', name: 'ねむいくじら', outline: blob(320, 310, 230, 115, 0.1, 3, 0.8), details: [dot(200, 300), arc(240, 300, 340, 10)] },
      { id: 's2', name: 'うさぎのしっぽ', outline: blob(160, 620, 100, 42, 0.12, 2), details: [] },
      { id: 's3', name: 'ふとったねこ', outline: blob(330, 300, 170, 140, 0.12, 2, 2.2), details: [dot(290, 290), dot(360, 290), line([[310, 320], [325, 330], [340, 320]])] },
    ],
  },
  {
    id: 'p-outlet',
    kind: 'post',
    photo: `${BASE}samples/outlet.svg`,
    aspect: W / H,
    traces: [
      { id: 'u1', name: 'びっくりした人', outline: blob(300, 400, 140, 180, 0.03, 4), details: [] },
      { id: 'u2', name: 'ロボットのあいさつ', outline: blob(300, 400, 165, 210, 0.08, 4, 1.5), details: [line([[300, 190], [300, 140]]), dot(300, 132)] },
    ],
  },
  {
    id: 'p-wall',
    kind: 'post',
    photo: `${BASE}samples/wall.svg`,
    aspect: W / H,
    traces: [], // まだだれも描いていない写真
  },
  {
    id: 'p-coffee',
    kind: 'post',
    photo: `${BASE}samples/coffee.svg`,
    aspect: W / H,
    traces: [
      { id: 'c1', name: 'くまさん', outline: blob(300, 390, 110, 110, 0.12, 2, 1.6), details: [arc(280, 320, 420, 10)] },
      { id: 'c2', name: 'ひつじ雲', outline: blob(300, 400, 150, 130, 0.14, 6, 0.4), details: [dot(270, 380), dot(330, 380)] },
    ],
  },
  {
    id: 'p-wood',
    kind: 'post',
    photo: `${BASE}samples/wood.svg`,
    aspect: W / H,
    traces: [
      { id: 'w1', name: '目玉焼き', outline: blob(300, 410, 160, 100, 0.08, 3, 0.2), details: [] },
    ],
  },
  {
    id: 'p-rock',
    kind: 'post',
    photo: `${BASE}samples/rock.svg`,
    aspect: W / H,
    traces: [],
  },
];
