import Link from 'next/link';
import { type Comision, comisionesForSubject } from '@/features/mi-carrera/data/comisiones';
import {
  plan as defaultPlan,
  type PlannedSubject,
  type PlanYear,
} from '@/features/mi-carrera/data/plan';
import { reviewCountForSubject, topReviewsForSubject } from '@/features/mi-carrera/data/reviews';
import { teacherById, teachersForSubject } from '@/features/mi-carrera/data/teachers';
import {
  approvedCodes,
  isUnlocked,
  missingCorrelativas,
  stateLabel,
} from '@/features/mi-carrera/lib/subject-status';
import { cn } from '@/lib/utils';
import { CorrelativaChip } from './correlativa-chip';
import { ReviewCard } from './review-card';
import { StatCell } from './stat-cell';

type Props = {
  /** Materia a renderear en el drawer. */
  subject: PlannedSubject & { year: number };
  /** Plan completo (para resolver correlativas + habilita). Opcional para testing. */
  plan?: PlanYear[];
};

/**
 * Drawer de detalle de materia (US-045-d). Port literal del mock
 * `canvas-mocks/v2-screens-3.jsx::V2MateriaDetalle`. Renderea: header
 * (eyebrow breadcrumb + título + subtitle stats) + grid 2-col con reseñas
 * top 3 + correlativas a la izquierda, números + docentes + situación del
 * alumno a la derecha.
 *
 * "Drawer" en MVP es una página dedicada (no modal), por simplicidad y
 * sharable URLs. Visualmente se trata como panel sobre la app. Cuando
 * aterrice parallel routes (`@modal`), se evalúa migrar.
 */
export function SubjectDrawer({ subject, plan = defaultPlan }: Props) {
  const approved = approvedCodes(plan);
  const teachers = teachersForSubject(subject.code);
  const activeTeachers = teachers.filter((t) => t.subjects.includes(subject.code));
  const totalReviews = reviewCountForSubject(subject.code);
  const reviews = topReviewsForSubject(subject.code, 3);
  const comisiones = comisionesForSubject(subject.code);

  const rating =
    activeTeachers.length > 0
      ? activeTeachers.reduce((acc, t) => acc + t.rating.overall, 0) / activeTeachers.length
      : null;

  // Correlativas que esta materia "necesita" (sus correlativas declaradas).
  const needsCodes = subject.correlativas;
  const needs = needsCodes
    .map((code) => findSubjectByCode(plan, code))
    .filter((s): s is PlannedSubject & { year: number } => s != null);

  // Correlativas que esta materia "habilita" (otras materias del plan que la
  // tienen en su correlativas array).
  const allSubjects = plan.flatMap((y) => y.subjects.map((s) => ({ ...s, year: y.year })));
  const unlocks = allSubjects.filter((s) => s.correlativas.includes(subject.code));

  const unlocked = isUnlocked(subject, approved);
  const missing = missingCorrelativas(subject, approved);

  return (
    <div className="flex flex-col gap-4">
      <Header subject={subject} totalTeachers={activeTeachers.length} totalReviews={totalReviews} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4">
        {/* Col izq: reseñas + correlativas */}
        <div className="flex flex-col gap-3.5">
          <ReviewsCard subjectCode={subject.code} reviews={reviews} totalReviews={totalReviews} />
          <CorrelativasCard needs={needs} unlocks={unlocks} />
        </div>

        {/* Col der: stats + docentes + situación */}
        <div className="flex flex-col gap-3.5">
          <StatsCard
            rating={rating}
            totalReviews={totalReviews}
            comisionesCount={comisiones.length}
            modality={subject.modality}
          />
          <TeachersCard teachers={teachers} subjectCode={subject.code} />
          <SituationCard subject={subject} unlocked={unlocked} missing={missing} />
        </div>
      </div>
    </div>
  );
}

function Header({
  subject,
  totalTeachers,
  totalReviews,
}: {
  subject: PlannedSubject & { year: number };
  totalTeachers: number;
  totalReviews: number;
}) {
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-wider text-ink-3 mb-2">
        <Link href="/mi-carrera" className="hover:text-ink-2 cursor-pointer">
          Mi carrera
        </Link>
        <span className="mx-1.5 text-ink-4">›</span>
        <Link href="/mi-carrera?tab=catalogo" className="hover:text-ink-2">
          Catálogo
        </Link>
        <span className="mx-1.5 text-ink-4">›</span>
        <span className="text-ink-2">{subject.code}</span>
      </div>
      <h1 className="font-display font-semibold text-3xl text-ink leading-tight">{subject.name}</h1>
      <p className="text-sm text-ink-3 mt-2">
        {subject.year}° año · {modalityLabel(subject.modality)} · {totalTeachers} docentes ·{' '}
        {totalReviews} reseñas · estado {stateLabel[subject.state].toLowerCase()}
      </p>
    </div>
  );
}

function modalityLabel(modality: PlannedSubject['modality']): string {
  return modality === 'anual' ? 'Anual' : modality === '1c' ? '1er cuatri' : '2do cuatri';
}

function ReviewsCard({
  subjectCode,
  reviews,
  totalReviews,
}: {
  subjectCode: string;
  reviews: ReturnType<typeof topReviewsForSubject>;
  totalReviews: number;
}) {
  return (
    <div className="bg-bg-card border border-line rounded-lg p-5 shadow-card">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-display font-semibold text-base text-ink">
          Reseñas <small className="text-ink-3 font-normal ml-1">{totalReviews} · top útiles</small>
        </h2>
      </div>
      {reviews.length === 0 ? (
        <div className="py-6 text-center text-sm text-ink-3">
          <p>Aún no hay reseñas para esta materia.</p>
          <button type="button" className="mt-2 text-accent-ink hover:text-accent-hover text-sm">
            Sé el primero en reseñar →
          </button>
        </div>
      ) : (
        <>
          {reviews.map((r, i) => (
            <ReviewCard key={r.id} review={r} isLast={i === reviews.length - 1} />
          ))}
          <div className="pt-3 mt-2 border-t border-line">
            <Link
              href={`/reviews?subjectCode=${subjectCode}`}
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

function CorrelativasCard({
  needs,
  unlocks,
}: {
  needs: Array<PlannedSubject & { year: number }>;
  unlocks: Array<PlannedSubject & { year: number }>;
}) {
  return (
    <div className="bg-bg-card border border-line rounded-lg p-5 shadow-card">
      <h2 className="font-display font-semibold text-base text-ink mb-3">Correlativas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-2">
            Necesitás (aprobadas)
          </div>
          <div className="flex flex-col gap-1.5">
            {needs.length === 0 ? (
              <p className="text-xs text-ink-3">Sin correlativas.</p>
            ) : (
              needs.map((c) => (
                <CorrelativaChip key={c.code} code={c.code} name={c.name} tone="ok" />
              ))
            )}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-3 mb-2">
            Habilita
          </div>
          <div className="flex flex-col gap-1.5">
            {unlocks.length === 0 ? (
              <p className="text-xs text-ink-3">No habilita otras materias.</p>
            ) : (
              unlocks.map((c) => (
                <CorrelativaChip key={c.code} code={c.code} name={c.name} tone="next" />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  rating,
  totalReviews,
  comisionesCount,
  modality,
}: {
  rating: number | null;
  totalReviews: number;
  comisionesCount: number;
  modality: PlannedSubject['modality'];
}) {
  return (
    <div className="bg-bg-card border border-line rounded-lg p-5 shadow-card">
      <h2 className="font-display font-semibold text-base text-ink mb-3">En números</h2>
      <div className="grid grid-cols-2 gap-3.5">
        <StatCell
          value={rating != null ? `★ ${rating.toFixed(1)}` : 'sin datos'}
          label="rating promedio"
        />
        <StatCell value={String(totalReviews)} label="reseñas" />
        <StatCell value={String(comisionesCount)} label="comisiones" />
        <StatCell value={modalityLabel(modality)} label="modalidad" />
      </div>
    </div>
  );
}

function TeachersCard({
  teachers,
  subjectCode,
}: {
  teachers: ReturnType<typeof teachersForSubject>;
  subjectCode: string;
}) {
  const comisiones = comisionesForSubject(subjectCode);
  return (
    <div className="bg-bg-card border border-line rounded-lg p-5 shadow-card">
      <h2 className="font-display font-semibold text-base text-ink mb-2">Docentes</h2>
      {teachers.length === 0 ? (
        <p className="text-xs text-ink-3 mt-2">Sin docentes asignados a esta materia.</p>
      ) : (
        <div className="flex flex-col">
          {teachers.map((t, i) => {
            const teacherCommissions = comisiones.filter((c) => c.teacherId === t.id);
            return (
              <Link
                key={t.id}
                href={`/mi-carrera/docente/${t.id}`}
                className={cn(
                  'flex justify-between items-center gap-2.5 py-2.5',
                  i === 0 ? '' : 'border-t border-line',
                  'hover:bg-bg-elev rounded-md px-1 -mx-1',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      'w-7 h-7 rounded-full grid place-items-center text-xs font-semibold shrink-0',
                      'bg-accent-soft text-accent-ink',
                    )}
                    aria-hidden
                  >
                    {t.name.split(',')[0][0]}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm text-ink font-medium">{t.name}</div>
                    <div className="text-[10.5px] text-ink-3 font-mono mt-px">
                      {teacherCommissions.length > 0
                        ? `Com ${teacherCommissions.map((c) => c.label).join(', ')}`
                        : 'Sin comisión asignada'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11.5px] text-ink-2 font-mono">
                    ★ {t.rating.overall.toFixed(1)}
                  </span>
                  <span className="text-ink-3">›</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SituationCard({
  subject,
  unlocked,
  missing,
}: {
  subject: PlannedSubject;
  unlocked: boolean;
  missing: string[];
}) {
  if (subject.state === 'AP') {
    return (
      <div
        className="rounded-lg p-5 border"
        style={{
          background:
            'linear-gradient(180deg, var(--color-accent-soft) 0%, var(--color-bg-card) 100%)',
          borderColor: 'oklch(0.85 0.07 55)',
        }}
      >
        <h2 className="font-display font-semibold text-base text-ink mb-1.5">Tu situación</h2>
        <p className="text-sm text-ink-2 leading-relaxed">
          La tenés aprobada con nota <strong>{subject.grade}</strong>. Si querés, podés mirar
          reseñas de otros para tu reseña propia.
        </p>
      </div>
    );
  }

  if (subject.state === 'CU') {
    return (
      <div
        className="rounded-lg p-5 border"
        style={{
          background:
            'linear-gradient(180deg, var(--color-accent-soft) 0%, var(--color-bg-card) 100%)',
          borderColor: 'oklch(0.85 0.07 55)',
        }}
      >
        <h2 className="font-display font-semibold text-base text-ink mb-1.5">Tu situación</h2>
        <p className="text-sm text-ink-2 leading-relaxed">
          La estás cursando este cuatri. Cuando la cierres, te vamos a invitar a reseñarla.
        </p>
      </div>
    );
  }

  // PD
  if (unlocked) {
    return (
      <div
        className="rounded-lg p-5 border"
        style={{
          background:
            'linear-gradient(180deg, var(--color-accent-soft) 0%, var(--color-bg-card) 100%)',
          borderColor: 'oklch(0.85 0.07 55)',
        }}
      >
        <h2 className="font-display font-semibold text-base text-ink mb-1.5">Tu situación</h2>
        <p className="text-sm text-ink-2 leading-relaxed mb-2.5">
          Tenés las correlativas aprobadas. La podés cursar en cualquier{' '}
          {modalityLabel(subject.modality)}.
        </p>
        <button
          type="button"
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium',
            'bg-accent text-white hover:bg-accent-hover',
          )}
        >
          Sumarla al borrador
        </button>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-line rounded-lg p-5 shadow-card">
      <h2 className="font-display font-semibold text-base text-ink mb-1.5">Tu situación</h2>
      <p className="text-sm text-ink-2 leading-relaxed mb-2">
        Te faltan correlativas. No la podés cursar todavía:
      </p>
      <ul className="text-sm text-ink-2 list-disc pl-5 space-y-0.5">
        {missing.map((code) => (
          <li key={code} className="font-mono text-xs">
            {code}
          </li>
        ))}
      </ul>
    </div>
  );
}

function findSubjectByCode(
  plan: PlanYear[],
  code: string,
): (PlannedSubject & { year: number }) | null {
  for (const yearBlock of plan) {
    const found = yearBlock.subjects.find((s) => s.code === code);
    if (found) return { ...found, year: yearBlock.year };
  }
  return null;
}
