import { render } from 'preact';
import { App } from './app';
import './styles/tokens.css';
import './styles/base.css';
import './styles/screens.css';
import './data/store'; // 起動時に「開いた日」を記録
import { trackViewportHeight } from './lib/viewportHeight';

trackViewportHeight();

render(<App />, document.getElementById('root')!);
