import { HomePaths } from '@/features/home/components/home-paths';
import { greetingNameFromEmail } from '@/features/home/lib/greeting';
import { getSession } from '@/lib/session';

/**
 * Inicio (`/home`). Con el seguimiento de carrera podado (ADR-0086) ya no hay plan,
 * período, materias en curso ni movimientos que mostrar acá: la pantalla saluda, dice
 * en una línea qué es este lugar, y ofrece los tres caminos a lo que el producto sí
 * hace hoy (`HomePaths`: leer fichas, contar una cursada, ver lo aportado). No pide ni
 * inventa ningún número: no hay fetch de conteos propios todavía, así que no se
 * muestra ninguno.
 *
 * El guard de `(member)/layout.tsx` ya filtró sesión y rol; esta página asume los dos.
 *
 * `data-surface="bulletin"` va en el contenedor de ancho completo y no en la columna,
 * mismo criterio documentado en `ChairFactsSheet`
 * (`features/chair-facts/components/chair-facts-sheet.tsx`): el `<main>` del AppShell
 * no lleva la superficie, así que si el atributo lo lleva solo la columna de 560px, el
 * resto del área queda con el fondo del chasis anterior (Apricot), que es otra paleta.
 */
export default async function HomePage() {
  const session = await getSession();
  const firstName = session ? greetingNameFromEmail(session.email) : 'alumno';

  return (
    <div data-surface="bulletin" className="min-h-full w-full">
      <div className="mx-auto w-full max-w-[560px] px-4 py-8">
        <div className="mb-[18px]">
          <p className="font-mono text-[11px] tracking-[0.04em] text-ink-3">Inicio</p>
          <h1 className="mt-1.5 font-serif text-[24px] font-semibold leading-tight text-ink">
            Hola {firstName}.
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
            Leé lo que ya vivieron otros en cada materia y cátedra. Cuando curses algo, contalo vos
            también.
          </p>
        </div>

        <HomePaths />
      </div>
    </div>
  );
}
