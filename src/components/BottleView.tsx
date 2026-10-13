/*
 * コレクションの瓶。中の形は Matter.js で物理的に動く（当たり判定は楕円）。
 * - スマホを傾けると重力の向きが変わる（iOS の許可は、瓶を開いたタップの中で取る：lib/orientation.ts）
 * - 指でつまんで動かせる／「ふる」でゆらせる
 * 壁は瓶の絵の輪郭（胴・肩・首・底の角）に沿って置き、形がガラスの外に出ないようにする。
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import Matter from 'matter-js';
import { Waves, X } from 'lucide-preact';
import { bottleById } from '../config/bottles';
import type { Collection, Shape } from '../data/storage';
import { useFit } from '../lib/useFit';
import { ShapeSticker, stickerBox } from './ShapeSticker';

const { Engine, Bodies, Body, Composite, Constraint, Query } = Matter;

// 瓶の座標系（この単位で物理演算し、表示時に拡大縮小する）
const VW = 320, VH = 470;
const CX = 160;

// 瓶の輪郭（内側の線）。絵と物理の壁はこの数値を共有する
const G = {
  neckL: 136, neckR: 184, neckTop: 62, neckBottom: 100, // 首
  bodyL: 26, bodyR: 294, shoulderY: 192, // 胴の左右と肩の終わり
  bottom: 454, corner: 38, // 底と角の丸み
};

const BOTTLE_PATH = [
  `M${G.neckL},${G.neckTop}`,
  `H${G.neckR}`,
  `V${G.neckBottom}`,
  `C${G.neckR},${G.neckBottom + 36} ${G.bodyR},${G.shoulderY - 58} ${G.bodyR},${G.shoulderY}`,
  `V${G.bottom - G.corner}`,
  `A${G.corner},${G.corner} 0 0 1 ${G.bodyR - G.corner},${G.bottom}`,
  `H${G.bodyL + G.corner}`,
  `A${G.corner},${G.corner} 0 0 1 ${G.bodyL},${G.bottom - G.corner}`,
  `V${G.shoulderY}`,
  `C${G.bodyL},${G.shoulderY - 58} ${G.neckL},${G.neckBottom + 36} ${G.neckL},${G.neckBottom}`,
  'Z',
].join(' ');

const WALL_T = 50; // 壁の厚み（すり抜け防止に厚めに）
const SKIN = 4; // 壁の面を絵の線より少し内側に（線の太さぶん）

/** 線分 (x1,y1)-(x2,y2) に沿った外向きの壁 */
function wall(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1);
  let nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
  if (nx * (mx - CX) + ny * (my - 260) < 0) { nx = -nx; ny = -ny; } // 瓶の中心から外へ向ける
  const off = WALL_T / 2 - SKIN;
  return Bodies.rectangle(mx + nx * off, my + ny * off, len + WALL_T, WALL_T, {
    isStatic: true,
    angle: Math.atan2(y2 - y1, x2 - x1),
  });
}

function buildWalls() {
  const { neckL, neckR, neckTop, neckBottom, bodyL, bodyR, shoulderY, bottom, corner } = G;
  const midShoulderY = neckBottom + (shoulderY - neckBottom) * 0.45;
  return [
    wall(neckL, neckTop, neckR, neckTop), // 栓の下
    wall(neckL, neckTop, neckL, neckBottom), wall(neckR, neckTop, neckR, neckBottom), // 首
    // 肩（2 本の線でカーブに沿わせる）
    wall(neckL, neckBottom, neckL - 46, midShoulderY), wall(neckL - 46, midShoulderY, bodyL, shoulderY),
    wall(neckR, neckBottom, neckR + 46, midShoulderY), wall(neckR + 46, midShoulderY, bodyR, shoulderY),
    wall(bodyL, shoulderY, bodyL, bottom - corner), wall(bodyR, shoulderY, bodyR, bottom - corner), // 胴
    wall(bodyL, bottom - corner, bodyL + corner * 0.3, bottom - corner * 0.3), // 底の角
    wall(bodyL + corner * 0.3, bottom - corner * 0.3, bodyL + corner, bottom),
    wall(bodyR, bottom - corner, bodyR - corner * 0.3, bottom - corner * 0.3),
    wall(bodyR - corner * 0.3, bottom - corner * 0.3, bodyR - corner, bottom),
    wall(bodyL + corner, bottom, bodyR - corner, bottom), // 底
  ];
}

/** 形の中心が瓶の外に出ていないか（念のための保険） */
function isOutside(x: number, y: number) {
  return x < G.bodyL - 2 || x > G.bodyR + 2 || y > G.bottom + 2 || y < G.neckTop - 2;
}

function maxSideFor(n: number) {
  return Math.max(64, Math.min(108, 124 - n * 6));
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
  const [tilting, setTilting] = useState(false);

  const maxSide = maxSideFor(shapes.length);
  const dims = shapes.map((s) => {
    const b = stickerBox(s);
    const k = maxSide / Math.max(b.w, b.h);
    return { w: Math.round(b.w * k), h: Math.round(b.h * k) };
  });

  // 物理エンジン
  useEffect(() => {
    const engine = Engine.create({ positionIterations: 10, velocityIterations: 8 });
    engine.gravity.y = 1;
    engineRef.current = engine;
    const bodies = dims.map((d, i) => {
      const r = Math.max(d.w, d.h) / 2;
      const x = CX + (Math.random() - 0.5) * (G.bodyR - G.bodyL - r * 2);
      const y = G.shoulderY + 20 + (i % 4) * 40 + Math.random() * 20;
      // 当たり判定：ステッカーの外枠（余白込み）よりひとまわり小さい楕円＝だいたい形そのもの
      const b = Bodies.circle(x, y, r * 0.9, { restitution: 0.3, friction: 0.05, frictionAir: 0.015, density: 0.002 });
      Body.scale(b, d.w / (r * 2), d.h / (r * 2));
      Body.setAngle(b, (Math.random() - 0.5) * 0.6);
      return b;
    });
    bodiesRef.current = bodies;
    Composite.add(engine.world, [...buildWalls(), ...bodies]);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(20, now - last);
      last = now;
      Engine.update(engine, dt);
      bodies.forEach((b, i) => {
        // 速すぎると壁をすり抜けるので上限をかける
        const v = Math.hypot(b.velocity.x, b.velocity.y);
        if (v > 18) Body.setVelocity(b, { x: (b.velocity.x / v) * 18, y: (b.velocity.y / v) * 18 });
        if (isOutside(b.position.x, b.position.y)) {
          Body.setPosition(b, { x: CX, y: G.shoulderY + 40 });
          Body.setVelocity(b, { x: 0, y: 0 });
        }
        const el = itemRefs.current[i];
        if (el) el.style.transform = `translate(${b.position.x - dims[i].w / 2}px, ${b.position.y - dims[i].h / 2}px) rotate(${b.angle}rad)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      Engine.clear(engine);
    };
  }, []);

  // 傾き。許可は瓶を開いたタップの中で取ってある。イベントが届いたら有効
  useEffect(() => {
    const onOrient = (e: DeviceOrientationEvent) => {
      const engine = engineRef.current;
      if (!engine || e.beta === null || e.gamma === null) return;
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      engine.gravity.x = clamp(e.gamma / 45);
      engine.gravity.y = clamp(e.beta / 45);
      setTilting(true);
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, []);

  const shake = () => {
    for (const b of bodiesRef.current) {
      Body.setVelocity(b, { x: (Math.random() - 0.5) * 12, y: -5 - Math.random() * 7 });
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.35);
    }
  };

  // 指でつまんで動かす（つまむ点は瓶の内側に制限）
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    let grab: { id: number; c: Matter.Constraint } | null = null;
    const toWorld = (e: PointerEvent) => {
      const r = layer.getBoundingClientRect();
      const s = scaleRef.current || 1;
      return {
        x: Math.max(G.bodyL + 10, Math.min(G.bodyR - 10, (e.clientX - r.left) / s)),
        y: Math.max(G.shoulderY - 20, Math.min(G.bottom - 10, (e.clientY - r.top) / s)),
      };
    };
    const down = (e: PointerEvent) => {
      const engine = engineRef.current;
      if (!engine || grab) return;
      const r = layer.getBoundingClientRect();
      const s = scaleRef.current || 1;
      const hit = Query.point(bodiesRef.current, { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s })[0];
      if (!hit) return;
      e.preventDefault();
      try { layer.setPointerCapture(e.pointerId); } catch { /* 合成イベント */ }
      const c = Constraint.create({ pointA: toWorld(e), bodyB: hit, pointB: { x: 0, y: 0 }, stiffness: 0.08, damping: 0.1, length: 0 });
      Composite.add(engine.world, c);
      grab = { id: e.pointerId, c };
    };
    const move = (e: PointerEvent) => {
      if (!grab || grab.id !== e.pointerId) return;
      e.preventDefault();
      grab.c.pointA = toWorld(e);
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

  const { neckL, neckR, neckTop, bodyL, bodyR, shoulderY, bottom } = G;
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
          {/* 奥：ずらした影とガラス */}
          <svg class="bottle-glass" viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true">
            <path d={BOTTLE_PATH} fill="#1A1A1A" transform="translate(9 9)" />
            <path d={BOTTLE_PATH} fill={style.glass} />
            {/* ガラスの厚み（内側の白い線） */}
            <path d={BOTTLE_PATH} fill="none" stroke="#fff" stroke-width="14" opacity=".35" />
            {/* 底のガラスの溜まり */}
            <path d={`M${bodyL + 30},${bottom - 16} H${bodyR - 30}`} stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".5" />
          </svg>

          <div class="bottle-layer" ref={layerRef} style={{ width: `${VW}px`, height: `${VH}px`, transform: `scale(${scale})` }}>
            {shapes.map((s, i) => (
              <div class="bottle-item" ref={(el) => { itemRefs.current[i] = el; }} style={{ width: `${dims[i].w}px`, height: `${dims[i].h}px` }}>
                <ShapeSticker shape={s} maxSide={maxSide} uid={`b-${collection.id}-${s.id}`} />
              </div>
            ))}
          </div>

          {/* 手前：反射と輪郭、口と栓 */}
          <svg class="bottle-front" viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true">
            <path d={`M${bodyL + 20},${shoulderY + 12} C${bodyL + 22},${shoulderY - 22} ${neckL - 40},${shoulderY - 62} ${neckL - 10},${shoulderY - 82}`}
              fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".8" />
            <path d={`M${bodyL + 20},${shoulderY + 34} V${bottom - 90}`} stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".8" />
            <path d={`M${bodyL + 20},${bottom - 72} V${bottom - 62}`} stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".8" />
            <path d={`M${bodyR - 22},${bottom - 120} V${bottom - 60}`} stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45" />
            <path d={BOTTLE_PATH} fill="none" stroke="#1A1A1A" stroke-width="4" stroke-linejoin="round" />
            {/* 口のふち */}
            <rect x={neckL - 8} y={neckTop - 14} width={neckR - neckL + 16} height="18" rx="6" fill={style.glass} stroke="#1A1A1A" stroke-width="4" />
            <path d={`M${neckL - 2},${neckTop - 9} H${neckL + 14}`} stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8" />
            {/* コルク栓 */}
            <path d={`M${neckL + 4},${neckTop - 14} V${neckTop - 40} Q${neckL + 4},${neckTop - 46} ${neckL + 10},${neckTop - 46} H${neckR - 10} Q${neckR - 4},${neckTop - 46} ${neckR - 4},${neckTop - 40} V${neckTop - 14} Z`}
              fill={style.cap} stroke="#1A1A1A" stroke-width="4" stroke-linejoin="round" />
            <path d={`M${neckL + 14},${neckTop - 34} H${CX - 6} M${CX + 8},${neckTop - 26} H${neckR - 14}`} stroke="#1A1A1A" stroke-width="3" stroke-linecap="round" opacity=".35" />
          </svg>
        </div>
      </div>

      <footer class="bottle-foot">
        <p class="small muted bottle-hint">
          {tilting ? 'スマホを傾けると、形が転がります。' : '指でつまんで動かせます。'}
        </p>
        <div class="flow-foot">
          <button class="btn primary" onClick={shake}><Waves size={18} strokeWidth={2.4} />ふる</button>
        </div>
      </footer>
    </div>
  );
}
