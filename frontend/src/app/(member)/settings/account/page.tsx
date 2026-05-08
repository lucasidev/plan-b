import { redirect } from 'next/navigation';
import { DeleteAccountButton } from '@/features/delete-account';
import { getSession } from '@/lib/session';

/**
 * `/settings/account`: pantalla de gestión de la cuenta del member.
 *
 * MVP scope: solo expone el botón de "Eliminar mi cuenta" (US-038-f). Cuando
 * aterrice US-047 (Mi perfil) y US-072 (Ajustes completos), esta página se
 * absorbe en el shell de Mi perfil o se expande con secciones adicionales.
 * Por ahora vive como sub-ruta dedicada porque el guard de `(member)` ya nos
 * cubre y crear la página completa de Mi perfil es scope de otra US.
 *
 * Server Component: lee la sesión para pasarle el email al CTA destructivo
 * (que lo usa como anti-accidental check en el modal). Si no hay sesión,
 * redirect. Duplica el guard del layout pero es defensa explícita ante un
 * caso degenerado donde el JWT haya expirado entre el render del layout y
 * el render de la página.
 */
export default async function AccountSettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div style={{ padding: '32px 24px', maxWidth: 720 }}>
      <h1
        className="text-ink"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          letterSpacing: '-0.01em',
          fontWeight: 600,
          margin: 0,
          marginBottom: 8,
        }}
      >
        Tu cuenta
      </h1>
      <p className="text-ink-2" style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 28 }}>
        Acciones sobre tu cuenta de plan-b. Más opciones (notificaciones, privacidad, idioma, tema)
        llegarán cuando aterrice Ajustes (US-072).
      </p>

      <DeleteAccountButton email={session.email} />
    </div>
  );
}
