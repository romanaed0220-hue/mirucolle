// 写真の保存（IndexedDB）。localStorage には入れない（容量が小さいため）。
import { useEffect, useState } from 'preact/hooks';
import { createStore, get, set } from 'idb-keyval';
import { STORAGE_PREFIX } from '../config/env';

const store = createStore(`${STORAGE_PREFIX}-photos`, 'photos');

/** 長辺 1280px の JPEG に縮小する */
export async function compressPhoto(file: Blob, maxSide = 1280): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85),
    );
    return { blob, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const savePhoto = (id: string, blob: Blob) => set(id, blob, store);
export const loadPhoto = (id: string) => get<Blob>(id, store);

/** 写真を読み込んで表示用 URL を返す（アンマウント時に解放） */
export function usePhotoURL(id: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let objectUrl: string | null = null;
    let alive = true;
    loadPhoto(id).then((blob) => {
      if (!alive || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  return url;
}
