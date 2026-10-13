/*
 * コレクションの瓶。瓶の絵は Blender で描いた画像（tools/blender/render_jar.py → public/jars/）を重ねる：
 *   奥半分（＋側面・影） → 形 → 手前半分（＋ハイライト） → 輪郭線
 * 中の形は Matter.js で物理的に動く（当たり判定は楕円）。壁は同じスクリプトが書き出した
 * 瓶の内側の線（src/config/jar.json）に沿って置くので、絵と当たり判定がずれない。
 * - 開くと、形が口から 1 つずつ落ちてくる
 * - スマホを傾けると重力の向きが変わる（iOS の許可は、瓶を開いたタップの中で取る：lib/orientation.ts）
 * - 指でつまんで動かせる／「ふる」でゆらせる
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import Matter from 'matter-js';
import { Plus, Waves, X } from 'lucide-preact';
import { BOTTLE_MAX_SHAPES } from '../config/bottles';
import JAR from '../config/jar.json';
import type { Collection, Shape } from '../data/storage';
import { useFit } from '../lib/useFit';
import { ShapePickGrid } from './ShapePickGrid';
import { ShapeSticker, stickerBox } from './ShapeSticker';

const { Engine, Bodies, Body, Composite, Constraint, Query } = Matter;

// 瓶の座標系（この単位で物理演算し、表示時に拡大縮小する）
const [VW, VH] = JAR.viewBox as [number, number];
const CX = VW / 2;
const WALL = JAR.wallLeft.concat(JAR.wallRight) as [number, number][]; // 口の左 → 底 → 口の右
const XS = JAR.silhouette.map((p) => p[0]);
const YS = JAR.silhouette.map((p) => p[1]);
const BOX = { left: Math.min(...XS), right: Math.max(...XS), top: Math.min(...YS), bottom: Math.max(...YS) };
const RIM_Y = JAR.rimY;
const MOUTH = { left: JAR.wallLeft[0][0], right: JAR.wallRight[JAR.wallRight.length - 1][0] }; // 口の内側の幅
const IMG = (name: string) => `${import.meta.env.BASE_URL}jars/${name}.webp`;

const WALL_T = 40; // 壁の厚み（すり抜け防止に厚めに）
const BODY_CENTER_Y = (RIM_Y + BOX.bottom) / 2;

/** 線分に沿った、瓶の外側へ向いた厚い壁 */
function wall(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  let nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
  if (nx * (mx - CX) + ny * (my - BODY_CENTER_Y) < 0) { nx = -nx; ny = -ny; }
  return Bodies.rectangle(mx + nx * WALL_T / 2, my + ny * WALL_T / 2, len + WALL_T * 0.6, WALL_T, {
    isStatic: true,
    angle: Math.atan2(y2 - y1, x2 - x1),
  });
}

function buildWalls() {
  const walls: Matter.Body[] = [];
  for (let i = 0; i < WALL.length - 1; i++) walls.push(wall(WALL[i][0], WALL[i][1], WALL[i + 1][0], WALL[i + 1][1]));
  return walls;
}

/** ふた（口をふさぐ見えない壁）。形が全部入ってから置く */
function lid() {
  return Bodies.rectangle(CX, RIM_Y - WALL_T / 2 + 6, VW, WALL_T, { isStatic: true });
}

/** 形の中心が瓶の外に出ていないか（念のための保険） */
function isOutside(x: number, y: number, lidOn: boolean) {
  return x < BOX.left || x > BOX.right || y > BOX.bottom || (lidOn && y < RIM_Y - 10) || y < -400;
}


function maxSideFor(n: number) {
  return Math.max(60, Math.min(100, 116 - n * 6));
}

const DROP_EVERY = 260; // 形が 1 つ落ちてくる間隔（ms）
const LID_AFTER = 900; // 最後の形が落ちてから、ふたを閉めるまで（ms）

type Item = { body: Matter.Body; w: number; h: number; maxSide: number; dropped: boolean };

type Props = {
  collection: Collection;
  /** この瓶に入っている形 */
  shapes: Shape[];
  /** まだこの瓶に入っていない自分の形（「形を入れる」の候補） */
  addable: Shape[];
  onAdd: (shapeIds: string[]) => void;
  onClose: () => void;
};

export function BottleView({ collection, shapes, addable, onAdd, onClose }: Props) {
  const style = collection.bottleId;
  const [stageRef, size] = useFit<HTMLDivElement>(VW / VH);
  const scale = size.w / VW;
  const layerRef = useRef<HTMLDivElement>(null);
  const elRefs = useRef(new Map<string, HTMLDivElement>());
  const engineRef = useRef<Matter.Engine | null>(null);
  const itemsRef = useRef(new Map<string, Item>());
  const lidRef = useRef<{ body: Matter.Body | null; on: boolean; timer: number }>({ body: null, on: false, timer: 0 });
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const [tilting, setTilting] = useState(false);
  const [picking, setPicking] = useState(false);
  const room = BOTTLE_MAX_SHAPES - shapes.length;

  // 形の大きさは、瓶に入った時点の個数で決めて、あとから変えない（中で急に大きさが変わらないように）
  const sizeOf = (s: Shape) => {
    const known = itemsRef.current.get(s.id);
    if (known) return known;
    const maxSide = maxSideFor(shapes.length);
    const b = stickerBox(s);
    const k = maxSide / Math.max(b.w, b.h);
    return { w: Math.round(b.w * k), h: Math.round(b.h * k), maxSide };
  };

  // 物理エンジン（壁と、毎フレームの描画）
  useEffect(() => {
    const engine = Engine.create({ positionIterations: 10, velocityIterations: 8 });
    engine.gravity.y = 1;
    engineRef.current = engine;
    Composite.add(engine.world, buildWalls());

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(20, now - last);
      last = now;
      Engine.update(engine, dt);
      itemsRef.current.forEach((it, id) => {
        const el = elRefs.current.get(id);
        if (!it.dropped) {
          if (el) el.style.visibility = 'hidden';
          return;
        }
        const b = it.body;
        // 速すぎると壁をすり抜けるので上限をかける
        const v = Math.hypot(b.velocity.x, b.velocity.y);
        if (v > 18) Body.setVelocity(b, { x: (b.velocity.x / v) * 18, y: (b.velocity.y / v) * 18 });
        if (isOutside(b.position.x, b.position.y, lidRef.current.on)) {
          Body.setPosition(b, { x: CX, y: BODY_CENTER_Y });
          Body.setVelocity(b, { x: 0, y: 0 });
        }
        if (el) {
          el.style.visibility = 'visible';
          el.style.transform = `translate(${b.position.x - it.w / 2}px, ${b.position.y - it.h / 2}px) rotate(${b.angle}rad)`;
        }
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(lidRef.current.timer);
      Engine.clear(engine);
    };
  }, []);

  // 新しく入った形を、口の上から 1 つずつ落とす（開いたときも、「形を入れる」のあとも）
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const fresh = shapes.filter((s) => !itemsRef.current.has(s.id));
    if (fresh.length === 0) return;

    // ふたを開ける
    const lidState = lidRef.current;
    clearTimeout(lidState.timer);
    if (lidState.body) Composite.remove(engine.world, lidState.body);
    lidState.body = null;
    lidState.on = false;

    const mouthW = MOUTH.right - MOUTH.left;
    const timers: number[] = [];
    fresh.forEach((s, i) => {
      const sz = sizeOf(s);
      const r = Math.max(sz.w, sz.h) / 2;
      const x = CX + (Math.random() - 0.5) * Math.max(0, mouthW - r * 2 - 10);
      const body = Bodies.circle(x, RIM_Y - r - 40, r * 0.9, { restitution: 0.3, friction: 0.05, frictionAir: 0.015, density: 0.002 });
      Body.scale(body, sz.w / (r * 2), sz.h / (r * 2)); // 楕円にする
      Body.setAngle(body, (Math.random() - 0.5) * 0.8);
      const item: Item = { body, ...sz, dropped: false };
      itemsRef.current.set(s.id, item);
      timers.push(window.setTimeout(() => {
        Composite.add(engine.world, body);
        item.dropped = true;
      }, 200 + i * DROP_EVERY));
    });

    // 全部落ちたら、ふたを閉める
    lidState.timer = window.setTimeout(() => {
      lidState.body = lid();
      Composite.add(engine.world, lidState.body);
      lidState.on = true;
    }, 200 + fresh.length * DROP_EVERY + LID_AFTER);
    return () => timers.forEach((t) => clearTimeout(t));
  }, [shapes.map((s) => s.id).join(',')]);

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
    itemsRef.current.forEach(({ body: b, dropped }) => {
      if (!dropped) return;
      Body.setVelocity(b, { x: (Math.random() - 0.5) * 12, y: -5 - Math.random() * 7 });
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.35);
    });
  };

  // 指でつまんで動かす（つまむ点は瓶の内側に制限）
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    let grab: { id: number; c: Matter.Constraint } | null = null;
    const raw = (e: PointerEvent) => {
      const r = layer.getBoundingClientRect();
      const s = scaleRef.current || 1;
      return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s };
    };
    const clampInside = (p: { x: number; y: number }) => ({
      x: Math.max(BOX.left + 30, Math.min(BOX.right - 30, p.x)),
      y: Math.max(RIM_Y + 30, Math.min(BOX.bottom - 30, p.y)),
    });
    const down = (e: PointerEvent) => {
      const engine = engineRef.current;
      if (!engine || grab) return;
      const bodies = [...itemsRef.current.values()].filter((it) => it.dropped).map((it) => it.body);
      const hit = Query.point(bodies, raw(e))[0];
      if (!hit) return;
      e.preventDefault();
      try { layer.setPointerCapture(e.pointerId); } catch { /* 合成イベント */ }
      const c = Constraint.create({ pointA: clampInside(raw(e)), bodyB: hit, pointB: { x: 0, y: 0 }, stiffness: 0.08, damping: 0.1, length: 0 });
      Composite.add(engine.world, c);
      grab = { id: e.pointerId, c };
    };
    const move = (e: PointerEvent) => {
      if (!grab || grab.id !== e.pointerId) return;
      e.preventDefault();
      grab.c.pointA = clampInside(raw(e));
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
          <img class="bottle-img" src={IMG(`jar-${style}-back`)} alt="" draggable={false} />
          <div class="bottle-layer" ref={layerRef} style={{ width: `${VW}px`, height: `${VH}px`, transform: `scale(${scale})` }}>
            {shapes.map((s) => {
              const sz = sizeOf(s);
              return (
                <div class="bottle-item" key={s.id}
                  ref={(el) => { if (el) elRefs.current.set(s.id, el); else elRefs.current.delete(s.id); }}
                  style={{ width: `${sz.w}px`, height: `${sz.h}px`, visibility: 'hidden' }}>
                  <ShapeSticker shape={s} maxSide={sz.maxSide} uid={`b-${collection.id}-${s.id}`} />
                </div>
              );
            })}
          </div>
          <img class="bottle-img" src={IMG(`jar-${style}-front`)} alt="" draggable={false} />
          <img class="bottle-img" src={IMG('jar-lines')} alt="" draggable={false} />
        </div>
      </div>

      <footer class="bottle-foot">
        <p class="small muted bottle-hint">
          {tilting ? 'スマホを傾けると、形が転がります。' : '指でつまんで動かせます。'}
        </p>
        <div class="flow-foot">
          <button class="btn" onClick={() => setPicking(true)} disabled={addable.length === 0 || room <= 0}>
            <Plus size={18} strokeWidth={2.4} />形を入れる
          </button>
          <button class="btn primary" onClick={shake}><Waves size={18} strokeWidth={2.4} />ふる</button>
        </div>
        {addable.length === 0 && <p class="small muted bottle-hint">ほかの形は、もう全部この瓶に入っています。</p>}
        {addable.length > 0 && room <= 0 && <p class="small muted bottle-hint">この瓶はいっぱいです。</p>}
      </footer>

      {picking && (
        <AddShapes
          shapes={addable}
          room={room}
          onClose={() => setPicking(false)}
          onAdd={(ids) => { setPicking(false); onAdd(ids); }}
        />
      )}
    </div>
  );
}

/** 瓶に入れる形を選ぶ */
function AddShapes({ shapes, room, onAdd, onClose }: { shapes: Shape[]; room: number; onAdd: (ids: string[]) => void; onClose: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= room ? p : [...p, id]));
  return (
    <div class="flow add-shapes">
      <header class="flow-head">
        <button class="icon-btn" aria-label="やめる" onClick={onClose}><X size={20} strokeWidth={2.4} /></button>
        <h2 class="head add-title">瓶に形を入れる</h2>
      </header>
      <p class="flow-hint small">入れたい形を選んでください。</p>
      <ShapePickGrid shapes={shapes} picked={picked} onToggle={toggle} />
      <footer class="flow-foot">
        <button class="btn primary" onClick={() => onAdd(picked)} disabled={picked.length === 0}>入れる</button>
      </footer>
    </div>
  );
}
