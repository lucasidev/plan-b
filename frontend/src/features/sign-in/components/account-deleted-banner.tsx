'use client';

import { CheckCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Confirmation banner rendered after a successful account deletion (US-038-f).
 * Mounted by `app/(auth)/sign-in/page.tsx` when `?deleted=1` is in the URL,
 * driven by the deleteAccountAction's `redirect('/sign-in?deleted=1')` call.
 *
 * Same dismissal model as `ResetSuccessBanner`: 8s auto-dismiss + manual close.
 * The query param stays in the URL after dismissal (harmless, banner ignores
 * stale state on next render).
 */
export function AccountDeletedBanner() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setOpen(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-2 rounded bg-st-approved-bg text-st-approved-fg"
      style={{
        padding: '10px 12px',
        marginBottom: 18,
        fontSize: 13,
        border: '1px solid color-mix(in oklch, var(--color-st-approved-fg) 30%, transparent)',
      }}
    >
      <CheckCircle2 size={16} aria-hidden style={{ marginTop: 1, flexShrink: 0 }} />
      <p className="flex-1" style={{ lineHeight: 1.45 }}>
        <b style={{ fontWeight: 600 }}>Tu cuenta fue eliminada.</b> Volvé cuando quieras.
      </p>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Cerrar mensaje"
        className="text-ink-3 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft rounded-sm"
        style={{ padding: 2, marginTop: -2, marginRight: -4, lineHeight: 0 }}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}
