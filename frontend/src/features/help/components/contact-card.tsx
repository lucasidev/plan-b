/**
 * "Hablá con nosotros" card on the right sidebar (US-073). The mockup showed an "Abrir
 * chat de soporte" button + a mailto link at the foot. Since there is no real chat yet,
 * both open a mailto to the support email; once Notifications BC + a chat widget land,
 * the button starts opening it and the mailto becomes a fallback.
 *
 * Explicit debt: the contact form described in the US-073 doc (subject + message +
 * screenshot) is NOT implemented until the backend has `POST /api/support/contact`. In
 * MVP the mailto covers the case without scope creep.
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
