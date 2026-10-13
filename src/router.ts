import { useEffect, useState } from 'preact/hooks';

// ハッシュルーティング：GitHub Pages のサブパスでもリロードで 404 にならない
export type Route = 'record' | 'collect' | 'connect' | 'ura';

const ROUTES: Route[] = ['record', 'collect', 'connect', 'ura'];
export const DEFAULT_ROUTE: Route = 'record';

function parse(hash: string): Route {
  const name = hash.replace(/^#\/?/, '').split('/')[0] as Route;
  return ROUTES.includes(name) ? name : DEFAULT_ROUTE;
}

export const href = (r: Route) => `#/${r}`;

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parse(location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
