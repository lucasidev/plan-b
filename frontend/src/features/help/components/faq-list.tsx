'use client';

import { ChevronRight } from 'lucide-react';
import { type CSSProperties, useState } from 'react';
import { FAQ, type FaqEntry } from '../data/faq';

// Style del trigger del accordion. Module-scope para evitar nueva ref por render y
// para que la regla `no-inline-exhaustive-style` no se dispare por las 13 props (es un
// botón pill clickeable, no tenemos clases Tailwind compactas que cubran este shape).
const TRIGGER_STYLE: CSSProperties = {
  appearance: 'none',
  background: 'transparent',
  border: 0,
  width: '100%',
  padding: '16px 18px',
  fontSize: 14,
  fontWeight: 500,
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  cursor: 'pointer',
};

/**
 * Lista de FAQ con accordions (US-073). Cada item es un `<button>` que abre/cierra el panel
 * con la respuesta. Solo se mantiene abierto uno a la vez (toggle): así el scroll vertical
 * no se vuelve impredecible cuando el user explora varios.
 *
 * Cliente porque mantiene el estado del item abierto. Idiomatic Next: server por default,
 * cliente solo donde el interactivity lo exige.
 */
export function FaqList() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {FAQ.map((entry) => (
        <li key={entry.id}>
          <FaqItem
            entry={entry}
            open={openId === entry.id}
            onToggle={() => setOpenId((prev) => (prev === entry.id ? null : entry.id))}
          />
        </li>
      ))}
    </ul>
  );
}

function FaqItem({
  entry,
  open,
  onToggle,
}: {
  entry: FaqEntry;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = `faq-panel-${entry.id}`;
  const buttonId = `faq-button-${entry.id}`;
  return (
    <div className="bg-bg-card border border-line" style={{ borderRadius: 10, overflow: 'hidden' }}>
      <button
        id={buttonId}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="text-ink-1 hover:bg-bg-elev"
        style={TRIGGER_STYLE}
      >
        <span>{entry.question}</span>
        <ChevronRight
          size={16}
          aria-hidden
          className="text-ink-3"
          style={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 120ms ease',
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        // `<section>` con aria-labelledby es el equivalente semántico de
        // `<div role="region">`, prefiere el elemento por sobre el role (regla
        // react-doctor/prefer-tag-over-role).
        <section
          id={panelId}
          aria-labelledby={buttonId}
          className="text-ink-2"
          style={{
            padding: '0 18px 16px',
            fontSize: 13.5,
            lineHeight: 1.6,
            borderTop: '1px solid var(--line)',
            paddingTop: 14,
          }}
        >
          {entry.answer}
        </section>
      )}
    </div>
  );
}
