// つながり：ほかの人の写真を 1 枚ずつ横にめくる。1 枚目は必ず今月のお題。
import { useRef, useState } from 'preact/hooks';
import { FeedCard } from '../components/FeedCard';
import { Portal } from '../components/Portal';
import { TraceFlow } from '../components/TraceFlow';
import { FEED, type FeedPost } from '../config/feed';
import { setMyTrace, useAppState } from '../data/store';

export function ConnectScreen() {
  const { myTraces } = useAppState();
  const trackRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState<FeedPost | null>(null);

  // お題は必ず先頭（設定の並びに関係なく）
  const posts = [...FEED.filter((p) => p.kind === 'odai'), ...FEED.filter((p) => p.kind !== 'odai')];

  const goNext = (i: number) => {
    const track = trackRef.current;
    const next = track?.children[i + 1] as HTMLElement | undefined;
    if (track && next) track.scrollTo({ left: next.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  };

  return (
    <div class="screen fill connect-screen">
      <div class="feed" ref={trackRef}>
        {posts.map((p, i) => (
          <div class="feed-slide">
            <FeedCard post={p} mine={myTraces[p.id]} onDraw={() => setDrawing(p)} onSkip={() => goNext(i)} />
          </div>
        ))}
        <div class="feed-slide feed-end">
          <p class="head">今日はここまで</p>
          <p class="small muted">外に出て、何かに見えるものを探してみませんか。</p>
        </div>
      </div>

      {drawing && (
        <Portal>
          <TraceFlow
            photoURL={drawing.photo}
            aspect={drawing.aspect}
            saveLabel="描いて、見る"
            onClose={() => setDrawing(null)}
            onSave={async ({ outline, details, name }) => {
              setMyTrace(drawing.id, { createdAt: new Date().toISOString(), name, outline, details });
              setDrawing(null);
            }}
          />
        </Portal>
      )}
    </div>
  );
}
