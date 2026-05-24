'use client';

import { getInitialsFromEmail } from '@/lib/member-shell';

/**
 * Avatar grande del header de Mi perfil. Genera iniciales del email mientras no haya storage
 * de fotos (ADR pendiente). Cuando aterrice, este componente acepta una `photoUrl` opcional
 * y renderea `<img>` con fallback a las iniciales.
 */
export function ProfileAvatar({ email }: { email: string }) {
  const initials = getInitialsFromEmail(email);
  return (
    <div
      role="img"
      aria-label={`Avatar de ${email}`}
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
