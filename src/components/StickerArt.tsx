// シールの絵（メンフィス：黒い輪郭＋色のずれた硬い影）。id ごとに 1 枚
const BLOBS: [number, number, number][] = [
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

export function StickerArt({ id }: { id: string }) {
  if (id === 'hitsuji') return <Hitsuji />;
  return null;
}
