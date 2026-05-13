import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SubjectDrawer } from '@/features/mi-carrera/components/subject-drawer';
import { plan } from '@/features/mi-carrera/data/plan';

/**
 * Drawer de detalle de materia (US-045-d). Ruta dedicada con la materia
 * resuelta por code. Si el code no existe en el plan del alumno, 404.
 *
 * Visualmente es un panel sobre el shell de la app — no es modal todavía.
 * Cuando aterrice un patrón de parallel routes (`@modal`), evaluar
 * migrar; mientras tanto, página dedicada da sharable URL y simplicidad.
 *
 * Reemplaza el stub de US-045-b que era solo "Próximamente".
 */
export default async function SubjectDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const found = findSubject(code);

  if (!found) {
    notFound();
  }

  return (
    <div className="px-6 py-9 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <Link
          href="/mi-carrera?tab=catalogo"
          className="text-sm text-accent-ink hover:text-accent-hover inline-flex items-center"
        >
          ← Volver al catálogo
        </Link>
      </div>
      <SubjectDrawer subject={found} />
    </div>
  );
}

function findSubject(code: string) {
  for (const yearBlock of plan) {
    const found = yearBlock.subjects.find((s) => s.code === code);
    if (found) return { ...found, year: yearBlock.year };
  }
  return null;
}
