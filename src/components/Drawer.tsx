import { CalendarHeart, Info, Settings, X } from 'lucide-preact';
import { APP_ENV, APP_VERSION } from '../config/env';

export function Drawer({ onClose }: { onClose: () => void }) {
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

        <ul class="drawer-list">
          <li><CalendarHeart size={20} />月のふりかえり<span class="chip soon">準備中</span></li>
          <li><Settings size={20} />設定<span class="chip soon">準備中</span></li>
          <li><Info size={20} />このアプリについて<span class="chip soon">準備中</span></li>
        </ul>

        <p class="drawer-foot small muted">v{APP_VERSION}{APP_ENV !== 'prod' ? ` · ${APP_ENV}` : ''}</p>
      </div>
    </>
  );
}
