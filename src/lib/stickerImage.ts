// シールの絵（SVG）を画像にする。共有画像の Canvas に描くため。CSS 変数の色は実際の色に置き換える
import { h, render } from 'preact';
import { StickerArt } from '../components/StickerArt';

const cache = new Map<string, Promise<HTMLImageElement | null>>();

export function stickerImage(id: string): Promise<HTMLImageElement | null> {
  let p = cache.get(id);
  if (!p) {
    p = (async () => {
      const box = document.createElement('div');
      render(h(StickerArt, { id }), box);
      const svg = box.querySelector('svg');
      if (!svg) return null;
      const vb = svg.viewBox.baseVal;
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', String(vb.width * 4));
      svg.setAttribute('height', String(vb.height * 4));
      const css = getComputedStyle(document.documentElement);
      const text = svg.outerHTML.replace(/var\((--[\w-]+)\)/g, (_, name: string) => css.getPropertyValue(name).trim() || '#1A1A1A');
      render(null, box);
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
      await img.decode();
      return img;
    })().catch((e) => { console.error(e); return null; });
    cache.set(id, p);
  }
  return p;
}
