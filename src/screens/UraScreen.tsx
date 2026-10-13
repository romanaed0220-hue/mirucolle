import { Dots, HalfCircle, Ring, Squiggle, Triangle } from '../components/Deco';

export function UraScreen() {
  return (
    <div class="screen fill">
      <Squiggle x="16px" y="10px" w={80} color={2} rot={-6} />
      <Triangle x="80%" y="40px" s={24} color={1} rot={20} />
      <Dots x="45%" y="70px" cols={6} rows={2} />
      <Ring x="72%" y="62%" s={36} color={4} />
      <HalfCircle x="24px" y="70%" s={44} color={3} />

      <div class="screen-inner center ura">
        <div>
          <p class="head ura-title">裏世界</p>
          <p class="small muted ura-text">
            お題の回ごとに、みんなの見え方が集まる場所。<br />
            自分の作品がいちばん前、ほかはランダムに並びます。
          </p>
          <span class="chip soon">準備中</span>
        </div>
      </div>
    </div>
  );
}
