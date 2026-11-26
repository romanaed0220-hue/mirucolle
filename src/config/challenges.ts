/*
 * 運営のチャレンジ（お題）。バックエンドがないので、ここに書いたものを「運営が出したお題」とみなす。
 * docs/01-app-spec.md 5.1
 *  - A 官方照片型：つながりの 1 枚目（いまは config/feed.ts の odai）
 *  - B 主題型：記録の入口。テーマだけ出して、写真は自分で見つけて撮る。参加すると入口が消える
 * 日付は端末のローカル日付で比べる（YYYY-MM-DD、両端を含む）。
 */
import { APP_ENV, STORAGE_PREFIX } from './env';

export type ThemeChallenge = {
  id: string;
  kind: 'theme';
  /** 小さなラベル（例：お正月のお題） */
  label: string;
  /** テーマ（例：ひつじ） */
  theme: string;
  /** 入口の説明 */
  lead: string;
  start: string;
  end: string;
  /** 参加でもらえるシール（config/stickers.ts）とポイント。ポイントの数値は【未定】の仮 */
  reward: { stickerId: string; points: number };
};

export const THEME_CHALLENGES: ThemeChallenge[] = [
  {
    id: 'theme-2027-newyear-hitsuji',
    kind: 'theme',
    label: 'お正月のお題',
    theme: 'ひつじ',
    lead: 'どんなひつじでも。身のまわりで見つけて、撮って、なぞってください。',
    start: '2026-12-29',
    end: '2027-01-07',
    reward: { stickerId: 'hitsuji', points: 10 },
  },
];

/** 開発版だけ：日付に関係なく最初のお題を開催中として扱う（マイページのスイッチ） */
const FORCE_KEY = `${STORAGE_PREFIX}:force-challenge`;
export const canForceChallenge = APP_ENV !== 'prod';
export function isChallengeForced(): boolean {
  if (!canForceChallenge) return false;
  try { return localStorage.getItem(FORCE_KEY) === '1'; } catch { return false; }
}
export function setChallengeForced(on: boolean) {
  try { on ? localStorage.setItem(FORCE_KEY, '1') : localStorage.removeItem(FORCE_KEY); } catch { /* noop */ }
}

/** いま開催中の B 主題型お題（なければ null） */
export function activeThemeChallenge(now = new Date()): ThemeChallenge | null {
  if (isChallengeForced()) return THEME_CHALLENGES[0] ?? null;
  const today = now.toLocaleDateString('sv-SE');
  return THEME_CHALLENGES.find((c) => c.start <= today && today <= c.end) ?? null;
}
