// 全画面レイヤー（記録フロー・詳細）を body 直下に出す。
// スクロール容器の中に position: fixed を置くと、iOS Safari で切り取られてボタンが押せなくなるため。
import type { ComponentChildren } from 'preact';
import { createPortal } from 'preact/compat';

export function Portal({ children }: { children: ComponentChildren }) {
  return createPortal(children, document.body);
}
