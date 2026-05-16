import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DisplayHeading } from '@/components/ui/display-heading';
import { Eyebrow } from '@/components/ui/eyebrow';
import { ImportHistorialFlow } from '@/features/import-historial';
import { getSession } from '@/lib/session';
import { fetchStudentProfile } from '@/lib/student-profile';

/**
 * Página `/mi-carrera/historial/importar` (US-014-f).
 *
 * Server component: chequea session + profile, renderiza el client component
 * <see cref="ImportHistorialFlow"/> que maneja upload → polling → preview →
 * confirm. El backend hace el procesamiento async; el client componente pollea
 * el GET hasta ver el estado Parsed/Failed.
 */
export default async function ImportarHistorialPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in');

  const profile = await fetchStudentProfile();
  if (!profile) redirect('/onboarding/welcome');

  return (
    <div className="px-6 py-9 max-w-[960px] mx-auto">
      <Eyebrow>Mi carrera · Historial · Importar</Eyebrow>
      <DisplayHeading size={28} className="mt-2 mb-2">
        Importá tu historial del SIU.
      </DisplayHeading>
      <p className="text-ink-3" style={{ fontSize: 14, marginBottom: 24 }}>
        Subí el PDF que descargás del SIU o pegá el texto. Plan-b detecta materias, notas y
        cuatrimestres. Después revisás el preview y elegís qué importar.
      </p>

      <ImportHistorialFlow />

      <div style={{ marginTop: 24 }}>
        <Link
          href="/mi-carrera?tab=historial"
          className="inline-flex items-center text-accent-ink hover:text-accent-hover"
          style={{ fontSize: 13 }}
        >
          ← Volver al historial
        </Link>
      </div>
    </div>
  );
}
