// カードの縁どり（交換所の「カード」）。つながりの自分の投稿と、見本で同じクラスを使う
export const cardFrameClass = (id?: string) => (id ? ` cs-${id}` : '');

/** 交換所・もちもので見せる小さな見本 */
export function CardSample({ id }: { id?: string }) {
  return (
    <div class={`card mini-card${cardFrameClass(id)}`} aria-hidden="true">
      <div class="mini-stage" />
      <div class="mini-body"><i /><i /></div>
    </div>
  );
}
