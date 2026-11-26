// 開発版だけ：サンプル写真に見え方を描いて、書き出す（docs/05 参照）
import { useState } from 'preact/hooks';
import { Copy, Download, Pencil, X } from 'lucide-preact';
import { Portal } from '../components/Portal';
import { TraceFlow } from '../components/TraceFlow';
import { SAMPLE_PHOTOS, samplePhotoURL, type SamplePhoto } from '../config/samplePhotos';
import bundled from '../config/sampleTraces.json';
import type { TraceBook } from '../config/feed';
import { addMakerTrace, loadMakerBook, makerExportFile, removeMakerTrace } from '../data/maker';
import { newId } from '../lib/path';
import { shareOrDownload } from '../lib/shareImage';

const KIND_LABEL = { view: '見るだけ', ask: '先に描く', odai: 'お題' } as const;

export function MakerScreen() {
  const [book, setBook] = useState<TraceBook>(loadMakerBook);
  const [drawing, setDrawing] = useState<SamplePhoto | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const shipped = bundled as TraceBook;
  const total = Object.values(book).reduce((n, l) => n + l.length, 0);

  const exportFile = async () => {
    try {
      const r = await shareOrDownload(makerExportFile(book), 'ミルコレ サンプル');
      if (r !== 'cancelled') setNote('書き出しました。このファイルを送ってください。');
    } catch (e) {
      console.error(e);
      setNote('書き出せませんでした。「コピー」を試してください。');
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(book));
      setNote('コピーしました。メッセージに貼り付けて送ってください。');
    } catch {
      setNote('コピーできませんでした。');
    }
  };

  return (
    <div class="screen">
      <div class="screen-inner maker">
        <div class="card maker-intro">
          <p class="small">
            つながりに出す「ほかの人の見え方」を描くページです（開発版だけ）。
            写真をえらんで、見えた形をなぞり、名前をつけてください。1 枚に何個描いても大丈夫です。
            友だちに描いてもらうのもおすすめです。
          </p>
          <p class="small muted">描いたものは、この開発版のつながりにすぐ混ざります。最後に「書き出す」でファイルを送ってください。</p>
        </div>

        <div class="maker-actions">
          <button class="btn primary" onClick={exportFile} disabled={!total}><Download size={18} strokeWidth={2.4} />書き出す（{total}）</button>
          <button class="btn" onClick={copy} disabled={!total}><Copy size={16} strokeWidth={2.4} />コピー</button>
        </div>
        {note && <p class="small maker-note">{note}</p>}

        <ul class="maker-grid">
          {SAMPLE_PHOTOS.map((p) => {
            const mine = book[p.slug] ?? [];
            const already = (shipped[p.slug] ?? []).length;
            return (
              <li class="card maker-item">
                <button class="maker-photo" onClick={() => setDrawing(p)} aria-label={`${p.what}をなぞる`}>
                  <img src={samplePhotoURL(p.slug)} alt="" loading="lazy" />
                  <span class="chip maker-kind">{KIND_LABEL[p.kind]}</span>
                  <span class="maker-pen"><Pencil size={16} strokeWidth={2.6} /></span>
                </button>
                <p class="maker-what">{p.what}{already ? <span class="small muted">（入っている {already}）</span> : null}</p>
                {mine.length > 0 && (
                  <ul class="maker-traces">
                    {mine.map((t) => (
                      <li>
                        <span>{t.name}</span>
                        <button aria-label={`${t.name}を消す`} onClick={() => { if (confirm(`「${t.name}」を消しますか？`)) setBook(removeMakerTrace(book, p.slug, t.id)); }}>
                          <X size={14} strokeWidth={2.6} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {drawing && (
        <Portal>
          <TraceFlow
            photoURL={samplePhotoURL(drawing.slug)}
            aspect={drawing.aspect}
            saveLabel="追加する"
            onClose={() => setDrawing(null)}
            onSave={async ({ outline, details, name, outlinePen, detailPens }) => {
              setBook(addMakerTrace(book, drawing.slug, { id: newId(), name, outline, details, outlinePen, detailPens }));
              setNote(`「${name}」を追加しました。`);
              setDrawing(null);
            }}
          />
        </Portal>
      )}
    </div>
  );
}
