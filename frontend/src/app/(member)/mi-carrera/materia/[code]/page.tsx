import Link from 'next/link';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';

/**
 * Stub del detalle de materia. Hoy es destino del click desde el plan grid
 * (US-045-b). Cuando aterrice US-045-d, esta ruta se convierte en el drawer
 * real con datos del catálogo + correlativas + comisiones + reseñas. La URL
 * `/mi-carrera/materia/[code]` se mantiene para que los links del PlanGrid
 * no se rompan.
 *
 * Server component liviano: solo lee el code de los params y muestra el
 * placeholder. Sin fetch, sin cliente.
 */
export default async function MateriaStubPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  return (
    <div className="px-6 py-9 max-w-[800px] mx-auto">
      <Eyebrow>Mi carrera · Materia · {code}</Eyebrow>
      <DisplayHeading size={32} className="mt-2 mb-4">
        Próximamente: detalle de materia.
      </DisplayHeading>
      <p className="text-ink-2 mb-6">
        El drawer con info completa de <strong>{code}</strong> (descripción, correlativas,
        comisiones del cuatri, reseñas) aterriza con US-045-d. Mientras tanto, este es el destino
        del click desde el plan grid.
      </p>
      <Link
        href="/mi-carrera"
        className="inline-flex items-center text-accent-ink hover:text-accent-hover"
      >
        ← Volver al plan
      </Link>
    </div>
  );
}
