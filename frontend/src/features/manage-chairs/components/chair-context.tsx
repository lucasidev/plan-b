import { CatalogBreadcrumb } from '@/features/browse-catalog/components/breadcrumb';
import type { ChairSubjectContext } from '../types';

export function chairListHref(subjectId: string) {
  return `/admin/chairs?subjectId=${subjectId}`;
}

export function chairDetailHref(subjectId: string, chairId: string) {
  return `/admin/chairs/${chairId}?subjectId=${subjectId}`;
}

export function ChairContext({
  context,
  chairName,
}: {
  context: ChairSubjectContext;
  chairName?: string;
}) {
  const universityHref = `/admin/universities/${context.universityId}`;
  const careerHref = `${universityHref}/careers/${context.careerId}`;
  return (
    <CatalogBreadcrumb
      items={[
        { label: 'Universidades', href: '/admin/universities' },
        { label: context.universityName, href: universityHref },
        { label: context.careerName, href: careerHref },
        {
          label: `Plan ${context.planYear}`,
          href: `${careerHref}/plans/${context.careerPlanId}/subjects`,
        },
        {
          label: context.subjectName,
          href: chairName ? chairListHref(context.subjectId) : undefined,
        },
        ...(chairName ? [{ label: `Cátedra ${chairName}` }] : []),
      ]}
    />
  );
}
