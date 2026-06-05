import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TeacherDrawer } from '@/features/my-career/components/teacher-drawer';
import { teacherById } from '@/features/my-career/data/teachers';

/**
 * Teacher-detail drawer (US-045-d). Dedicated route with the teacher resolved by id.
 * 404 if it does not exist.
 *
 * Pattern parallel to `/my-career/subject/[code]`. Dedicated page mounting
 * `<TeacherDrawer />`; eventual migration to `@modal` stays as debt.
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
