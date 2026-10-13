/*
 * 写真の上に指で描くキャンバス。
 * - outline モード：1 筆でぐるっと囲む。指を離すと自動で閉じる。描き直すと置き換え。
 * - detail モード：囲んだ形の中に線を描き足す（外側は薄く隠す）。
 * 座標は写真の幅・高さを 1 とした割合で扱う。
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { Point } from '../data/storage';
import { bounds, round4, tracePath } from '../lib/path';

type Props = {
  photoURL: string;
  aspect: number;
  mode: 'outline' | 'detail';
  outline: Point[] | null;
  details: Point[][];
  /** 描き始め：(null, false)／小さすぎて無効：(null, true)／成功：(点列, false) */
  onOutline?: (pts: Point[] | null, invalid: boolean) => void;
  onDetail?: (pts: Point[]) => void;
};

const MIN_STEP_PX = 3;
const DETAIL_W = 5;

export function DrawCanvas(props: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const live = useRef<{ id: number; pts: Point[] } | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  // ステージに収まる大きさ（写真の比率を保つ）
  useLayoutEffect(() => {
    const el = stageRef.current!;
    const fit = () => {
      // 枠線（左右上下 2px）と影（4px）の分を引いて、はみ出さないようにする
      const sw = el.clientWidth - 8, sh = el.clientHeight - 8;
      if (sw <= 0 || sh <= 0) return;
      const a = propsRef.current.aspect;
      const w = Math.min(sw, sh * a);
      setBox({ w: Math.floor(w), h: Math.floor(w / a) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const draw = () => {
    const c = canvasRef.current;
    if (!c || !box.w) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, box.w, box.h);
    const { mode, outline, details } = propsRef.current;
    const W = box.w, H = box.h;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const stroke = (pts: Point[], closed: boolean, w: number) => {
      tracePath(ctx, pts, W, H, closed);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = w + 4;
      ctx.stroke();
      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = w;
      ctx.stroke();
    };

    if (outline && mode === 'detail') {
      // 形の外側を薄く隠して、形の中に集中できるように
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      tracePath(ctx, outline, W, H, true, false);
      ctx.fillStyle = 'rgba(255, 253, 246, 0.72)';
      ctx.fill('evenodd');
      ctx.restore();
    }
    if (outline) stroke(outline, true, 3);
    for (const d of details) stroke(d, false, DETAIL_W);
    if (live.current) stroke(live.current.pts, false, mode === 'outline' ? 3 : DETAIL_W);
  };

  // キャンバスの解像度を合わせて再描画
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !box.w) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(box.w * dpr);
    c.height = Math.round(box.h * dpr);
    draw();
  }, [box.w, box.h]);

  useEffect(draw, [props.outline, props.details, props.mode]);

  // ポインター操作（ネイティブで登録：passive にしない、スクロールさせない）
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    let raf = 0;
    const toPoint = (e: PointerEvent): Point => {
      const r = c.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      return [round4(x), round4(y)];
    };
    const down = (e: PointerEvent) => {
      if (live.current) return; // 2 本目の指は無視
      e.preventDefault();
      // 閉じた形ができたら、うっかり触っても消さない（消すのは「やり直す」だけ）
      if (propsRef.current.mode === 'outline' && propsRef.current.outline) return;
      try { c.setPointerCapture(e.pointerId); } catch { /* 合成イベントなどで失敗しても描画は続ける */ }
      live.current = { id: e.pointerId, pts: [toPoint(e)] };
      draw();
    };
    const move = (e: PointerEvent) => {
      const l = live.current;
      if (!l || l.id !== e.pointerId) return;
      e.preventDefault();
      const r = c.getBoundingClientRect();
      const coalesced = e.getCoalescedEvents?.();
      const events = coalesced && coalesced.length ? coalesced : [e];
      for (const ev of events) {
        const p = toPoint(ev);
        const last = l.pts[l.pts.length - 1];
        const dx = (p[0] - last[0]) * r.width, dy = (p[1] - last[1]) * r.height;
        if (dx * dx + dy * dy >= MIN_STEP_PX * MIN_STEP_PX) l.pts.push(p);
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };
    const up = (e: PointerEvent) => {
      const l = live.current;
      if (!l || l.id !== e.pointerId) return;
      live.current = null;
      const { mode, onOutline, onDetail } = propsRef.current;
      if (mode === 'outline') {
        const b = bounds(l.pts);
        const r = c.getBoundingClientRect();
        // 小さすぎる・点が少なすぎる囲みは無効
        const ok = l.pts.length >= 8 && b.w * r.width >= 40 && b.h * r.height >= 40;
        onOutline?.(ok ? l.pts : null, !ok);
      } else if (l.pts.length >= 1) {
        onDetail?.(l.pts.length === 1 ? [l.pts[0], [round4(l.pts[0][0] + 0.002), l.pts[0][1]]] : l.pts);
      }
      draw();
    };
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    return () => {
      cancelAnimationFrame(raf);
      c.removeEventListener('pointerdown', down);
      c.removeEventListener('pointermove', move);
      c.removeEventListener('pointerup', up);
      c.removeEventListener('pointercancel', up);
    };
  }, [box.w, box.h]);

  const size = { width: `${box.w}px`, height: `${box.h}px` };
  return (
    <div class="draw-stage" ref={stageRef}>
      <div class="draw-box" style={{ width: `${box.w + 4}px`, height: `${box.h + 4}px` }}>
        <img src={props.photoURL} alt="" draggable={false} />
        <canvas ref={canvasRef} style={size} />
      </div>
    </div>
  );
}
