import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminPageHeader } from '@/components/layout/admin-page-header';
import { fetchUniversityDetailServer } from '@/features/manage-universities/api.server';

export const dynamic = 'force-dynamic';

export default async function AdminUniversityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const university = await fetchUniversityDetailServer(id);
  if (!university) notFound();
  const sections = [
    {
      label: 'Carreras y planes de estudio',
      href: `/admin/universities/${id}/careers`,
      description: 'Entrá a un plan para gestionar sus materias y las cátedras de cada materia.',
    },
    {
      label: 'Docentes',
      href: `/admin/teachers?universityId=${id}`,
      description: 'Docentes del catálogo de esta universidad.',
    },
    {
      label: 'Períodos lectivos',
      href: `/admin/universities/${id}/terms`,
      description: 'Períodos disponibles para las cursadas de esta universidad.',
    },
  ];
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/universities" className="text-sm underline">
        Volver a Universidades
      </Link>
      <AdminPageHeader
        eyebrow="Catálogo académico"
        title={university.name}
        subtitle={
          university.isActive ? 'Universidad cargada en el catálogo.' : 'Universidad archivada.'
        }
        action={
          university.isActive ? (
            <Link href={`/admin/universities/${id}/edit`} className="text-sm underline">
              Editar universidad
            </Link>
          ) : undefined
        }
      />
      <nav
        aria-label="Catálogo de la universidad"
        className="divide-y divide-line rounded-lg border border-line bg-bg-card"
      >
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="block p-5 hover:bg-bg-elev">
            <h2 className="font-medium">{section.label}</h2>
            <p className="mt-1 text-sm text-ink-2">{section.description}</p>
          </Link>
        ))}
      </nav>
    </div>
  );
}
