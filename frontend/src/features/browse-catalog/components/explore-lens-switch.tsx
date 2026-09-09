import Link from 'next/link';
import { cn } from '@/lib/utils';

export type ExploreLens = 'careers' | 'universities';

const LENSES: { lens: ExploreLens; href: string; label: string }[] = [
  { lens: 'careers', href: '/careers', label: 'Carreras' },
  { lens: 'universities', href: '/universities', label: 'Universidades' },
];

/**
 * Las dos lentes de Explorar (US-222, V03): por carrera y por institución, sin escribir nada
 * para pasar de una a otra. Server Component: cada página ya sabe cuál es (`active`), así que no
 * hace falta `usePathname` ni JS en el cliente para resaltar la lente activa.
 */
export function ExploreLensSwitch({ active }: { active: ExploreLens }) {
  return (
    <div
      role="tablist"
      aria-label="Lente de exploración"
      className="inline-flex gap-1 rounded-lg border border-line bg-bg-card p-1"
    >
      {LENSES.map(({ lens, href, label }) => (
        <Link
          key={lens}
          href={href}
          role="tab"
          aria-selected={lens === active}
          className={cn(
            'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
            lens === active ? 'bg-bg-elev text-ink' : 'text-ink-2 hover:text-ink',
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
