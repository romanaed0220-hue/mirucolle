// 描く画面のペン選び：色・太さ・（交換した）質感。横にスクロールできる 1 列
import { PEN_COLORS, PEN_KINDS, PEN_WIDTHS, type PenStyle } from '../lib/pen';
import { useAppState } from '../data/store';

export function PenBar({ pen, onChange }: { pen: PenStyle; onChange: (patch: Partial<PenStyle>) => void }) {
  const { owned } = useAppState();
  const kinds = PEN_KINDS.filter((k) => owned.includes(k.id));
  return (
    <div class="pen-bar" role="toolbar" aria-label="ペン">
      {PEN_COLORS.map((c) => (
        <button class={`pen-color${pen.c === c.id ? ' on' : ''}`} style={{ background: c.hex }}
          aria-label={c.name} aria-pressed={pen.c === c.id} onClick={() => onChange({ c: c.id })} />
      ))}
      <span class="pen-sep" />
      {PEN_WIDTHS.map((w) => (
        <button class={`pen-width${pen.w === w.id ? ' on' : ''}`} aria-label={w.name} aria-pressed={pen.w === w.id}
          onClick={() => onChange({ w: w.id })}>
          <i class={`pw-${w.id}`} />
        </button>
      ))}
      {kinds.length > 0 && (
        <>
          <span class="pen-sep" />
          {[{ id: undefined as string | undefined, name: 'ふつう' }, ...kinds].map((k) => (
            <button class={`pen-kind${pen.k === k.id ? ' on' : ''}`} aria-pressed={pen.k === k.id}
              onClick={() => onChange({ k: k.id })}>{k.name}</button>
          ))}
        </>
      )}
    </div>
  );
}
