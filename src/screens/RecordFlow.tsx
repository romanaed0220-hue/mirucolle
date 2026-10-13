// 記録の 2〜3 ステップ（なぞる → 描き足す・名付ける → 保存）。写真を選んだあと全画面で開く。
import { useState } from 'preact/hooks';
import { RotateCcw, Undo2, X } from 'lucide-preact';
import { DrawCanvas } from '../components/DrawCanvas';
import { savePhoto } from '../data/photos';
import { addShape } from '../data/store';
import type { Point } from '../data/storage';
import { newId } from '../lib/path';
import { href } from '../router';

export type PickedPhoto = { blob: Blob; url: string; width: number; height: number };

const NAME_MAX = 20;

export function RecordFlow({ photo, onClose }: { photo: PickedPhoto; onClose: () => void }) {
  const [step, setStep] = useState<'trace' | 'detail'>('trace');
  const [outline, setOutline] = useState<Point[] | null>(null);
  const [tooSmall, setTooSmall] = useState(false);
  const [details, setDetails] = useState<Point[][]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const aspect = photo.width / photo.height;

  const close = () => {
    if (outline && !confirm('描いた形は保存されません。やめますか？')) return;
    onClose();
  };

  const save = async () => {
    if (!outline || saving) return;
    setSaving(true);
    try {
      const id = newId();
      await savePhoto(id, photo.blob);
      addShape({
        id,
        createdAt: new Date().toISOString(),
        name: name.trim() || 'なまえのない形',
        photoId: id,
        aspect,
        outline,
        details,
      });
      onClose();
      location.hash = href('collect');
    } catch (e) {
      console.error(e);
      alert('保存できませんでした。もう一度お試しください。');
      setSaving(false);
    }
  };

  return (
    <div class="flow">
      <header class="flow-head">
        <button class="icon-btn" aria-label="やめる" onClick={close}><X size={20} strokeWidth={2.4} /></button>
        <ol class="flow-steps" aria-label="ステップ">
          <li class="done">撮る</li>
          <li class={step === 'trace' ? 'on' : 'done'}>なぞる</li>
          <li class={step === 'detail' ? 'on' : ''}>描き足す・名付ける</li>
        </ol>
      </header>

      <p class="flow-hint small">
        {step === 'trace'
          ? tooSmall
            ? 'もう少し大きく、ぐるっと一周囲んでみてください。'
            : '見えた形を、指でぐるっと一周なぞってください。'
          : '目や口、手足などを描き足して、名前をつけましょう。'}
      </p>

      <DrawCanvas
        photoURL={photo.url}
        aspect={aspect}
        mode={step === 'trace' ? 'outline' : 'detail'}
        outline={outline}
        details={details}
        onOutline={(pts, invalid) => {
          setOutline(pts);
          setTooSmall(invalid);
        }}
        onDetail={(pts) => setDetails((d) => [...d, pts])}
      />

      {step === 'trace' ? (
        <footer class="flow-foot">
          <button class="btn" onClick={() => { setOutline(null); setTooSmall(false); }} disabled={!outline}>
            <RotateCcw size={18} strokeWidth={2.4} />やり直す
          </button>
          <button class="btn primary" onClick={() => setStep('detail')} disabled={!outline}>次へ</button>
        </footer>
      ) : (
        <footer class="flow-foot detail">
          <input
            class="name-input"
            type="text"
            inputMode="text"
            enterKeyHint="done"
            maxLength={NAME_MAX}
            placeholder="なまえ（例：ねむいくじら）"
            value={name}
            onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
          />
          <div class="flow-foot-row">
            <button class="btn" onClick={() => (details.length ? setDetails((d) => d.slice(0, -1)) : setStep('trace'))}>
              <Undo2 size={18} strokeWidth={2.4} />{details.length ? '一つ戻す' : 'なぞり直す'}
            </button>
            <button class="btn primary" onClick={save} disabled={saving}>{saving ? '保存中…' : '保存する'}</button>
          </div>
        </footer>
      )}
    </div>
  );
}
