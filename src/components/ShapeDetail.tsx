// 形をタップしたときの詳細：元の写真の全体と、そのときなぞった輪郭・描き足した線。
import { X } from 'lucide-preact';
import type { Shape } from '../data/storage';
import { usePhotoURL } from '../data/photos';
import { toSvgPath } from '../lib/path';

export function ShapeDetail({ shape, onClose }: { shape: Shape; onClose: () => void }) {
  const url = usePhotoURL(shape.photoId);
  const date = new Date(shape.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  const stroke = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' } as const;

  return (
    <div class="overlay" role="dialog" aria-modal="true" aria-label={shape.name} onClick={onClose}>
      <div class="detail card" onClick={(e) => e.stopPropagation()}>
        <header class="detail-head">
          <div>
            <h2 class="head detail-name">{shape.name}</h2>
            <p class="small muted">{date}</p>
          </div>
          <button class="icon-btn" aria-label="閉じる" onClick={onClose}><X size={20} strokeWidth={2.4} /></button>
        </header>
        <div class="detail-photo" style={{ aspectRatio: `${shape.aspect}` }}>
          {url && <img src={url} alt="" />}
          <svg viewBox={`0 0 ${shape.aspect} 1`} preserveAspectRatio="none" aria-hidden="true">
            <path d={toSvgPath(shape.outline, shape.aspect, 1, true)} stroke="#fff" stroke-width="7" {...stroke} />
            <path d={toSvgPath(shape.outline, shape.aspect, 1, true)} stroke="#1A1A1A" stroke-width="3" {...stroke} />
            {shape.details.map((d) => (
              <>
                <path d={toSvgPath(d, shape.aspect, 1, false)} stroke="#fff" stroke-width="9" {...stroke} />
                <path d={toSvgPath(d, shape.aspect, 1, false)} stroke="#1A1A1A" stroke-width="5" {...stroke} />
              </>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
