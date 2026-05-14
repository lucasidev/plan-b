import Link from 'next/link';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';

/**
 * Stub de cargar entrada manual al historial. Destino del CTA
 * "+ Materia rendida" del tab Historial (US-045-e). Cuando aterrice
 * US-013 (cargar entrada manual), esta ruta se convierte en el form
 * real.
 */
export default function AgregarHistorialStub() {
  return (
    <div className="px-6 py-9 max-w-[800px] mx-auto">
      <Eyebrow>Mi carrera · Historial · Agregar materia</Eyebrow>
      <DisplayHeading size={32} className="mt-2 mb-4">
        Próximamente: cargar materia rendida.
      </DisplayHeading>
      <p className="text-ink-2 mb-6">
        Vas a poder cargar manualmente una materia que hayas rendido, con código, nombre, período,
        docente y nota final. Aterriza con US-013. Mientras tanto, las materias del onboarding ya
        están cargadas en tu historial.
      </p>
      <Link
        href="/mi-carrera?tab=historial"
        className="inline-flex items-center text-accent-ink hover:text-accent-hover"
      >
        ← Volver al historial
      </Link>
    </div>
  );
}
