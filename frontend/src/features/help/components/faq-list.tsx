'use client';

import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { FAQ, type FaqEntry } from '../data/faq';

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
    <ul className="flex min-w-0 flex-col gap-3">
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
    <div className="overflow-hidden rounded-[10px] border border-line bg-bg-card">
      <button
        id={buttonId}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-medium text-ink hover:bg-bg-elev focus-visible:-outline-offset-2"
      >
        <span>{entry.question}</span>
        <ChevronRight
          size={16}
          aria-hidden
          className="shrink-0 text-ink-3 motion-safe:transition-transform motion-safe:duration-150"
          style={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
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
          className="border-t border-line px-4 py-4 text-sm leading-relaxed text-ink-2"
        >
          {entry.answer}
        </section>
      )}
    </div>
  );
}
