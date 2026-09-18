'use client';

import { ChevronUp } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import { initialSignOutState, signOut } from '@/features/sign-out';
import { displayNameFromEmail, getInitialsFromEmail } from '@/lib/member-shell';
import { navigateAfterMutation } from '@/lib/navigate-after-mutation';
import type { Session } from '@/lib/session';
import { cn } from '@/lib/utils';
import { FallbackLink } from './fallback-link';

type Props = {
  email: string;
  accountRole?: Session['role'];
  placement?: 'sidebar' | 'header';
};

/** Menú de cuenta compartido por header y sidebar, para alumno y admin. */
export function AvatarMenu({ email, accountRole = 'member', placement = 'sidebar' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [signOutState, signOutFormAction, pending] = useActionState(async () => {
    const result = await signOut();
    if (result.status === 'success') navigateAfterMutation(result.redirectTo);
    return result;
  }, initialSignOutState);

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
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const initials = getInitialsFromEmail(email);
  const inHeader = placement === 'header';

  return (
    <div ref={ref} className={cn('relative', inHeader ? 'shrink-0' : 'w-full')}>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={inHeader ? `Menú de cuenta: ${email}` : undefined}
        title={inHeader ? displayNameFromEmail(email) : undefined}
        className={cn(
          'flex items-center gap-2.5 text-left cursor-pointer',
          'border-0 bg-transparent text-inherit',
          inHeader ? 'rounded-full' : 'w-full border-t border-line',
        )}
        style={{ padding: inHeader ? 0 : '10px 8px', font: 'inherit' }}
      >
        <Avatar initials={initials} />
        {!inHeader && <Identity email={email} />}
        {!inHeader && (
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
        )}
      </button>

      {open && (
        <Dropdown
          email={email}
          accountRole={accountRole}
          placement={placement}
          onClose={() => setOpen(false)}
          signOutFormAction={signOutFormAction}
          pending={pending}
          error={signOutState.status === 'error' ? signOutState.message : undefined}
        />
      )}
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

function Dropdown({
  email,
  accountRole,
  placement,
  onClose,
  signOutFormAction,
  pending,
  error,
}: Required<Props> & {
  onClose: () => void;
  signOutFormAction: () => void;
  pending: boolean;
  error?: string;
}) {
  return (
    <div
      role="menu"
      className="absolute bg-bg border border-line shadow-card"
      style={{
        ...(placement === 'header'
          ? { top: 'calc(100% + 6px)', right: 0, width: 'min(260px, calc(100vw - 32px))' }
          : { bottom: 'calc(100% + 6px)', left: 8, right: 8 }),
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

      {accountRole === 'member' ? (
        <>
          <MenuLink href="/my-profile" onClick={onClose}>
            Mi perfil
          </MenuLink>
          <MenuLink href="/settings" onClick={onClose}>
            Ajustes
          </MenuLink>
        </>
      ) : (
        <MenuLink href="/admin" onClick={onClose}>
          Backoffice
        </MenuLink>
      )}
      <MenuLink href="/help" onClick={onClose}>
        Ayuda y contacto
      </MenuLink>

      <div style={{ height: 1, background: 'var(--color-line-2)', margin: '4px 0' }} />

      <form action={signOutFormAction}>
        {error && (
          <p role="alert" className="px-2.5 py-2 text-sm text-ink">
            {error}
          </p>
        )}
        <button
          type="submit"
          role="menuitem"
          disabled={pending}
          // Mantener el form montado durante el submit evita descartar el envío.
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
    <FallbackLink
      href={href}
      onClick={onClick}
      // Mismo motivo que el sidebar y el topbar (#477): el prefetch en viewport compite con la
      // navegación real, y acá pega más fuerte porque abrir el menú monta los tres links a la vez.
      prefetch={false}
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
    </FallbackLink>
  );
}
