/*
 * コレクションの瓶。中の形は Matter.js で物理的に動く（当たり判定は楕円）。
 * - スマホを傾けると重力の向きが変わる（iOS はボタンで許可をもらう）
 * - 傾きが使えなくても、指でつまんで動かせる／「ふる」でゆらせる
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import Matter from 'matter-js';
import { Smartphone, Waves, X } from 'lucide-preact';
import { bottleById } from '../config/bottles';
import type { Collection, Shape } from '../data/storage';
import { useFit } from '../lib/useFit';
import { ShapeSticker, stickerBox } from './ShapeSticker';

const { Engine, Bodies, Body, Composite, Constraint, Query } = Matter;

// 瓶の座標系（この単位で物理演算し、表示時に拡大縮小する）
const VW = 300, VH = 440;
const IN = { left: 20, right: 280, top: 150, bottom: 420 }; // 胴の内側（肩より下）
const WALL = 60;

const BOTTLE_PATH =
  'M120,18 h60 v52 c70,18 104,44 104,92 v228 a34,34 0 0 1 -34,34 h-200 a34,34 0 0 1 -34,-34 v-228 c0,-48 34,-74 104,-92 z';
const CAP_PATH = 'M112,6 h76 v34 h-76 z';

type Orientation = 'unknown' | 'needs-permission' | 'on' | 'unavailable';

function maxSideFor(n: number) {
  return Math.max(64, Math.min(104, 120 - n * 6));
}

export function BottleView({ collection, shapes, onClose }: { collection: Collection; shapes: Shape[]; onClose: () => void }) {
  const style = bottleById(collection.bottleId);
  const [stageRef, size] = useFit<HTMLDivElement>(VW / VH);
  const scale = size.w / VW;
  const layerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const engineRef = useRef<Matter.Engine | null>(null);
  const bodiesRef = useRef<Matter.Body[]>([]);
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const [orientation, setOrientation] = useState<Orientation>('unknown');

  const maxSide = maxSideFor(shapes.length);
  const dims = shapes.map((s) => {
    const b = stickerBox(s);
    const k = maxSide / Math.max(b.w, b.h);
    return { w: Math.round(b.w * k), h: Math.round(b.h * k) };
  });

  // 物理エンジン
  useEffect(() => {
    const engine = Engine.create();
    engine.gravity.y = 1;
    engineRef.current = engine;
    const walls = [
      Bodies.rectangle(IN.left - WALL / 2, VH / 2, WALL, VH * 2, { isStatic: true }),
      Bodies.rectangle(IN.right + WALL / 2, VH / 2, WALL, VH * 2, { isStatic: true }),
      Bodies.rectangle(VW / 2, IN.bottom + WALL / 2, VW * 2, WALL, { isStatic: true }),
      Bodies.rectangle(VW / 2, IN.top - WALL / 2, VW * 2, WALL, { isStatic: true }),
    ];
    const bodies = dims.map((d, i) => {
      const r = Math.max(d.w, d.h) / 2;
      const x = IN.left + r + Math.random() * Math.max(1, IN.right - IN.left - r * 2);
      const y = IN.top + r + (i % 4) * 30 + Math.random() * 20;
      const b = Bodies.circle(x, y, r * 0.86, { restitution: 0.35, friction: 0.05, frictionAir: 0.012, density: 0.002 });
      Body.scale(b, d.w / (r * 2), d.h / (r * 2)); // 楕円にする
      Body.setAngle(b, (Math.random() - 0.5) * 0.6);
      return b;
    });
    bodiesRef.current = bodies;
    Composite.add(engine.world, [...walls, ...bodies]);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      Engine.update(engine, dt);
      bodies.forEach((b, i) => {
        const el = itemRefs.current[i];
        if (!el) return;
        el.style.transform = `translate(${b.position.x - dims[i].w / 2}px, ${b.position.y - dims[i].h / 2}px) rotate(${b.angle}rad)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      Engine.clear(engine);
    };
  }, []);

  // 傾き：Android などは許可なしで届く。iOS はボタンで許可が必要
  useEffect(() => {
    const DOE = (window as any).DeviceOrientationEvent;
    if (!DOE) { setOrientation('unavailable'); return; }
    if (typeof DOE.requestPermission === 'function') { setOrientation('needs-permission'); return; }
    return listenOrientation();
  }, []);

  function listenOrientation() {
    const onOrient = (e: DeviceOrientationEvent) => {
      const engine = engineRef.current;
      if (!engine || e.beta === null || e.gamma === null) return;
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      engine.gravity.x = clamp(e.gamma / 45);
      engine.gravity.y = clamp(e.beta / 45);
      setOrientation('on');
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }

  const askPermission = async () => {
    try {
      const r = await (window as any).DeviceOrientationEvent.requestPermission();
      if (r === 'granted') { listenOrientation(); setOrientation('on'); }
      else setOrientation('unavailable');
    } catch {
      setOrientation('unavailable');
    }
  };

  const shake = () => {
    for (const b of bodiesRef.current) {
      Body.setVelocity(b, { x: (Math.random() - 0.5) * 14, y: -4 - Math.random() * 8 });
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.4);
    }
  };

  // 指でつまんで動かす
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    let grab: { id: number; c: Matter.Constraint } | null = null;
    const toWorld = (e: PointerEvent) => {
      const r = layer.getBoundingClientRect();
      const s = scaleRef.current || 1;
      return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
    };
    const down = (e: PointerEvent) => {
      const engine = engineRef.current;
      if (!engine || grab) return;
      const p = toWorld(e);
      const hit = Query.point(bodiesRef.current, p)[0];
      if (!hit) return;
      e.preventDefault();
      try { layer.setPointerCapture(e.pointerId); } catch { /* 合成イベント */ }
      const c = Constraint.create({ pointA: p, bodyB: hit, pointB: { x: 0, y: 0 }, stiffness: 0.15, damping: 0.1, length: 0 });
      Composite.add(engine.world, c);
      grab = { id: e.pointerId, c };
    };
    const move = (e: PointerEvent) => {
      if (!grab || grab.id !== e.pointerId) return;
      e.preventDefault();
      const p = toWorld(e);
      grab.c.pointA = p;
    };
    const up = (e: PointerEvent) => {
      if (!grab || grab.id !== e.pointerId) return;
      if (engineRef.current) Composite.remove(engineRef.current.world, grab.c);
      grab = null;
    };
    layer.addEventListener('pointerdown', down);
    layer.addEventListener('pointermove', move);
    layer.addEventListener('pointerup', up);
    layer.addEventListener('pointercancel', up);
    return () => {
      layer.removeEventListener('pointerdown', down);
      layer.removeEventListener('pointermove', move);
      layer.removeEventListener('pointerup', up);
      layer.removeEventListener('pointercancel', up);
    };
  }, [size.w]);

  return (
    <div class="bottle-view" role="dialog" aria-modal="true" aria-label={collection.theme}>
      <header class="flow-head bottle-head">
        <button class="icon-btn" aria-label="閉じる" onClick={onClose}><X size={20} strokeWidth={2.4} /></button>
        <div>
          <p class="small muted">コレクション</p>
          <h2 class="head bottle-theme">{collection.theme}</h2>
        </div>
      </header>

      <div class="bottle-stage" ref={stageRef}>
        <div class="bottle-box" style={{ width: `${size.w}px`, height: `${size.h}px` }}>
          <svg class="bottle-glass" viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true">
            <path d={BOTTLE_PATH} fill={style.glass} />
          </svg>
          <div class="bottle-layer" ref={layerRef} style={{ width: `${VW}px`, height: `${VH}px`, transform: `scale(${scale})` }}>
            {shapes.map((s, i) => (
              <div class="bottle-item" ref={(el) => { itemRefs.current[i] = el; }} style={{ width: `${dims[i].w}px`, height: `${dims[i].h}px` }}>
                <ShapeSticker shape={s} maxSide={maxSide} uid={`b-${collection.id}-${s.id}`} />
              </div>
            ))}
          </div>
          <svg class="bottle-front" viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true">
            <path d="M52,170 v170" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".7" />
            <path d="M52,360 v18" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity=".7" />
            <path d={BOTTLE_PATH} fill="none" stroke="#1A1A1A" stroke-width="5" stroke-linejoin="round" />
            <path d={CAP_PATH} fill={style.cap} stroke="#1A1A1A" stroke-width="5" stroke-linejoin="round" />
          </svg>
        </div>
      </div>

      <footer class="bottle-foot">
        <p class="small muted bottle-hint">
          {orientation === 'on' ? 'スマホを傾けると、形が転がります。' : '指でつまんで動かせます。'}
        </p>
        <div class="flow-foot">
          {orientation === 'needs-permission' && (
            <button class="btn" onClick={askPermission}><Smartphone size={18} strokeWidth={2.4} />傾けて動かす</button>
          )}
          <button class="btn primary" onClick={shake}><Waves size={18} strokeWidth={2.4} />ふる</button>
        </div>
      </footer>
    </div>
  );
}
