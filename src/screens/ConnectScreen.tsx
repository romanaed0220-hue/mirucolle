import { Pencil } from 'lucide-preact';
import { Squiggle, Triangle } from '../components/Deco';

// 仮のお題写真（フラットなプレースホルダー）。本物は運営側の設定ファイルから読む予定
function PlaceholderSky() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="100" fill="#8CCBF2" />
      <ellipse cx="30" cy="42" rx="20" ry="10" fill="#fff" />
      <ellipse cx="46" cy="34" rx="16" ry="12" fill="#fff" />
      <ellipse cx="62" cy="44" rx="18" ry="9" fill="#fff" />
      <ellipse cx="78" cy="76" rx="14" ry="6" fill="#fff" opacity=".85" />
    </svg>
  );
}

export function ConnectScreen() {
  return (
    <div class="screen fill">
      <Triangle x="88%" y="70%" s={26} color={1} rot={15} />
      <Squiggle x="-10px" y="82%" w={70} color={5} rot={-8} />

      <div class="screen-inner connect">
        <article class="card odai">
          <div class="odai-photo">
            <PlaceholderSky />
            <span class="chip">今月のお題</span>
          </div>
          <div class="odai-body">
            <h2 class="head odai-q">あなたには<br />何に見えますか？</h2>
            <p class="small odai-rule">
              <Pencil size={14} strokeWidth={2.4} />
              <span><span class="mark">先に描く、それから見る。</span>描き終えると、ほかの人の見え方がひらきます。</span>
            </p>
            <div class="odai-actions">
              <button class="btn" disabled>スキップ</button>
              <button class="btn primary" disabled>なぞってみる</button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
