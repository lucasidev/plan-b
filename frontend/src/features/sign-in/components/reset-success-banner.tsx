'use client';

import { CheckCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Confirmation banner rendered after a successful password reset. Mounted
 * by `app/(auth)/sign-in/page.tsx` when `?reset=success` is in the URL
 * (driven by the reset-password 204 redirect, US-033-i).
 *
 * Auto-dismisses after 8s and is also dismissable manually via the close
 * button. Pure UI: the source of truth (`?reset=success`) is server-driven
 * by the SignInPage; closing the banner does NOT clean the URL because
 * the param is harmless and the banner ignores stale state on the next
 * render.
 */
export function ResetSuccessBanner() {
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
        <b style={{ fontWeight: 600 }}>Listo.</b> Ya podés ingresar con tu nueva contraseña.
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
