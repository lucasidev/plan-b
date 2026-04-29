import { ComingSoon } from '@/components/ui';
import { getSession } from '@/lib/session';

/**
 * Home del área `(member)`. Esta es la pantalla a la que aterriza el user
 * post-login (sign-in redirige a `/dashboard`).
 *
 * Por ahora es un placeholder honesto: el AppShell ya está armado
 * alrededor (US-042-f), pero el contenido rico del home (DecisionCards
 * + sección "Cursando ahora" + greeting personalizado) aterriza en la
 * siguiente US, [US-043-f](docs/domain/user-stories/US-043-f.md).
 *
 * El sign-out vive en el AvatarMenu del shell, no acá.
 */
export default async function DashboardPage() {
  const session = await getSession();
  return (
    <ComingSoon
      section={`Hola${session ? `, ${greetingNameFromEmail(session.email)}` : ''}`}
      futureUs="US-043-f"
      description="Tu home del cuatrimestre con decisiones priorizadas, materias en curso y atajos a las herramientas. Aterriza en US-043-f. Mientras tanto navegá las secciones del sidebar para ver el shape del producto."
    />
  );
}

function greetingNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const first = local.split('.')[0] ?? local;
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : email;
}
