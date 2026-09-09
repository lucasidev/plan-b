import Link from 'next/link';
import { CatalogTopbar } from '@/features/browse-catalog';

export const metadata = {
  title: 'Materias · planb',
};

/**
 * /subjects (US-222, V03: esta ruta respondía 404 aunque había links que llevaban acá). Las
 * materias no son una lente propia de Explorar (esas son Carreras e Instituciones, US-222): cada
 * materia cuelga de un plan, y un plan de una carrera. Página estática y sin datos: en vez de un
 * 404, orienta hacia la lente que sí existe.
 */
export default function SubjectsPage() {
  return (
    <>
      <CatalogTopbar />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div
          role="status"
          className="flex flex-col items-center gap-4 rounded-lg border border-line bg-bg-card px-6 py-12 text-center"
        >
          <p className="max-w-[42ch] text-[13.5px] leading-relaxed text-ink-2">
            Las materias se navegan desde su carrera: elegí la tuya para ver su plan de estudios y
            sus materias.
          </p>
          <Link
            href="/careers"
            className="inline-flex items-center justify-center gap-1.5 rounded-pill bg-ink px-4 text-[13.5px] font-medium text-white shadow-card transition-colors hover:bg-[#1a110a]"
            style={{ height: 40 }}
          >
            Ver carreras
          </Link>
        </div>
      </main>
    </>
  );
}
