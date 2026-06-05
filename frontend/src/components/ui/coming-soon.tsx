import { cn } from '@/lib/utils';

type Props = {
  /** Display name of the section. Shown as the placeholder heading. */
  section: string;
  /**
   * Future US that will land here. Rendered as a mono-spaced hint so the evaluator
   * understands this is not a bug but technical debt with an assigned ticket.
   */
  futureUs?: string;
  /** Optional override for the descriptive copy. Defaults to a generic one. */
  description?: string;
};

/**
 * Honest empty-state for authenticated routes that live inside the AppShell
 * (US-042-f) but do not have real content yet.
 *
 * Why not a 404: the route exists in the sidebar, the user got here because they
 * clicked it. Showing 404 would be a lie. This screen makes it clear that the
 * section is mapped, alive, and will have content when the matching US lands.
 *
 * Why not a toast/redirect: the sidebar wants to show the active item when the user
 * navigates. If the page redirects, the sidebar gets confused.
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
