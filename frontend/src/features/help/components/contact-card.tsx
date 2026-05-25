/**
 * Card "Hablá con nosotros" del sidebar derecho (US-073). El mockup mostraba botón "Abrir
 * chat de soporte" + link mailto al pie. Como no tenemos chat real todavía, ambos abren un
 * mailto al support email; cuando aterrice Notifications BC + un widget de chat, el botón
 * pasa a abrirlo y el mailto queda como fallback.
 *
 * Deuda explícita: el form de contacto descrito en el doc US-073 (subject + message +
 * screenshot) NO se implementa hasta que el backend tenga `POST /api/support/contact`.
 * En MVP el mailto cubre el caso sin scope creep.
 */

import { SUPPORT_EMAIL } from '../data/resources';

const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Hola plan-b — necesito ayuda')}`;

export function ContactCard() {
  return (
    <section
      className="bg-accent-soft border border-accent/30"
      style={{ padding: 18, borderRadius: 10 }}
      aria-labelledby="contact-eyebrow"
    >
      <div
        id="contact-eyebrow"
        className="text-accent-ink"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Hablá con nosotros
      </div>
      <p
        className="text-ink-2"
        style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 0, marginBottom: 14 }}
      >
        ¿Algo no cierra o ves un dato mal? Lo respondemos en menos de 24h.
      </p>
      <a
        href={SUPPORT_MAILTO}
        className="bg-accent text-white"
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '10px 14px',
          borderRadius: 999,
          fontSize: 13.5,
          fontWeight: 500,
          textDecoration: 'none',
        }}
      >
        Abrir chat de soporte
      </a>
      <p
        className="text-ink-3"
        style={{ fontSize: 12, marginTop: 10, marginBottom: 0, textAlign: 'center' }}
      >
        o escribinos a{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-ink hover:text-accent-hover">
          {SUPPORT_EMAIL}
        </a>
      </p>
    </section>
  );
}
