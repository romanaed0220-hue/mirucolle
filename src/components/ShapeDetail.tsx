// 形をタップしたときの詳細：元の写真の全体と、そのときなぞった輪郭・描き足した線。
// 右上の「⋯」から、つながりへの投稿と外部への共有ができる。
import { useEffect, useState } from 'preact/hooks';
import { MoreHorizontal, Send, Share2, Undo2, X } from 'lucide-preact';
import type { Shape } from '../data/storage';
import { loadPhoto, usePhotoURL } from '../data/photos';
import { setPosted } from '../data/store';
import { toSvgPath } from '../lib/path';
import { makeShareImage, shareOrDownload } from '../lib/shareImage';

export function ShapeDetail({ shape, onClose }: { shape: Shape; onClose: () => void }) {
  const url = usePhotoURL(shape.photoId);
  const [menu, setMenu] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [shareFile, setShareFile] = useState<File | null>(null);
  const date = new Date(shape.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  const stroke = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' } as const;

  // 共有画像はメニューを開いた時点で作っておく（iOS ではタップ直後でないと共有シートが開かないため）
  useEffect(() => {
    if (!menu || shareFile) return;
    let alive = true;
    loadPhoto(shape.photoId)
      .then((blob) => (blob ? makeShareImage(shape, blob) : null))
      .then((f) => { if (alive && f) setShareFile(f); })
      .catch((e) => console.error(e));
    return () => { alive = false; };
  }, [menu]);

  const togglePost = () => {
    const posting = !shape.postedAt;
    setPosted(shape.id, posting);
    setMenu(false);
    setNote(posting ? 'つながりに投稿しました。' : '投稿を取り消しました。');
  };

  const share = async () => {
    if (!shareFile) return;
    setMenu(false);
    try {
      const r = await shareOrDownload(shareFile, shape.name);
      if (r === 'downloaded') setNote('画像を保存しました。');
    } catch (e) {
      console.error(e);
      setNote('共有できませんでした。');
    }
  };

  return (
    <div class="overlay" role="dialog" aria-modal="true" aria-label={shape.name} onClick={onClose}>
      <div class="detail card" onClick={(e) => { e.stopPropagation(); if (menu) setMenu(false); }}>
        <header class="detail-head">
          <div>
            <h2 class="head detail-name">{shape.name}</h2>
            <p class="small muted">{date}{shape.postedAt ? '・つながりに投稿中' : ''}</p>
          </div>
          <div class="detail-tools">
            <button class="icon-btn" aria-label="メニュー" aria-expanded={menu} onClick={(e) => { e.stopPropagation(); setMenu(!menu); }}>
              <MoreHorizontal size={20} strokeWidth={2.4} />
            </button>
            <button class="icon-btn" aria-label="閉じる" onClick={onClose}><X size={20} strokeWidth={2.4} /></button>
            {menu && (
              <ul class="menu card" role="menu" onClick={(e) => e.stopPropagation()}>
                <li><button role="menuitem" onClick={togglePost}>
                  {shape.postedAt ? <><Undo2 size={18} />投稿を取り消す</> : <><Send size={18} />つながりに投稿</>}
                </button></li>
                <li><button role="menuitem" onClick={share} disabled={!shareFile}>
                  <Share2 size={18} />{shareFile ? '外部に共有' : '画像を準備中…'}
                </button></li>
              </ul>
            )}
          </div>
        </header>
        <div class="detail-photo" style={{ aspectRatio: `${shape.aspect}` }}>
          {url && <img src={url} alt="" />}
          <svg viewBox={`0 0 ${shape.aspect} 1`} preserveAspectRatio="none" aria-hidden="true">
            <path d={toSvgPath(shape.outline, shape.aspect, 1, true)} stroke="#fff" stroke-width="7" {...stroke} />
            <path d={toSvgPath(shape.outline, shape.aspect, 1, true)} stroke="#1A1A1A" stroke-width="3" {...stroke} />
            {shape.details.map((d) => (
              <>
                <path d={toSvgPath(d, shape.aspect, 1, false)} stroke="#fff" stroke-width="9" {...stroke} />
                <path d={toSvgPath(d, shape.aspect, 1, false)} stroke="#1A1A1A" stroke-width="5" {...stroke} />
              </>
            ))}
          </svg>
        </div>
        {note && <p class="small detail-note">{note}</p>}
      </div>
    </div>
  );
}
