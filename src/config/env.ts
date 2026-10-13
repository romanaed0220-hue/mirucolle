// ビルド環境。GitHub Actions で VITE_APP_ENV=prod / dev を渡す。ローカルは local。
export type AppEnv = 'prod' | 'dev' | 'local';

export const APP_ENV: AppEnv = (import.meta.env.VITE_APP_ENV as AppEnv) || 'local';

// main と dev は同じ github.io オリジンに置かれるので、保存先の名前を環境ごとに分ける
export const STORAGE_PREFIX = APP_ENV === 'prod' ? 'mirucolle' : `mirucolle-${APP_ENV}`;

export const APP_VERSION = '0.1.0';
