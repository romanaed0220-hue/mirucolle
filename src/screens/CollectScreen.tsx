import { Dots, HalfCircle, Ring, Squiggle } from '../components/Deco';
import { href } from '../router';

const BOTTLE = 'M15,2 h10 v10 c8,4 12,10 12,20 v18 a6,6 0 0 1 -6,6 h-22 a6,6 0 0 1 -6,-6 v-18 c0,-10 4,-16 12,-20 z';

function Bottle({ locked }: { locked?: boolean }) {
  return (
    <svg class="bottle" viewBox="0 0 40 58" aria-hidden="true">
      <path d={BOTTLE} fill={locked ? 'none' : 'var(--c-teal)'} stroke={locked ? 'var(--muted)' : 'var(--line)'}
        stroke-width="2" stroke-dasharray={locked ? '4 3' : undefined} />
    </svg>
  );
}

export function CollectScreen() {
  return (
    <div class="screen fill">
      <Dots x="70%" y="10px" cols={5} rows={4} />
      <HalfCircle x="14px" y="150px" s={46} color={4} rot={-20} />
      <Ring x="80%" y="58%" s={40} color={2} />
      <Squiggle x="12%" y="36%" w={80} color={1} rot={10} />

      <div class="screen-inner center">
        <div>
          <p class="head empty-title">まだ形がありません</p>
          <p class="small muted empty-text">
            ここには、あなたが描いた形だけが浮かびます。<br />
            <a href={href('record')}>記録</a>から最初のひとつを。
          </p>
        </div>
      </div>

      <div class="shelf">
        <span class="chip shelf-cap">コレクション</span>
        <div class="shelf-row">
          <Bottle locked /><Bottle locked /><Bottle locked /><Bottle locked />
        </div>
      </div>
    </div>
  );
}
