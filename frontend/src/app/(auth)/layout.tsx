import { redirect } from 'next/navigation';
import { roleHomePath } from '@/lib/role-home-path';
import { getSession } from '@/lib/session';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // ADR-0019: si ya hay sesión, se rebota a donde entra ese rol para no repetir el login. El
  // destino sale de `roleHomePath` y no de `/home` fijo: mandar a todos al área de alumno hacía
  // que el guard de `(member)` los devolviera acá, y este guard los mandara de vuelta.
  if (session) redirect(roleHomePath(session.role));
  return <>{children}</>;
}
