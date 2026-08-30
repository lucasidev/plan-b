import type { Session } from './session';

/**
 * A dónde entra cada rol. Única fuente de verdad, porque los dos lugares que deciden esto
 * tienen que coincidir o el que no coincida queda en un bucle: el sign-in, cuando manda a
 * alguien recién autenticado, y el guard de `(auth)`, cuando alguien con sesión abre
 * `/sign-in` de nuevo.
 *
 * Existe por un defecto real. El sign-in devolvía `/home` fijo, sin mirar el rol: un admin
 * entraba, `(member)/layout` lo echaba a `/sign-in` por no ser `member`, y `(auth)/layout` lo
 * devolvía a `/home` por tener sesión. Pantalla en blanco y afuera, con la sesión creada.
 *
 * El `switch` es exhaustivo sobre el union a propósito: si mañana vuelve un rol, el compilador
 * obliga a decir dónde entra antes de dejarlo pasar por los guards.
 */
export function roleHomePath(role: Session['role']): string {
  switch (role) {
    case 'member':
      return '/home';
    case 'admin':
      return '/admin';
  }
}
