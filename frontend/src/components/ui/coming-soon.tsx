import { cn } from '@/lib/utils';

type Props = {
  /** Display name de la sección. Aparece como heading del placeholder. */
  section: string;
  /**
   * US futura que va a aterrizar acá. Se muestra como hint mono-spaced para
   * que el evaluador entienda que no es un bug, es deuda técnica con
   * ticket asignado.
   */
  futureUs?: string;
  /** Optional override del copy descriptivo. Default es genérico. */
  description?: string;
};

/**
 * Empty-state honesto para rutas autenticadas que viven dentro del
 * AppShell (US-042-f) pero todavía no tienen contenido real.
 *
 * Por qué no un 404: la ruta existe en el sidebar, el usuario llegó acá
 * porque lo clickeó. Mostrarle 404 sería mentirle. Esta pantalla deja
 * claro que la sección está mapeada, viva, y va a tener contenido cuando
 * aterrice la US correspondiente.
 *
 * Por qué no un toast/redirect: el sidebar quiere mostrar item activo
 * cuando el user navega. Si la página redirige, el sidebar se confunde.
 */
export function ComingSoon({ section, futureUs, description }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'min-h-[60vh] px-9 py-12 max-w-xl mx-auto',
      )}
    >
      <p
        className="text-ink-4"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Próximamente
      </p>
      <h1
        className="text-ink"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 36,
          letterSpacing: '-0.02em',
          fontWeight: 500,
          margin: 0,
          lineHeight: 1.1,
        }}
      >
        {section}
      </h1>
      <p className="text-ink-2" style={{ marginTop: 16, fontSize: 14, lineHeight: 1.55 }}>
        {description ??
          'Esta sección va a tener contenido real cuando aterrice la feature correspondiente. Por ahora forma parte del mapa de la app para que veas dónde va a vivir.'}
      </p>
      {futureUs && (
        <p
          className="text-ink-3"
          style={{
            marginTop: 18,
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
            letterSpacing: '0.06em',
          }}
        >
          Ticket: {futureUs}
        </p>
      )}
    </div>
  );
}
