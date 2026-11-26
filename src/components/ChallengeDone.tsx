// チャレンジに参加したあとの画面：シールとポイントを受け取り、収集にも入れるかを選ぶ（初期は入れない）
import { useState } from 'preact/hooks';
import { Check, FlaskConical } from 'lucide-preact';
import type { ThemeChallenge } from '../config/challenges';
import { stickerById } from '../config/stickers';
import type { ChallengeEntry } from '../data/storage';
import { copyEntryToCollect } from '../data/store';
import { ShapeSticker } from './ShapeSticker';
import { StickerArt } from './StickerArt';
import { Dots, Ring, Triangle } from './Deco';

type Props = { challenge: ThemeChallenge; entry: ChallengeEntry; onClose: () => void };

export function ChallengeDone({ challenge, entry, onClose }: Props) {
  const [copied, setCopied] = useState(!!entry.shapeId);
  const sticker = stickerById(challenge.reward.stickerId);
  const asShape = { id: `entry-${entry.challengeId}`, createdAt: entry.createdAt, name: entry.name, photoId: entry.photoId, aspect: entry.aspect, outline: entry.outline, details: entry.details };

  return (
    <div class="flow challenge-done">
      <Dots x="66%" y="24px" cols={5} rows={3} />
      <Triangle x="10%" y="62%" s={22} color={2} rot={16} />
      <Ring x="80%" y="70%" s={32} color={4} />

      <div class="cd-body">
        <span class="chip challenge-chip">{challenge.label}「{challenge.theme}」</span>
        <h2 class="head cd-title">参加しました</h2>

        <div class="cd-work">
          <ShapeSticker shape={asShape} maxSide={150} uid="challenge-done" />
          <p class="head cd-name">{entry.name}</p>
        </div>

        <div class="card cd-reward">
          <div class="cd-sticker"><StickerArt id={challenge.reward.stickerId} /></div>
          <div>
            <p class="cd-reward-title">{sticker?.name}のシールをもらいました</p>
            <p class="small muted">ポイント +{challenge.reward.points}</p>
          </div>
        </div>
      </div>

      <footer class="cd-foot">
        <button class="btn block" onClick={() => { copyEntryToCollect(entry.challengeId); setCopied(true); }} disabled={copied}>
          {copied ? <><Check size={18} strokeWidth={2.6} />収集にも入れました</> : <><FlaskConical size={18} strokeWidth={2.4} />収集にも入れる</>}
        </button>
        <button class="btn primary block" onClick={onClose}>とじる</button>
      </footer>
    </div>
  );
}
