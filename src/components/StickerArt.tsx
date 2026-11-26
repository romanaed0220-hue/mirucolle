// シールの絵（メンフィス：黒い輪郭＋色のずれた硬い影）。id ごとに 1 枚
const BLOBS: [number, number, number][] = [
  [66, 58, 24], // まん中のすき間をうめる
  [40, 52, 16], [58, 42, 17], [78, 42, 16], [94, 54, 15], [88, 72, 15], [66, 76, 17], [44, 72, 15],
];

function Fluff({ fill, stroke }: { fill: string; stroke?: string }) {
  // 円をいくつも重ねたもこもこ。輪郭は「太い線の円 → その上に線なしの円」で外側だけ残す
  return (
    <>
      {stroke && BLOBS.map(([x, y, r]) => <circle cx={x} cy={y} r={r} fill={stroke} stroke={stroke} stroke-width={6} />)}
      {BLOBS.map(([x, y, r]) => <circle cx={x} cy={y} r={r} fill={fill} />)}
    </>
  );
}

function Hitsuji() {
  return (
    <svg viewBox="0 0 132 116" aria-hidden="true">
      {/* 影 */}
      <g transform="translate(6 6)"><Fluff fill="var(--c-pink)" /></g>
      {/* あし */}
      {[48, 60, 76, 88].map((x) => <rect x={x - 4} y={84} width={8} height={20} rx={3} fill="var(--c-ink)" />)}
      <Fluff fill="#fff" stroke="var(--c-ink)" />
      {/* 顔 */}
      <ellipse cx={30} cy={58} rx={15} ry={18} fill="var(--c-ink)" />
      <ellipse cx={18} cy={46} rx={9} ry={5} fill="var(--c-ink)" transform="rotate(-25 18 46)" />
      <circle cx={25} cy={55} r={3.2} fill="#fff" />
      <circle cx={35} cy={55} r={3.2} fill="#fff" />
      <path d="M26 66 q4 4 8 0" stroke="#fff" stroke-width={2.4} fill="none" stroke-linecap="round" />
    </svg>
  );
}

// 星の頂点（中心 60,58）
const STAR = Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5;
  const r = i % 2 ? 22 : 48;
  return `${(60 + r * Math.cos(a)).toFixed(1)},${(58 + r * Math.sin(a)).toFixed(1)}`;
}).join(' ');

function Hoshi() {
  return (
    <svg viewBox="0 0 124 116" aria-hidden="true">
      <polygon points={STAR} fill="var(--c-teal)" transform="translate(6 6)" stroke-linejoin="round" />
      <polygon points={STAR} fill="var(--c-yellow)" stroke="var(--c-ink)" stroke-width={4} stroke-linejoin="round" />
      <circle cx={52} cy={60} r={3.2} fill="var(--c-ink)" />
      <circle cx={68} cy={60} r={3.2} fill="var(--c-ink)" />
    </svg>
  );
}

function Hana() {
  const petals = [0, 72, 144, 216, 288];
  return (
    <svg viewBox="0 0 124 120" aria-hidden="true">
      <g transform="translate(6 6)">
        {petals.map((d) => <ellipse cx={60} cy={34} rx={18} ry={24} fill="var(--c-blue)" transform={`rotate(${d} 60 58)`} />)}
      </g>
      {petals.map((d) => <ellipse cx={60} cy={34} rx={18} ry={24} fill="var(--c-pink)" stroke="var(--c-ink)" stroke-width={4} transform={`rotate(${d} 60 58)`} />)}
      <circle cx={60} cy={58} r={16} fill="var(--c-yellow)" stroke="var(--c-ink)" stroke-width={4} />
    </svg>
  );
}

const GHOST = 'M24 100 V52 a36 36 0 0 1 72 0 V100 l-12 -10 l-12 10 l-12 -10 l-12 10 l-12 -10 z';
function Obake() {
  return (
    <svg viewBox="0 0 124 116" aria-hidden="true">
      <path d={GHOST} fill="var(--c-lilac)" transform="translate(6 6)" />
      <path d={GHOST} fill="#fff" stroke="var(--c-ink)" stroke-width={4} stroke-linejoin="round" />
      <ellipse cx={48} cy={54} rx={5} ry={7} fill="var(--c-ink)" />
      <ellipse cx={72} cy={54} rx={5} ry={7} fill="var(--c-ink)" />
      <ellipse cx={60} cy={72} rx={6} ry={5} fill="var(--c-ink)" />
    </svg>
  );
}

const ARTS: Record<string, () => preact.JSX.Element> = { hitsuji: Hitsuji, hoshi: Hoshi, hana: Hana, obake: Obake };

export function StickerArt({ id }: { id: string }) {
  const Art = ARTS[id];
  return Art ? <Art /> : null;
}
