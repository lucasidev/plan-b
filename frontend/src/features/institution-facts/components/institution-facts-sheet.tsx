import {
  OFFICIAL_FACT_FIELDS,
  type OfficialFact,
  officialFactCellContent,
} from '@/components/facts';
import { PageFrame, type PageFrameStat } from '@/components/layout/page-frame';
import {
  type Career,
  type CareerCoverage,
  hasReviews,
  institutionTypeLabel,
} from '@/features/browse-catalog';
import {
  describeInstitutionCareers,
  describeMeasuredCareers,
} from '../lib/describe-institution-header';
import { CareersByFaculty } from './careers-by-faculty';
import { CareersStartHere } from './careers-start-here';
import { CHECKLIST_ORDER, TransparencyChecklist } from './transparency-checklist';

/**
 * La ficha de una institución (SC-005, ADR-0090), markup literal de la maqueta aprobada
 * (planb-catalogo-adentro.html, `V.university`, `frameApp`).
 *
 * Se listan TODAS las carreras de la institución, agrupadas por facultad: sin el truncamiento
 * de la maqueta ("Se muestran 17 de las 56"), que era una limitación de la demo, no del producto.
 */
type Props = {
  universityName: string;
  careers: Career[];
  officialFacts: OfficialFact[];
  /** `catalogCoverage` ya filtrado a esta universidad. */
  coverage: CareerCoverage[];
};

export function InstitutionFactsSheet({ universityName, careers, officialFacts, coverage }: Props) {
  const byField = new Map(officialFacts.map((fact) => [fact.field, fact]));
  const careersWithReviews = coverage.filter(hasReviews);

  return (
    <PageFrame
      head={
        <Head
          universityName={universityName}
          careers={careers}
          identity={byField.get(OFFICIAL_FACT_FIELDS.institutionType)}
          careersWithReviews={careersWithReviews}
        />
      }
      stats={institutionStats(byField, careers.length, careersWithReviews.length)}
      main={<CareersByFaculty careers={careers} coverage={coverage} />}
      aside={
        <>
          <CareersStartHere coverage={coverage} />
          <IdentitySummary identity={byField.get(OFFICIAL_FACT_FIELDS.institutionType)} />
          <TransparencyChecklist facts={officialFacts} />
        </>
      }
    />
  );
}

function Head({
  universityName,
  careers,
  identity,
  careersWithReviews,
}: {
  universityName: string;
  careers: Career[];
  identity: OfficialFact | undefined;
  careersWithReviews: CareerCoverage[];
}) {
  const kind = institutionTypeLabel(identity)?.toLowerCase() ?? null;
  const careersSentence = describeInstitutionCareers(careers);
  const measuredSentence = describeMeasuredCareers(
    careersWithReviews.map((career) => ({ careerName: career.careerName })),
  );

  return (
    <>
      <div className="pb-eyebrow">Universidad{kind ? ` · ${kind}` : ''}</div>
      <h1 className="pb-serif">{universityName}</h1>
      {careersSentence && (
        <p className="pb-h-sub">
          {careersSentence}
          {measuredSentence ? ` ${measuredSentence}` : ''}
        </p>
      )}
    </>
  );
}

/** La tira `.pb-stats` (`V.university().stats` de la maqueta): estudiantes, egresados, carreras con reseñas y transparencia. */
function institutionStats(
  byField: Map<string, OfficialFact>,
  totalCareers: number,
  careersWithReviewsCount: number,
): PageFrameStat[] {
  const stats: PageFrameStat[] = [];

  const students = byField.get(OFFICIAL_FACT_FIELDS.students);
  if (students?.status === 'Published') {
    const cell = officialFactCellContent(students);
    stats.push([cell.value, `estudiantes${cell.note ? ` en ${cell.note}` : ''}`]);
  }

  const graduates = byField.get(OFFICIAL_FACT_FIELDS.graduates);
  if (graduates?.status === 'Published') {
    const cell = officialFactCellContent(graduates);
    stats.push([cell.value, `egresados${cell.note ? ` en ${cell.note}` : ''}`]);
  }

  if (totalCareers > 0) {
    stats.push([
      `${careersWithReviewsCount}`,
      careersWithReviewsCount === 1 ? 'carrera con reseñas' : 'carreras con reseñas',
    ]);
  }

  const checklistFacts = CHECKLIST_ORDER.map((field) => byField.get(field)).filter(
    (fact): fact is OfficialFact => fact !== undefined,
  );
  if (checklistFacts.length > 0) {
    const publishedCount = checklistFacts.filter((fact) => fact.status === 'Published').length;
    stats.push([
      `${publishedCount} de ${checklistFacts.length}`,
      'datos de transparencia que la institución publica',
    ]);
  }

  return stats;
}

/** "Identidad institucional" (columna derecha): el valor completo de `institution_type`, con su fuente. */
function IdentitySummary({ identity }: { identity: OfficialFact | undefined }) {
  if (identity?.status !== 'Published' || !identity.value) return null;

  return (
    <div className="pb-section">
      <div className="pb-eyebrow">Identidad institucional</div>
      <p className="pb-serif" style={{ fontSize: 16, lineHeight: 1.35 }}>
        {identity.value}
      </p>
      <p className="pb-meta" style={{ marginTop: 4 }}>
        {identity.sourceName}
        {identity.period ? ` · ${identity.period}` : ''}
      </p>
    </div>
  );
}
