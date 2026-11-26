/*
 * 写真の上に指で描くキャンバス。
 * - outline モード：1 筆でぐるっと囲む。指を離すと自動で閉じる。描き直すと置き換え。
 * - detail モード：囲んだ形の中に線を描き足す（外側は薄く隠す）。
 * - 2 本指：つまんで拡大（最大 4 倍）、ずらして移動。トラックパッドのピンチ／2 本指スクロールも同じ。
 *   2 本目の指が触れたら、1 本目で描きかけた線は取り消す。
 * 座標は写真の幅・高さを 1 とした割合で扱う（拡大しても同じ）。
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Minus, Plus, Maximize } from 'lucide-preact';
import type { Point } from '../data/storage';
import { bounds, round4, tracePath } from '../lib/path';
import { strokeWithPen, type PenStyle } from '../lib/pen';

type Props = {
  photoURL: string;
  aspect: number;
  mode: 'outline' | 'detail';
  outline: Point[] | null;
  details: Point[][];
  /** 輪郭・描き足した線それぞれのペンと、いま描いている線のペン */
  outlinePen?: PenStyle;
  detailPens?: PenStyle[];
  pen?: PenStyle;
  /** 描き始め：(null, false)／小さすぎて無効：(null, true)／成功：(点列, false) */
  onOutline?: (pts: Point[] | null, invalid: boolean) => void;
  onDetail?: (pts: Point[]) => void;
};

const MIN_STEP_PX = 3;
const DETAIL_W = 5;
const MAX_ZOOM = 4;

type View = { z: number; x: number; y: number };

export function DrawCanvas(props: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  // 拡大・移動（transform-origin は左上。x, y は枠の中でのずれ px）
  const [view, setView] = useState<View>({ z: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const boxRef = useRef(box);
  boxRef.current = box;
  // キャンバスの解像度の倍率。拡大しても線がぼやけないように（0.5 刻み、最大 3）
  const res = Math.min(3, Math.ceil(view.z * 2) / 2);
  const resRef = useRef(res);
  resRef.current = res;
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
    const k = dpr * resRef.current;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, box.w, box.h);
    const { mode, outline, details, outlinePen, detailPens, pen } = propsRef.current;
    const W = box.w, H = box.h;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 拡大中は、線の太さを画面の上で同じに保つ（細かいところが線で隠れないように）
    const z = viewRef.current.z;
    const stroke = (pts: Point[], closed: boolean, w: number, p?: PenStyle) => {
      tracePath(ctx, pts, W, H, closed);
      strokeWithPen(ctx, p, w / z, 4 / z);
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
    if (outline) stroke(outline, true, 3, outlinePen);
    details.forEach((d, i) => stroke(d, false, DETAIL_W, detailPens?.[i]));
    if (live.current) stroke(live.current.pts, false, mode === 'outline' ? 3 : DETAIL_W, pen);
  };

  // キャンバスの解像度を合わせて再描画
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !box.w) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(box.w * dpr * res);
    c.height = Math.round(box.h * dpr * res);
    draw();
  }, [box.w, box.h, res]);

  useEffect(draw, [props.outline, props.details, props.mode, props.outlinePen, props.detailPens, view.z]);

  /** 拡大率 z にして、枠の中の点 (cx, cy) の下にある写真の位置を動かさない */
  const clampView = (v: View): View => {
    const { w, h } = boxRef.current;
    const z = Math.min(MAX_ZOOM, Math.max(1, v.z));
    return { z, x: Math.min(0, Math.max(w * (1 - z), v.x)), y: Math.min(0, Math.max(h * (1 - z), v.y)) };
  };
  const zoomAt = (from: View, z: number, cx: number, cy: number): View => {
    const px = (cx - from.x) / from.z, py = (cy - from.y) / from.z;
    return clampView({ z, x: cx - z * px, y: cy - z * py });
  };
  const zoomBy = (f: number) => {
    const { w, h } = boxRef.current;
    setView((v) => zoomAt(v, v.z * f, w / 2, h / 2));
  };

  // ポインター操作（ネイティブで登録：passive にしない、スクロールさせない）
  useEffect(() => {
    const c = canvasRef.current;
    const frame = frameRef.current;
    if (!c || !frame) return;
    let raf = 0;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch: { d0: number; mx: number; my: number; v0: View } | null = null;
    let blocked = false; // 2 本指の操作のあと、指が全部離れるまで描かない

    const rel = (e: { clientX: number; clientY: number }) => {
      const r = frame.getBoundingClientRect();
      return { x: e.clientX - r.left - 2, y: e.clientY - r.top - 2 }; // 枠線 2px の内側
    };
    const pinchState = () => {
      const [a, b] = [...pointers.values()];
      return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    };
    const toPoint = (e: PointerEvent): Point => {
      const r = c.getBoundingClientRect(); // 拡大中も、見えている大きさで割れば写真の割合になる
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      return [round4(x), round4(y)];
    };

    const down = (e: PointerEvent) => {
      e.preventDefault();
      pointers.set(e.pointerId, rel(e));
      if (pointers.size === 2) {
        // 2 本目：描きかけの線を取り消して、つまむ操作に切り替える
        if (live.current) { live.current = null; draw(); }
        const st = pinchState();
        pinch = { d0: Math.max(1, st.d), mx: st.mx, my: st.my, v0: viewRef.current };
        blocked = true;
        return;
      }
      if (pointers.size > 2 || blocked || live.current) return;
      // 閉じた形ができたら、うっかり触っても消さない（消すのは「やり直す」だけ）
      if (propsRef.current.mode === 'outline' && propsRef.current.outline) return;
      try { frame.setPointerCapture(e.pointerId); } catch { /* 合成イベントなどで失敗しても描画は続ける */ }
      live.current = { id: e.pointerId, pts: [toPoint(e)] };
      draw();
    };
    const move = (e: PointerEvent) => {
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, rel(e));
      if (pinch && pointers.size >= 2) {
        e.preventDefault();
        const st = pinchState();
        const { v0, d0, mx, my } = pinch;
        const z = Math.min(MAX_ZOOM, Math.max(1, v0.z * (st.d / d0)));
        // つまみ始めの真ん中にあった写真の点が、いまの真ん中に来るように
        const px = (mx - v0.x) / v0.z, py = (my - v0.y) / v0.z;
        setView(clampView({ z, x: st.mx - z * px, y: st.my - z * py }));
        return;
      }
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
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) blocked = false;
      const l = live.current;
      if (!l || l.id !== e.pointerId) return;
      live.current = null;
      const { mode, onOutline, onDetail } = propsRef.current;
      if (mode === 'outline') {
        const b = bounds(l.pts);
        // 小さすぎる・点が少なすぎる囲みは無効（画面に見えている大きさで判定：拡大すれば小さい形も囲める）
        const r = c.getBoundingClientRect();
        const ok = l.pts.length >= 8 && b.w * r.width >= 40 && b.h * r.height >= 40;
        onOutline?.(ok ? l.pts : null, !ok);
      } else if (l.pts.length >= 1) {
        // 1 回タップは点：少しだけずらした 2 点にする（右端では左へずらして 1 を超えないように）
        const [x0, y0] = l.pts[0];
        onDetail?.(l.pts.length === 1 ? [l.pts[0], [round4(x0 > 0.99 ? x0 - 0.002 : x0 + 0.002), y0]] : l.pts);
      }
      draw();
    };
    // トラックパッド：ピンチ（ctrlKey つきの wheel）で拡大、2 本指スクロールで移動
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = rel(e);
      if (e.ctrlKey) setView((v) => zoomAt(v, v.z * Math.exp(-e.deltaY * 0.01), p.x, p.y));
      else setView((v) => clampView({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    };
    frame.addEventListener('pointerdown', down);
    frame.addEventListener('pointermove', move);
    frame.addEventListener('pointerup', up);
    frame.addEventListener('pointercancel', up);
    frame.addEventListener('wheel', wheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      frame.removeEventListener('pointerdown', down);
      frame.removeEventListener('pointermove', move);
      frame.removeEventListener('pointerup', up);
      frame.removeEventListener('pointercancel', up);
      frame.removeEventListener('wheel', wheel);
    };
  }, [box.w, box.h]);

  const size = { width: `${box.w}px`, height: `${box.h}px` };
  return (
    <div class="draw-stage" ref={stageRef}>
      <div class="draw-box" ref={frameRef} style={{ width: `${box.w + 4}px`, height: `${box.h + 4}px` }}>
        <div class="draw-zoom" style={{ ...size, transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})` }}>
          <img src={props.photoURL} alt="" draggable={false} />
          <canvas ref={canvasRef} style={size} />
        </div>
        <div class="zoom-ctl" onPointerDown={(e) => e.stopPropagation()}>
          {view.z > 1 && (
            <button class="zoom-btn" aria-label="もとの大きさにもどす" onClick={() => setView({ z: 1, x: 0, y: 0 })}><Maximize size={16} strokeWidth={2.6} /></button>
          )}
          <button class="zoom-btn" aria-label="ちいさく" disabled={view.z <= 1} onClick={() => zoomBy(1 / 1.5)}><Minus size={16} strokeWidth={2.8} /></button>
          <button class="zoom-btn" aria-label="おおきく" disabled={view.z >= MAX_ZOOM} onClick={() => zoomBy(1.5)}><Plus size={16} strokeWidth={2.8} /></button>
        </div>
      </div>
    </div>
  );
}
