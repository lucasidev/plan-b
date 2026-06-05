'use client';

import { ChevronRight } from 'lucide-react';
import { type CSSProperties, useState } from 'react';
import { FAQ, type FaqEntry } from '../data/faq';

// Style of the accordion trigger. Module-scope to avoid a new ref per render and so
// the `no-inline-exhaustive-style` rule does not fire for the 13 props (it is a
// clickable pill button; no compact Tailwind classes cover this shape).
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
 * FAQ list with accordions (US-073). Each item is a `<button>` that opens/closes the
 * panel with the answer. Only one stays open at a time (toggle): that way the vertical
 * scroll does not become unpredictable when the user explores several.
 *
 * Client because it keeps the open-item state. Idiomatic Next: server by default,
 * client only where interactivity requires it.
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
        // `<section>` with aria-labelledby is the semantic equivalent of
        // `<div role="region">`; prefer the element over the role
        // (react-doctor/prefer-tag-over-role rule).
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
