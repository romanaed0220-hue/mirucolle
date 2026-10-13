/*
 * つながりの 1 枚。
 * - view：だれかが描いた形をそのまま見る
 * - ask / odai：「先に描く、それから見る」。描くまでは写真と問いかけだけ、描いたらほかの人の見え方がひらく
 * 数字（何人が描いたか等）はどこにも出さない。
 */
import { useState } from 'preact/hooks';
import { Lock, Pencil } from 'lucide-preact';
import type { FeedItem, SampleTrace } from '../config/feed';
import type { MyTrace, Point } from '../data/storage';
import { toSvgPath } from '../lib/path';
import { useFit } from '../lib/useFit';
import { usePhotoURL } from '../data/photos';

const COLORS = ['var(--c-pink)', 'var(--c-blue)', 'var(--c-teal)', 'var(--c-lilac)', 'var(--c-yellow)'];
const INK = '#1A1A1A';

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

function Photo({ item, children }: { item: FeedItem; children?: preact.ComponentChildren }) {
  const [stageRef, size] = useFit<HTMLDivElement>(item.aspect);
  const ownURL = usePhotoURL(item.kind === 'view' ? item.ownPhotoId : undefined);
  const src = item.kind === 'view' && item.ownPhotoId ? ownURL : item.photo;
  return (
    <div class="feed-stage" ref={stageRef}>
      <div class="feed-photo" style={{ width: `${size.w}px`, height: `${size.h}px` }}>
        {src && <img src={src} alt="" draggable={false} />}
        {children}
      </div>
    </div>
  );
}

const overlay = (aspect: number, inner: preact.ComponentChildren) => (
  <svg viewBox={`0 0 ${aspect} 1`} preserveAspectRatio="none" aria-hidden="true">{inner}</svg>
);

type Props = { item: FeedItem; mine: MyTrace | undefined; onDraw: () => void; onNext: () => void };

export function FeedCard({ item, mine, onDraw, onNext }: Props) {
  const [focus, setFocus] = useState<string | null>(null); // 強調表示する見え方（null = 全部）

  // だれかの形をそのまま見るカード
  if (item.kind === 'view') {
    const t = item.trace;
    return (
      <article class="card feed-card">
        <Photo item={item}>{overlay(item.aspect, <Lines outline={t.outline} details={t.details} aspect={item.aspect} color={INK} width={4} />)}</Photo>
        <div class="feed-body">
          <p class="small muted">{item.ownPhotoId ? 'あなたの投稿' : 'だれかの見え方'}</p>
          <h2 class="head feed-name">{t.name}</h2>
          <button class="btn block feed-next" onClick={onNext}>次へ</button>
        </div>
      </article>
    );
  }

  const others: SampleTrace[] = item.traces;
  const isOdai = item.kind === 'odai';

  // 先に描く、それから見る
  if (!mine) {
    return (
      <article class="card feed-card is-ask">
        <Photo item={item} />
        {isOdai && <span class="chip feed-tag">{item.odaiTitle}</span>}
        <div class="feed-body">
          <h2 class="head feed-q">あなたには<br />何に見えますか？</h2>
          <p class="small feed-rule">
            <Lock size={14} strokeWidth={2.4} />
            <span><span class="mark">先に描く、それから見る。</span>なぞると、ほかの人の見え方がひらきます。</span>
          </p>
          {others.length === 0 && <p class="small muted feed-first">まだだれも描いていない写真です。</p>}
          <div class="feed-actions">
            <button class="btn" onClick={onNext}>スキップ</button>
            <button class="btn primary" onClick={onDraw}><Pencil size={16} strokeWidth={2.4} />なぞってみる</button>
          </div>
        </div>
      </article>
    );
  }

  // 描いたので、ほかの人の見え方がひらいた
  return (
    <article class="card feed-card is-revealed">
      <Photo item={item}>
        {overlay(item.aspect, (
          <>
            {others.map((t, i) => (
              <Lines outline={t.outline} details={t.details} aspect={item.aspect} color={COLORS[i % COLORS.length]} width={3}
                faded={focus !== null && focus !== t.id} />
            ))}
            <Lines outline={mine.outline} details={mine.details} aspect={item.aspect} color={INK} width={4}
              faded={focus !== null && focus !== 'mine'} />
          </>
        ))}
      </Photo>
      {isOdai && <span class="chip feed-tag">{item.odaiTitle}</span>}
      <div class="feed-body">
        <h2 class="head feed-q small-q">みんなの見え方</h2>
        <div class="ways">
          <button aria-pressed={focus === 'mine'} class={`way${focus === 'mine' ? ' on' : ''}`} onClick={() => setFocus(focus === 'mine' ? null : 'mine')}>
            <i style={{ background: INK }} />あなた{mine.name ? `「${mine.name}」` : ''}
          </button>
          {others.map((t, i) => (
            <button aria-pressed={focus === t.id} class={`way${focus === t.id ? ' on' : ''}`} onClick={() => setFocus(focus === t.id ? null : t.id)}>
              <i style={{ background: COLORS[i % COLORS.length] }} />{t.name}
            </button>
          ))}
        </div>
        {others.length === 0 && <p class="small muted feed-first">この写真の、最初の見え方です。</p>}
        {isOdai && <p class="small muted feed-first">お題の見え方は、裏世界に集まります。</p>}
        <button class="btn block feed-next" onClick={onNext}>次へ</button>
      </div>
    </article>
  );
}
