import { Camera } from 'lucide-preact';
import { Dots, Ring, Squiggle } from '../components/Deco';

const STEPS = [
  { n: 1, title: '撮る', text: '「何かに見える」瞬間を撮る' },
  { n: 2, title: 'なぞる', text: '指で形をぐるっと囲む' },
  { n: 3, title: '描き足す・名付ける', text: '目や手足を足して、名前をつける' },
];

export function RecordScreen() {
  return (
    <div class="screen">
      <Dots x="68%" y="10px" cols={5} rows={3} />
      <Squiggle x="-12px" y="430px" w={90} color={5} rot={-8} />
      <Ring x="84%" y="500px" s={36} color={2} />

      <div class="screen-inner record">
        <h2 class="head record-title">今日、何に<br />見えた？</h2>

        <ol class="steps">
          {STEPS.map((s) => (
            <li class="card step">
              <span class="head step-n">{s.n}</span>
              <div>
                <div class="step-title">{s.title}</div>
                <div class="small muted">{s.text}</div>
              </div>
            </li>
          ))}
        </ol>

        <button class="btn primary block record-cta" disabled>
          <Camera size={20} strokeWidth={2.4} />写真を撮る<span class="chip soon">準備中</span>
        </button>
        <p class="small muted record-note">保存されるのは、あなたが描いた「形」です。</p>
      </div>
    </div>
  );
}
