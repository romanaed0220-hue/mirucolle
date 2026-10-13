import type { ComponentChildren } from 'preact';
import { Menu } from 'lucide-preact';

export function TopBar({ title, onMenu, right }: { title: string; onMenu: () => void; right?: ComponentChildren }) {
  return (
    <header class="topbar">
      <button class="icon-btn" aria-label="マイページを開く" onClick={onMenu}>
        <Menu size={20} strokeWidth={2.4} />
      </button>
      <h1>{title}</h1>
      <div>{right}</div>
    </header>
  );
}
