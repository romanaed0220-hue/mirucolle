/*
 * 傾き（ジャイロ）の許可。iOS はユーザーのタップの中でしか許可ダイアログを出せないので、
 * 瓶を開くボタンの onClick の中で、同期的にこれを呼ぶ。Android などでは何もしない（許可不要）。
 */
let asked = false;

export function requestOrientationPermission(): void {
  const DOE = (window as any).DeviceOrientationEvent;
  if (asked || !DOE || typeof DOE.requestPermission !== 'function') return;
  asked = true;
  DOE.requestPermission().catch(() => { asked = false; });
}
