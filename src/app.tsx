import { useEffect, useState } from 'preact/hooks';
import { ArrowLeft } from 'lucide-preact';
import { BottomNav } from './components/BottomNav';
import { Drawer } from './components/Drawer';
import { TopBar } from './components/TopBar';
import { useAppState } from './data/store';
import { href, useRoute, type Route } from './router';
import { RecordScreen } from './screens/RecordScreen';
import { CollectScreen } from './screens/CollectScreen';
import { ConnectScreen } from './screens/ConnectScreen';
import { AboutScreen } from './screens/AboutScreen';
import { ItemsScreen } from './screens/ItemsScreen';
import { MakerScreen } from './screens/MakerScreen';
import { canMakeSamples } from './data/maker';
import { ShopScreen } from './screens/ShopScreen';

const TITLES: Record<Route, string> = { record: '記録', collect: '収集', connect: 'つながり', shop: '交換所', items: 'もちもの', about: 'このアプリについて', maker: 'サンプルを描く' };

export function App() {
  const route = useRoute();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { equipped } = useAppState();

  useEffect(() => setDrawerOpen(false), [route]);
  // きせかえ：<html> に付けるので、Portal で body に出す全画面レイヤーにも効く
  useEffect(() => {
    if (equipped.theme) document.documentElement.dataset.theme = equipped.theme;
    else delete document.documentElement.dataset.theme;
  }, [equipped.theme]);

  // 交換所・もちものはマイページから入る下層の画面なので、戻るボタンを出す
  const sub = route === 'shop' || route === 'items' || route === 'about' || route === 'maker';
  const back = () => (history.length > 1 ? history.back() : (location.hash = href('record')));

  return (
    <div class="app">
      <TopBar title={TITLES[route]} onMenu={() => setDrawerOpen(true)}
        right={sub ? <button class="icon-btn" aria-label="もどる" onClick={back}><ArrowLeft size={18} strokeWidth={2.4} /></button> : null} />
      {route === 'record' && <RecordScreen />}
      {route === 'collect' && <CollectScreen />}
      {route === 'connect' && <ConnectScreen />}
      {route === 'shop' && <ShopScreen />}
      {route === 'items' && <ItemsScreen />}
      {route === 'about' && <AboutScreen />}
      {route === 'maker' && canMakeSamples && <MakerScreen />}
      <BottomNav route={route} />
      {drawerOpen && <Drawer onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}
