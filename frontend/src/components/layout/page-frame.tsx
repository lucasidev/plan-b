import './planb.css';

/** Un par número/etiqueta de la tira `.pb-stats` (`stats(v)` en la maqueta). */
export type PageFrameStat = readonly [value: string, label: string];

type Props = {
  /** El contenido de `.pb-head` (`v.head` en la maqueta): eyebrow, h1, subtítulo, lo que la vista necesite ahí. */
  head: React.ReactNode;
  /** La tira `.pb-stats` (`stats(v)`), pares [número, etiqueta]. Sin ella no se dibuja: `frameApp` la omite cuando la vista no la declara. */
  stats?: readonly PageFrameStat[];
  /** El cuerpo, columna izquierda de `.pb-dossier` (`v.main`). */
  main: React.ReactNode;
  /** La columna derecha (`v.aside`), opcional: sin ella, `.pb-dossier` no se dibuja y el cuerpo ocupa todo el ancho. */
  aside?: React.ReactNode;
};

/**
 * El marco de página que `render()` arma en la maqueta aprobada (planb-catalogo-adentro.html,
 * `frameApp`): `.pb-content` con `.pb-head` (cabecera + stats) y `.pb-dossier` (cuerpo + columna
 * derecha). Toda pantalla del shell que porte la maqueta lo usa.
 *
 * Una sola diferencia a propósito contra la maqueta: acá es un `<div>`, no un `<main>`. `AppShell`
 * ya pone el `<main>` del documento (el landmark de scroll, con su `tabIndex` para WCAG 2.1.1); un
 * segundo `<main>` anidado sería un landmark duplicado.
 */
export function PageFrame({ head, stats, main, aside }: Props) {
  return (
    <div className="pb-content">
      <div className="pb-head">
        {head}
        {stats && stats.length > 0 && (
          <div className="pb-stats">
            {stats.map(([value, label]) => (
              <div key={label}>
                <div className="pb-v">{value}</div>
                <div className="pb-k">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {aside ? (
        <div className="pb-dossier">
          <div>{main}</div>
          <aside>{aside}</aside>
        </div>
      ) : (
        <div>{main}</div>
      )}
    </div>
  );
}
