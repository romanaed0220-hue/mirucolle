/*
 * 実際に見えている画面の高さを CSS 変数 --vh に入れる。
 * スマホのブラウザは 100vh / 100dvh を「ツールバーを除いた高さ」より大きく計算することがあり、
 * 全画面レイヤーの下端のボタン（次へ・発表する など）がツールバーの裏に隠れてしまうため。
 * visualViewport はキーボードが出ているときも縮むので、入力中も下のボタンが見える。
 */
export function trackViewportHeight() {
  const vv = window.visualViewport;
  const apply = () => {
    const h = vv ? vv.height : window.innerHeight;
    document.documentElement.style.setProperty('--vh', `${Math.round(h)}px`);
    document.documentElement.style.setProperty('--vv-top', `${Math.round(vv ? vv.offsetTop : 0)}px`);
  };
  apply();
  vv?.addEventListener('resize', apply);
  vv?.addEventListener('scroll', apply);
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);
}
