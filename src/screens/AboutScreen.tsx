// このアプリについて：アプリの考え方と、サンプル写真のクレジット（CC BY の表示義務）
import { ExternalLink } from 'lucide-preact';
import { SAMPLE_PHOTOS } from '../config/samplePhotos';
import { APP_VERSION } from '../config/env';

// ライセンス本文へのリンク（CC BY は表示義務）
function licenseURL(lic: string): string | null {
  const m = lic.match(/^CC BY (\d\.\d)/);
  if (m) return `https://creativecommons.org/licenses/by/${m[1]}/deed.ja`;
  if (lic === 'CC0') return 'https://creativecommons.org/publicdomain/zero/1.0/deed.ja';
  return null;
}

export function AboutScreen() {
  return (
    <div class="screen">
      <div class="screen-inner about">
        <div class="card about-card">
          <p class="small">
            ミルコレは<span class="mark">先に描く、それから見る</span>アプリです。
            日常の「何かに見える」をなぞって、あつめます。ほかの人の見え方は、自分で描いたあとにひらきます。
          </p>
          <p class="small muted">データはこの端末の中だけに保存されます。 v{APP_VERSION}</p>
        </div>

        <h2 class="head about-h">写真クレジット</h2>
        <p class="small muted">つながりのサンプル写真は Wikimedia Commons の自由ライセンスの写真を、縮小して使っています。</p>
        <ul class="credits">
          {SAMPLE_PHOTOS.map((p) => (
            <li>
              <b>{p.what}</b>
              <span class="small">
                {p.credit.author}／{licenseURL(p.credit.license)
                  ? <a href={licenseURL(p.credit.license)!} target="_blank" rel="noopener noreferrer">{p.credit.license}</a>
                  : p.credit.license}
              </span>
              <a class="small" href={p.credit.url} target="_blank" rel="noopener noreferrer">
                {p.credit.title}<ExternalLink size={12} strokeWidth={2.4} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
