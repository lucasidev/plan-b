import { AvatarMenu } from './avatar-menu';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

type Props = {
  /** Email del user logueado, viene de la session leída en el layout RSC. */
  email: string;
  children: React.ReactNode;
};

/**
 * Chrome del área `(member)`: sidebar (con AvatarMenu en el footer) +
 * topbar + área de contenido scrolleable.
 *
 * Server component (no `'use client'`): solo recibe el email del session y
 * compone los tres bloques. El interactividad vive en los hijos
 * (Sidebar, Topbar, AvatarMenu cada uno marca `'use client'` cuando
 * corresponde).
 *
 * Layout: grid de dos columnas (240px sidebar fijo + 1fr main). Mobile
 * queda con el sidebar visible por ahora; cuando agreguemos drawer
 * collapsable, este componente decide si renderizar el shell desktop o
 * el mobile basado en breakpoint via CSS, no via JS.
 *
 * Per `docs/design/reference/styles.css::.app`.
 */
export function AppShell({ email, children }: Props) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: '240px 1fr',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Sidebar footer={<AvatarMenu email={email} />} />
      <div className="flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-bg">{children}</main>
      </div>
    </div>
  );
}
