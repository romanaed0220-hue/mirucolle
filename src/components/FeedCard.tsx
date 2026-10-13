/*
 * つながりの 1 枚。「先に描く、それから見る」：
 * 自分が描くまでは写真と問いかけだけ。描いたら、ほかの人の見え方がひらく。
 * 数字（何人が描いたか等）はどこにも出さない。
 */
import { useState } from 'preact/hooks';
import { Lock, Pencil, SkipForward } from 'lucide-preact';
import type { FeedPost } from '../config/feed';
import type { MyTrace, Point } from '../data/storage';
import { toSvgPath } from '../lib/path';
import { useFit } from '../lib/useFit';

const COLORS = ['var(--c-pink)', 'var(--c-blue)', 'var(--c-teal)', 'var(--c-lilac)', 'var(--c-yellow)'];

type Props = {
  post: FeedPost;
  mine: MyTrace | undefined;
  onDraw: () => void;
  onSkip: () => void;
};

function Lines({ outline, details, aspect, color, width, faded }: { outline: Point[]; details: Point[][]; aspect: number; color: string; width: number; faded?: boolean }) {
  const common = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' } as const;
  const paths = [toSvgPath(outline, aspect, 1, true), ...details.map((d) => toSvgPath(d, aspect, 1, false))];
  return (
    <g opacity={faded ? 0.18 : 1}>
      {paths.map((d) => <path d={d} stroke="#fff" stroke-width={width + 4} {...common} />)}
      {paths.map((d) => <path d={d} stroke={color} stroke-width={width} {...common} />)}
    </g>
  );
}

export function FeedCard({ post, mine, onDraw, onSkip }: Props) {
  const [stageRef, size] = useFit<HTMLDivElement>(post.aspect);
  const [focus, setFocus] = useState<string | null>(null); // 強調表示する見え方（null = 全部）
  const revealed = !!mine;
  const isOdai = post.kind === 'odai';

  return (
    <article class={`card feed-card${revealed ? ' is-revealed' : ''}`}>
      <div class="feed-stage" ref={stageRef}>
        <div class="feed-photo" style={{ width: `${size.w}px`, height: `${size.h}px` }}>
          <img src={post.photo} alt="" draggable={false} />
          {revealed && (
            <svg viewBox={`0 0 ${post.aspect} 1`} preserveAspectRatio="none" aria-hidden="true">
              {post.traces.map((t, i) => (
                <Lines outline={t.outline} details={t.details} aspect={post.aspect} color={COLORS[i % COLORS.length]} width={3}
                  faded={focus !== null && focus !== t.id} />
              ))}
              <Lines outline={mine!.outline} details={mine!.details} aspect={post.aspect} color="#1A1A1A" width={4}
                faded={focus !== null && focus !== 'mine'} />
            </svg>
          )}
        </div>
        {isOdai && <span class="chip feed-tag">{post.odaiTitle ?? 'お題'}</span>}
        {!revealed && <span class="chip feed-lock"><Lock size={12} strokeWidth={2.6} />描くとひらきます</span>}
      </div>

      {!revealed ? (
        <div class="feed-body">
          <h2 class="head feed-q">あなたには<br />何に見えますか？</h2>
          <p class="small feed-rule">
            <Pencil size={14} strokeWidth={2.4} />
            <span><span class="mark">先に描く、それから見る。</span>描き終えると、ほかの人の見え方がひらきます。</span>
          </p>
          {post.traces.length === 0 && <p class="small muted feed-first">まだだれも描いていない写真です。</p>}
          <div class="feed-actions">
            <button class="btn" onClick={onSkip}><SkipForward size={16} strokeWidth={2.4} />スキップ</button>
            <button class="btn primary" onClick={onDraw}>なぞってみる</button>
          </div>
        </div>
      ) : (
        <div class="feed-body">
          <h2 class="head feed-q small-q">みんなの見え方</h2>
          <div class="ways">
            <button aria-pressed={focus === 'mine'} class={`way mine${focus === 'mine' ? ' on' : ''}`} onClick={() => setFocus(focus === 'mine' ? null : 'mine')}>
              <i style={{ background: '#1A1A1A' }} />あなた「{mine!.name}」
            </button>
            {post.traces.map((t, i) => (
              <button aria-pressed={focus === t.id} class={`way${focus === t.id ? ' on' : ''}`} onClick={() => setFocus(focus === t.id ? null : t.id)}>
                <i style={{ background: COLORS[i % COLORS.length] }} />{t.name}
              </button>
            ))}
          </div>
          {post.traces.length === 0 && <p class="small muted feed-first">この写真の、最初の見え方です。</p>}
          {isOdai && <p class="small muted feed-first">お題の見え方は、裏世界に集まります。</p>}
          <button class="btn block feed-next" onClick={onSkip}>次の写真へ<SkipForward size={16} strokeWidth={2.4} /></button>
        </div>
      )}
    </article>
  );
}
