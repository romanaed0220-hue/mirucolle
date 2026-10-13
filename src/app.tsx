import { useEffect, useState } from 'preact/hooks';
import { ArrowLeft, Sparkles } from 'lucide-preact';
import { BottomNav } from './components/BottomNav';
import { Drawer } from './components/Drawer';
import { TopBar } from './components/TopBar';
import { href, useRoute, type Route } from './router';
import { loadState, recordOpen, saveState } from './data/storage';
import { RecordScreen } from './screens/RecordScreen';
import { CollectScreen } from './screens/CollectScreen';
import { ConnectScreen } from './screens/ConnectScreen';
import { UraScreen } from './screens/UraScreen';

const TITLES: Record<Route, string> = { record: '記録', collect: '収集', connect: 'つながり', ura: '裏世界' };

export function App() {
  const route = useRoute();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    saveState(recordOpen(loadState()));
  }, []);

  useEffect(() => setDrawerOpen(false), [route]);

  const right =
    route === 'connect' ? (
      <a class="icon-btn ura" href={href('ura')} aria-label="裏世界へ"><Sparkles size={18} strokeWidth={2.4} /></a>
    ) : route === 'ura' ? (
      <a class="icon-btn" href={href('connect')} aria-label="つながりへ戻る"><ArrowLeft size={18} strokeWidth={2.4} /></a>
    ) : null;

  return (
    <div class="app" data-theme={route === 'ura' ? 'ura' : undefined}>
      <TopBar title={TITLES[route]} onMenu={() => setDrawerOpen(true)} right={right} />
      {route === 'record' && <RecordScreen />}
      {route === 'collect' && <CollectScreen />}
      {route === 'connect' && <ConnectScreen />}
      {route === 'ura' && <UraScreen />}
      <BottomNav route={route} />
      {drawerOpen && <Drawer onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}
