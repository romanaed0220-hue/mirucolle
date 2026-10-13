import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// base は相対パス：/mirucolle/ と /mirucolle/dev/ のどちらに置いても動くようにする
export default defineConfig({
  base: './',
  plugins: [preact()],
});
