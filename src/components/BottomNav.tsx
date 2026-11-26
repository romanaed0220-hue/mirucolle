import { Camera, Eye, FlaskConical } from 'lucide-preact';
import { href, type Route } from '../router';

const ITEMS = [
  { route: 'record', label: '記録', Icon: Camera },
  { route: 'collect', label: '収集', Icon: FlaskConical },
  { route: 'connect', label: 'つながり', Icon: Eye },
] as const;

export function BottomNav({ route }: { route: Route }) {
  return (
    <nav class="nav">
      {ITEMS.map(({ route: r, label, Icon }) => (
        <a href={href(r)} aria-current={route === r ? 'page' : undefined}>
          <span class="nav-ic"><Icon size={22} strokeWidth={2} /></span>
          {label}
        </a>
      ))}
    </nav>
  );
}
