import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

type HomePath = {
  href: string;
  title: string;
  body: string;
};

/**
 * Los tres caminos a lo que el producto hace hoy (ADR-0086): leer fichas, reseñar una
 * cursada, y ver lo que ya aportaste. Ninguno vive en el sidebar del área (member, ver
 * `lib/member-shell.ts`, que solo lista Inicio y Mis aportes), así que esta lista es la
 * única puerta a `/universities` y a `/reviews/new` dentro de la app ya logueada.
 *
 * Misma fila-link con chevron que `UniversityList`
 * (`features/browse-catalog/components/university-list.tsx`): las tres opciones son
 * pares entre sí, ninguna más importante que las otras, así que no hay un botón de
 * acento que sugiera una jerarquía que no existe.
 */
const PATHS: readonly HomePath[] = [
  {
    href: '/universities',
    title: 'Explorar carreras y materias',
    body: 'Universidades, carreras, materias y cátedras, con lo que publica cada una.',
  },
  {
    href: '/reviews/new',
    title: 'Reseñar una cursada',
    body: 'Un minuto y medio, marcando opciones.',
  },
  {
    href: '/reviews/mine',
    title: 'Mis aportes',
    body: 'Lo que reseñaste hasta ahora, para corregirlo o sacarlo.',
  },
];

export function HomePaths() {
  return (
    <ul className="flex flex-col gap-2">
      {PATHS.map((path) => (
        <li key={path.href}>
          <Link
            href={path.href}
            prefetch
            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-card px-4 py-3.5 transition-colors hover:bg-bg-elev"
          >
            <span>
              <span className="block text-[14px] font-medium text-ink">{path.title}</span>
              <span className="mt-0.5 block text-[12.5px] text-ink-3">{path.body}</span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-ink-3" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
