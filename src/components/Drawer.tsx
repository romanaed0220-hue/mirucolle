import { Backpack, CalendarHeart, ChevronRight, Coins, Info, Settings, X } from 'lucide-preact';
import { canForceChallenge, isChallengeForced, setChallengeForced } from '../config/challenges';
import { APP_ENV, APP_VERSION } from '../config/env';
import { useAppState } from '../data/store';
import { href } from '../router';

export function Drawer({ onClose }: { onClose: () => void }) {
  const { points } = useAppState();
  return (
    <>
      <div class="scrim" onClick={onClose} />
      <div class="drawer" role="dialog" aria-modal="true" aria-label="マイページ">
        <div class="drawer-head">
          <h2 class="head drawer-title">マイページ</h2>
          <button class="icon-btn" aria-label="閉じる" onClick={onClose}><X size={20} strokeWidth={2.4} /></button>
        </div>

        <div class="card drawer-about">
          <p class="small">
            ミルコレは<span class="mark">先に描く、それから見る</span>アプリです。
            ほかの人の見え方は、自分で描いたあとにひらきます。
          </p>
          <p class="small muted">データはこの端末の中だけに保存されます。</p>
        </div>

        <a class="card drawer-mine" href={href('shop')} aria-label={`ポイント ${points}。交換所をひらく`}>
          <Coins size={20} />
          <span class="small">ポイント <b>{points}</b></span>
          <span class="mine-go small">交換所<ChevronRight size={16} strokeWidth={2.6} /></span>
        </a>

        <ul class="drawer-list">
          <li><a href={href('items')}><Backpack size={20} />もちもの<ChevronRight class="go" size={18} strokeWidth={2.6} /></a></li>
          <li><CalendarHeart size={20} />月のふりかえり<span class="chip soon">準備中</span></li>
          <li><Settings size={20} />設定<span class="chip soon">準備中</span></li>
          <li><Info size={20} />このアプリについて<span class="chip soon">準備中</span></li>
        </ul>

        {canForceChallenge && (
          <label class="dev-toggle muted">
            <input type="checkbox" checked={isChallengeForced()}
              onChange={(e) => { setChallengeForced((e.currentTarget as HTMLInputElement).checked); location.reload(); }} />
            開発用：お題を開催中にする
          </label>
        )}
        <p class="drawer-foot small muted">v{APP_VERSION}{APP_ENV !== 'prod' ? ` · ${APP_ENV}` : ''}</p>
      </div>
    </>
  );
}
