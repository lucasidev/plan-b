'use client';

import { getInitialsFromEmail } from '@/lib/member-shell';

/**
 * Avatar grande del header de Mi perfil. Genera iniciales del email mientras no haya storage
 * de fotos (ADR pendiente). Cuando aterrice, este componente acepta una `photoUrl` opcional
 * y renderea `<img>` con fallback a las iniciales.
 */
export function ProfileAvatar({ email }: { email: string }) {
  const initials = getInitialsFromEmail(email);
  // Avatar decorativo basado en iniciales (no hay foto real todavía). El email del usuario
  // ya está expuesto al lado del avatar en el header, así que marcamos esto como
  // decorativo (aria-hidden) para evitar que screen readers anuncien las iniciales por
  // duplicado. Cuando aterrice storage de fotos, pasamos a <img alt="">.
  return (
    <div
      aria-hidden="true"
      className="bg-accent-soft text-accent-ink grid place-items-center font-semibold"
      style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        fontSize: 32,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
