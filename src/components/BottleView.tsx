/*
 * コレクションの瓶。瓶の絵は Blender で描いた画像（tools/blender/render_jar.py → public/jars/）を重ねる：
 *   奥半分（＋側面・影） → 形 → 手前半分（＋ハイライト） → 輪郭線
 * 中の形は Matter.js で物理的に動く（当たり判定は楕円）。壁は同じスクリプトが書き出した
 * 瓶の内側の線（src/config/jar.json）に沿って置くので、絵と当たり判定がずれない。
 * - 開くと、形が口から 1 つずつ落ちてくる
 * - スマホを傾けると重力の向きが変わる（iOS の許可は、瓶を開いたタップの中で取る：lib/orientation.ts）
 * - 指でつまんで動かせる／瓶をタップするとゆれる
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import Matter from 'matter-js';
import { Pencil, Trash2, X } from 'lucide-preact';
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
  /** 自分の形すべて（編集で入れる・取り出すの候補） */
  allShapes: Shape[];
  onSave: (patch: { theme: string; shapeIds: string[] }) => void;
  onDelete: () => void;
  onClose: () => void;
};

export function BottleView({ collection, shapes, allShapes, onSave, onDelete, onClose }: Props) {
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
  const [editing, setEditing] = useState(false);

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

  // 新しく入った形を、口の上から 1 つずつ落とす（開いたときも、編集で入れたあとも）。取り出した形は消す
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const ids = new Set(shapes.map((s) => s.id));
    itemsRef.current.forEach((it, id) => {
      if (ids.has(id)) return;
      Composite.remove(engine.world, it.body);
      itemsRef.current.delete(id);
    });
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

  const boxRef = useRef<HTMLDivElement>(null);
  // 瓶をタップすると、ゆれる（中の形がはねる＋瓶が少しふるえる）
  const shake = () => {
    itemsRef.current.forEach(({ body: b, dropped }) => {
      if (!dropped) return;
      Body.setVelocity(b, { x: (Math.random() - 0.5) * 12, y: -5 - Math.random() * 7 });
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.35);
    });
    const box = boxRef.current;
    if (box) {
      box.classList.remove('shaking');
      void box.offsetWidth; // アニメーションを最初からやり直す
      box.classList.add('shaking');
    }
  };
  const shakeRef = useRef(shake);
  shakeRef.current = shake;

  // 指の操作：形をつまんで動かす（つまむ点は瓶の内側に制限）／瓶を軽くタップしたらゆらす
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    let grab: { id: number; c: Matter.Constraint } | null = null;
    let tap: { id: number; x: number; y: number; t: number; moved: boolean } | null = null;
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
      if (!engine || tap) return;
      e.preventDefault();
      tap = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
      try { layer.setPointerCapture(e.pointerId); } catch { /* 合成イベント */ }
      const bodies = [...itemsRef.current.values()].filter((it) => it.dropped).map((it) => it.body);
      const hit = Query.point(bodies, raw(e))[0];
      if (!hit) return;
      const c = Constraint.create({ pointA: clampInside(raw(e)), bodyB: hit, pointB: { x: 0, y: 0 }, stiffness: 0.08, damping: 0.1, length: 0 });
      Composite.add(engine.world, c);
      grab = { id: e.pointerId, c };
    };
    const move = (e: PointerEvent) => {
      if (!tap || tap.id !== e.pointerId) return;
      e.preventDefault();
      if (Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 8) tap.moved = true;
      if (grab) grab.c.pointA = clampInside(raw(e));
    };
    const up = (e: PointerEvent) => {
      if (!tap || tap.id !== e.pointerId) return;
      const wasTap = !tap.moved && performance.now() - tap.t < 350 && e.type === 'pointerup';
      tap = null;
      if (grab) {
        if (engineRef.current) Composite.remove(engineRef.current.world, grab.c);
        grab = null;
      }
      if (wasTap) shakeRef.current();
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
        <div class="bottle-box" ref={boxRef} style={{ width: `${size.w}px`, height: `${size.h}px` }}>
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
          {tilting ? '傾けると転がります。瓶をタップすると、ゆれます。' : '指でつまんで動かせます。瓶をタップすると、ゆれます。'}
        </p>
        <div class="flow-foot">
          <button class="btn" onClick={() => setEditing(true)}>
            <Pencil size={18} strokeWidth={2.4} />編集
          </button>
        </div>
      </footer>

      {editing && (
        <EditCollection
          collection={collection}
          allShapes={allShapes}
          onClose={() => setEditing(false)}
          onSave={(patch) => { setEditing(false); onSave(patch); }}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

const THEME_MAX = 24;

/** 瓶の編集：テーマを変える・形を入れる／取り出す・瓶を消す */
function EditCollection({ collection, allShapes, onSave, onDelete, onClose }: {
  collection: Collection;
  allShapes: Shape[];
  onSave: (patch: { theme: string; shapeIds: string[] }) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [theme, setTheme] = useState(collection.theme);
  // もう存在しない形の id は落としておく
  const [picked, setPicked] = useState(collection.shapeIds.filter((id) => allShapes.some((s) => s.id === id)));
  const full = picked.length >= BOTTLE_MAX_SHAPES;
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : full ? p : [...p, id]));
  // 瓶に入っている形を先に並べる。並びは開いたときのまま（選ぶたびに並び替えない）
  const [order] = useState(() =>
    [...allShapes].sort((a, b) => Number(picked.includes(b.id)) - Number(picked.includes(a.id))).map((s) => s.id));
  const shapesInOrder = order.map((id) => allShapes.find((s) => s.id === id)!).filter(Boolean);

  const remove = () => {
    if (!confirm(`コレクション「${collection.theme}」を消しますか？\n中の形は収集に残ります。`)) return;
    onDelete();
  };

  return (
    <div class="flow edit-collection">
      <header class="flow-head">
        <button class="icon-btn" aria-label="やめる" onClick={onClose}><X size={20} strokeWidth={2.4} /></button>
        <h2 class="head add-title">コレクションを編集</h2>
      </header>
      <input
        class="name-input"
        type="text"
        enterKeyHint="done"
        maxLength={THEME_MAX}
        placeholder="テーマ"
        value={theme}
        onInput={(e) => setTheme((e.currentTarget as HTMLInputElement).value)}
      />
      <p class="flow-hint small">
        選んだ形が瓶に入ります。外すと取り出します。{full ? '（この瓶はいっぱいです）' : ''}
      </p>
      <ShapePickGrid shapes={shapesInOrder} picked={picked} onToggle={toggle} />
      <footer class="flow-foot edit-foot">
        <button class="btn danger" onClick={remove}><Trash2 size={18} strokeWidth={2.4} />瓶を消す</button>
        <button class="btn primary" onClick={() => onSave({ theme: theme.trim() || collection.theme, shapeIds: picked })}
          disabled={picked.length === 0}>保存する</button>
      </footer>
      {picked.length === 0 && <p class="small muted">形を 1 つ以上選んでください。</p>}
    </div>
  );
}
