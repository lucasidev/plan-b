import Link from 'next/link';
import { Logo } from '@/components/ui';

/**
 * Header mínimo del catálogo público (US-001): logo (vuelve a la landing) + link a Ingresar.
 * No es el `<Topbar>` de `(member)` (asume sesión activa) ni el `<LpTopbar>` completo de la
 * landing (con nav a anclas de la landing): el catálogo es 100% anónimo y no necesita esa
 * superficie, así que se mantiene chico a propósito.
 */
export function CatalogTopbar() {
  return (
    <header className="flex items-center justify-between border-b border-line bg-bg px-4 py-4 sm:px-6">
      <Link href="/" aria-label="Ir al inicio">
        <Logo size={18} />
      </Link>
      <Link
        href="/sign-in"
        className="text-[13px] font-medium text-ink-2 hover:text-ink hover:underline"
      >
        Ingresar
      </Link>
    </header>
  );
}
