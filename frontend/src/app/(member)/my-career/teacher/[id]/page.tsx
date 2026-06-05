import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TeacherDrawer } from '@/features/my-career/components/teacher-drawer';
import { teacherById } from '@/features/my-career/data/teachers';

/**
 * Drawer de detalle de docente (US-045-d). Ruta dedicada con el teacher
 * resuelto por id. 404 si no existe.
 *
 * Patrón paralelo al de `/my-career/subject/[code]`. Página dedicada que
 * monta `<TeacherDrawer />`; eventual migración a `@modal` queda como
 * deuda.
 */
export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teacher = teacherById(id);

  if (!teacher) {
    notFound();
  }

  return (
    <div className="px-6 py-9 max-w-[1200px] mx-auto">
      <div className="mb-4">
        <Link
          href="/my-career?tab=teachers"
          className="text-sm text-accent-ink hover:text-accent-hover inline-flex items-center"
        >
          ← Volver a docentes
        </Link>
      </div>
      <TeacherDrawer teacher={teacher} />
    </div>
  );
}
