'use client';

import { getInitialsFromEmail } from '@/lib/member-shell';

/**
 * Large avatar of the Mi perfil header. Generates initials from the email while there is
 * no photo storage (ADR pending). When that lands, this component accepts an optional
 * `photoUrl` and renders `<img>` with a fallback to the initials.
 *
 * The element uses `role="img"` + `aria-label` even though
 * react-doctor/prefer-tag-over-role suggests <img>: there is no real raster here, just
 * initials generated in CSS. The role makes it discoverable for screen readers as
 * "Avatar de <email>" instead of being read as the two loose letters. The suppression
 * stays in react-doctor.config.json so it is traceable.
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
