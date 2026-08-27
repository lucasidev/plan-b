import Link from 'next/link';
import { Logo } from '@/components/ui';
import { GlobalSearch } from '@/features/global-search';

/**
 * Header del catálogo público (US-001, US-132): logo (vuelve a la landing), la búsqueda y el link
 * a Ingresar. No es el `<Topbar>` de `(member)` (asume sesión activa) ni el `<LpTopbar>` completo
 * de la landing (con nav a sus anclas): el catálogo es 100 % anónimo y se mantiene chico.
 *
 * La búsqueda vivía solo en el área autenticada, y eso dejaba a un visitante sin forma de llegar a
 * una cátedra salvo recorriendo universidad, carrera, plan y materia. El endpoint ya era público
 * (leer no pide cuenta, que es media tesis), así que lo único que faltaba era montarla acá.
 */
export function CatalogTopbar() {
  return (
    <header className="flex items-center gap-4 border-b border-line bg-bg px-4 py-4 sm:px-6">
      <Link href="/" aria-label="Ir al inicio">
        <Logo size={18} />
      </Link>
      <div className="flex-1" />
      <GlobalSearch />
      <Link
        href="/sign-in"
        className="shrink-0 text-[13px] font-medium text-ink-2 hover:text-ink hover:underline"
      >
        Ingresar
      </Link>
    </header>
  );
}
