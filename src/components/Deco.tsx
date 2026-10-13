// メンフィスの背景モチーフ。色は CSS 変数（--deco-1〜5）で渡すので、裏世界でも自動で切り替わる。
// x / y は CSS の長さ（"20px" や "70%"）。Preact 11 は数値に px を付けないので文字列で渡す。
type Pos = { x: string; y: string; rot?: number };
type DecoColor = 1 | 2 | 3 | 4 | 5;

const style = (p: Pos, w: number, h: number) => ({
  left: p.x, top: p.y, width: `${w}px`, height: `${h}px`,
  transform: p.rot ? `rotate(${p.rot}deg)` : undefined,
});
const c = (n: DecoColor) => `var(--deco-${n})`;

export const Squiggle = ({ w = 80, color = 1, ...p }: Pos & { w?: number; color?: DecoColor }) => (
  <svg class="deco" style={style(p, w, w * 0.3)} viewBox="0 0 100 30" aria-hidden="true">
    <path d="M3,15 q10,-14 20,0 t20,0 t20,0 t20,0 t14,0" fill="none" stroke={c(color)} stroke-width="5" stroke-linecap="round" />
  </svg>
);

export const Triangle = ({ s = 24, color = 3, ...p }: Pos & { s?: number; color?: DecoColor }) => (
  <svg class="deco" style={style(p, s, s)} viewBox="0 0 40 40" aria-hidden="true">
    <path d="M20,4 L37,35 L3,35 Z" fill={c(color)} stroke="var(--line)" stroke-width="2.5" stroke-linejoin="round" />
  </svg>
);

export const Dots = ({ cols = 5, rows = 4, ...p }: Pos & { cols?: number; rows?: number }) => (
  <svg class="deco" style={style(p, cols * 10, rows * 10)} viewBox={`0 0 ${cols * 10} ${rows * 10}`} aria-hidden="true">
    {Array.from({ length: cols * rows }, (_, i) => (
      <circle cx={(i % cols) * 10 + 5} cy={Math.floor(i / cols) * 10 + 5} r="2" fill="var(--line)" />
    ))}
  </svg>
);

export const HalfCircle = ({ s = 46, color = 4, ...p }: Pos & { s?: number; color?: DecoColor }) => (
  <svg class="deco" style={style(p, s, s / 2)} viewBox="0 0 40 20" aria-hidden="true">
    <path d="M2,19 a18,18 0 0 1 36,0 Z" fill={c(color)} stroke="var(--line)" stroke-width="2.5" stroke-linejoin="round" />
  </svg>
);

export const Ring = ({ s = 40, color = 2, ...p }: Pos & { s?: number; color?: DecoColor }) => (
  <svg class="deco" style={style(p, s, s)} viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="15" fill="none" stroke={c(color)} stroke-width="6" />
  </svg>
);
