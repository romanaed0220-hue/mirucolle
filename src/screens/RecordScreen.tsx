import { useRef, useState } from 'preact/hooks';
import { Camera, Image as ImageIcon } from 'lucide-preact';
import { Dots, Ring, Squiggle } from '../components/Deco';
import { ChallengeDone } from '../components/ChallengeDone';
import { Portal } from '../components/Portal';
import { StickerArt } from '../components/StickerArt';
import { TraceFlow } from '../components/TraceFlow';
import { activeThemeChallenge } from '../config/challenges';
import { compressPhoto, savePhoto } from '../data/photos';
import { addShape, joinChallenge, useAppState } from '../data/store';
import { newId } from '../lib/path';
import { href } from '../router';

type PickedPhoto = { blob: Blob; url: string; width: number; height: number };

const STEPS = [
  { n: 1, title: '撮る', text: '「何かに見える」瞬間を撮る' },
  { n: 2, title: 'なぞる', text: '指で形をぐるっと囲む' },
  { n: 3, title: '描き足す・名付ける', text: '目や手足を足して、名前をつける' },
];

export function RecordScreen() {
  const cameraRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const { challengeEntries } = useAppState();
  // 開催中の B 主題型お題。参加したら入口は消える
  const challenge = activeThemeChallenge();
  const joined = !!challenge && challengeEntries.some((e) => e.challengeId === challenge.id);
  /** いま選んでいる写真がお題への参加か */
  const [forChallenge, setForChallenge] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const doneEntry = doneId ? challengeEntries.find((e) => e.challengeId === doneId) : undefined;

  const pick = (ref: typeof cameraRef, challengeMode: boolean) => {
    setForChallenge(challengeMode);
    ref.current?.click();
  };

  const onPick = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // 同じ写真をもう一度選べるように
    if (!file) return;
    setLoading(true);
    try {
      const { blob, width, height } = await compressPhoto(file);
      setPhoto({ blob, width, height, url: URL.createObjectURL(blob) });
    } catch (err) {
      console.error(err);
      alert('写真を読み込めませんでした。別の写真でお試しください。');
    } finally {
      setLoading(false);
    }
  };

  const closeFlow = () => {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(null);
  };

  return (
    <div class="screen">
      <Dots x="68%" y="10px" cols={5} rows={3} />
      <Squiggle x="-12px" y="470px" w={90} color={5} rot={-8} />
      <Ring x="84%" y="540px" s={36} color={2} />

      <div class="screen-inner record">
        {challenge && !joined && (
          <section class="card challenge-card" aria-label={challenge.label}>
            <div class="challenge-art"><StickerArt id={challenge.reward.stickerId} /></div>
            <span class="chip challenge-chip">{challenge.label}</span>
            <h2 class="head challenge-theme">{challenge.theme}</h2>
            <p class="small challenge-lead">{challenge.lead}</p>
            <div class="challenge-actions">
              <button class="btn primary" onClick={() => pick(cameraRef, true)} disabled={loading}>
                <Camera size={18} strokeWidth={2.4} />撮って参加
              </button>
              <button class="btn" onClick={() => pick(albumRef, true)} disabled={loading} aria-label="アルバムから選んで参加">
                <ImageIcon size={18} strokeWidth={2.4} />アルバム
              </button>
            </div>
          </section>
        )}

        <h2 class="head record-title">今日、何に<br />見えた？</h2>

        <ol class="steps">
          {STEPS.map((s) => (
            <li class="card step">
              <span class="head step-n">{s.n}</span>
              <div>
                <div class="step-title">{s.title}</div>
                <div class="small muted">{s.text}</div>
              </div>
            </li>
          ))}
        </ol>

        <div class="record-actions">
          <button class="btn primary block record-cta" onClick={() => pick(cameraRef, false)} disabled={loading}>
            <Camera size={20} strokeWidth={2.4} />{loading ? '読み込み中…' : '写真を撮る'}
          </button>
          <button class="btn block" onClick={() => pick(albumRef, false)} disabled={loading}>
            <ImageIcon size={18} strokeWidth={2.4} />アルバムから選ぶ
          </button>
        </div>
        <p class="small muted record-note">保存されるのは、あなたが描いた「形」です。</p>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
        <input ref={albumRef} type="file" accept="image/*" hidden onChange={onPick} />
      </div>

      {photo && (
        <Portal>
          <TraceFlow
            photoURL={photo.url}
            aspect={photo.width / photo.height}
            showTakeStep
            topic={forChallenge && challenge ? `${challenge.label}「${challenge.theme}」` : undefined}
            saveLabel={forChallenge ? '参加する' : undefined}
            onClose={closeFlow}
            onSave={async ({ outline, details, name }) => {
              const id = newId();
              await savePhoto(id, photo.blob);
              if (forChallenge && challenge) {
                // お題の作品は収集とは別に残す（収集にも入れるかは、このあと選ぶ）
                joinChallenge(
                  { challengeId: challenge.id, createdAt: new Date().toISOString(), name, photoId: id, aspect: photo.width / photo.height, outline, details },
                  challenge.reward,
                );
                closeFlow();
                setDoneId(challenge.id);
                return;
              }
              addShape({ id, createdAt: new Date().toISOString(), name, photoId: id, aspect: photo.width / photo.height, outline, details });
              closeFlow();
              location.hash = href('collect');
            }}
          />
        </Portal>
      )}
      {doneEntry && challenge && (
        <Portal><ChallengeDone challenge={challenge} entry={doneEntry} onClose={() => setDoneId(null)} /></Portal>
      )}
    </div>
  );
}
