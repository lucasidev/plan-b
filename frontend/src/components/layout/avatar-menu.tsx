'use client';

import { ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { signOutAction } from '@/features/sign-out';
import { displayNameFromEmail, getInitialsFromEmail } from '@/lib/member-shell';
import { cn } from '@/lib/utils';

type Props = {
  email: string;
};

/**
 * Avatar + contextual dropdown at the bottom of the sidebar. Per
 * `docs/design/reference/components/shell.jsx::Sidebar` (the `me` section).
 *
 * Menu states:
 *  - **idle** (closed): shows only avatar + email + rotated chevron.
 *  - **open**: panel above the avatar with links to Mi perfil, Configuración,
 *    Onboarding (not implemented, go to stubs), Ayuda, and "Cerrar sesión".
 *
 * Sign-out uses the existing US-029-i server action. The form submit fires the
 * action; the redirect to `/sign-in` it returns unmounts this dropdown naturally
 * (navigation pulls the user out of the authenticated area). There is no
 * onClick={onClose} on the submit button: if there were, the state change could
 * unmount the form before the action executes (race observable in E2E with very fast
 * clicks).
 *
 * Clicking outside the dropdown closes it (event listener on `document`).
 */
export function AvatarMenu({ email }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click outside closes the menu.
  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Esc also closes it.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const initials = getInitialsFromEmail(email);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'w-full flex items-center gap-2.5 text-left cursor-pointer',
          'border-0 bg-transparent text-inherit',
          'border-t border-line',
        )}
        style={{ padding: '10px 8px', font: 'inherit' }}
      >
        <Avatar initials={initials} />
        <Identity email={email} />
        <ChevronUp
          size={11}
          className="text-ink-3"
          style={{
            marginRight: 6,
            transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.15s',
          }}
          aria-hidden
        />
      </button>

      {open && <Dropdown email={email} onClose={() => setOpen(false)} />}
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div
      className="bg-accent-soft text-accent-ink grid place-items-center font-semibold"
      style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        fontSize: 12,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function Identity({ email }: { email: string }) {
  const name = displayNameFromEmail(email);
  return (
    <div style={{ lineHeight: 1.2, minWidth: 0, flex: 1 }}>
      <b className="block text-ink" style={{ fontSize: 13, fontWeight: 500 }}>
        {name}
      </b>
      <small className="text-ink-3 truncate block" style={{ fontSize: 11 }}>
        {email}
      </small>
    </div>
  );
}

function Dropdown({ email, onClose }: { email: string; onClose: () => void }) {
  return (
    <div
      role="menu"
      className="absolute bg-bg border border-line shadow-card"
      style={{
        bottom: 'calc(100% + 6px)',
        left: 8,
        right: 8,
        borderRadius: 'var(--radius)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
        padding: 6,
        zIndex: 10,
      }}
    >
      <div
        style={{
          padding: '10px 10px 8px',
          borderBottom: '1px solid var(--color-line-2)',
          marginBottom: 4,
        }}
      >
        <div className="text-ink" style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
          {displayNameFromEmail(email)}
        </div>
        <div
          className="text-ink-3 truncate"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            letterSpacing: '0.02em',
          }}
        >
          {email}
        </div>
      </div>

      <MenuLink href="/my-profile" onClick={onClose}>
        Mi perfil
      </MenuLink>
      <MenuLink href="/settings" onClick={onClose}>
        Ajustes
      </MenuLink>
      <MenuLink href="/help" onClick={onClose}>
        Ayuda y contacto
      </MenuLink>

      <div style={{ height: 1, background: 'var(--color-line-2)', margin: '4px 0' }} />

      <form action={signOutAction}>
        <button
          type="submit"
          role="menuitem"
          // No `onClick={onClose}` here: the server action redirects to `/sign-in`,
          // which unmounts this dropdown naturally via navigation. If we closed the
          // dropdown manually in the same event, React could re-render before the
          // submit and discard the whole form (race observable in E2E with very
          // fast clicks).
          className={cn(
            'w-full text-left cursor-pointer border-0 bg-transparent',
            'text-st-failed-fg hover:bg-bg-elev',
            'transition-colors',
          )}
          style={{
            padding: '8px 10px',
            borderRadius: 6,
            fontSize: 12.5,
            fontFamily: 'inherit',
          }}
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className={cn('block w-full text-left text-ink-2 hover:bg-bg-elev', 'transition-colors')}
      style={{
        padding: '8px 10px',
        borderRadius: 6,
        fontSize: 12.5,
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  );
}
