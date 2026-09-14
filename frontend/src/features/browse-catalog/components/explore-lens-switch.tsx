import Link from 'next/link';

export type ExploreLens = 'careers' | 'universities';

/** Orden de la maqueta (`Object.entries(LENS)`, `V.explore`): Universidades primero, Carreras después. */
const LENSES: { lens: ExploreLens; href: string; label: string }[] = [
  { lens: 'universities', href: '/universities', label: 'Universidades' },
  { lens: 'careers', href: '/careers', label: 'Carreras' },
];

/**
 * Las dos lentes de Explorar (US-222, V03, ADR-0096, maqueta aprobada: `.pb-lens`), sin escribir
 * nada para pasar de una a otra. Server Component: cada página ya sabe cuál es (`active`), así
 * que no hace falta `usePathname` ni JS en el cliente para resaltar la lente activa.
 */
export function ExploreLensSwitch({ active }: { active: ExploreLens }) {
  return (
    <div role="tablist" aria-label="Lente de exploración" className="pb-lens">
      {LENSES.map(({ lens, href, label }) => (
        <Link key={lens} href={href} role="tab" aria-selected={lens === active}>
          {label}
        </Link>
      ))}
    </div>
  );
}
