// つながり：重なったカードを 1 枚ずつ払ってめくる。1 枚目は必ず今月のお題。
import { useState } from 'preact/hooks';
import { CardStack } from '../components/CardStack';
import { FeedCard } from '../components/FeedCard';
import { Portal } from '../components/Portal';
import { TraceFlow } from '../components/TraceFlow';
import { FEED, type FeedItem } from '../config/feed';
import { setMyTrace, useAppState } from '../data/store';

// お題は必ず先頭（設定の並びに関係なく）
const ITEMS: FeedItem[] = [...FEED.filter((p) => p.kind === 'odai'), ...FEED.filter((p) => p.kind !== 'odai')];

// タブを切り替えても、めくった位置を覚えておく（アプリを開き直すとお題から）
let savedIndex = 0;

export function ConnectScreen() {
  const { myTraces } = useAppState();
  const [index, setIndex] = useState(savedIndex);
  const [drawing, setDrawing] = useState<FeedItem | null>(null);
  const go = (i: number) => { savedIndex = i; setIndex(i); };

  return (
    <div class="screen fill connect-screen">
      <CardStack
        items={ITEMS}
        index={index}
        onIndex={go}
        keyOf={(it) => it.id}
        render={(it, next) => <FeedCard item={it} mine={myTraces[it.id]} onDraw={() => setDrawing(it)} onNext={next} />}
        end={
          <div class="card feed-end">
            <p class="head">今日はここまで</p>
            <p class="small muted">外に出て、何かに見えるものを探してみませんか。</p>
            <button class="btn" onClick={() => go(0)}>はじめから見る</button>
          </div>
        }
      />

      {drawing && (
        <Portal>
          <TraceFlow
            photoURL={drawing.photo}
            aspect={drawing.aspect}
            outlineOnly
            saveLabel="描いて、見る"
            onClose={() => setDrawing(null)}
            onSave={async ({ outline }) => {
              setMyTrace(drawing.id, { createdAt: new Date().toISOString(), name: '', outline, details: [] });
              setDrawing(null);
            }}
          />
        </Portal>
      )}
    </div>
  );
}
