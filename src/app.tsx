import { useEffect, useState } from 'preact/hooks';
import { BottomNav } from './components/BottomNav';
import { Drawer } from './components/Drawer';
import { TopBar } from './components/TopBar';
import { useRoute, type Route } from './router';
import { RecordScreen } from './screens/RecordScreen';
import { CollectScreen } from './screens/CollectScreen';
import { ConnectScreen } from './screens/ConnectScreen';

const TITLES: Record<Route, string> = { record: '記録', collect: '収集', connect: 'つながり' };

export function App() {
  const route = useRoute();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setDrawerOpen(false), [route]);

  return (
    <div class="app">
      <TopBar title={TITLES[route]} onMenu={() => setDrawerOpen(true)} />
      {route === 'record' && <RecordScreen />}
      {route === 'collect' && <CollectScreen />}
      {route === 'connect' && <ConnectScreen />}
      <BottomNav route={route} />
      {drawerOpen && <Drawer onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}
