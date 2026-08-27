import Link from 'next/link';
import { plan as defaultPlan, type PlanYear } from '@/features/my-career/data/plan';
import type { Teacher } from '@/features/my-career/data/teachers';
import { cn } from '@/lib/utils';
import { StatCell } from './stat-cell';

type Props = {
  teacher: Teacher;
  /** Full plan to resolve names of subjects they deliver. Optional for testing. */
  plan?: PlanYear[];
};

/**
 * Drawer de detalle de un docente (US-045-d). Header + grilla de dos columnas: los tags a la
 * izquierda; los números y las materias que dicta a la derecha.
 *
 * Sin puntajes: lo que el producto publica es de la cátedra, en conteos y en su ficha (ADR-0083).
 */
export function TeacherDrawer({ teacher, plan = defaultPlan }: Props) {
  // `findSubjectName(...) ?? code` always returns a truthy string, so the previous
  // `.filter(Boolean)` was a noop. Switched to a single-pass .map
  // (react-doctor/js-flatmap-filter rule).
  const subjectNames = teacher.subjects.map((code) => findSubjectName(plan, code) ?? code);

  return (
    <div className="flex flex-col gap-4">
      <Header teacher={teacher} subjectNames={subjectNames} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4">
        {/* Left col: tags */}
        <div className="flex flex-col gap-3.5">
          <TagsCard tags={teacher.tags} />
        </div>

        {/* Right col: stats + delivered subjects */}
        <div className="flex flex-col gap-3.5">
          <StatsCard teacher={teacher} />
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
          <Link href="/my-career" className="hover:text-ink-2">
            Mi carrera
          </Link>
          <span className="mx-1.5 text-ink-4">›</span>
          <Link href="/my-career?tab=teachers" className="hover:text-ink-2">
            Docentes
          </Link>
        </div>
        <h1 className="font-display font-semibold text-3xl text-ink leading-tight">
          {teacher.name}
        </h1>
        <p className="text-sm text-ink-3 mt-1">{subjectNames.join(' · ')}</p>
      </div>
    </div>
  );
}

function StatsCard({ teacher }: { teacher: Teacher }) {
  return (
    <div className="bg-bg-card border border-line rounded-lg p-5 shadow-card">
      <h2 className="font-display font-semibold text-base text-ink mb-3">En números</h2>
      <div className="grid grid-cols-2 gap-3.5">
        <StatCell value={String(teacher.subjects.length)} label="materias que dicta" />
        <StatCell value={String(teacher.tags.length)} label="tags destacados" />
      </div>
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
              href={`/my-career/subject/${code}`}
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

/**
 * Per-instance plan map cache to avoid nested find (react-doctor/js-index-maps rule).
 * WeakMap so we do not retain the plan if callers recreate it (the plan tends to be
 * stable per-component-tree).
 */
const planIndexCache = new WeakMap<PlanYear[], Map<string, string>>();

function getPlanIndex(plan: PlanYear[]): Map<string, string> {
  let idx = planIndexCache.get(plan);
  if (!idx) {
    idx = new Map(plan.flatMap((yearBlock) => yearBlock.subjects.map((s) => [s.code, s.name])));
    planIndexCache.set(plan, idx);
  }
  return idx;
}

function findSubjectName(plan: PlanYear[], code: string): string | null {
  return getPlanIndex(plan).get(code) ?? null;
}
