// 外部共有用の画像：写真の上に輪郭と描き足した線、下の帯に名前。
import type { Shape } from '../data/storage';
import { tracePath } from './path';
import { strokeWithPen, type PenStyle } from './pen';

const WIDTH = 1080;
const BAND = 170;

async function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function makeShareImage(shape: Shape, photo: Blob): Promise<File> {
  const img = await loadImage(photo);
  const ph = Math.round(WIDTH / shape.aspect);
  const c = document.createElement('canvas');
  c.width = WIDTH;
  c.height = ph + BAND;
  const ctx = c.getContext('2d')!;

  ctx.drawImage(img, 0, 0, WIDTH, ph);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const stroke = (pts: Shape['outline'], closed: boolean, w: number, pen?: PenStyle) => {
    tracePath(ctx, pts, WIDTH, ph, closed);
    strokeWithPen(ctx, pen, w, 8);
  };
  stroke(shape.outline, true, 8, shape.outlinePen);
  shape.details.forEach((d, i) => stroke(d, false, 11, shape.detailPens?.[i]));

  // 下の帯
  ctx.fillStyle = '#FFFDF6';
  ctx.fillRect(0, ph, WIDTH, BAND);
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(0, ph, WIDTH, 5);
  try { await document.fonts.load('56px "Dela Gothic One"'); } catch { /* 読めなければ代替フォント */ }
  ctx.textBaseline = 'middle';
  ctx.font = '56px "Dela Gothic One", "Hiragino Sans", sans-serif';
  ctx.fillText(shape.name, 48, ph + BAND * 0.42, WIDTH - 96);
  ctx.font = '700 28px "M PLUS Rounded 1c", "Hiragino Sans", sans-serif';
  ctx.fillStyle = '#6B6B6B';
  ctx.fillText('ミルコレ ─ 先に描く、それから見る', 48, ph + BAND * 0.78, WIDTH - 96);

  const blob = await new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
  return new File([blob], `mirucolle-${shape.name}.png`, { type: 'image/png' });
}

/** OS の共有シートで共有する。共有できない環境では画像を保存する */
export async function shareOrDownload(file: File, title: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelled';
      throw e;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
