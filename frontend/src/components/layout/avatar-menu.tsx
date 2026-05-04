'use client';

import { ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { signOutAction } from '@/features/sign-out';
import { getInitialsFromEmail } from '@/lib/member-shell';
import { cn } from '@/lib/utils';

type Props = {
  email: string;
};

/**
 * Avatar + dropdown contextual abajo del sidebar. Per
 * `docs/design/reference/components/shell.jsx::Sidebar` (sección `me`).
 *
 * Estados del menú:
 *  - **idle** (cerrado): solo muestra avatar + email + chevron rotado.
 *  - **open**: panel encima del avatar con links a Mi perfil, Configuración,
 *    Onboarding (no implementados, llevan a stubs), Ayuda, y "Cerrar sesión".
 *
 * Sign-out usa el server action existente de US-029-i. El form submit
 * dispara la action; el redirect a `/sign-in` que devuelve desmonta este
 * dropdown natural (la nav saca al usuario del area autenticada). No hay
 * onClick={onClose} en el submit button: si lo tuviéramos, el state
 * change podría unmountear el form antes que la action ejecute (race
 * observable en E2E con clicks ultra-rápidos).
 *
 * El click fuera del dropdown lo cierra (event listener en `document`).
 */
export function AvatarMenu({ email }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click fuera cierra el menú.
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

  // Esc también cierra.
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

/**
 * Display name temporal: "lucia.mansilla@gmail.com" → "Lucia Mansilla".
 * Cuando US-012 (StudentProfile) aterrice y la session lleve `firstName +
 * lastName`, este helper se reemplaza por leer eso directo.
 */
function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  if (!local) return email;
  return local
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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

      <MenuLink href="/profile" onClick={onClose}>
        Mi perfil
      </MenuLink>
      <MenuLink href="/settings" onClick={onClose}>
        Configuración
      </MenuLink>
      <MenuLink href="/help" onClick={onClose}>
        Ayuda y contacto
      </MenuLink>

      <div style={{ height: 1, background: 'var(--color-line-2)', margin: '4px 0' }} />

      <form action={signOutAction}>
        <button
          type="submit"
          role="menuitem"
          // No `onClick={onClose}` acá: el server action hace redirect a
          // `/sign-in` que desmonta este dropdown natural via navegación.
          // Si cerrábamos el dropdown manualmente en el mismo evento, React
          // podía re-renderear antes del submit y descartar el form entero
          // (race observable en E2E con clicks ultra-rápidos).
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
