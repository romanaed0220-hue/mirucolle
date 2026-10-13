import { useLayoutEffect, useRef, useState } from 'preact/hooks';

/** 親要素に収まる、縦横比 aspect（幅/高さ）の最大サイズ。margin はそのぶん内側に収める */
export function useFit<T extends HTMLElement>(aspect: number, margin = 0) {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current!;
    const fit = () => {
      const sw = el.clientWidth - margin, sh = el.clientHeight - margin;
      if (sw <= 0 || sh <= 0) return;
      const w = Math.min(sw, sh * aspect);
      setSize({ w: Math.floor(w), h: Math.floor(w / aspect) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect, margin]);
  return [ref, size] as const;
}
