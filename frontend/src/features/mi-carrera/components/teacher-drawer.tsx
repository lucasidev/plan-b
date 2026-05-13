import Link from 'next/link';
import { plan as defaultPlan, type PlanYear } from '@/features/mi-carrera/data/plan';
import { topReviewsForTeacher } from '@/features/mi-carrera/data/reviews';
import type { Teacher } from '@/features/mi-carrera/data/teachers';
import { cn } from '@/lib/utils';
import { ReviewCard } from './review-card';
import { StatCell } from './stat-cell';

type Props = {
  teacher: Teacher;
  /** Plan completo para resolver nombre de subjects que dicta. Opcional para testing. */
  plan?: PlanYear[];
};

/**
 * Drawer de detalle de docente (US-045-d). Port literal del mock
 * `canvas-mocks/v2-screens-3.jsx::V2DocenteDetalle`. Header + grid 2-col
 * con reseñas top + tags a la izquierda; números, métricas sub-dim y
 * resumen a la derecha.
 */
export function TeacherDrawer({ teacher, plan = defaultPlan }: Props) {
  const reviews = topReviewsForTeacher(teacher.id, 3);
  const subjectNames = teacher.subjects
    .map((code) => findSubjectName(plan, code) ?? code)
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <Header teacher={teacher} subjectNames={subjectNames} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4">
        {/* Col izq: reseñas + tags */}
        <div className="flex flex-col gap-3.5">
          <ReviewsCard
            reviews={reviews}
            totalReviews={teacher.rating.reviewCount}
            teacherId={teacher.id}
          />
          <TagsCard tags={teacher.tags} />
        </div>

        {/* Col der: stats + metrics + subjects que dicta */}
        <div className="flex flex-col gap-3.5">
          <StatsCard teacher={teacher} />
          <MetricsCard metrics={teacher.metrics} />
          <SubjectsCard teacher={teacher} plan={plan} />
        </div>
      </div>
    </div>
  );
}

function Header({ teacher, subjectNames }: { teacher: Teacher; subjectNames: string[] }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          'w-16 h-16 rounded-full grid place-items-center text-2xl font-semibold shrink-0',
          'bg-accent-soft text-accent-ink',
        )}
        aria-hidden
      >
        {teacher.name.split(',')[0][0]}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-1.5">
          <Link href="/mi-carrera" className="hover:text-ink-2">
            Mi carrera
          </Link>
          <span className="mx-1.5 text-ink-4">›</span>
          <Link href="/mi-carrera?tab=docentes" className="hover:text-ink-2">
            Docentes
          </Link>
        </div>
        <h1 className="font-display font-semibold text-3xl text-ink leading-tight">
          {teacher.name}
        </h1>
        <p className="text-sm text-ink-3 mt-1">
          {subjectNames.join(' · ')} · {teacher.rating.reviewCount} reseñas verificadas
        </p>
      </div>
    </div>
  );
}

function StatsCard({ teacher }: { teacher: Teacher }) {
  return (
    <div className="bg-bg-card border border-line rounded-lg p-5 shadow-card">
      <h2 className="font-display font-semibold text-base text-ink mb-3">En números</h2>
      <div className="grid grid-cols-2 gap-3.5">
        <StatCell value={`★ ${teacher.rating.overall.toFixed(1)}`} label="rating promedio" />
        <StatCell value={String(teacher.rating.reviewCount)} label="reseñas" />
        <StatCell value={String(teacher.subjects.length)} label="materias que dicta" />
        <StatCell value={String(teacher.tags.length)} label="tags destacados" />
      </div>
    </div>
  );
}

function MetricsCard({ metrics }: { metrics: Teacher['metrics'] }) {
  const items: Array<[string, number]> = [
    ['Claridad', metrics.claridad],
    ['Exigencia', metrics.exigencia],
    ['Buena onda', metrics.buenaonda],
    ['Responde', metrics.responde],
  ];
  return (
    <div className="bg-bg-card border border-line rounded-lg p-5 shadow-card">
      <h2 className="font-display font-semibold text-base text-ink mb-3">Cómo es como docente</h2>
      <div className="flex flex-col gap-2.5">
        {items.map(([label, value]) => (
          <MetricRow key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const tone = value >= 4 ? 'good' : value >= 3 ? 'neutral' : 'low';
  return (
    <div>
      <div className="flex justify-between text-[12px] text-ink-2 mb-1">
        <span>{label}</span>
        <span className="font-mono">{value.toFixed(1)}/5</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuenow={value}
        aria-label={label}
        className="h-1.5 rounded-full bg-bg-elev overflow-hidden"
      >
        <div
          className={cn(
            'h-full rounded-full',
            tone === 'good' && 'bg-st-approved-fg',
            tone === 'neutral' && 'bg-st-coursing-fg',
            tone === 'low' && 'bg-st-failed-fg',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ReviewsCard({
  reviews,
  totalReviews,
  teacherId,
}: {
  reviews: ReturnType<typeof topReviewsForTeacher>;
  totalReviews: number;
  teacherId: string;
}) {
  return (
    <div className="bg-bg-card border border-line rounded-lg p-5 shadow-card">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-display font-semibold text-base text-ink">
          Reseñas <small className="text-ink-3 font-normal ml-1">{totalReviews} · top útiles</small>
        </h2>
      </div>
      {reviews.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-3">Aún no hay reseñas para este docente.</p>
      ) : (
        <>
          {reviews.map((r, i) => (
            <ReviewCard key={r.id} review={r} isLast={i === reviews.length - 1} />
          ))}
          <div className="pt-3 mt-2 border-t border-line">
            <Link
              href={`/reviews?teacherId=${teacherId}`}
              className="text-accent-ink hover:text-accent-hover text-sm"
            >
              Ver las {totalReviews} reseñas →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function TagsCard({ tags }: { tags: Teacher['tags'] }) {
  return (
    <div className="bg-bg-card border border-line rounded-lg p-5 shadow-card">
      <h2 className="font-display font-semibold text-base text-ink mb-3">Tags destacados</h2>
      {tags.length === 0 ? (
        <p className="text-xs text-ink-3">Sin tags destacados todavía.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.label}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs',
                'bg-bg-elev text-ink-2',
              )}
            >
              <span>{tag.label}</span>
              <span className="font-mono text-[10px] text-ink-3">×{tag.count}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SubjectsCard({ teacher, plan }: { teacher: Teacher; plan: PlanYear[] }) {
  return (
    <div className="bg-bg-card border border-line rounded-lg p-5 shadow-card">
      <h2 className="font-display font-semibold text-base text-ink mb-2">Materias que dicta</h2>
      <div className="flex flex-col">
        {teacher.subjects.map((code, i) => {
          const name = findSubjectName(plan, code);
          return (
            <Link
              key={code}
              href={`/mi-carrera/materia/${code}`}
              className={cn(
                'flex justify-between items-center gap-2 py-2',
                i === 0 ? '' : 'border-t border-line',
                'hover:bg-bg-elev rounded-md px-1 -mx-1',
              )}
            >
              <div className="min-w-0">
                <div className="text-sm text-ink">{name ?? 'Materia fuera del plan'}</div>
                <div className="text-[10.5px] text-ink-3 font-mono">{code}</div>
              </div>
              <span className="text-ink-3 shrink-0">›</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function findSubjectName(plan: PlanYear[], code: string): string | null {
  for (const yearBlock of plan) {
    const found = yearBlock.subjects.find((s) => s.code === code);
    if (found) return found.name;
  }
  return null;
}
