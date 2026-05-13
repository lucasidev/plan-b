import Link from 'next/link';
import type { PlanYear, SubjectState } from '@/features/mi-carrera/data/plan';
import {
  approvedCodes,
  isUnlocked,
  missingCorrelativas,
  stateLabel,
} from '@/features/mi-carrera/lib/subject-status';
import { cn } from '@/lib/utils';
import { ModalityBadge } from './modality-badge';

type Props = {
  plan: PlanYear[];
};

/**
 * Tab "Plan" de Mi carrera (US-045-b). Port literal del mock
 * `canvas-mocks/v2-screens.jsx::V2CarreraPlan`.
 *
 * Layout: una card por año (vertical), cada una con un grid de 3 cols con
 * las materias. Cada celda muestra código + modalidad + nombre + nota
 * (cuando aplica). Estados visuales del mockup: AP (verde) / CU (naranja)
 * / PD (transparente con border).
 *
 * Drift intencional vs spec original de US-045-b: el AC hablaba de 4
 * estados visuales (AP / CU / Disponible / Bloqueada), separando las
 * pendientes según correlativas. El mockup canónico de v2 unifica todo
 * lo no-AP/CU en "PD". El visual manda; el cálculo de unlocked vs
 * bloqueada queda disponible vía `isUnlocked()` para tooltips y para el
 * drawer de US-045-d que sí va a distinguir los dos casos.
 *
 * Click en cada celda navega a `/mi-carrera/materia/[code]` (stub hasta
 * que aterrice US-045-d con el drawer real).
 */
export function PlanGrid({ plan }: Props) {
  if (plan.length === 0) {
    return (
      <div className="bg-bg-card border border-line rounded-lg p-10 text-center text-ink-3">
        <p>No hay materias en tu plan todavía.</p>
        <p className="text-sm mt-1">Hablá con la coordinación de tu carrera.</p>
      </div>
    );
  }

  const approved = approvedCodes(plan);

  return (
    <div className="flex flex-col gap-4">
      <Legend />

      {plan.map((yearBlock) => (
        <YearCard key={yearBlock.year} year={yearBlock} approved={approved} />
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-5 gap-y-2',
        'bg-bg-card border border-line rounded-lg px-4 py-2.5',
        'text-xs text-ink-3',
      )}
    >
      <span className="font-mono uppercase tracking-wider" style={{ fontSize: 10.5 }}>
        Leyenda
      </span>
      <LegendSwatch state="AP" />
      <LegendSwatch state="CU" />
      <LegendSwatch state="PD" />
      <span className="flex-1" />
      <span style={{ fontSize: 11.5 }}>
        Modalidad de cada materia definida por la cátedra (anual / cuatrimestral)
      </span>
    </div>
  );
}

function LegendSwatch({ state }: { state: SubjectState }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'w-3.5 h-3.5 rounded-sm',
          state === 'AP' && 'bg-st-approved-bg',
          state === 'CU' && 'bg-st-coursing-bg',
          state === 'PD' && 'border border-dashed border-line-2',
        )}
      />
      <span className="text-ink-2">{stateLabel[state]}</span>
    </span>
  );
}

type YearCardProps = {
  year: PlanYear;
  approved: Set<string>;
};

function YearCard({ year, approved }: YearCardProps) {
  const approvedCount = year.subjects.filter((s) => s.state === 'AP').length;
  const coursingCount = year.subjects.filter((s) => s.state === 'CU').length;

  return (
    <div className="bg-bg-card border border-line rounded-lg p-5 shadow-card">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display font-semibold text-lg text-ink">
          {year.year}° año{' '}
          <small className="text-ink-3 font-normal ml-1">{year.subjects.length} materias</small>
        </h2>
        <small className="text-ink-3 text-xs">
          {approvedCount} aprobadas · {coursingCount} cursando
        </small>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {year.subjects.map((subject) => (
          <SubjectCell key={subject.code} subject={subject} approved={approved} />
        ))}
      </div>
    </div>
  );
}

type SubjectCellProps = {
  subject: PlanYear['subjects'][number];
  approved: Set<string>;
};

function SubjectCell({ subject, approved }: SubjectCellProps) {
  const missing = missingCorrelativas(subject, approved);
  const unlocked = isUnlocked(subject, approved);
  const tooltipParts: string[] = [stateLabel[subject.state]];
  if (subject.state === 'AP' && subject.grade != null) {
    tooltipParts.push(`nota ${subject.grade}`);
  }
  if (subject.state === 'PD' && !unlocked) {
    const preview = missing.slice(0, 3).join(', ');
    const overflow = missing.length > 3 ? ` y ${missing.length - 3} más` : '';
    tooltipParts.push(`Te faltan: ${preview}${overflow}`);
  }
  const tooltip = `${subject.name} · ${tooltipParts.join(' · ')}`;

  return (
    <Link
      href={`/mi-carrera/materia/${subject.code}`}
      title={tooltip}
      aria-label={tooltip}
      data-state={subject.state}
      data-unlocked={unlocked}
      className={cn(
        'flex flex-col gap-1 px-3 py-2.5 rounded-md border transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        subject.state === 'AP' &&
          'bg-st-approved-bg border-transparent text-st-approved-fg hover:opacity-90',
        subject.state === 'CU' &&
          'bg-st-coursing-bg border-transparent text-st-coursing-fg hover:opacity-90',
        subject.state === 'PD' && 'bg-bg-card border-line text-ink-3 hover:bg-bg-elev',
        subject.state === 'PD' && 'opacity-80',
      )}
    >
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
        <span>{subject.code}</span>
        <ModalityBadge modality={subject.modality} />
      </div>
      <div
        className={cn(
          'text-sm font-medium leading-snug',
          subject.state === 'PD' ? 'text-ink-3' : 'text-ink',
        )}
      >
        {subject.name}
      </div>
      {subject.state === 'AP' && subject.grade != null && (
        <div
          className="font-mono uppercase tracking-wider text-st-approved-fg"
          style={{ fontSize: 10.5 }}
        >
          nota {subject.grade}
        </div>
      )}
    </Link>
  );
}
